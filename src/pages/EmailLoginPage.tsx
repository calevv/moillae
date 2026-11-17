import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { useNextPath } from "@/hooks/useNextPath";
import { withNext } from "@/utils/next";
import { authErrorMessage } from "@/api/auth";
import { useAuthStore } from "@/stores/useAuthStore";

const inputStyle =
  "h-14 w-full rounded-2xl border-[1.5px] border-muted-line bg-white px-4 text-[17px] font-medium outline-none focus:border-plum";

function EmailLoginPage() {
  const status = useAuthStore((s) => s.status);
  const signIn = useAuthStore((s) => s.signIn);

  const next = useNextPath();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 이동
  if (status === "signedIn") return <Navigate to={next ?? "/home"} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-[22px] bg-white px-5 pt-3 pb-7 text-plum"
    >
      <Link
        to={withNext("/login", next)}
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

      <h1 className="text-[30px] leading-tight font-extrabold tracking-tight">
        이메일로 로그인
      </h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-email" className="text-sm font-bold">
          이메일
        </label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="login-password" className="text-sm font-bold">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputStyle} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            className="absolute top-1.5 right-1.5 h-11 min-w-11 px-3 text-sm font-bold text-subtext"
          >
            {showPassword ? "숨기기" : "보기"}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-holiday-text">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-[54px] rounded-full bg-coral text-[17px] font-bold disabled:opacity-60"
      >
        로그인
      </button>

      <div className="flex items-center justify-center gap-1 text-[15px] text-subtext">
        <span>계정이 없나요?</span>
        <Link
          to={withNext("/signup", next)}
          className="min-h-11 px-1.5 font-bold text-plum underline underline-offset-[3px] inline-flex items-center"
        >
          회원가입
        </Link>
      </div>
    </form>
  );
}

export default EmailLoginPage;
