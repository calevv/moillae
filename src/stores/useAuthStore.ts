import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  ensureProfile,
  signInWithEmail,
  signOutFromSupabase,
  signUpWithEmail,
  updateDisplayName,
  clearLocalSession,
} from "@/api/auth";
import { CURRENT_USER_ID } from "@/data/dummy";
import { deleteMyAccount } from "@/api/account";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";
import { detachPush, getCurrentSubscription } from "@/utils/push";

type AuthStatus = "loading" | "signedOut" | "signedIn" | "demo";

type AuthState = {
  status: AuthStatus;
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  startAuthListener: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    next?: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
  updateName: (name: string) => Promise<void>;
  deleteAccount: () => Promise<{ accountDeleted: boolean }>;
};

const signedOut = {
  status: "signedOut" as const,
  userId: null,
  email: null,
  profile: null,
};

export const useAuthStore = create<AuthState>()((set, get) => {
  // 세션 이벤트가 연달아 오면 마지막 것만 반영해요 (늦게 끝난 옛 결과는 버림)
  let sessionSeq = 0;

  // 세션이 바뀔 때마다: 없으면 로그아웃 상태, 있으면 프로필 확인 후 로그인 상태
  async function applySession(session: Session | null) {
    const seq = ++sessionSeq;
    if (!session) {
      set(signedOut);
      supabase.realtime.disconnect(); // 로그아웃하면 실시간 연결도 끊어요 (다시 로그인하면 자동으로 다시 연결)
      return;
    }
    try {
      const profile = await ensureProfile(session.user);
      if (seq !== sessionSeq) return;
      set({
        status: "signedIn",
        userId: session.user.id,
        email: session.user.email ?? null,
        profile,
      });
    } catch (error) {
      if (seq !== sessionSeq) return;
      console.error(error);
      set(signedOut);
    }
  }

  return {
    status: "loading",
    userId: null,
    email: null,
    profile: null,

    startAuthListener: () => {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        // 이 콜백 안에서 바로 다른 Supabase 요청을 기다리면 멈출 수 있어서 한 박자 미뤄요
        setTimeout(() => void applySession(session), 0);
      });
      return () => data.subscription.unsubscribe();
    },

    signIn: async (email, password) => {
      set({ status: "loading" });
      try {
        await signInWithEmail(email, password); // 성공하면 리스너가 signedIn으로 바꿔요
      } catch (error) {
        set(signedOut);
        throw error;
      }
    },

    signUp: async (name, email, password, next) => {
      set({ status: "loading" });
      try {
        await signUpWithEmail(name, email, password, next);
      } catch (error) {
        set(signedOut);
        throw error;
      }
    },
    signOut: async () => {
      // 이 기기와 내 계정의 푸시 연결만 끊기 (사서함은 다음 로그인 때 다시 씀)
      if (get().status === "signedIn") {
        await detachPush().catch((e: unknown) =>
          console.error("푸시 연결 해제 실패", e),
        );
      }
      if (get().status === "demo") {
        set(signedOut);
        return;
      }
      await signOutFromSupabase(); // 리스너가 signedOut으로 바꿔요
    },
    deleteAccount: async () => {
      const result = await deleteMyAccount(); // 실패하면 여기서 멈춰요 (화면에서 토스트)

      // 이 브라우저의 푸시 구독도 해제 (서버 기록은 이미 지워졌어요)
      await getCurrentSubscription()
        .then((sub) => sub?.unsubscribe())
        .catch((e: unknown) => console.error("푸시 구독 해제 실패", e));

      // 서버에는 계정이 없으니 이 기기의 로그인 정보만 지워요 (리스너가 signedOut으로 바꿔요)
      await clearLocalSession().catch((e: unknown) => {
        console.error("로그인 정보 정리 실패", e);
        set(signedOut); // 그래도 화면은 로그아웃 상태로
      });

      return result;
    },

    updateName: async (name) => {
      const { status, userId } = get();
      if (status !== "signedIn" || !userId) return;
      const profile = await updateDisplayName(userId, name); // 실패하면 에러가 화면까지 올라가요
      set({ profile });
    },

    enterDemo: () =>
      set({
        status: "demo",
        userId: CURRENT_USER_ID,
        email: null,
        profile: null,
      }),
  };
});
