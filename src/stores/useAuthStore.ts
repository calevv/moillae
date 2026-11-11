import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";
import {
  ensureProfile,
  signInWithEmail,
  signOutFromSupabase,
  signUpWithEmail,
} from "@/api/auth";
import { CURRENT_USER_ID } from "@/data/dummy";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";

type AuthStatus = "loading" | "signedOut" | "signedIn" | "demo";

type AuthState = {
  status: AuthStatus;
  userId: string | null;
  profile: Profile | null;
  startAuthListener: () => () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemo: () => void;
};

const signedOut = { status: "signedOut" as const, userId: null, profile: null };

export const useAuthStore = create<AuthState>()((set, get) => {
  // 세션이 바뀔 때마다: 없으면 로그아웃 상태, 있으면 프로필 확인 후 로그인 상태
  async function applySession(session: Session | null) {
    if (!session) {
      set(signedOut);
      return;
    }
    try {
      const profile = await ensureProfile(session.user);
      set({ status: "signedIn", userId: session.user.id, profile });
    } catch (error) {
      console.error(error);
      set(signedOut);
    }
  }

  return {
    status: "loading",
    userId: null,
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

    signUp: async (name, email, password) => {
      set({ status: "loading" });
      try {
        await signUpWithEmail(name, email, password);
      } catch (error) {
        set(signedOut);
        throw error;
      }
    },

    signOut: async () => {
      if (get().status === "demo") {
        set(signedOut);
        return;
      }
      await signOutFromSupabase(); // 리스너가 signedOut으로 바꿔요
    },

    enterDemo: () =>
      set({ status: "demo", userId: CURRENT_USER_ID, profile: null }),
  };
});
