// 모일래 공휴일: 연도를 받아서 공공데이터포털 특일 정보(공휴일)를 정리해 돌려줘요
const API_URL = 'https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo';

// 브라우저(앱)에서 부를 수 있게 허락하는 헤더 (CORS)
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 공공데이터 API 응답 모양 (필요한 부분만)
type ApiItem = { locdate: number; dateName: string; isHoliday: string };
type ApiBody = {
    response?: {
        header?: { resultCode?: string; resultMsg?: string };
        body?: { items?: { item?: ApiItem | ApiItem[] } | '' };
    };
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            ...extraHeaders,
        },
    });
}

// 20261225 → "2026-12-25" (앱의 날짜 키와 같은 모양)
function toDateKey(locdate: number): string {
    const s = String(locdate);
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

Deno.serve(async (req) => {
    // 브라우저가 본 요청 전에 "보내도 돼?" 하고 먼저 묻는 요청
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    // 1. 받은 연도 검사 (아무 값이나 그대로 믿지 않기)
    let year: unknown;
    try {
        const input = await req.json();
        year = input?.year;
    } catch {
        return json({ error: 'invalid_body' }, 400);
    }
    if (typeof year !== 'number' || !Number.isInteger(year) || year < 2000 || year > 2100) {
        return json({ error: 'invalid_year' }, 400);
    }

    // 2. 시크릿에서 인증키 꺼내기 (코드와 git에는 없음)
    const serviceKey = Deno.env.get('DATA_GO_KR_SERVICE_KEY');
    if (!serviceKey) return json({ error: 'missing_key' }, 500);

    // 3. 공공데이터 API 호출. URLSearchParams가 키를 주소용으로 바꿔 줘서 Decoding 키를 넣어요
    const url = new URL(API_URL);
    url.searchParams.set('serviceKey', serviceKey);
    url.searchParams.set('solYear', String(year));
    url.searchParams.set('numOfRows', '100');
    url.searchParams.set('_type', 'json');

    let text: string;
    try {
        const res = await fetch(url);
        text = await res.text();
    } catch (e) {
        console.error('upstream_fetch_failed', e);
        return json({ error: 'upstream_error' }, 502);
    }

    // 4. 에러는 JSON이 아니라 XML로 오기도 해서 먼저 확인
    let body: ApiBody;
    try {
        body = JSON.parse(text);
    } catch {
        console.error('upstream_not_json', text.slice(0, 300));
        return json({ error: 'upstream_error' }, 502);
    }
    const header = body.response?.header;
    if (header?.resultCode !== '00') {
        console.error('upstream_result', header);
        return json({ error: 'upstream_error' }, 502);
    }

    // 5. 모양 맞추기: 0개면 items가 "", 1개면 객체, 여러 개면 배열로 와요 → 항상 배열로
    const items = body.response?.body?.items;
    const raw = items && typeof items === 'object' ? items.item : undefined;
    const list = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw];

    const holidays = list
        .filter((i) => i.isHoliday === 'Y')
        .map((i) => ({ date: toDateKey(i.locdate), name: i.dateName }));

    // 6. 하루 동안 다시 묻지 않아도 되게 캐시 허락
    return json({ year, holidays }, 200, {
        'Cache-Control': 'public, max-age=86400',
    });
});
