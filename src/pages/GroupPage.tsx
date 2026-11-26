import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import BottomSheet from "@/components/BottomSheet";
import CopyInviteButton from "@/components/CopyInviteButton";
import PollSummaryCard from "@/components/PollSummaryCard";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useGroup, useGroupMembers, useGroupPolls } from "@/stores/selectors";
import { useAppStore } from "@/stores/useAppStore";
import { confirmDialog } from "@/stores/useConfirmStore";
import { toast } from "@/stores/useToastStore";
import { useAuthStore } from "@/stores/useAuthStore";

const MAX_NAME = 20;
type Sheet = "menu" | "rename" | null;

const menuItemClass =
  "flex h-14 w-full items-center gap-2 text-left text-base font-medium";

function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUserId = useCurrentUser();
  const group = useGroup(groupId);
  const groupMembers = useGroupMembers(groupId);
  const groupPolls = useGroupPolls(groupId);
  const renameGroup = useAppStore((s) => s.renameGroup);
  const leaveGroup = useAppStore((s) => s.leaveGroup);
  const deleteGroup = useAppStore((s) => s.deleteGroup);
  const regenerateInviteCode = useAppStore((s) => s.regenerateInviteCode);
  const isDemo = useAuthStore((s) => s.status) === "demo";

  const [sheet, setSheet] = useState<Sheet>(null);
  const [draft, setDraft] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false); // 나가기·삭제 직후 "찾을 수 없어요"가 번쩍 보이지 않게
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 이름 바꾸기 시트가 열리면 입력칸에 초점
  useEffect(() => {
    if (sheet === "rename") renameInputRef.current?.focus();
  }, [sheet]);

  if (!group) {
    return leaving ? null : (
      <p className="p-5 text-plum">그룹을 찾을 수 없어요.</p>
    );
  }

  const isAlone = groupMembers.length <= 1; // 나 혼자인 그룹
  const hasPolls = groupPolls.length > 0;
  const isOwner = group.ownerId === currentUserId;
  const nextOwner = groupMembers.find((m) => m.id !== currentUserId); // 들어온 순서대로라 첫 번째 다른 멤버

  const openRename = () => {
    setDraft(group.name);
    setRenameError(null);
    setSheet("rename");
  };

  const handleRename = async (e: FormEvent) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name) {
      setRenameError("그룹 이름을 입력해 주세요.");
      renameInputRef.current?.focus();
      return;
    }
    if (name === group.name) {
      setSheet(null);
      return;
    }
    setSaving(true);
    try {
      await renameGroup(group.id, name);
      setSheet(null);
      toast.success("그룹 이름을 바꿨어요.");
    } catch {
      toast.error("그룹 이름을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handleLeave = async () => {
    setSheet(null);
    const ok = await confirmDialog({
      title: "그룹에서 나갈까요?",
      description:
        isOwner && nextOwner
          ? `방장은 ${nextOwner.name}님에게 넘어가요. 다시 들어오려면 초대 링크가 필요해요.`
          : "다시 들어오려면 초대 링크가 필요해요.",
      confirmLabel: "나가기",
      cancelLabel: "취소",
      tone: "strong",
    });
    if (!ok) return;

    setLeaving(true);
    try {
      await leaveGroup(group.id);
      navigate("/home", { replace: true });
      toast.success("그룹에서 나왔어요.");
    } catch (err) {
      setLeaving(false);
      toast.error(
        err instanceof Error && err.message === "last_member"
          ? "혼자 있는 그룹은 나갈 수 없어요. 그룹을 삭제해 주세요."
          : "그룹에서 나가지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  const handleRegenerateInvite = async () => {
    setSheet(null);
    const ok = await confirmDialog({
      title: "초대 링크를 새로 만들까요?",
      description:
        "예전 링크로는 더 이상 들어올 수 없어요. 이미 들어온 멤버는 그대로예요.",
      confirmLabel: "새로 만들기",
      cancelLabel: "취소",
      tone: "strong",
    });
    if (!ok) return;

    try {
      await regenerateInviteCode(group.id);
      toast.success("새 초대 링크를 만들었어요. 친구에게 다시 보내 주세요.");
    } catch {
      toast.error("초대 링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleDelete = async () => {
    setSheet(null);
    const ok = await confirmDialog({
      title: "그룹을 삭제할까요?",
      description: "모임 제안, 투표, 응답이 모두 사라지고 되돌릴 수 없어요.",
      confirmLabel: "그룹 삭제",
      cancelLabel: "취소",
      tone: "danger",
    });
    if (!ok) return;

    setLeaving(true);
    try {
      await deleteGroup(group.id);
      navigate("/home", { replace: true });
      toast.success("그룹을 삭제했어요.");
    } catch {
      setLeaving(false);
      toast.error("그룹을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-[22px] px-5 pt-3">
        {/* 상단: 뒤로 가기 + 더보기 */}
        <div className="flex items-center justify-between">
          <Link
            to="/home"
            aria-label="뒤로 가기"
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
          <button
            type="button"
            aria-label="그룹 메뉴"
            aria-haspopup="dialog"
            onClick={() => setSheet("menu")}
            className="-mr-2.5 flex size-11 items-center justify-center"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <circle cx="5.5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="18.5" cy="12" r="1.7" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
            {group.name}
          </h1>
          <p className="text-[15px] text-subtext">
            멤버 {groupMembers.length}명
          </p>
        </div>

        {/* 멤버 */}
        {isAlone ? (
          <section className="flex flex-col gap-3.5 rounded-3xl bg-peach px-4 py-[18px]">
            <div className="flex items-center gap-3">
              <div className="flex shrink-0">
                <span className="flex size-11 items-center justify-center rounded-full border-2 border-peach bg-white font-bold">
                  나
                </span>
                <span
                  className="-ml-2 flex size-11 items-center justify-center rounded-full border-2 border-dashed border-faint bg-peach"
                  aria-hidden="true"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[17px] font-extrabold tracking-tight">
                  친구를 초대해 보세요
                </span>
                <span className="text-sm text-subtext">
                  링크를 보내면 바로 참여할 수 있어요.
                </span>
              </div>
            </div>
            <CopyInviteButton
              groupId={group.id}
              inviteCode={group.inviteCode}
              variant="dark"
            />
          </section>
        ) : (
          <section className="flex flex-col gap-3.5">
            <ul className="flex flex-wrap gap-2.5">
              {groupMembers.map((m) => (
                <li
                  key={m.id}
                  className="flex w-12 flex-col items-center gap-1.5"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-cream text-[17px] font-bold">
                    {m.name.slice(0, 1)}
                  </span>
                  <span className="w-full truncate text-center text-[13px] font-medium">
                    {m.name}
                  </span>
                  {m.id === group.ownerId && (
                    <span className="-mt-0.5 inline-flex h-5 items-center rounded-full border border-plum px-[7px] text-xs font-bold">
                      방장
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <CopyInviteButton
              groupId={group.id}
              inviteCode={group.inviteCode}
            />
          </section>
        )}

        {/* 모임 제안 */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-extrabold tracking-tight">모임 제안</h2>
          {hasPolls ? (
            groupPolls.map((poll) => (
              <PollSummaryCard
                key={poll.id}
                poll={poll}
                members={groupMembers}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-2.5 rounded-3xl border-[1.5px] border-dashed border-muted-line p-6 text-center">
              <span
                className="flex size-14 items-center justify-center rounded-full bg-cream"
                aria-hidden="true"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="5.5" width="16" height="14" rx="3" />
                  <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-tight">
                아직 모임 제안이 없어요
              </span>
              <span className="text-sm leading-relaxed text-subtext">
                후보 시간을 여러 개 올리면
                <br />
                친구들이 가능한 시간에 투표해요.
              </span>
            </div>
          )}
        </section>
      </div>

      {/* 하단 고정 버튼 (탭 바로 위) */}
      <div className="sticky bottom-tab-bar mt-4 bg-white px-5 py-3 border-t border-line">
        <Link
          to={`/groups/${group.id}/polls/new`}
          className="flex h-[54px] w-full items-center justify-center gap-2 rounded-full bg-coral text-[17px] font-bold"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          {hasPolls ? "새 모임 제안" : "첫 모임 제안하기"}
        </Link>
      </div>

      {/* 더보기 메뉴 / 이름 바꾸기 시트 */}
      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        label={sheet === "menu" ? "그룹 메뉴" : undefined}
        labelledBy={sheet === "rename" ? "rename-title" : undefined}
      >
        {sheet === "menu" && (
          <div className="-mt-3 flex flex-col">
            {isOwner && (
              <button
                type="button"
                onClick={openRename}
                className={menuItemClass}
              >
                그룹 이름 바꾸기
              </button>
            )}

            {isOwner && !isDemo && (
              <button
                type="button"
                onClick={() => void handleRegenerateInvite()}
                className={`${menuItemClass} border-t border-line`}
              >
                초대 링크 새로 만들기
              </button>
            )}

            {!(isOwner && isAlone) && (
              <button
                type="button"
                onClick={() => void handleLeave()}
                className={`${menuItemClass} ${isOwner ? "border-t border-line" : ""}`}
              >
                그룹 나가기
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                className={`${menuItemClass} border-t border-line text-danger`}
              >
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
                그룹 삭제
              </button>
            )}
          </div>
        )}

        {sheet === "rename" && (
          <form onSubmit={handleRename} noValidate>
            <h2
              id="rename-title"
              className="text-lg leading-[1.45] font-bold tracking-tight"
            >
              그룹 이름 바꾸기
            </h2>
            <input
              ref={renameInputRef}
              type="text"
              value={draft}
              maxLength={MAX_NAME}
              onChange={(e) => {
                setDraft(e.target.value);
                if (renameError) setRenameError(null);
              }}
              aria-label="그룹 이름"
              aria-invalid={renameError ? true : undefined}
              aria-describedby="rename-msg"
              className={`mt-4 h-[52px] w-full rounded-xl border-[1.5px] bg-white px-3.5 text-base font-medium outline-none ${
                renameError ? "border-danger" : "border-plum"
              }`}
            />
            <div className="mt-2 flex items-start justify-between gap-3 text-[13px] leading-normal">
              <p
                id="rename-msg"
                role={renameError ? "alert" : undefined}
                className={renameError ? "font-bold text-danger" : ""}
              >
                {renameError ?? ""}
              </p>
              <span className="shrink-0 text-subtext">
                {draft.length}/{MAX_NAME}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setSheet(null)}
                className="h-12 flex-1 rounded-full border-[1.5px] border-plum bg-white text-[15px] font-bold"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-12 flex-1 rounded-full bg-coral text-[15px] font-bold disabled:opacity-60"
              >
                {saving ? "저장하는 중…" : "저장"}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}

export default GroupPage;
