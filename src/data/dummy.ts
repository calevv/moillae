import type { Group, Member, Poll } from "@/types/poll";

export const CURRENT_USER_ID = "m1";

export const members: Member[] = [
  { id: "m1", name: "나" },
  { id: "m2", name: "서준" },
  { id: "m3", name: "하은" },
  { id: "m4", name: "지호" },
  { id: "m5", name: "유나" },
];

export const groups: Group[] = [
  { id: "g1", name: "대학 친구들", memberIds: ["m1", "m2", "m3", "m4", "m5"] },
];

export const polls: Poll[] = [
  {
    id: "p1",
    groupId: "g1",
    title: "송년회",
    hostId: "m1",
    options: [
      {
        id: "o1",
        date: "2026-12-19",
        time: "19:00",
        responses: { m1: "yes", m2: "yes", m3: "yes", m4: "no", m5: "pending" },
      },
      {
        id: "o2",
        date: "2026-12-20",
        time: "18:00",
        responses: {
          m1: "pending",
          m2: "no",
          m3: "yes",
          m4: "yes",
          m5: "pending",
        },
      },
      {
        id: "o3",
        date: "2026-12-25",
        time: "19:00",
        holiday: "기독탄신일",
        responses: { m1: "no", m2: "yes", m3: "no", m4: "yes", m5: "pending" },
      },
    ],
  },
];
