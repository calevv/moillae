import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { authErrorMessage } from "@/api/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNextPath } from "@/hooks/useNextPath";
import { withNext } from "@/utils/next";

const inputStyle =
  "h-14 w-full rounded-2xl border-[1.5px] border-muted-line bg-white px-4 text-[17px] font-medium outline-none focus:border-plum";
const MIN_PASSWORD = 8;
const MAX_NAME = 20;

function SignUpPage() {
  const status = useAuthStore((s) => s.status);
  const signUp = useAuthStore((s) => s.signUp);

  const next = useNextPath();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "signedIn") return <Navigate to={next ?? "/home"} replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("이름을 입력해 주세요.");
    if (!email) return setError("이메일을 입력해 주세요.");
    if (password.length < MIN_PASSWORD)
      return setError(`비밀번호는 ${MIN_PASSWORD}자 이상 입력해 주세요.`);

    setError(null);
    try {
      await signUp(name.trim(), email, password, next ?? "/home");
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
        to={withNext("/login/email", next)}
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
          회원가입
        </h1>
        <p className="text-[15px] text-subtext">
          몇 가지만 입력하면 바로 시작할 수 있어요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="signup-name" className="text-sm font-bold">
          이름
        </label>
        <input
          id="signup-name"
          type="text"
          autoComplete="nickname"
          maxLength={MAX_NAME}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-describedby="signup-name-hint"
          className={inputStyle}
        />
        <div className="flex justify-between gap-3 text-[13px] text-subtext">
          <span id="signup-name-hint">
            모임에서 친구들에게 보이는 이름이에요
          </span>
          <span>
            {name.length}/{MAX_NAME}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="signup-email" className="text-sm font-bold">
          이메일
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="signup-password" className="text-sm font-bold">
          비밀번호
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="signup-password-hint"
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
        <span id="signup-password-hint" className="text-[13px] text-subtext">
          {MIN_PASSWORD}자 이상 입력해 주세요
        </span>
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
        가입하기
      </button>

      <div className="flex items-center justify-center gap-1 text-[15px] text-subtext">
        <span>이미 계정이 있나요?</span>
        <Link
          to={withNext("/login/email", next)}
          className="min-h-11 px-1.5 font-bold text-plum underline underline-offset-[3px] inline-flex items-center"
        >
          로그인
        </Link>
      </div>
    </form>
  );
}

export default SignUpPage;
