import { useToastStore } from "@/stores/useToastStore";

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-label="알림"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--spacing-tab-bar)_+_16px)] z-50 mx-auto flex max-w-[390px] flex-col gap-2 px-4"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className="toast-item flex min-h-12 items-center gap-2.5 rounded-xl bg-plum px-4 py-3 text-white shadow-[0_4px_16px_rgba(54,23,43,0.2)]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            {t.kind === "error" ? (
              <>
                <path d="M12 3.5l9.5 16.5h-19z" />
                <path d="M12 10v4.5M12 17.2v.01" />
              </>
            ) : (
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            )}
          </svg>
          <span className="text-sm leading-normal font-medium">
            {t.message}
          </span>
        </div>
      ))}
    </div>
  );
}
