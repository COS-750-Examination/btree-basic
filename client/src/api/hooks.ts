import {
  Badge,
  Cheer,
  FriendGrove,
  FriendsList,
  InviteCode,
  InvitePreview,
  InviteResult,
  PublicUser,
  StreakSummary,
  type AccountPatchBody,
  type LoginBody,
  type RegisterBody,
} from '@btree/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from './client';

/** Current user, or null for guests. Lessons and the visualiser never wait on this (NFR7). */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () =>
      (await api.get('/auth/session', z.object({ user: PublicUser.nullable() }))).user,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) => api.post('/auth/login', body, PublicUser),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterBody) => api.post('/auth/register', body, PublicUser),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      qc.setQueryData(['me'], null);
      void qc.invalidateQueries();
    },
  });
}

export function useFriends(enabled: boolean) {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends', FriendsList),
    enabled,
  });
}

function useFriendsMutation<T>(mutationFn: (arg: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export const useSendFriendRequest = () =>
  useFriendsMutation((email: string) => api.post('/friends/requests', { email }));

export const useAcceptRequest = () =>
  useFriendsMutation((id: string) => api.post(`/friends/requests/${id}/accept`));

export const useDeclineRequest = () =>
  useFriendsMutation((id: string) => api.post(`/friends/requests/${id}/decline`));

export const useCancelRequest = () =>
  useFriendsMutation((id: string) => api.delete(`/friends/requests/${id}`));

export const useUnfriend = () => useFriendsMutation((id: string) => api.delete(`/friends/${id}`));

export function useFriendGrove(id: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['friend-grove', id],
    queryFn: () => api.get(`/friends/${id}/grove`, FriendGrove),
    enabled: enabled && Boolean(id),
  });
}

export function useCheers(enabled: boolean) {
  return useQuery({
    queryKey: ['cheers'],
    queryFn: () => api.get('/cheers', z.array(Cheer)),
    enabled,
    refetchInterval: 60_000,
  });
}

export function useSendCheer(friendId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId?: number) => api.post(`/friends/${friendId}/cheers`, { moduleId }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cheers'] }),
  });
}

export function useStreak(enabled: boolean) {
  return useQuery({
    queryKey: ['streak'],
    queryFn: () => api.get('/streak', StreakSummary),
    enabled,
  });
}

export function useBadges(enabled: boolean) {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/badges', z.array(Badge)),
    enabled,
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AccountPatchBody) => api.patch('/account', body, PublicUser),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}

export function useMyInvite(enabled: boolean) {
  return useQuery({
    queryKey: ['invite'],
    queryFn: () => api.get('/invites/mine', InviteCode),
    enabled,
  });
}

export function useResetInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/invites/mine/reset', {}, InviteCode),
    onSuccess: (data) => qc.setQueryData(['invite'], data),
  });
}

export function useInvitePreview(code: string, enabled: boolean) {
  return useQuery({
    queryKey: ['invite', code],
    queryFn: () => api.get(`/invites/${code}`, InvitePreview),
    enabled,
    retry: false,
  });
}

export function useAcceptInvite(code: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post(`/invites/${code}`, {}, InviteResult),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['friends'] });
      void qc.invalidateQueries({ queryKey: ['invite', code] });
    },
  });
}
