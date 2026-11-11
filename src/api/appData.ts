import { supabase } from "@/lib/supabase";
import type {
  Group,
  Member,
  Poll,
  TimeOption,
  VoteResponse,
} from "@/types/poll";
import { toDateKey } from "@/utils/calendar";
import { getHoliday } from "@/utils/holiday";

type ProfileRow = { id: string; display_name: string };
type GroupRow = { id: string; name: string };
type GroupMemberRow = { group_id: string; user_id: string };
type PollRow = {
  id: string;
  group_id: string;
  title: string;
  host_id: string;
  confirmed_option_id: string | null;
};
type OptionRow = { id: string; poll_id: string; starts_at: string };
type ResponseRow = { option_id: string; user_id: string; value: "yes" | "no" };

export type AppData = {
  members: Record<string, Member>;
  groups: Record<string, Group>;
  polls: Record<string, Poll>;
};

// DB의 시각(starts_at)을 이 브라우저 시간 기준 날짜와 시간으로 나눠요
// "2026-12-19T10:00:00+00:00" → { date: "2026-12-19", time: "19:00" } (한국)
function splitStartsAt(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return {
    date: toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()),
    time: `${hh}:${mm}`,
  };
}

export async function fetchAppData(): Promise<AppData> {
  // 조건(where)을 따로 안 걸어도 RLS가 "내가 속한 그룹"의 것만 돌려줘요
  const [
    profilesRes,
    groupsRes,
    membersRes,
    pollsRes,
    optionsRes,
    responsesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("id, display_name"),
    supabase.from("groups").select("id, name").order("created_at"),
    supabase
      .from("group_members")
      .select("group_id, user_id")
      .order("joined_at"),
    supabase
      .from("polls")
      .select("id, group_id, title, host_id, confirmed_option_id")
      .order("created_at"),
    supabase
      .from("poll_options")
      .select("id, poll_id, starts_at")
      .order("starts_at"),
    supabase.from("responses").select("option_id, user_id, value"),
  ]);

  for (const res of [
    profilesRes,
    groupsRes,
    membersRes,
    pollsRes,
    optionsRes,
    responsesRes,
  ]) {
    if (res.error) throw res.error;
  }

  const profileRows = (profilesRes.data ?? []) as ProfileRow[];
  const groupRows = (groupsRes.data ?? []) as GroupRow[];
  const memberRows = (membersRes.data ?? []) as GroupMemberRow[];
  const pollRows = (pollsRes.data ?? []) as PollRow[];
  const optionRows = (optionsRes.data ?? []) as OptionRow[];
  const responseRows = (responsesRes.data ?? []) as ResponseRow[];

  // 멤버: profiles → Member
  const members: Record<string, Member> = Object.fromEntries(
    profileRows.map((p) => [p.id, { id: p.id, name: p.display_name }]),
  );

  // 그룹: group_members를 그룹별로 모아서 memberIds로
  const memberIdsByGroup: Record<string, string[]> = {};
  for (const m of memberRows)
    (memberIdsByGroup[m.group_id] ??= []).push(m.user_id);

  const groups: Record<string, Group> = Object.fromEntries(
    groupRows.map((g) => [
      g.id,
      { id: g.id, name: g.name, memberIds: memberIdsByGroup[g.id] ?? [] },
    ]),
  );

  // 응답: 후보별로 { 멤버id: "yes" | "no" }
  const responsesByOption: Record<string, Record<string, VoteResponse>> = {};
  for (const r of responseRows)
    (responsesByOption[r.option_id] ??= {})[r.user_id] = r.value;

  // 후보: 투표별로 모으기. DB에는 "미응답"이 없어서(줄이 없음) 그룹 멤버 전원을 pending으로 채우고 덮어써요
  const groupIdByPoll: Record<string, string> = Object.fromEntries(
    pollRows.map((p) => [p.id, p.group_id]),
  );
  const optionsByPoll: Record<string, TimeOption[]> = {};
  for (const o of optionRows) {
    const { date, time } = splitStartsAt(o.starts_at);
    const memberIds = groups[groupIdByPoll[o.poll_id]]?.memberIds ?? [];
    const responses: Record<string, VoteResponse> = {
      ...Object.fromEntries(memberIds.map((id) => [id, "pending" as const])),
      ...responsesByOption[o.id],
    };
    (optionsByPoll[o.poll_id] ??= []).push({
      id: o.id,
      date,
      time,
      holiday: getHoliday(date),
      responses,
    });
  }

  // 투표
  const polls: Record<string, Poll> = Object.fromEntries(
    pollRows.map((p) => [
      p.id,
      {
        id: p.id,
        groupId: p.group_id,
        title: p.title,
        hostId: p.host_id,
        options: optionsByPoll[p.id] ?? [],
        confirmedOptionId: p.confirmed_option_id ?? undefined,
      },
    ]),
  );

  return { members, groups, polls };
}
