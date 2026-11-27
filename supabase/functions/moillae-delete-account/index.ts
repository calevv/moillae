import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      // 모양이 이상하면 아래 예전 키로
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  // 누가 탈퇴하는지는 요청의 로그인 토큰으로만 판단해요 (body로 id를 받지 않아요)
  const token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "not_authenticated" }, 401);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, getSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "moillae" },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user)
    return json({ error: "not_authenticated" }, 401);
  const userId = userData.user.id;

  // ① 모일래 데이터 정리 (DB 함수 하나라 전부 되거나 전부 안 돼요)
  const { data: remainingApps, error: cleanupError } = await admin.rpc(
    "delete_account_data",
    { p_user_id: userId },
  );
  if (cleanupError) {
    console.error("delete_account_data_failed", cleanupError);
    return json({ error: "cleanup_failed" }, 500);
  }

  // ② 이 계정을 쓰는 다른 앱이 없을 때만 로그인 계정까지 삭제
  const accountDeleted = remainingApps === 0;
  if (accountDeleted) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      // 모일래 데이터는 이미 정리돼서, 다시 시도하면 돼요
      console.error("delete_user_failed", deleteError);
      return json({ error: "account_delete_failed" }, 500);
    }
  }

  console.log("account_deleted", { userId, accountDeleted });
  return json({ accountDeleted });
});
