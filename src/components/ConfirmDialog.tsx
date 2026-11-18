import { useEffect, useRef } from "react";
import { useConfirmStore } from "@/stores/useConfirmStore";
import { lockScroll } from "@/utils/scrollLock";

export default function ConfirmDialog() {
  const request = useConfirmStore((s) => s.request);
  const close = useConfirmStore((s) => s.close);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!request) {
      if (dialog.open) dialog.close();
      return;
    }
    if (!dialog.open) dialog.showModal();
    cancelRef.current?.focus(); // 실수로 Enter를 눌러도 "취소"가 되도록
    return lockScroll();
  }, [request]);

  const tone = request?.tone ?? "primary";

  const confirmClass =
    tone === "danger"
      ? "border-[1.5px] border-danger bg-white text-danger"
      : tone === "strong"
        ? "bg-plum text-white"
        : "bg-coral text-plum";

  const cancelClass =
    tone === "danger"
      ? "bg-plum text-white" // 삭제할 때는 "취소"를 더 눈에 띄게
      : "border-[1.5px] border-plum bg-white";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-title"
      aria-describedby={request?.description ? "confirm-desc" : undefined}
      onCancel={(e) => {
        e.preventDefault();
        close(false);
      }}
      onClose={() => {
        if (useConfirmStore.getState().request) close(false);
      }}
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

          <div className="flex items-start gap-2">
            {tone === "danger" && (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-danger"
              >
                <path d="M12 3.5l9.5 16.5h-19z" />
                <path d="M12 10v4.5M12 17.2v.01" />
              </svg>
            )}
            <h2
              id="confirm-title"
              className="text-lg leading-[1.45] font-bold tracking-tight"
            >
              {request.title}
            </h2>
          </div>
          {request.description && (
            <p
              id="confirm-desc"
              className="mt-2 text-sm leading-relaxed text-subtext"
            >
              {request.description}
            </p>
          )}

          <div
            className={`mt-6 flex flex-col ${tone === "danger" ? "gap-3" : "gap-2"}`}
          >
            <button
              type="button"
              onClick={() => close(true)}
              className={`flex h-12 items-center justify-center gap-1.5 rounded-full text-[15px] font-bold ${confirmClass}`}
            >
              {tone === "primary" && (
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
              {tone === "danger" && (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 12.5h9l1-12.5M10.5 11v5M13.5 11v5" />
                </svg>
              )}
              {request.confirmLabel}
            </button>
            <button
              ref={cancelRef}
              type="button"
              onClick={() => close(false)}
              className={`h-12 rounded-full text-[15px] font-bold ${cancelClass}`}
            >
              {request.cancelLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
