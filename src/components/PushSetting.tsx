import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "@/stores/useToastStore";
import {
  disablePush,
  enablePush,
  getCurrentSubscription,
  getPushSupport,
} from "@/utils/push";

type State =
  | "checking"
  | "on"
  | "off"
  | "denied"
  | "needs-install"
  | "unsupported";

const row =
  "flex min-h-14 items-center justify-between gap-3 border-b border-line py-2";
const pillButton =
  "h-11 shrink-0 rounded-full border-[1.5px] border-plum px-[18px] text-sm font-bold disabled:opacity-60";

export default function PushSetting() {
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);

  // 처음에 이 기기의 상태 확인
  useEffect(() => {
    let ignore = false;

    (async () => {
      const support = getPushSupport();
      if (support !== "supported") {
        if (!ignore) setState(support);
        return;
      }
      if (Notification.permission === "denied") {
        if (!ignore) setState("denied");
        return;
      }
      const subscription = await getCurrentSubscription();
      if (ignore) return;
      setState(subscription ? "on" : "off");
    })();

    return () => {
      ignore = true;
    };
  }, []);

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await enablePush();
      if (permission === "granted") {
        setState("on");
        toast.success("알림을 켰어요.");
      } else if (permission === "denied") {
        setState("denied");
      }
      // "default"(창을 그냥 닫음)면 그대로 꺼진 상태
    } catch (e) {
      console.error(e);
      toast.error("알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await disablePush();
      setState("off");
      toast.success("알림을 껐어요.");
    } catch (e) {
      console.error(e);
      toast.error("알림을 끄지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={row}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium">알림</span>
        {state === "needs-install" && (
          <span className="text-[13px] text-subtext">
            홈 화면에 추가하면 받을 수 있어요.
          </span>
        )}
        {state === "denied" && (
          <span className="text-[13px] text-subtext">
            알림이 차단돼 있어요. 브라우저 설정에서 허용해 주세요.
          </span>
        )}
        {state === "unsupported" && (
          <span className="text-[13px] text-subtext">
            이 브라우저에서는 받을 수 없어요.
          </span>
        )}
        {state === "on" && (
          <span className="text-[13px] text-subtext">
            새 투표, 확정 소식을 받아요.
          </span>
        )}
      </div>

      {state === "off" && (
        <button
          type="button"
          onClick={turnOn}
          disabled={busy}
          className={pillButton}
        >
          켜기
        </button>
      )}
      {state === "on" && (
        <button
          type="button"
          onClick={turnOff}
          disabled={busy}
          className={pillButton}
        >
          끄기
        </button>
      )}
      {state === "needs-install" && (
        <Link to="/install" className={`${pillButton} flex items-center`}>
          설치 방법
        </Link>
      )}
    </div>
  );
}
