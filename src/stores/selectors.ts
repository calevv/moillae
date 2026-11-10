import { useShallow } from "zustand/shallow";
import { useAppStore } from "@/stores/useAppStore";

//  저장된 값을 그대로 꺼냄 → useShallow 필요 없음
export const usePoll = (pollId?: string) =>
  useAppStore((s) => (pollId ? s.polls[pollId] : undefined));

export const useGroup = (groupId?: string) =>
  useAppStore((s) => (groupId ? s.groups[groupId] : undefined));

//  filter, map으로 새 배열을 만듦 → useShallow로 감싸기
export const useGroupPolls = (groupId?: string) =>
  useAppStore(
    useShallow((s) =>
      Object.values(s.polls).filter((p) => p.groupId === groupId),
    ),
  );

export const useGroupMembers = (groupId?: string) =>
  useAppStore(
    useShallow((s) => {
      const group = groupId ? s.groups[groupId] : undefined;
      if (!group) return [];
      return group.memberIds.map((id) => s.members[id]).filter(Boolean);
    }),
  );

//  Object.values는 새 배열을 만듦 → useShallow
export const useGroups = () =>
  useAppStore(useShallow((s) => Object.values(s.groups)));

export const usePolls = () =>
  useAppStore(useShallow((s) => Object.values(s.polls)));

//  저장된 객체를 그대로 꺼냄
export const useMemberMap = () => useAppStore((s) => s.members);
