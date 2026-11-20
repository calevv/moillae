import { create } from "zustand";

// Chrome이 "이 사이트는 설치할 수 있어요" 하고 보내는 신호. TypeScript 기본 타입에 없어서 직접 적어요
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallState = {
  promptEvent: BeforeInstallPromptEvent | null;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
};

export const useInstallStore = create<InstallState>()((set, get) => ({
  promptEvent: null,

  // 우리 "설치" 버튼을 누르면 Chrome의 설치 창을 띄워요
  promptInstall: async () => {
    const event = get().promptEvent;
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    set({ promptEvent: null }); // 한 번 쓴 신호는 다시 쓸 수 없어요
    return outcome;
  },
}));

// 앱이 시작될 때 한 번 불러요 (main.tsx)
// 신호는 화면이 뜨기 전에 올 수 있어서, /install 화면이 아니라 앱 시작부터 듣고 있어야 해요
export function listenInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // Chrome이 자체 설치 안내를 띄우지 않게. 우리 버튼으로 띄울 거예요
    useInstallStore.setState({ promptEvent: e as BeforeInstallPromptEvent });
  });
  window.addEventListener("appinstalled", () => {
    useInstallStore.setState({ promptEvent: null });
  });
}
