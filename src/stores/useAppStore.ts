import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { groups, members, polls } from "@/data/dummy";
import { fetchAppData } from "@/api/appData";
import {
  saveConfirmation,
  saveGroup,
  savePoll,
  saveResponse,
} from "@/api/polls";
import type {
  Group,
  Member,
  NewGroupInput,
  NewPollInput,
  Poll,
  VoteResponse,
} from "@/types/poll";
import { getHoliday } from "@/utils/holiday";

// 배열을 { id: 항목 } 객체로 바꾸기
function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

type DataStatus = "idle" | "loading" | "ready" | "error";

type AppState = {
  members: Record<string, Member>;
  groups: Record<string, Group>;
  polls: Record<string, Poll>;
  dataStatus: DataStatus;
  loadFromServer: () => Promise<void>;
  loadDemo: () => void;
  resetData: () => void;
  confirmPoll: (pollId: string, optionId: string) => Promise<void>;
  setResponse: (
    pollId: string,
    optionId: string,
    userId: string,
    value: VoteResponse,
  ) => Promise<void>;
  createPoll: (input: NewPollInput) => Promise<string>;
  createGroup: (input: NewGroupInput) => Promise<string>;
};

const empty = { members: {}, groups: {}, polls: {} };

// 불러오는 도중 로그아웃하거나 계정을 바꾸면, 늦게 도착한 옛 응답은 버리기 위한 번호표
let loadSeq = 0;

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // 처음 값은 비어 있음 (로그인 상태에 따라 RootLayout이 채워요)
      ...empty,
      dataStatus: "idle",

      // 로그인한 사용자의 데이터를 Supabase에서 불러오기
      loadFromServer: async () => {
        const seq = ++loadSeq;
        set({ dataStatus: "loading" }, undefined, "data/load");
        try {
          const data = await fetchAppData();
          if (seq !== loadSeq) return; // 그사이 다른 요청이 시작됐으면 무시
          set({ ...data, dataStatus: "ready" }, undefined, "data/load:done");
        } catch (error) {
          if (seq !== loadSeq) return;
          console.error(error);
          set({ dataStatus: "error" }, undefined, "data/load:error");
        }
      },

      // 로그인 없이 둘러보기: 더미 데이터
      loadDemo: () => {
        loadSeq++;
        set(
          {
            members: toRecord(members),
            groups: toRecord(groups),
            polls: toRecord(polls),
            dataStatus: "ready",
          },
          undefined,
          "data/loadDemo",
        );
      },

      // 로그아웃: 비우기
      resetData: () => {
        loadSeq++;
        set({ ...empty, dataStatus: "idle" }, undefined, "data/reset");
      },

      setResponse: async (pollId, optionId, userId, value) => {
        const before = get().polls[pollId];
        if (!before) return;

        const after: Poll = {
          ...before,
          options: before.options.map((o) =>
            o.id === optionId
              ? { ...o, responses: { ...o.responses, [userId]: value } }
              : o,
          ),
        };

        // ① 화면 먼저 바꾸기
        set(
          (s) => ({ polls: { ...s.polls, [pollId]: after } }),
          undefined,
          "poll/setResponse",
        );

        // ② 저장하고, 실패하면 원래대로 되돌리기
        try {
          await saveResponse(pollId, optionId, userId, value);
        } catch (error) {
          set(
            (s) => ({ polls: { ...s.polls, [pollId]: before } }),
            undefined,
            "poll/setResponse:rollback",
          );
          throw error;
        }
      },
      confirmPoll: async (pollId, optionId) => {
        const before = get().polls[pollId];
        if (!before) return;

        const after: Poll = { ...before, confirmedOptionId: optionId };
        set(
          (s) => ({ polls: { ...s.polls, [pollId]: after } }),
          undefined,
          "poll/confirm",
        );

        try {
          await saveConfirmation(pollId, optionId);
        } catch (error) {
          set(
            (s) => ({ polls: { ...s.polls, [pollId]: before } }),
            undefined,
            "poll/confirm:rollback",
          );
          throw error;
        }
      },
      createPoll: async (input) => {
        const poll: Poll = {
          id: crypto.randomUUID(),
          groupId: input.groupId,
          title: input.title,
          hostId: input.hostId,
          options: input.options
            .map((o) => ({
              id: crypto.randomUUID(),
              date: o.date,
              time: o.time,
              holiday: getHoliday(o.date),
              responses: {},
            }))
            .sort((a, b) =>
              `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
            ),
        };

        set(
          (s) => ({ polls: { ...s.polls, [poll.id]: poll } }),
          undefined,
          "poll/create",
        );

        try {
          await savePoll(poll);
        } catch (error) {
          set(
            (s) => {
              const rest = { ...s.polls };
              delete rest[poll.id];
              return { polls: rest };
            },
            undefined,
            "poll/create:rollback",
          );
          throw error;
        }

        return poll.id;
      },
      createGroup: async (input) => {
        const group: Group = {
          id: crypto.randomUUID(),
          name: input.name,
          memberIds: [input.ownerId], // 만든 사람만 들어 있는 상태로 시작
        };

        set(
          (s) => ({ groups: { ...s.groups, [group.id]: group } }),
          undefined,
          "group/create",
        );

        try {
          await saveGroup(group);
        } catch (error) {
          set(
            (s) => {
              const rest = { ...s.groups };
              delete rest[group.id];
              return { groups: rest };
            },
            undefined,
            "group/create:rollback",
          );
          throw error;
        }

        return group.id;
      },
    }),
    { name: "MoillaeStore" }, // DevTools에 보이는 이름
  ),
);
