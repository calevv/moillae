import type { Member, TimeOption, VoteResponse } from "@/types/poll";
import { formatDate, formatTime } from "@/utils/date";
import { countYes } from "@/utils/poll";

type CandidateCardProps = {
  option: TimeOption;
  members: Member[];
  currentUserId: string;
  isRecommended: boolean;
  isHost: boolean;
  onRespond: (value: "yes" | "no") => void;
};

const STATUS_LABEL: Record<VoteResponse, string> = {
  yes: "가능",
  no: "불가능",
  pending: "미응답",
};

function StatusBadge({ status }: { status: VoteResponse }) {
  const base =
    "absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2";

  if (status === "yes") {
    return (
      <span className={`${base} border-white bg-coral`}>
        <svg
          width="11"
          height="11"
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
    );
  }
  if (status === "no") {
    return (
      <span className={`${base} border-white bg-plum`}>
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
    );
  }
  return (
    <span className={`${base} border-dashed border-faint bg-white`}>
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-faint"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
      </svg>
    </span>
  );
}

export default function CandidateCard({
  option,
  members,
  currentUserId,
  isRecommended,
  isHost,
  onRespond,
}: CandidateCardProps) {
  const yesCount = countYes(option, members);
  const myResponse = option.responses[currentUserId] ?? "pending";

  const cardStyle = isRecommended
    ? "border-coral bg-white shadow-[0_8px_24px_rgba(242,139,102,0.28)]"
    : "border-line bg-white";

  const responseButton = (value: "yes" | "no", label: string) => {
    const selected = myResponse === value;
    const selectedStyle =
      value === "yes"
        ? "border-coral bg-coral text-plum font-bold"
        : "border-plum bg-plum text-white font-bold";
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onRespond(value)}
        className={`flex h-12 items-center justify-center gap-1.5 rounded-2xl border-2 text-base ${
          selected
            ? selectedStyle
            : "border-muted-line bg-white text-plum font-medium"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <section
      className={`flex flex-col gap-4 rounded-3xl border-2 px-4 pt-[18px] pb-4 ${cardStyle}`}
    >
      {/* 날짜, 시간, 가능 인원 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span
            className={`text-[15px] font-bold ${option.holiday ? "text-holiday-date" : "text-subtext"}`}
          >
            {formatDate(option.date)}
          </span>
          <span className="text-[26px] leading-tight font-extrabold tracking-tight">
            {formatTime(option.time)}
          </span>

          <div className="mt-1 flex min-h-[26px] flex-wrap gap-1.5">
            {isRecommended && (
              <span className="inline-flex h-[26px] items-center gap-1 rounded-full bg-coral px-2.5 text-[13px] font-bold">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z" />
                </svg>
                추천
              </span>
            )}
            {option.holiday && (
              <span className="inline-flex h-[26px] items-center rounded-full bg-holiday-bg px-2.5 text-[13px] font-bold text-holiday-text">
                공휴일 · {option.holiday}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[30px] leading-tight font-extrabold tracking-tight">
            {yesCount}/{members.length}명
          </span>
          <span className="text-[13px] font-bold text-subtext">가능</span>
        </div>
      </div>

      {/* 인원 막대 */}
      <div className="flex gap-1" aria-hidden="true">
        {members.map((m, i) => (
          <div
            key={m.id}
            className={`h-2 flex-1 rounded-full ${i < yesCount ? "bg-coral" : "bg-track"}`}
          />
        ))}
      </div>

      {/* 멤버별 응답 */}
      <ul className="grid grid-cols-5 gap-y-3">
        {members.map((m) => {
          const status = option.responses[m.id] ?? "pending";
          return (
            <li key={m.id} className="flex flex-col items-center gap-1">
              <div className="relative size-11">
                <div className="flex size-11 items-center justify-center rounded-full bg-cream text-[15px] font-bold">
                  {m.name.slice(0, 1)}
                </div>
                <StatusBadge status={status} />
              </div>
              <span className="text-[13px] font-medium">{m.name}</span>
              <span
                className={`text-xs ${status === "pending" ? "font-medium text-faint" : "font-bold"}`}
              >
                {STATUS_LABEL[status]}
              </span>
            </li>
          );
        })}
      </ul>

      {/* 내 응답 */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-bold text-subtext">내 응답</span>
        <div className="grid grid-cols-2 gap-2">
          {responseButton("yes", "가능")}
          {responseButton("no", "불가능")}
        </div>
      </div>

      {/* 확정 (만든 사람만) */}
      {isHost && (
        <button
          type="button"
          className={`h-[52px] rounded-full text-base font-bold ${
            isRecommended
              ? "bg-plum text-white"
              : "border-[1.5px] border-plum text-plum"
          }`}
        >
          이 시간으로 확정
        </button>
      )}
    </section>
  );
}
