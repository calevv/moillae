import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import type { Group } from '@/types/poll';

const isDemo = () => useAuthStore.getState().status === 'demo';

// 그룹 만들기: 그룹 + 나(owner)를 한 번에. 초대 코드를 돌려줌
export async function saveGroup(group: Group): Promise<string | null> {
    if (isDemo()) return null;

    const { data, error } = await supabase.rpc('create_group', {
        p_group_id: group.id,
        p_name: group.name,
    });
    if (error) throw error;
    return data;
}

// 초대 코드로 그룹 참여. 참여한 그룹 id를 돌려줘요 (이미 멤버여도 그 그룹 id)
export async function joinGroupByCode(code: string): Promise<string> {
    const { data, error } = await supabase.rpc('join_group_by_code', {
        p_code: code,
    });
    if (error) {
        if (error.message.includes('invalid_invite_code')) throw new Error('invalid_invite_code');
        throw error;
    }
    return data;
}

export type InvitePreview = {
    groupId: string;
    groupName: string;
    memberCount: number;
    isMember: boolean;
};

// 초대 코드로 그룹 이름, 인원, 내가 멤버인지 미리 보기 (로그인 안 해도 됨)
export async function getInvitePreview(code: string): Promise<InvitePreview | null> {
    const { data, error } = await supabase.rpc('get_invite_preview', { p_code: code }).maybeSingle();
    if (error) throw error;
    if (!data) return null; // 없는 코드
    return {
        groupId: data.group_id,
        groupName: data.group_name,
        memberCount: data.member_count,
        isMember: data.is_member,
    };
}

// 그룹 이름 바꾸기 (RLS: 방장만)
export async function saveGroupName(groupId: string, name: string) {
    if (isDemo()) return;
    const { data, error } = await supabase.from('groups').update({ name }).eq('id', groupId).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('not_allowed');
}

// 그룹 나가기 (방장이면 자동 위임)
export async function saveLeaveGroup(groupId: string) {
    if (isDemo()) return;
    const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
    if (error) {
        if (error.message.includes('last_member')) throw new Error('last_member');
        throw error;
    }
}

// 그룹 삭제 (RLS: 방장만). 멤버, 투표, 후보, 응답이 함께 지워져요 (on delete cascade)
export async function saveDeleteGroup(groupId: string) {
    if (isDemo()) return;
    const { data, error } = await supabase.from('groups').delete().eq('id', groupId).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('not_allowed');
}
