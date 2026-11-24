// 모일래 푸시 보내기: notifications에 줄이 생기면 Database Webhook이 이 함수를 불러요
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

type NotificationRow = {
  id: string;
  user_id: string;
  type: "poll_created" | "poll_confirmed" | "poll_unconfirmed";
  group_id: string;
  poll_id: string | null;
};

type WebhookBody = {
  type: string;
  table: string;
  record: NotificationRow | null;
};

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// 관리자 키 (새 키 방식이 있으면 그걸, 없으면 예전 service_role 키)
function getSecretKey(): string | undefined {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    try {
      const key = JSON.parse(keys).default;
      if (key) return key;
    } catch {
      // 아래 예전 키로
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

// "12월 20일 (일) 오후 6:00" (한국 시간)
function formatKoreanTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("month")} ${get("day")}일 (${get("weekday")}) ${get("dayPeriod")} ${get("hour")}:${get("minute")}`;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // 1. 우리 DB 웹훅인지 확인 (비밀 헤더)
  const expected = Deno.env.get("MOILLAE_WEBHOOK_SECRET");
  if (!expected || req.headers.get("x-moillae-webhook-secret") !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const body = (await req.json().catch(() => null)) as WebhookBody | null;
  const n = body?.record;
  if (!n?.user_id) return json({ error: "invalid_body" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();
  const vapidPublic = Deno.env.get("MOILLAE_VAPID_PUBLIC_KEY");
  const vapidPrivate = Deno.env.get("MOILLAE_VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("MOILLAE_VAPID_SUBJECT");
  if (
    !supabaseUrl ||
    !secretKey ||
    !vapidPublic ||
    !vapidPrivate ||
    !vapidSubject
  ) {
    return json({ error: "missing_env" }, 500);
  }

  // 2. VAPID 도장 준비 (비밀 키는 여기서만 써요)
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  const db = createClient(supabaseUrl, secretKey, {
    db: { schema: "moillae" },
    auth: { persistSession: false },
  });

  // 3. 받는 사람의 사서함 찾기. 없으면 할 일 없음
  const { data: subsData, error: subsError } = await db
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", n.user_id)
    .eq("kind", "web");
  if (subsError) {
    console.error("read_subscriptions_failed", subsError);
    return json({ error: "read_failed" }, 500);
  }
  const subs = (subsData ?? []) as Subscription[];
  if (subs.length === 0) return json({ sent: 0, reason: "no_subscription" });

  // 4. 문장 만들기 (투표 이름, 그룹 이름, 확정 시간)
  const [pollRes, groupRes] = await Promise.all([
    n.poll_id
      ? db
          .from("polls")
          .select("title, confirmed_option_id")
          .eq("id", n.poll_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    db.from("groups").select("name").eq("id", n.group_id).maybeSingle(),
  ]);
  const poll = pollRes.data as {
    title: string;
    confirmed_option_id: string | null;
  } | null;
  const groupName =
    (groupRes.data as { name: string } | null)?.name ?? "모일래";
  const pollTitle = poll?.title ?? "모임";

  let body_ = "";
  if (n.type === "poll_created") {
    body_ = `새 투표 "${pollTitle}"가 올라왔어요. 가능한 시간을 골라 주세요.`;
  } else if (n.type === "poll_confirmed") {
    let when = "";
    if (poll?.confirmed_option_id) {
      const { data: option } = await db
        .from("poll_options")
        .select("starts_at")
        .eq("id", poll.confirmed_option_id)
        .maybeSingle();
      if (option)
        when = ` ${formatKoreanTime((option as { starts_at: string }).starts_at)}로`;
    }
    body_ = `"${pollTitle}" 시간이${when} 확정됐어요.`;
  } else {
    body_ = `"${pollTitle}" 확정이 취소됐어요. 다시 투표해 주세요.`;
  }

  const payload = JSON.stringify({
    title: groupName,
    body: body_,
    url: n.poll_id
      ? `/groups/${n.group_id}/polls/${n.poll_id}`
      : `/groups/${n.group_id}`,
    tag: n.poll_id ? `poll-${n.poll_id}` : undefined, // 같은 투표 알림은 하나로 묶기
  });

  // 5. 사서함마다 보내기. 하나가 실패해도 나머지는 계속
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
        { TTL: 60 * 60 * 24 }, // 기기가 꺼져 있으면 하루 동안 보관했다가 배달
      ),
    ),
  );

  // 6. 사서함이 없어졌다는 답(404, 410)이면 DB에서 지우기
  const deadIds: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const code = (r.reason as { statusCode?: number })?.statusCode;
      if (code === 404 || code === 410) deadIds.push(subs[i].id);
      else console.error("send_failed", code, r.reason);
    }
  });
  if (deadIds.length > 0) {
    await db.from("push_subscriptions").delete().in("id", deadIds);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  console.log("push_sent", {
    notification: n.id,
    sent,
    removed: deadIds.length,
  });
  return json({ sent, removed: deadIds.length });
});
