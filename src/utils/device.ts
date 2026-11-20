// 지금 기기와 브라우저가 무엇인지. 설치 안내를 고르려고 써요
export type Platform = "ios" | "android" | "desktop";

export type InstallContext = {
  platform: Platform;
  isStandalone: boolean; // 이미 홈 화면 앱으로 열었는지
  inAppBrowser: "kakaotalk" | "other" | null; // 카카오톡 같은 앱 안의 브라우저
  isIosSafari: boolean;
};

// 카카오톡 말고 자주 쓰는 앱 안 브라우저 (네이버, 인스타그램, 페이스북, 라인, 다음, 에브리타임)
const OTHER_IN_APP =
  /NAVER\(inapp|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i;

export function getInstallContext(): InstallContext {
  const ua = navigator.userAgent;

  // iPad는 PC(Mac)처럼 보이기도 해서, 터치가 되는지로 한 번 더 확인
  const isIpad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const isIos = /iPhone|iPad|iPod/.test(ua) || isIpad;
  const isAndroid = /Android/.test(ua);
  const platform: Platform = isIos ? "ios" : isAndroid ? "android" : "desktop";

  // 앱으로 열면 display-mode가 standalone. 예전 아이폰은 navigator.standalone으로 알려 줘요
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

  const inAppBrowser = /KAKAOTALK/i.test(ua)
    ? "kakaotalk"
    : OTHER_IN_APP.test(ua)
      ? "other"
      : null;

  // 아이폰의 Chrome(CriOS), Firefox(FxiOS), Edge(EdgiOS)는 Safari가 아니에요
  const isIosSafari = isIos && !inAppBrowser && !/CriOS|FxiOS|EdgiOS/.test(ua);

  return { platform, isStandalone, inAppBrowser, isIosSafari };
}

// 카카오톡 안에서 외부 브라우저로 여는 주소 (실제 카카오톡에서 동작 확인 필요)
export function kakaoOpenExternalUrl(url: string): string {
  return `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
}
