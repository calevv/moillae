import { useEffect, useState } from "react";
import { groups, members, polls } from "@/data/dummy";

import { formatDate, formatTime } from "@/utils/date";
import { countYes } from "@/utils/poll";

const INTERVAL_MS = 2500; // 카드가 바뀌는 간격

// 0: 맨 앞, 1: 바로 뒤(흐리게), 2: 더 뒤(안 보임)
const SLOT_STYLES = [
  { transform: "translateY(36px) scale(1)", opacity: 1, zIndex: 30 },
  { transform: "translateY(-44px) scale(0.92)", opacity: 0.7, zIndex: 20 },
  { transform: "translateY(-100px) scale(0.84)", opacity: 0, zIndex: 10 },
];

export default function RotatingCards() {
  const poll = polls[0];
  const options = poll.options;
  const group = groups.find((g) => g.id === poll.groupId);
  const pollMembers = members.filter((m) => group?.memberIds.includes(m.id));
  const [active, setActive] = useState(0);

  useEffect(() => {
    // 기기에서 "동작 줄이기"를 켰다면 돌리지 않음
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % options.length);
    }, INTERVAL_MS);

    return () => clearInterval(timer); // 화면을 떠나면 타이머 정리
  }, [options.length]);

  const maxYes = Math.max(...options.map((o) => countYes(o, pollMembers)));

  return (
    <div
      aria-hidden="true"
      className="relative h-[300px] overflow-hidden rounded-[32px] bg-peach"
    >
      {options.map((option, i) => {
        const slot = (i - active + options.length) % options.length;
        const count = countYes(option, pollMembers);
        const yesMembers = pollMembers.filter(
          (m) => option.responses[m.id] === "yes",
        );

        return (
          <div
            key={option.id}
            style={SLOT_STYLES[Math.min(slot, SLOT_STYLES.length - 1)]}
            className="absolute inset-x-5 top-1/2 -mt-[60px] flex flex-col gap-3.5 rounded-3xl bg-white px-4 py-[18px] shadow-[0_10px_28px_rgba(54,23,43,0.12)] transition-all duration-700 ease-out"
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-bold text-faint">
                  {formatDate(option.date)}
                </span>
                <span className="text-[22px] font-extrabold tracking-tight">
                  {formatTime(option.time)}
                </span>
              </div>
              {count === maxYes && (
                <span className="inline-flex h-7 items-center rounded-full bg-coral px-2.5 text-[13px] font-bold">
                  추천
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex">
                {yesMembers.map((m, idx) => (
                  <span
                    key={m.id}
                    className={`flex size-8 items-center justify-center rounded-full border-2 border-white bg-cream text-[13px] font-bold ${idx > 0 ? "-ml-2" : ""}`}
                  >
                    {m.name.slice(0, 1)}
                  </span>
                ))}
              </div>
              <span className="text-[15px] font-bold">
                {count}/{pollMembers.length}명 가능
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
