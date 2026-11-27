import { useState } from "react";
import { Link } from "react-router";
import { toast } from "@/stores/useToastStore";
import { getInstallContext } from "@/utils/device";

// 이 기기에서만 기억하면 되는 값이라 localStorage에 저장해요
// (설치는 기기마다 하는 거라, 휴대폰에서 닫아도 태블릿에는 보여야 해요)
const STORAGE_KEY = "moillae.installBanner";
const SNOOZE_DAYS = 7; // "나중에"를 누르면 며칠 뒤에 다시 보일지
const DAY_MS = 86_400_000;

type BannerMemory = {
  closed?: boolean; // "닫기": 다시 안 보임
  snoozeUntil?: number; // "나중에": 이 시각까지 안 보임
};

// 비공개 모드 등에서는 localStorage가 에러를 낼 수 있어서 try/catch
function readMemory(): BannerMemory {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "{}",
    ) as BannerMemory;
  } catch {
    return {};
  }
}

function writeMemory(memory: BannerMemory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // 저장하지 못해도 이번에는 숨겨요. 다음에 다시 보일 수 있어요
  }
}

function shouldShow(): boolean {
  const ctx = getInstallContext();
  if (ctx.isStandalone || ctx.platform === "desktop") return false;

  const memory = readMemory();
  if (memory.closed) return false;
  if (memory.snoozeUntil && Date.now() < memory.snoozeUntil) return false;
  return true;
}

export default function InstallBanner() {
  // 처음 그릴 때 한 번만 검사 (함수를 넘기면 매번이 아니라 처음에만 실행돼요)
  const [visible, setVisible] = useState(shouldShow);
  // 아이폰은 Safari 탭에서 알림을 켤 수 없어서, 설치해야 알림을 받을 수 있어요
  const isIos = getInstallContext().platform === "ios";

  if (!visible) return null;

  const later = () => {
    writeMemory({ snoozeUntil: Date.now() + SNOOZE_DAYS * DAY_MS });
    setVisible(false);
    toast.success("며칠 뒤에 다시 안내해요.");
  };

  const close = () => {
    writeMemory({ closed: true });
    setVisible(false);
    toast.success("더는 안내하지 않아요. 내 정보에서 설치할 수 있어요.");
  };

  return (
    <section
      aria-label="앱 설치 안내"
      className="rounded-xl border border-line pt-3 pr-1 pb-2 pl-3.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm leading-normal font-bold">
            홈 화면에 추가하면 바로 열 수 있어요.
          </p>
          {isIos && (
            <p className="mt-0.5 text-[13px] leading-normal text-subtext">
              아이폰은 설치해야 알림을 받을 수 있어요.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="설치 안내 닫기"
          className="-mt-2 flex size-11 shrink-0 items-center justify-center text-subtext"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <div className="mt-0.5 flex items-center gap-1">
        <Link
          to="/install"
          className="flex h-11 items-center rounded-full border-[1.5px] border-plum px-4 text-sm font-bold"
        >
          설치 방법 보기
        </Link>
        <button
          type="button"
          onClick={later}
          className="flex h-11 items-center px-3.5 text-sm font-medium text-subtext"
        >
          나중에
        </button>
      </div>
    </section>
  );
}
