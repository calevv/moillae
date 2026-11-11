import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";

function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const enterDemo = useAuthStore((s) => s.enterDemo);
  const navigate = useNavigate();
  const location = useLocation();

  if (status === "signedIn" || status === "demo")
    return <Navigate to="/home" replace />;

  function handleDemo() {
    enterDemo();
    navigate("/home");
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
          disabled
          className="h-[54px] rounded-full bg-coral text-[17px] font-bold opacity-50"
        >
          구글로 계속하기 (준비 중)
        </button>
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
          to="/login/email"
          state={location.state}
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
