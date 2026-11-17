import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAppStore } from "@/stores/useAppStore";

type CancelConfirmButtonProps = {
  pollId: string;
  hostId: string;
};

// 방장에게만 보이는 "확정 취소" 버튼
export default function CancelConfirmButton({
  pollId,
  hostId,
}: CancelConfirmButtonProps) {
  const currentUserId = useCurrentUser();
  const cancelConfirmation = useAppStore((s) => s.cancelConfirmation);
  const [pending, setPending] = useState(false);

  if (hostId !== currentUserId) return null;

  async function handleCancel() {
    if (
      !window.confirm(
        "확정을 취소할까요? 투표가 다시 열리고, 지금까지의 응답은 그대로 남아요.",
      )
    )
      return;
    setPending(true);
    try {
      await cancelConfirmation(pollId);
      // 성공하면 투표 화면으로 바뀌면서 이 버튼은 사라져요
    } catch {
      alert("확정을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCancel()}
      disabled={pending}
      className="flex h-[50px] w-full items-center justify-center rounded-full border-[1.5px] border-plum bg-white text-base font-bold disabled:opacity-60"
    >
      {pending ? "취소하는 중…" : "확정 취소하기"}
    </button>
  );
}
