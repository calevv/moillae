import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { confirmDialog } from "@/stores/useConfirmStore";
import { toast } from "@/stores/useToastStore";

const MAX_NAME = 20;

function ProfilePage() {
  const status = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.userId);
  const email = useAuthStore((s) => s.email);
  const profile = useAuthStore((s) => s.profile);
  const updateName = useAuthStore((s) => s.updateName);
  const signOut = useAuthStore((s) => s.signOut);

  // 이름 수정 모드에서만 쓰는 화면 상태
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 수정 모드가 되면 입력칸에 초점
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(profile?.displayName ?? "");
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const name = draft.trim();

    if (!name) {
      setError("이름을 입력해 주세요.");
      inputRef.current?.focus();
      return;
    }
    if (name === profile?.displayName) {
      setEditing(false); // 바뀐 게 없으면 저장 요청 없이 닫기
      return;
    }

    setSaving(true);
    try {
      await updateName(name); // ① 서버 저장 + 내 프로필(useAuthStore)
      if (userId) useAppStore.getState().renameMember(userId, name); // ② 그룹·투표 화면의 이름
      setEditing(false);
      toast.success("이름을 바꿨어요.");
    } catch {
      toast.error("이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const ok = await confirmDialog({
      title: "로그아웃할까요?",
      confirmLabel: "로그아웃",
      cancelLabel: "취소",
      tone: "strong",
    });
    if (ok) await signOut(); // RequireAuth가 알아서 로그인 화면으로 보내요
  }

  return (
    <div className="flex flex-1 flex-col px-5 pt-5 pb-10">
      {/* 머리 */}
      <div className="flex flex-col gap-5">
        <div className="flex h-11 items-center gap-2">
          <svg width="32" height="26" viewBox="0 0 40 32" aria-hidden="true">
            <circle cx="14" cy="16" r="13" className="fill-coral" />
            <circle
              cx="26"
              cy="16"
              r="13"
              className="fill-plum"
              fillOpacity="0.88"
            />
          </svg>
          <span className="text-xl font-extrabold tracking-tight">모일래</span>
        </div>
        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
          내 정보
        </h1>
      </div>

      {status === "demo" ? (
        /* 둘러보기(데모) 중 */
        <section className="mt-7 border-y border-line py-5">
          <p className="text-[17px] font-bold">둘러보기 중이에요</p>
          <p className="mt-1 text-sm leading-relaxed text-subtext">
            로그인하면 내 이름으로 모임을 만들고 친구를 초대할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 h-[54px] w-full rounded-full bg-coral text-[17px] font-bold"
          >
            로그인하기
          </button>
        </section>
      ) : (
        <div className="mt-7 flex flex-col">
          {/* 이름 */}
          <section className="border-t border-line py-5">
            {editing ? (
              <form onSubmit={handleSave} noValidate>
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-bold"
                >
                  이름
                </label>
                <input
                  ref={inputRef}
                  id="profile-name"
                  type="text"
                  value={draft}
                  maxLength={MAX_NAME}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    if (error) setError(null);
                  }}
                  aria-invalid={error ? true : undefined}
                  aria-describedby="profile-name-msg"
                  className={`mt-2 h-[52px] w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium outline-none ${
                    error ? "border-holiday-text" : "border-plum"
                  }`}
                />
                <div className="mt-2 flex items-start justify-between gap-3 text-[13px] leading-normal">
                  <p
                    id="profile-name-msg"
                    role={error ? "alert" : undefined}
                    className={
                      error ? "font-bold text-holiday-text" : "text-subtext"
                    }
                  >
                    {error ?? "모임에서 친구들에게 보이는 이름이에요."}
                  </p>
                  <span className="shrink-0 text-subtext">
                    {draft.length}/{MAX_NAME}
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="h-12 flex-1 rounded-full border-[1.5px] border-plum bg-white text-[15px] font-bold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-12 flex-1 rounded-full bg-coral text-[15px] font-bold disabled:opacity-60"
                  >
                    {saving ? "저장하는 중…" : "저장"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[13px] font-medium text-subtext">
                      이름
                    </span>
                    <span className="truncate text-lg font-bold tracking-tight">
                      {profile?.displayName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="h-11 shrink-0 rounded-full border-[1.5px] border-plum bg-white px-[18px] text-sm font-bold"
                  >
                    이름 바꾸기
                  </button>
                </div>
                <p className="mt-2 text-[13px] leading-normal text-subtext">
                  모임에서 친구들에게 보이는 이름이에요.
                </p>
              </>
            )}
          </section>

          {/* 이메일 */}
          <section className="border-y border-line py-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] font-medium text-subtext">
                이메일
              </span>
              <span className="text-base font-medium break-all">{email}</span>
            </div>
            <p className="mt-2 text-[13px] leading-normal text-subtext">
              이메일은 바꿀 수 없어요.
            </p>
          </section>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-8 h-[54px] w-full rounded-full border-[1.5px] border-plum bg-white text-[17px] font-bold"
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
