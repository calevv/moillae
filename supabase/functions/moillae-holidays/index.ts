// 모일래 공휴일: 연도를 받아서 그해 공휴일을 돌려줘요
// DB에 저장된 게 있으면 그걸, 없거나 오래됐으면 공공데이터 API에서 받아서 저장한 뒤 돌려줘요
import { createClient } from "npm:@supabase/supabase-js@2";

const API_URL =
  "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";
const REFRESH_DAYS = 30; // 올해와 이후 연도는 30일마다 다시 받기 (임시공휴일 대비)
const DAY_MS = 86_400_000;

// 브라우저(앱)에서 부를 수 있게 허락하는 헤더 (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Holiday = { date: string; name: string };

// 공공데이터 API 응답 모양 (필요한 부분만)
type ApiItem = { locdate: number; dateName: string; isHoliday: string };
type ApiBody = {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: ApiItem | ApiItem[] } | "" };
  };
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 20261225 → "2026-12-25"
function toDateKey(locdate: number): string {
  const s = String(locdate);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

// 관리자 키 (새 키 방식이 있으면 그걸, 없으면 예전 service_role 키)
function getSecretKey(): string | undefined {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const key = JSON.parse(keys).default;
      if (key) return key;
    } catch {
      // 모양이 이상하면 아래 예전 키로
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

// 공공데이터 API에서 그해 공휴일 받기. 실패하면 null
async function fetchFromApi(
  year: number,
  serviceKey: string,
): Promise<Holiday[] | null> {
  const url = new URL(API_URL);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("solYear", String(year));
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("_type", "json");

  let text: string;
  try {
    const res = await fetch(url);
    text = await res.text();
  } catch (e) {
    console.error("upstream_fetch_failed", e);
    return null;
  }

  // 에러는 JSON이 아니라 XML로 오기도 해서 먼저 확인
  let body: ApiBody;
  try {
    body = JSON.parse(text);
  } catch {
    console.error("upstream_not_json", text.slice(0, 300));
    return null;
  }
  const header = body.response?.header;
  if (header?.resultCode !== "00") {
    console.error("upstream_result", header);
    return null;
  }

  // 0개면 items가 "", 1개면 객체, 여러 개면 배열 → 항상 배열로
  const items = body.response?.body?.items;
  const raw = items && typeof items === "object" ? items.item : undefined;
  const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];

  return list
    .filter((i) => i.isHoliday === "Y")
    .map((i) => ({ date: toDateKey(i.locdate), name: i.dateName }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // 1. 받은 연도 검사
  let year: unknown;
  try {
    const input = await req.json();
    year = input?.year;
  } catch {
    return json({ error: "invalid_body" }, 400);
  }
  if (
    typeof year !== "number" ||
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100
  ) {
    return json({ error: "invalid_year" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();
  const serviceKey = Deno.env.get("DATA_GO_KR_SERVICE_KEY");
  if (!supabaseUrl || !secretKey || !serviceKey) {
    return json({ error: "missing_env" }, 500);
  }

  // 관리자 키라 RLS를 건너뛰어요. 그래서 이 함수(서버) 안에서만 써요
  const db = createClient(supabaseUrl, secretKey, {
    db: { schema: "moillae" },
    auth: { persistSession: false },
  });

  // 2. 저장해 둔 것 확인
  const [fetchRes, storedRes] = await Promise.all([
    db
      .from("holiday_fetches")
      .select("fetched_at")
      .eq("year", year)
      .maybeSingle(),
    db.from("holidays").select("date, name").eq("year", year).order("date"),
  ]);
  if (fetchRes.error) console.error("read_fetches_failed", fetchRes.error);
  if (storedRes.error) console.error("read_holidays_failed", storedRes.error);

  const fetchedAt = fetchRes.data?.fetched_at as string | undefined;
  const stored = (storedRes.data ?? []) as Holiday[];

  const thisYear = new Date().getFullYear();
  const age = fetchedAt ? Date.now() - new Date(fetchedAt).getTime() : Infinity;
  const fresh =
    fetchedAt !== undefined && (year < thisYear || age < REFRESH_DAYS * DAY_MS);

  if (fresh) {
    console.log("holidays_from_db", year);
    return json({ year, holidays: stored });
  }

  // 3. 없거나 오래됐으면 새로 받기
  const fromApi = await fetchFromApi(year, serviceKey);
  if (!fromApi) {
    // 받기 실패: 예전에 저장한 게 있으면 그거라도
    if (fetchedAt) return json({ year, holidays: stored });
    return json({ error: "upstream_error" }, 502);
  }

  // 4. 저장 (실패해도 받은 건 돌려줘요. 다음 요청에서 다시 저장을 시도해요)
  const { error: saveError } = await db.rpc("replace_holidays", {
    p_year: year,
    p_items: fromApi,
  });
  if (saveError) console.error("save_failed", saveError);

  console.log("holidays_from_api", year, fromApi.length);
  return json({ year, holidays: fromApi });
});
