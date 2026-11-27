import { supabase } from "@/lib/supabase";

type DeleteAccountResponse = { accountDeleted: boolean };

// 모일래 탈퇴. 로그인 계정까지 지워졌는지(accountDeleted)를 돌려줘요
export async function deleteMyAccount(): Promise<DeleteAccountResponse> {
  const { data, error } =
    await supabase.functions.invoke<DeleteAccountResponse>(
      "moillae-delete-account",
      { method: "POST" },
    );
  if (error) throw error;
  if (!data) throw new Error("empty_response");
  return data;
}
