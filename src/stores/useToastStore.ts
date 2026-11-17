import { create } from "zustand";

type ToastKind = "success" | "error";
type ToastItem = { id: string; kind: ToastKind; message: string };

type ToastState = {
  toasts: ToastItem[];
  show: (kind: ToastKind, message: string) => void;
  dismiss: (id: string) => void;
};

const DURATION = { success: 2500, error: 4000 }; // 실패는 조금 더 오래 보여 주기
const MAX_TOASTS = 3;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  show: (kind, message) => {
    const id = crypto.randomUUID();
    set((s) => ({
      toasts: [...s.toasts, { id, kind, message }].slice(-MAX_TOASTS),
    }));
    setTimeout(() => get().dismiss(id), DURATION[kind]); // 시간이 지나면 저절로 사라지기
  },

  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// 화면에서 쓰는 함수
export const toast = {
  success: (message: string) =>
    useToastStore.getState().show("success", message),
  error: (message: string) => useToastStore.getState().show("error", message),
};
