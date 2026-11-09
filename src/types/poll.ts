export type VoteResponse = "yes" | "no" | "pending"; // 가능, 불가능, 미응답

export type Member = {
  id: string;
  name: string;
};

export type TimeOption = {
  id: string;
  date: string; // "2026-12-19"
  time: string; // "19:00"
  holiday?: string;
  responses: Record<string, VoteResponse>; // memberId → 응답
};

export type Group = {
  id: string;
  name: string;
  memberIds: string[];
};

export type Poll = {
  id: string;
  groupId: string;
  title: string;
  hostId: string;
  options: TimeOption[];
};
