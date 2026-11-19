import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { groups, members, polls } from '@/data/dummy';
import { fetchAppData } from '@/api/appData';
import { saveConfirmation, savePoll, saveResponse } from '@/api/polls';
import type { Group, Member, NewGroupInput, NewPollInput, Poll, VoteResponse } from '@/types/poll';
import { saveDeleteGroup, saveGroup, saveGroupName, saveLeaveGroup } from '@/api/groups';

// 배열을 { id: 항목 } 객체로 바꾸기
function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
    return Object.fromEntries(items.map((item) => [item.id, item]));
}
// 그룹과 그 그룹의 투표를 함께 빼기
function withoutGroup(s: { groups: Record<string, Group>; polls: Record<string, Poll> }, groupId: string) {
    const groups = { ...s.groups };
    delete groups[groupId];
    const polls = Object.fromEntries(Object.entries(s.polls).filter(([, p]) => p.groupId !== groupId));
    return { groups, polls };
}

type DataStatus = 'idle' | 'loading' | 'ready' | 'error';

type AppState = {
    members: Record<string, Member>;
    groups: Record<string, Group>;
    polls: Record<string, Poll>;
    dataStatus: DataStatus;
    loadFromServer: () => Promise<void>;
    loadDemo: () => void;
    resetData: () => void;
    reloadData: () => Promise<void>;
    confirmPoll: (pollId: string, optionId: string) => Promise<void>;
    setResponse: (pollId: string, optionId: string, userId: string, value: VoteResponse) => Promise<void>;
    createPoll: (input: NewPollInput) => Promise<string>;
    createGroup: (input: NewGroupInput) => Promise<string>;
    cancelConfirmation: (pollId: string) => Promise<void>;
    renameMember: (memberId: string, name: string) => void;
    renameGroup: (groupId: string, name: string) => Promise<void>;
    leaveGroup: (groupId: string) => Promise<void>;
    deleteGroup: (groupId: string) => Promise<void>;
};

const empty = { members: {}, groups: {}, polls: {} };

// 불러오는 도중 로그아웃하거나 계정을 바꾸면, 늦게 도착한 옛 응답은 버리기 위한 번호표
let loadSeq = 0;

export const useAppStore = create<AppState>()(
    devtools(
        (set, get) => ({
            // 처음 값은 비어 있음 (로그인 상태에 따라 RootLayout이 채워요)
            ...empty,
            dataStatus: 'idle',

            // 로그인한 사용자의 데이터를 Supabase에서 불러오기
            loadFromServer: async () => {
                const seq = ++loadSeq;
                set({ dataStatus: 'loading' }, undefined, 'data/load');
                try {
                    const data = await fetchAppData();
                    if (seq !== loadSeq) return; // 그사이 다른 요청이 시작됐으면 무시
                    set({ ...data, dataStatus: 'ready' }, undefined, 'data/load:done');
                } catch (error) {
                    if (seq !== loadSeq) return;
                    console.error(error);
                    set({ dataStatus: 'error' }, undefined, 'data/load:error');
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
                        dataStatus: 'ready',
                    },
                    undefined,
                    'data/loadDemo',
                );
            },

            // 로그아웃: 비우기
            resetData: () => {
                loadSeq++;
                set({ ...empty, dataStatus: 'idle' }, undefined, 'data/reset');
            },

            // 내 이름이 바뀌면 그룹·투표 화면의 멤버 이름도 맞추기
            renameMember: (memberId, name) => {
                set(
                    (s) =>
                        s.members[memberId]
                            ? {
                                  members: {
                                      ...s.members,
                                      [memberId]: { ...s.members[memberId], name },
                                  },
                              }
                            : {},
                    undefined,
                    'member/rename',
                );
            },
            renameGroup: async (groupId, name) => {
                await saveGroupName(groupId, name);
                set(
                    (s) =>
                        s.groups[groupId]
                            ? {
                                  groups: {
                                      ...s.groups,
                                      [groupId]: { ...s.groups[groupId], name },
                                  },
                              }
                            : {},
                    undefined,
                    'group/rename',
                );
            },

            leaveGroup: async (groupId) => {
                await saveLeaveGroup(groupId);
                set((s) => withoutGroup(s, groupId), undefined, 'group/leave');
            },

            deleteGroup: async (groupId) => {
                await saveDeleteGroup(groupId);
                set((s) => withoutGroup(s, groupId), undefined, 'group/delete');
            },
            // 화면을 "불러오는 중"으로 바꾸지 않고 조용히 다시 받기 (초대 참여 후 등)
            reloadData: async () => {
                const seq = ++loadSeq;
                const data = await fetchAppData(); // 실패하면 에러가 그대로 위로 가요
                if (seq !== loadSeq) return;
                set({ ...data, dataStatus: 'ready' }, undefined, 'data/reload');
            },

            setResponse: async (pollId, optionId, userId, value) => {
                const before = get().polls[pollId];
                if (!before) return;

                const after: Poll = {
                    ...before,
                    options: before.options.map((o) =>
                        o.id === optionId ? { ...o, responses: { ...o.responses, [userId]: value } } : o,
                    ),
                };

                // ① 화면 먼저 바꾸기
                set((s) => ({ polls: { ...s.polls, [pollId]: after } }), undefined, 'poll/setResponse');

                // ② 저장하고, 실패하면 원래대로 되돌리기
                try {
                    await saveResponse(pollId, optionId, userId, value);
                } catch (error) {
                    set((s) => ({ polls: { ...s.polls, [pollId]: before } }), undefined, 'poll/setResponse:rollback');
                    throw error;
                }
            },
            confirmPoll: async (pollId, optionId) => {
                const before = get().polls[pollId];
                if (!before) return;

                const after: Poll = { ...before, confirmedOptionId: optionId };
                set((s) => ({ polls: { ...s.polls, [pollId]: after } }), undefined, 'poll/confirm');

                try {
                    await saveConfirmation(pollId, optionId);
                } catch (error) {
                    set((s) => ({ polls: { ...s.polls, [pollId]: before } }), undefined, 'poll/confirm:rollback');
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
                            responses: {},
                        }))
                        .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)),
                };

                set((s) => ({ polls: { ...s.polls, [poll.id]: poll } }), undefined, 'poll/create');

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
                        'poll/create:rollback',
                    );
                    throw error;
                }

                return poll.id;
            },
            createGroup: async (input) => {
                const group: Group = {
                    id: crypto.randomUUID(),
                    name: input.name,
                    memberIds: [input.ownerId],
                    ownerId: input.ownerId,
                };

                set((s) => ({ groups: { ...s.groups, [group.id]: group } }), undefined, 'group/create');

                try {
                    const inviteCode = await saveGroup(group);
                    if (inviteCode) {
                        set(
                            (s) =>
                                s.groups[group.id]
                                    ? {
                                          groups: {
                                              ...s.groups,
                                              [group.id]: { ...s.groups[group.id], inviteCode },
                                          },
                                      }
                                    : {},
                            undefined,
                            'group/create:inviteCode',
                        );
                    }
                } catch (error) {
                    set(
                        (s) => {
                            const rest = { ...s.groups };
                            delete rest[group.id];
                            return { groups: rest };
                        },
                        undefined,
                        'group/create:rollback',
                    );
                    throw error;
                }

                return group.id;
            },
            cancelConfirmation: async (pollId) => {
                const before = get().polls[pollId];
                if (!before || !before.confirmedOptionId) return;

                const after: Poll = { ...before, confirmedOptionId: undefined };
                set((s) => ({ polls: { ...s.polls, [pollId]: after } }), undefined, 'poll/cancelConfirm');

                try {
                    await saveConfirmation(pollId, null);
                } catch (error) {
                    set((s) => ({ polls: { ...s.polls, [pollId]: before } }), undefined, 'poll/cancelConfirm:rollback');
                    throw error;
                }
            },
        }),
        { name: 'MoillaeStore' }, // DevTools에 보이는 이름
    ),
);
