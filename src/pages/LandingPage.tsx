import RotatingCards from "@/components/RotatingCards";
import { Link } from "react-router";

function LandingPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[390px] flex-col gap-7 bg-white px-6 pt-14 pb-10 text-plum">
      <div className="flex items-center gap-2.5">
        <svg width="40" height="32" viewBox="0 0 40 32" aria-hidden="true">
          <circle cx="14" cy="16" r="13" className="fill-coral" />
          <circle
            cx="26"
            cy="16"
            r="13"
            className="fill-plum"
            fillOpacity="0.88"
          />
        </svg>
        <span className="text-2xl font-extrabold tracking-tight">모일래</span>
      </div>

      <RotatingCards />

      <div className="flex flex-col gap-2.5">
        <h1 className="text-[32px] leading-snug font-extrabold tracking-tight">
          모이는 날,
          <br />
          투표로 쉽게 정해요
        </h1>
        <p className="text-base leading-relaxed text-subtext">
          후보 시간만 올리면 친구들이
          <br />
          가능한 시간에 투표해요.
        </p>
      </div>

      <Link
        to="/home"
        className="mt-auto flex h-14 items-center justify-center gap-3 rounded-full bg-coral text-[17px] font-bold"
      >
        <span
          aria-hidden="true"
          className="flex size-7 items-center justify-center rounded-full bg-white text-[15px] font-extrabold"
        >
          G
        </span>
        구글로 시작하기
      </Link>
    </div>
  );
}

export default LandingPage;
