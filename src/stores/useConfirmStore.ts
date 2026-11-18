import { create } from "zustand";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: "primary" | "strong" | "danger"; // primary: 코랄 + 체크, strong: 자두색 + 되돌리기, danger: 되돌릴 수 없는 삭제
};

type ConfirmRequest = ConfirmOptions & { resolve: (ok: boolean) => void };

type ConfirmState = {
  request: ConfirmRequest | null;
  open: (options: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
};

export const useConfirmStore = create<ConfirmState>()((set, get) => ({
  request: null,

  // Promise를 돌려주고, 사용자가 버튼을 누르면 그때 결과(true/false)를 채워줌
  open: (options) =>
    new Promise<boolean>((resolve) => {
      get().request?.resolve(false); // 이미 열린 창이 있으면 "취소"로 끝내기
      set({ request: { ...options, resolve } });
    }),

  close: (ok) => {
    const request = get().request;
    if (!request) return;
    request.resolve(ok);
    set({ request: null });
  },
}));

// 화면에서 쓰는 함수: window.confirm처럼 쓰되 await로 기다리기
export const confirmDialog = (options: ConfirmOptions) =>
  useConfirmStore.getState().open(options);
