import { supabase } from "@/lib/supabase";

// 이 기기의 구독(사서함)을 내 계정으로 저장. 같은 기기에 다른 계정 구독이 있으면 DB 함수가 지워요
export async function savePushSubscription(subscription: PushSubscription) {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth)
    throw new Error("invalid_subscription");

  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: json.endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
    p_user_agent: navigator.userAgent,
  });
  if (error) throw error;
}

// 이 기기의 구독을 DB에서 지우기 (RLS: 내 구독만)
export async function deletePushSubscription(endpoint: string) {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}
