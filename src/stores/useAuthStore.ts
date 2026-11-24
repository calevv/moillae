import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  ensureProfile,
  signInWithEmail,
  signOutFromSupabase,
  signUpWithEmail,
  updateDisplayName,
} from "@/api/auth";
import { CURRENT_USER_ID } from "@/data/dummy";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";
import { detachPush } from "@/utils/push";

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
};

const signedOut = {
  status: "signedOut" as const,
  userId: null,
  email: null,
  profile: null,
};

export const useAuthStore = create<AuthState>()((set, get) => {
  // 세션이 바뀔 때마다: 없으면 로그아웃 상태, 있으면 프로필 확인 후 로그인 상태
  async function applySession(session: Session | null) {
    if (!session) {
      set(signedOut);
      return;
    }
    try {
      const profile = await ensureProfile(session.user);
      set({
        status: "signedIn",
        userId: session.user.id,
        email: session.user.email ?? null,
        profile,
      });
    } catch (error) {
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
