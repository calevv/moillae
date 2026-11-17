import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAppStore } from "@/stores/useAppStore";
import { confirmDialog } from "@/stores/useConfirmStore";
import { toast } from "@/stores/useToastStore";

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
    const ok = await confirmDialog({
      title: "확정을 취소할까요?",
      description: "투표가 다시 열리고, 지금까지의 응답은 그대로 남아요.",
      confirmLabel: "확정 취소",
      cancelLabel: "그대로 둘게요",
      tone: "strong",
    });
    if (!ok) return;

    setPending(true);
    try {
      await cancelConfirmation(pollId);
      toast.success("확정을 취소했어요. 다시 투표를 받을 수 있어요.");
    } catch {
      toast.error("확정을 취소하지 못했어요. 잠시 후 다시 시도해 주세요.");
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
