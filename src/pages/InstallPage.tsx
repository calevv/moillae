import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useInstallStore } from "@/stores/useInstallStore";
import { toast } from "@/stores/useToastStore";
import { getInstallContext, kakaoOpenExternalUrl } from "@/utils/device";

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

function InstallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const promptEvent = useInstallStore((s) => s.promptEvent);
  const promptInstall = useInstallStore((s) => s.promptInstall);

  const ctx = getInstallContext();
  const installUrl = `${window.location.origin}/install`;

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

  // 지금 상태에 맞는 안내 하나만 고르기
  let body: ReactNode;
  let showFinishNote = false;

  if (ctx.isStandalone) {
    body = (
      <section className="mt-6">
        <h2 className="text-lg font-bold">이미 앱으로 쓰고 있어요</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-subtext">
          홈 화면의 모일래 아이콘으로 열면 돼요.
        </p>
        <Link to="/home" className={`${secondaryButton} mt-5`}>
          홈으로
        </Link>
      </section>
    );
  } else if (ctx.platform === "desktop") {
    body = (
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
    );
  } else if (ctx.inAppBrowser || (ctx.platform === "ios" && !ctx.isIosSafari)) {
    // 카카오톡 같은 앱 안 브라우저, 또는 아이폰의 Safari가 아닌 브라우저
    const browser = ctx.platform === "ios" ? "Safari" : "Chrome";
    body = (
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
    );
  } else if (ctx.platform === "ios") {
    showFinishNote = true;
    body = <Steps steps={IOS_SAFARI_STEPS} />;
  } else if (promptEvent) {
    // 안드로이드 + 설치 신호를 받았을 때: 버튼 하나로
    body = (
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
    );
  } else {
    // 안드로이드인데 신호가 없을 때: 메뉴로
    showFinishNote = true;
    body = <Steps steps={ANDROID_MENU_STEPS} />;
  }

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

      {body}

      {showFinishNote && (
        <p className="mt-4 text-sm leading-relaxed text-subtext">
          끝나면 홈 화면의 모일래 아이콘으로 열어 주세요.
        </p>
      )}
    </div>
  );
}

export default InstallPage;
