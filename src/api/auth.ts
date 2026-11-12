import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";

type ProfileRow = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: row.avatar_url,
});

// 모일래 프로필이 있으면 가져오고, 없으면 만들어요 (다른 앱 가입자 대비)
export async function ensureProfile(user: User): Promise<Profile> {
  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  if (selectError) throw selectError;
  if (existing) return toProfile(existing);

  const meta = user.user_metadata as {
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
  };
  const fallback = user.email?.split("@")[0] ?? "친구";
  const displayName = (meta.display_name ?? meta.full_name ?? fallback).slice(
    0,
    20,
  );

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      display_name: displayName,
      avatar_url: meta.avatar_url ?? null,
    })
    .select("id, display_name, avatar_url")
    .single<ProfileRow>();
  if (insertError) throw insertError;
  return toProfile(created);
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
  next = "/home",
) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      // 이메일 인증을 켜면, 인증 메일의 링크가 이 주소로 돌아와요 (지금은 꺼져 있어서 준비만)
      emailRedirectTo: `${window.location.origin}${next}`,
    },
  });
  if (error) throw error;
}
export async function signOutFromSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Supabase 에러 코드를 화면 문구로
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "invalid_credentials":
      return "이메일 또는 비밀번호가 틀렸어요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일이에요. 로그인해 주세요.";
    case "weak_password":
      return "비밀번호가 너무 짧거나 쉬워요.";
    case "email_address_invalid":
      return "이메일 형식을 확인해 주세요.";
    default:
      console.error(error); // 처음 보는 에러는 콘솔에서 code 확인
      return "잠시 후 다시 시도해 주세요.";
  }
}
