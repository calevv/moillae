import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";
import type { TableRow } from "@/types/dbHelpers";

// 프로필에서 쓰는 칸만. select 세 곳이 같은 칸을 쓰게 한 곳에 모아 둬요
const PROFILE_COLUMNS = "id, display_name, avatar_url";
type ProfileRow = Pick<
  TableRow<"profiles">,
  "id" | "display_name" | "avatar_url"
>;

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: row.avatar_url,
});

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? toProfile(data) : null;
}

// 모일래 프로필이 있으면 가져오고, 없으면 만들어요 (다른 앱 가입자 대비)
export async function ensureProfile(user: User): Promise<Profile> {
  const existing = await fetchProfile(user.id);
  if (existing) return existing;

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

  // 로그인 이벤트가 겹쳐 동시에 불려도 한 번만 만들어지게: 이미 있으면 그냥 넘어가요
  const { error: insertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      avatar_url: meta.avatar_url ?? null,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (insertError) throw insertError;

  const created = await fetchProfile(user.id);
  if (!created) throw new Error("profile_not_created");
  return created;
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
      return "이메일 또는 비밀번호가 틀렸어요. 간편 로그인으로 가입했다면 가입할 때 쓴 방법으로 로그인해 주세요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일이에요. 간편 로그인으로 가입했다면 가입할 때 쓴 방법으로 로그인해 주세요.";
    case "weak_password":
      return "비밀번호가 너무 짧거나 쉬워요.";
    case "email_address_invalid":
      return "이메일 형식을 확인해 주세요.";
    default:
      console.error(error); // 처음 보는 에러는 콘솔에서 code 확인
      return "잠시 후 다시 시도해 주세요.";
  }
}

// 내 이름 바꾸기 (RLS: 본인 프로필만 수정 가능)
export async function updateDisplayName(
  userId: string,
  name: string,
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: name })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return toProfile(data);
}

// 탈퇴 직후처럼 서버에 알릴 필요가 없을 때: 이 기기의 로그인 정보만 지워요
export async function clearLocalSession() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

// 구글 로그인 시작. 구글 → Supabase를 거쳐 next 주소로 돌아와요 (이 함수 실행 후 페이지가 이동해요)
export async function signInWithGoogle(next: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}${next}`,
      queryParams: { prompt: "select_account" }, // 매번 구글 계정 고르는 화면을 보여 줘요
    },
  });
  if (error) throw error;
}
