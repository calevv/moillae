import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { groups, members, polls } from "@/data/dummy";
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

type AppState = {
  members: Record<string, Member>;
  groups: Record<string, Group>;
  polls: Record<string, Poll>;
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

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // 처음 값은 더미 데이터
        members: toRecord(members),
        groups: toRecord(groups),
        polls: toRecord(polls),

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
      {
        name: "moillae-store", // localStorage에 저장될 이름
        version: 2,
        partialize: (s) => ({
          members: s.members,
          groups: s.groups,
          polls: s.polls,
        }),
      },
    ),
    { name: "MoillaeStore" }, // DevTools에 보이는 이름
  ),
);
