import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroup } from "@/stores/selectors";
import { useAppStore } from "@/stores/useAppStore";
import { getHoliday } from "@/utils/holiday";

// 입력 중인 후보 한 개
type Draft = { key: string; date: string; time: string };

const newDraft = (): Draft => ({
  key: crypto.randomUUID(),
  date: "",
  time: "19:00",
});

const inputStyle =
  "w-full rounded-2xl border-[1.5px] border-muted-line bg-white px-4 text-plum outline-none focus:border-plum";

function CreatePollPage() {
  const { groupId } = useParams();
  const group = useGroup(groupId);
  const currentUserId = useCurrentUser();
  const createPoll = useAppStore((s) => s.createPoll);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>(() => [newDraft()]);
  const [attempted, setAttempted] = useState(false); // 등록을 한 번 눌렀는지
  const [submitting, setSubmitting] = useState(false);

  if (!group) {
    return <p className="p-5 text-plum">그룹을 찾을 수 없어요.</p>;
  }

  function updateDraft(key: string, field: "date" | "time", value: string) {
    setDrafts((prev) =>
      prev.map((d) => (d.key === key ? { ...d, [field]: value } : d)),
    );
  }

  function removeDraft(key: string) {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  }

  function addDraft() {
    setDrafts((prev) => [...prev, newDraft()]);
  }

  // 검사: 문제가 있으면 안내 문구, 없으면 null
  const slots = drafts.map((d) => `${d.date} ${d.time}`);
  const error = !title.trim()
    ? "모임 이름을 입력해 주세요."
    : drafts.some((d) => !d.date || !d.time)
      ? "후보의 날짜와 시간을 모두 입력해 주세요."
      : new Set(slots).size !== slots.length
        ? "같은 날짜와 시간의 후보가 있어요."
        : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // 폼 기본 동작(페이지 새로고침) 막기
    setAttempted(true);
    if (error || submitting || !group) return;

    setSubmitting(true);
    try {
      const pollId = await createPoll({
        groupId: group.id,
        title: title.trim(),
        hostId: currentUserId,
        options: drafts.map((d) => ({ date: d.date, time: d.time })),
      });
      navigate(`/groups/${group.id}/polls/${pollId}`, { replace: true });
    } catch {
      alert("모임을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-screen max-w-[390px] flex-col bg-white text-plum"
    >
      <div className="flex flex-1 flex-col gap-[22px] px-5 pt-3">
        <Link
          to={`/groups/${group.id}`}
          aria-label="닫고 뒤로 가기"
          className="-ml-2.5 flex size-11 items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
            새 모임 제안
          </h1>
          <p className="text-[15px] text-subtext">
            {group.name}에게 후보 시간을 올려요.
          </p>
        </div>

        {/* 모임 이름 */}
        <div className="flex flex-col gap-2">
          <label htmlFor="poll-title" className="text-sm font-bold">
            모임 이름
          </label>
          <input
            id="poll-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 송년회"
            className={`${inputStyle} h-14 text-[17px] font-medium`}
          />
        </div>

        {/* 후보 시간 */}
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">후보 시간</h2>
            <span className="text-sm text-subtext">{drafts.length}개</span>
          </div>

          {drafts.map((d, index) => {
            const holiday = d.date ? getHoliday(d.date) : undefined;
            return (
              <div
                key={d.key}
                className="flex flex-col gap-2.5 rounded-[20px] bg-cream pt-3 pr-2 pb-3.5 pl-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">후보 {index + 1}</span>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDraft(d.key)}
                      aria-label={`후보 ${index + 1} 삭제`}
                      className="flex size-11 items-center justify-center text-subtext"
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
                        <path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7M10.5 11v5M13.5 11v5" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pr-2">
                  <div className="flex min-w-0 flex-[1.25] flex-col gap-1.5">
                    <label
                      htmlFor={`${d.key}-date`}
                      className="text-xs font-bold text-subtext"
                    >
                      날짜
                    </label>
                    <input
                      id={`${d.key}-date`}
                      type="date"
                      value={d.date}
                      onChange={(e) =>
                        updateDraft(d.key, "date", e.target.value)
                      }
                      className={`${inputStyle} h-12 px-3 text-base font-bold ${holiday ? "text-holiday-date" : ""}`}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <label
                      htmlFor={`${d.key}-time`}
                      className="text-xs font-bold text-subtext"
                    >
                      시간
                    </label>
                    <input
                      id={`${d.key}-time`}
                      type="time"
                      value={d.time}
                      onChange={(e) =>
                        updateDraft(d.key, "time", e.target.value)
                      }
                      className={`${inputStyle} h-12 px-3 text-base font-bold`}
                    />
                  </div>
                </div>

                {holiday && (
                  <span className="inline-flex h-[26px] items-center self-start rounded-full bg-holiday-bg px-2.5 text-[13px] font-bold text-holiday-text">
                    공휴일 · {holiday}
                  </span>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addDraft}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-muted-line bg-white text-base font-bold"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            후보 추가
          </button>
          <p className="text-[13px] text-faint">
            공휴일은 빨간색과 배지로 표시돼요.
          </p>
        </section>
      </div>

      {/* 하단 고정: 등록 */}
      <div className="sticky bottom-0 mt-4 flex flex-col gap-2 bg-white px-5 pt-3 pb-7 shadow-[0_-8px_20px_rgba(54,23,43,0.05)]">
        {attempted && error && (
          <p
            role="alert"
            className="text-center text-sm font-bold text-holiday-text"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="h-[54px] w-full rounded-full bg-coral text-[17px] font-bold disabled:opacity-60"
        >
          모임 제안 등록
        </button>
      </div>
    </form>
  );
}

export default CreatePollPage;
