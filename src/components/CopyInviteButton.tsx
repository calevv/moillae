import { useEffect, useState } from "react";

type CopyInviteButtonProps = {
  groupId: string;
  inviteCode?: string; // 데모 더미 그룹에는 없음
  variant?: "outline" | "dark";
};

export default function CopyInviteButton({
  groupId,
  inviteCode,
  variant = "outline",
}: CopyInviteButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  // 2초 뒤 원래 글자로 돌아가기
  useEffect(() => {
    if (status === "idle") return;
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleCopy() {
    // 초대 코드가 있으면 초대 주소, 없으면(데모) 그룹 주소
    const url = inviteCode
      ? `${window.location.origin}/invite/${inviteCode}`
      : `${window.location.origin}/groups/${groupId}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
  }

  const style =
    variant === "dark"
      ? "bg-plum text-white"
      : "border-[1.5px] border-plum bg-white text-plum";

  const label =
    status === "copied"
      ? "링크를 복사했어요"
      : status === "failed"
        ? "복사에 실패했어요"
        : "초대 링크 복사";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`flex h-[50px] items-center justify-center gap-2 rounded-full text-base font-bold ${style}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
      </svg>
      <span aria-live="polite">{label}</span>
    </button>
  );
}
