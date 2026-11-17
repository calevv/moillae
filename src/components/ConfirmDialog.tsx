import { useEffect, useRef } from "react";
import { useConfirmStore } from "@/stores/useConfirmStore";

export default function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request);
  const close = useConfirmStore((s) => s.close);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // 스토어의 request가 생기면 열고, 사라지면 닫기
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (request && !dialog.open) {
      dialog.showModal();
      cancelRef.current?.focus(); // 실수로 Enter를 눌러도 "취소"가 되도록 안전한 버튼에 초점
      document.body.style.overflow = "hidden"; // 뒤 화면 스크롤 막기
    }
    if (!request && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [request]);

  const strong = request?.tone === "strong";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      aria-describedby={request?.description ? "confirm-desc" : undefined}
      // Esc: 브라우저가 직접 닫지 않게 막고, 스토어를 통해 닫아요
      onCancel={(e) => {
        e.preventDefault();
        close(false);
      }}
      // 혹시 브라우저가 그냥 닫아 버린 경우에도 스토어와 맞추기
      onClose={() => {
        if (useConfirmStore.getState().request) close(false);
      }}
      // 어두운 배경(backdrop)을 누르면 취소
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false);
      }}
      className="confirm-sheet mx-auto mt-auto mb-0 w-full max-w-[390px] rounded-t-2xl border-0 bg-white p-0 text-plum shadow-[0_-4px_16px_rgba(54,23,43,0.12)] backdrop:bg-plum/55"
    >
      {request && (
        <div className="rounded-t-2xl border-t border-line px-5 pt-2 pb-7">
          <div
            aria-hidden="true"
            className="mx-auto mb-5 h-1 w-9 rounded-full bg-line"
          />

          <h2
            id="confirm-title"
            className="text-lg leading-[1.45] font-bold tracking-tight"
          >
            {request.title}
          </h2>
          {request.description && (
            <p
              id="confirm-desc"
              className="mt-2 text-sm leading-relaxed text-subtext"
            >
              {request.description}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => close(true)}
              className={`flex h-12 items-center justify-center gap-1.5 rounded-full text-[15px] font-bold ${
                strong ? "bg-plum text-white" : "bg-coral text-plum"
              }`}
            >
              {!strong && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
              {request.confirmLabel}
            </button>
            <button
              ref={cancelRef}
              type="button"
              onClick={() => close(false)}
              className="h-12 rounded-full border-[1.5px] border-plum bg-white text-[15px] font-bold"
            >
              {request.cancelLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
