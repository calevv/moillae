import { deletePushSubscription, savePushSubscription } from "@/api/push";
import { getInstallContext } from "@/utils/device";

export type PushSupport = "supported" | "needs-install" | "unsupported";

// 이 기기에서 웹 푸시를 쓸 수 있는지
export function getPushSupport(): PushSupport {
  const ctx = getInstallContext();
  // 아이폰은 홈 화면에 추가한 앱에서만 웹 푸시가 돼요
  if (ctx.platform === "ios" && !ctx.isStandalone) return "needs-install";
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return "unsupported";
  }
  return "supported";
}

// VAPID 공개 키(글자)를 브라우저가 원하는 모양(바이트 배열)으로 바꾸기
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// 서비스 워커가 없으면(개발 서버 등) null. ready와 달리 없을 때 멈춰 기다리지 않아요
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) ?? null;
}

// 이 기기의 지금 구독 (없으면 null)
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const registration = await getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

// 알림 켜기. 버튼을 누른 그 순간에 불러야 해요 (아이폰은 사용자 동작 안에서만 허락 창을 띄워요)
export async function enablePush(): Promise<NotificationPermission> {
  // 다른 await보다 먼저 허락을 묻기
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidKey) throw new Error("missing_vapid_key");

  if (!(await getRegistration())) throw new Error("no_service_worker");
  const registration = await navigator.serviceWorker.ready;

  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true, // 받으면 항상 알림을 보여 준다는 약속
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    }));

  await savePushSubscription(subscription);
  return "granted";
}

// 알림 끄기 버튼: DB 줄을 먼저 지우고 사서함까지 닫아요 (다음 로그인 때도 꺼진 상태)
export async function disablePush() {
  const subscription = await getCurrentSubscription();
  if (!subscription) return;
  try {
    await deletePushSubscription(subscription.endpoint);
  } finally {
    await subscription.unsubscribe();
  }
}

// 로그아웃할 때: 서버에서 "이 기기 = 이 사람" 연결만 끊어요.
// 사서함은 남겨 두고, 다음에 로그인하는 사람에게 다시 연결해요
export async function detachPush() {
  const subscription = await getCurrentSubscription();
  if (subscription) await deletePushSubscription(subscription.endpoint);
}

// 로그인했을 때: 이미 알림이 허락돼 있고 사서함이 있으면 지금 계정으로 다시 연결
export async function reattachPush() {
  if (getPushSupport() !== "supported" || Notification.permission !== "granted")
    return;
  const subscription = await getCurrentSubscription();
  if (subscription) await savePushSubscription(subscription);
}
