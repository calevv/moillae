import { Link, Navigate, useNavigate } from "react-router";
import { useNextPath } from "@/hooks/useNextPath";
import { useAuthStore } from "@/stores/useAuthStore";
import { withNext } from "@/utils/next";
import { useEffect, useState } from "react";
import { signInWithGoogle } from "@/api/auth";
import { toast } from "@/stores/useToastStore";
import { getInstallContext, kakaoOpenExternalUrl } from "@/utils/device";

function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const navigate = useNavigate();
  const next = useNextPath(); // 로그인 후 돌아갈 곳 (없으면 null)
  const [googlePending, setGooglePending] = useState(false);
  const { inAppBrowser, platform, isStandalone } = getInstallContext(); // 카톡 등 앱 안 브라우저에서는 구글이 로그인을 막아요
  // 아이폰 홈 화면 앱: Gmail 앱으로 갔다 오는 2단계 인증이 끊겨요 (21-7)
  const isIosApp = platform === "ios" && isStandalone;

  // 구글 화면에서 뒤로 가기로 돌아오면 브라우저가 떠나기 전 화면을 그대로 되살려요(bfcache).
  // 그때 "이동하는 중" 상태가 남아 있으니 풀어 줘요
  useEffect(() => {
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) setGooglePending(false);
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  if (status === "signedIn") return <Navigate to={next ?? "/home"} replace />;
  if (status === "demo") return <Navigate to="/home" replace />;

  function handleDemo() {
    enterDemo();
    navigate("/home");
  }

  async function handleGoogle() {
    setGooglePending(true);
    try {
      await signInWithGoogle(next ?? "/home"); // 성공하면 구글 화면으로 이동해요
    } catch {
      setGooglePending(false);
      toast.error(
        "구글 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-[22px] bg-white px-5 pt-3 pb-7 text-plum">
      <Link
        to="/"
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

      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
          모일래 시작하기
        </h1>
        <p className="text-[15px] text-subtext">어떤 방법으로 시작할까요?</p>
      </div>

      <div className="mt-2 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void handleGoogle()}
          disabled={googlePending || inAppBrowser !== null}
          className="h-[54px] rounded-full bg-coral text-[17px] font-bold disabled:opacity-50"
        >
          {googlePending ? "구글로 이동하는 중…" : "Google로 계속하기"}
        </button>
        {isIosApp && (
          <p className="-mt-1 text-center text-[13px] leading-normal text-subtext">
            로그인이 안 되면 구글 확인 화면에서 '다른 방법 시도'를 눌러 인증
            코드로 확인하거나, 이메일로 로그인해 주세요.
          </p>
        )}
        {inAppBrowser && (
          <div className="-mt-1 flex flex-col items-center gap-2 text-center text-[13px] leading-normal text-subtext">
            <p>앱 안 브라우저에서는 구글 로그인을 쓸 수 없어요.</p>
            {inAppBrowser === "kakaotalk" ? (
              <a
                href={kakaoOpenExternalUrl(window.location.href)}
                className="flex min-h-11 items-center px-3 font-bold text-plum underline underline-offset-[3px]"
              >
                기본 브라우저로 열기
              </a>
            ) : (
              <p>Safari나 Chrome에서 이 주소를 열어 주세요.</p>
            )}
          </div>
        )}
        <button
          type="button"
          disabled
          className="h-[54px] rounded-full border-[1.5px] border-plum bg-white text-[17px] font-bold opacity-50"
        >
          카카오로 계속하기 (준비 중)
        </button>

        <div
          className="my-1.5 flex items-center gap-3.5"
          role="separator"
          aria-label="또는"
        >
          <span className="h-px flex-1 bg-line" />
          <span className="text-sm text-subtext">또는</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <Link
          to={withNext("/login/email", next)}
          className="flex h-[54px] items-center justify-center rounded-full border-[1.5px] border-plum bg-white text-[17px] font-bold"
        >
          이메일로 계속하기
        </Link>
      </div>

      <div className="mt-auto flex justify-center">
        <button
          type="button"
          onClick={handleDemo}
          className="min-h-11 px-4 text-sm font-medium text-subtext underline underline-offset-[3px]"
        >
          로그인 없이 둘러보기
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
