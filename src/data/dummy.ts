import type { Group, Member, Poll } from "@/types/poll";

export const CURRENT_USER_ID = "m1";

export const members: Member[] = [
  { id: "m1", name: "나" },
  { id: "m2", name: "서준" },
  { id: "m3", name: "하은" },
  { id: "m4", name: "지호" },
  { id: "m5", name: "유나" },
  { id: "m6", name: "민서" },
  { id: "m7", name: "현우" },
  { id: "m8", name: "수아" },
  { id: "m9", name: "재윤" },
  { id: "m10", name: "아린" },
];

export const groups: Group[] = [
  {
    id: "g1",
    name: "대학 친구들",
    memberIds: ["m1", "m2", "m3", "m4", "m5", "m7"],
  },
  { id: "g2", name: "회사 동기", memberIds: ["m1", "m6", "m7", "m8"] },
  { id: "g3", name: "스터디 메이트", memberIds: ["m1", "m9", "m10"] },
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
  {
    id: "p2",
    groupId: "g1",
    title: "보드게임 번개",
    hostId: "m2",
    confirmedOptionId: "o5",
    options: [
      {
        id: "o4",
        date: "2026-11-28",
        time: "18:00",
        responses: { m1: "no", m2: "yes", m3: "yes", m4: "no", m5: "yes" },
      },
      {
        id: "o5",
        date: "2026-12-05",
        time: "18:00",
        responses: { m1: "yes", m2: "yes", m3: "yes", m4: "yes", m5: "no" },
      },
    ],
  },
  {
    id: "p3",
    groupId: "g2",
    title: "연말 브런치",
    hostId: "m6",
    confirmedOptionId: "o6",
    options: [
      {
        id: "o6",
        date: "2026-12-12",
        time: "11:00",
        responses: { m1: "yes", m6: "yes", m7: "yes", m8: "yes" },
      },
    ],
  },
];
