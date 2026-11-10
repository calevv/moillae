import type { VoteResponse } from "@/types/poll";

export default function ResponseStatus({ status }: { status: VoteResponse }) {
  const circle =
    "inline-flex size-[22px] items-center justify-center rounded-full";

  if (status === "yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold">
        <span className={`${circle} bg-coral`}>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-plum"
            aria-hidden="true"
          >
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
        가능
      </span>
    );
  }
  if (status === "no") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-bold">
        <span className={`${circle} bg-plum`}>
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-white"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
        불가능
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-faint">
      <span
        className={`${circle} border-2 border-dashed border-faint bg-white`}
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      </span>
      미응답
    </span>
  );
}
