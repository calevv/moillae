import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useInstallStore } from "@/stores/useInstallStore";
import { toast } from "@/stores/useToastStore";
import {
  getInstallContext,
  kakaoOpenExternalUrl,
  type InstallContext,
} from "@/utils/device";

type Step = { text: string; hint?: string };

// 단계는 목록 데이터로. 브라우저 화면이 바뀌면 문장만 고치면 돼요
const IOS_SAFARI_STEPS: Step[] = [
  {
    text: "주소창 왼쪽의 ≡ 버튼을 눌러요",
    hint: "공유 버튼이 바로 보이면 그걸 눌러도 돼요",
  },
  { text: "메뉴에서 ‘공유’를 눌러요" },
  { text: "아래로 내려서 ‘홈 화면에 추가’를 눌러요" },
  { text: "오른쪽 위 ‘추가’를 눌러요" },
];

const ANDROID_MENU_STEPS: Step[] = [
  { text: "오른쪽 위 ⋮ 버튼을 눌러요" },
  { text: "‘앱 설치’ 또는 ‘홈 화면에 추가’를 눌러요" },
  { text: "‘설치’를 눌러요" },
];

// 보여 줄 수 있는 안내 종류
type Guide =
  | "installed" // 이미 앱으로 열었음
  | "desktop" // PC
  | "openBrowser" // 앱 안 브라우저 → Safari/Chrome으로 옮기기
  | "iosSteps" // 아이폰 Safari 단계
  | "androidButton" // 안드로이드 설치 버튼
  | "androidSteps"; // 안드로이드 메뉴 단계

type ManualPick = "ios" | "android" | null;

// 기기와 브라우저를 보고 안내 하나 고르기. 위에서부터 검사하는 순서가 중요해요
// (카카오톡 안은 아이폰이기도 해서, 아이폰보다 먼저 검사해야 해요)
function pickGuide(ctx: InstallContext, hasPrompt: boolean): Guide {
  if (ctx.isStandalone) return "installed";
  if (ctx.platform === "desktop") return "desktop";
  if (ctx.inAppBrowser || (ctx.platform === "ios" && !ctx.isIosSafari))
    return "openBrowser";
  if (ctx.platform === "ios") return "iosSteps";
  return hasPrompt ? "androidButton" : "androidSteps";
}

const primaryButton =
  "flex h-12 w-full items-center justify-center rounded-full bg-coral text-base font-bold";
const secondaryButton =
  "flex h-12 w-full items-center justify-center rounded-full border-[1.5px] border-plum text-base font-bold";

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="mt-5 border-b border-line">
      {steps.map((step, i) => (
        <li
          key={step.text}
          className="grid grid-cols-[24px_1fr] gap-3 border-t border-line py-4"
        >
          <span
            aria-hidden="true"
            className="mt-px flex size-6 items-center justify-center rounded-full border-[1.5px] border-plum text-[13px] font-bold"
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-normal font-bold">{step.text}</p>
            {step.hint && (
              <p className="mt-1 text-[13px] leading-normal text-subtext">
                {step.hint}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function PickButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-11 flex-1 rounded-full border-[1.5px] text-sm font-bold ${
        active ? "border-plum bg-plum text-white" : "border-line bg-white"
      }`}
    >
      {label}
    </button>
  );
}

function InstallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const promptEvent = useInstallStore((s) => s.promptEvent);
  const promptInstall = useInstallStore((s) => s.promptInstall);
  const [manual, setManual] = useState<ManualPick>(null); // 사용자가 직접 고른 기기

  const ctx = getInstallContext();
  const installUrl = `${window.location.origin}/install`;

  // 직접 골랐으면 그 기기 안내, 아니면 자동으로 고른 안내
  const autoGuide = pickGuide(ctx, promptEvent !== null);
  const guide: Guide =
    manual === "ios"
      ? "iosSteps"
      : manual === "android"
        ? promptEvent
          ? "androidButton"
          : "androidSteps"
        : autoGuide;

  // 앱 안에서 이동해 왔으면 뒤로, 주소로 바로 열었으면 첫 화면으로
  const goBack = () =>
    location.key !== "default" ? navigate(-1) : navigate("/");

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(installUrl);
      toast.success("주소를 복사했어요.");
    } catch {
      toast.error("복사하지 못했어요. 주소를 길게 눌러 복사해 주세요.");
    }
  };

  const handleInstall = async () => {
    const result = await promptInstall();
    if (result === "accepted")
      toast.success("설치했어요. 홈 화면에서 열어 주세요.");
  };

  const urlBox = (
    <p className="mt-2.5 truncate rounded-[10px] border border-line px-3 py-3 text-sm text-subtext select-all">
      {installUrl}
    </p>
  );

  const browser = ctx.platform === "ios" ? "Safari" : "Chrome";

  // 안내 이름별 화면
  const bodies: Record<Guide, ReactNode> = {
    installed: (
      <section className="mt-6">
        <h2 className="text-lg font-bold">이미 앱으로 쓰고 있어요</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-subtext">
          홈 화면의 모일래 아이콘으로 열면 돼요.
        </p>
        <Link to="/home" className={`${secondaryButton} mt-5`}>
          홈으로
        </Link>
      </section>
    ),
    desktop: (
      <section className="mt-6">
        <h2 className="text-lg font-bold">휴대폰에서 열어 주세요</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-subtext">
          휴대폰 브라우저에서 아래 주소를 열고, 이 화면의 안내를 따라 해요.
        </p>
        {urlBox}
        <button
          type="button"
          onClick={copyUrl}
          className={`${secondaryButton} mt-2.5`}
        >
          주소 복사
        </button>
      </section>
    ),
    openBrowser: (
      <section className="mt-6">
        <h2 className="text-lg font-bold">
          {browser}에서 열어야 설치할 수 있어요
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-subtext">
          {ctx.inAppBrowser === "kakaotalk"
            ? "카카오톡 안에서는 설치할 수 없어요."
            : "지금 브라우저에서는 설치할 수 없어요."}
        </p>
        {ctx.inAppBrowser === "kakaotalk" && (
          <a
            href={kakaoOpenExternalUrl(installUrl)}
            className={`${primaryButton} mt-5`}
          >
            {browser}로 열기
          </a>
        )}
        {urlBox}
        <button
          type="button"
          onClick={copyUrl}
          className={`${secondaryButton} mt-2.5`}
        >
          주소 복사
        </button>
        <p className="mt-3 text-sm leading-relaxed text-subtext">
          복사한 주소를 {browser} 주소창에 붙여넣어요.
        </p>
      </section>
    ),
    iosSteps: <Steps steps={IOS_SAFARI_STEPS} />,
    androidButton: (
      <section className="mt-6">
        <h2 className="text-lg font-bold">버튼을 누르면 설치돼요</h2>
        <button
          type="button"
          onClick={handleInstall}
          className={`${primaryButton} mt-4`}
        >
          설치
        </button>
        <p className="mt-3 text-sm leading-relaxed text-subtext">
          설치 창이 뜨면 ‘설치’를 눌러요. 끝나면 홈 화면에 모일래가 생겨요.
        </p>
      </section>
    ),
    androidSteps: <Steps steps={ANDROID_MENU_STEPS} />,
  };

  const showFinishNote = guide === "iosSteps" || guide === "androidSteps";

  return (
    <div className="mx-auto min-h-screen max-w-[390px] bg-white px-5 pt-3 pb-7 text-plum">
      <button
        type="button"
        onClick={goBack}
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
      </button>

      <h1 className="mt-2.5 text-[28px] leading-tight font-extrabold tracking-tight">
        앱으로 설치하기
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-subtext">
        홈 화면에 추가하면 주소창 없이 앱처럼 바로 열 수 있어요.
      </p>

      {bodies[guide]}

      {showFinishNote && (
        <p className="mt-4 text-sm leading-relaxed text-subtext">
          끝나면 홈 화면의 모일래 아이콘으로 열어 주세요.
        </p>
      )}

      {/* 판별이 틀렸을 때를 위한 직접 고르기. 이미 설치했으면 필요 없어요 */}
      {autoGuide !== "installed" && (
        <section className="mt-10 border-t border-line pt-5">
          <h2 className="text-[13px] font-bold text-subtext">
            다른 기기 안내 보기
          </h2>
          <div
            role="group"
            aria-label="기기 고르기"
            className="mt-2.5 flex gap-2"
          >
            <PickButton
              label="내 기기"
              active={manual === null}
              onClick={() => setManual(null)}
            />
            <PickButton
              label="아이폰"
              active={manual === "ios"}
              onClick={() => setManual("ios")}
            />
            <PickButton
              label="안드로이드"
              active={manual === "android"}
              onClick={() => setManual("android")}
            />
          </div>
        </section>
      )}
    </div>
  );
}

export default InstallPage;
