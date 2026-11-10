import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAppStore } from "@/stores/useAppStore";

const MAX_NAME = 20;

function CreateGroupPage() {
  const currentUserId = useCurrentUser();
  const createGroup = useAppStore((s) => s.createGroup);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const error = !name.trim() ? "그룹 이름을 입력해 주세요." : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAttempted(true);
    if (error || submitting) return;

    setSubmitting(true);
    try {
      const groupId = await createGroup({
        name: name.trim(),
        ownerId: currentUserId,
      });
      navigate(`/groups/${groupId}`, { replace: true });
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
          to="/home"
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
            새 그룹 만들기
          </h1>
          <p className="text-[15px] text-subtext">
            자주 모이는 친구들의 그룹을 만들어요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="group-name" className="text-sm font-bold">
              그룹 이름
            </label>
            <span className="text-[13px] text-faint">
              {name.length}/{MAX_NAME}
            </span>
          </div>
          <input
            id="group-name"
            type="text"
            value={name}
            maxLength={MAX_NAME}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 대학 친구들"
            className="h-14 w-full rounded-2xl border-[1.5px] border-muted-line bg-white px-4 text-[17px] font-medium outline-none focus:border-plum"
          />
          <p className="text-[13px] text-faint">
            그룹을 만든 뒤 초대 링크로 친구를 부를 수 있어요.
          </p>
        </div>
      </div>

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
          그룹 만들기
        </button>
      </div>
    </form>
  );
}

export default CreateGroupPage;
