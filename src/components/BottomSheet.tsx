import { lockScroll } from "@/utils/scrollLock";
import { useEffect, useRef, type ReactNode } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  label?: string; // 제목이 없는 시트용 (예: 메뉴)
  labelledBy?: string; // 제목 요소의 id
  children: ReactNode;
};

export default function BottomSheet({
  open,
  onClose,
  label,
  labelledBy,
  children,
}: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!open) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    return lockScroll(); // 닫힐 때(open이 false가 될 때) 자동으로 풀기
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="confirm-sheet mx-auto mt-auto mb-0 w-full max-w-[390px] rounded-t-2xl border-0 bg-white p-0 text-plum shadow-[0_-4px_16px_rgba(54,23,43,0.12)] backdrop:bg-plum/55"
    >
      {open && (
        <div className="rounded-t-2xl border-t border-line px-5 pt-2 pb-7">
          <div
            aria-hidden="true"
            className="mx-auto mb-5 h-1 w-9 rounded-full bg-line"
          />
          {children}
        </div>
      )}
    </dialog>
  );
}
