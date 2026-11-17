import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  getInvitePreview,
  joinGroupByCode,
  type InvitePreview,
} from "@/api/polls";
import { useAppStore } from "@/stores/useAppStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { withNext } from "@/utils/next";

type PreviewResult =
  | { kind: "ready"; preview: InvitePreview }
  | { kind: "notFound" }
  | { kind: "error" };

const primaryButton =
  "flex h-[54px] w-full items-center justify-center rounded-full bg-coral text-[17px] font-bold disabled:opacity-60";
const secondaryButton =
  "flex h-[54px] w-full items-center justify-center rounded-full border-[1.5px] border-plum bg-white text-[17px] font-bold";

function InvitePage() {
  const { code = "" } = useParams();
  const status = useAuthStore((s) => s.status);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const invitePath = `/invite/${code}`;

  // 미리 보기 결과를 "어떤 요청의 결과인지(key)"와 같이 저장해요.
  // key가 지금과 다르면 새 결과가 아직 안 온 거라 "불러오는 중"으로 봐요.
  const [retry, setRetry] = useState(0);
  const key = `${code}|${status}|${retry}`;
  const [result, setResult] = useState<{
    key: string;
    value: PreviewResult;
  } | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return; // 로그인 확인이 끝나야 "내가 멤버인지"가 정확해요
    let ignore = false; // 늦게 온 옛 응답 버리기 (loadSeq와 같은 역할)
    getInvitePreview(code)
      .then((preview) => {
        if (!ignore)
          setResult({
            key,
            value: preview ? { kind: "ready", preview } : { kind: "notFound" },
          });
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!ignore) setResult({ key, value: { kind: "error" } });
      });
    return () => {
      ignore = true;
    };
  }, [code, status, key]);

  const current = result?.key === key ? result.value : null; // null = 불러오는 중
  const preview = current?.kind === "ready" ? current.preview : null;
  const backTo = status === "signedIn" || status === "demo" ? "/home" : "/";

  async function handleJoin() {
    setJoining(true);
    setJoinError(null);
    try {
      const groupId = await joinGroupByCode(code);
      await useAppStore.getState().reloadData(); // 새 그룹, 멤버, 투표 받기
      navigate(`/groups/${groupId}`, { replace: true });
    } catch (err) {
      console.error(err);
      setJoinError(
        err instanceof Error && err.message === "invalid_invite_code"
          ? "초대 링크가 바뀌었어요. 친구에게 새 링크를 받아 주세요."
          : "참여하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setJoining(false);
    }
  }

  async function handleLoginFromDemo() {
    await signOut(); // 데모 끝내기
    navigate(withNext("/login", invitePath));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-[22px] bg-white px-5 pt-3 pb-7 text-plum">
      <Link
        to={backTo}
        aria-label="처음으로"
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

      {current === null && (
        <p className="flex flex-1 items-center justify-center text-[15px] text-subtext">
          초대 정보를 불러오는 중이에요…
        </p>
      )}

      {current?.kind === "notFound" && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p role="alert" className="text-[17px] font-bold">
              초대 링크가 올바르지 않아요.
            </p>
            <p className="text-[15px] text-subtext">
              초대한 친구에게 링크를 다시 받아 주세요.
            </p>
          </div>
          <Link to={backTo} replace className={primaryButton}>
            돌아가기
          </Link>
        </>
      )}

      {current?.kind === "error" && (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p role="alert" className="text-[17px] font-bold">
              초대 정보를 불러오지 못했어요.
            </p>
            <p className="text-[15px] text-subtext">
              인터넷 연결을 확인하고 다시 시도해 주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className={primaryButton}
          >
            다시 시도
          </button>
        </>
      )}

      {preview && (
        <>
          <section className="flex flex-col items-center gap-2 rounded-3xl bg-cream px-5 py-9 text-center">
            <span className="text-sm font-bold text-subtext">모임 초대</span>
            <h1 className="text-[28px] leading-tight font-extrabold tracking-tight break-keep">
              {preview.groupName}
            </h1>
            <p className="text-[15px] text-subtext">
              멤버 {preview.memberCount}명
            </p>
          </section>

          <div className="mt-auto flex flex-col gap-3">
            {joinError && (
              <p
                role="alert"
                className="text-center text-sm font-bold text-holiday-text"
              >
                {joinError}
              </p>
            )}

            {status === "signedIn" && preview.isMember && (
              <>
                <p className="text-center text-[15px] text-subtext">
                  이미 참여한 모임이에요.
                </p>
                <Link
                  to={`/groups/${preview.groupId}`}
                  replace
                  className={primaryButton}
                >
                  모임으로 가기
                </Link>
              </>
            )}

            {status === "signedIn" && !preview.isMember && (
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={joining}
                className={primaryButton}
              >
                {joining ? "참여하는 중…" : "참여하기"}
              </button>
            )}

            {status === "demo" && (
              <>
                <p className="text-center text-[15px] text-subtext">
                  둘러보기 모드에서는 참여할 수 없어요.
                </p>
                <button
                  type="button"
                  onClick={() => void handleLoginFromDemo()}
                  className={primaryButton}
                >
                  로그인하고 참여하기
                </button>
              </>
            )}

            {status === "signedOut" && (
              <>
                <Link
                  to={withNext("/signup", invitePath)}
                  className={primaryButton}
                >
                  가입하고 참여하기
                </Link>
                <Link
                  to={withNext("/login", invitePath)}
                  className={secondaryButton}
                >
                  로그인하고 참여하기
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InvitePage;
