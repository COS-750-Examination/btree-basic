import {
  Badge,
  Cheer,
  FriendGrove,
  FriendsList,
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

/** Friends, requests sent to you (`incoming`) and requests you sent (`outgoing`). */
export function useFriends(enabled: boolean) {
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => api.get('/friends', FriendsList),
    enabled,
  });
}

/** A friend-request action that changes the list, so the list is reloaded afterwards. */
function useFriendsMutation<T>(mutationFn: (arg: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['friends'] }),
  });
}

/**
 * Always succeeds (202) whether or not the email has an account. Reloads the list anyway,
 * because if they had already asked you, you are now friends.
 */
export const useSendFriendRequest = () =>
  useFriendsMutation((email: string) => api.post('/friends/requests', { email }));

export const useAcceptRequest = () =>
  useFriendsMutation((id: string) => api.post(`/friends/requests/${id}/accept`));

export const useDeclineRequest = () =>
  useFriendsMutation((id: string) => api.post(`/friends/requests/${id}/decline`));

/** Withdraw a request you sent. */
export const useCancelRequest = () =>
  useFriendsMutation((id: string) => api.delete(`/friends/requests/${id}`));

/** Works from either side. Their grove is then 404 and cheers to them are refused. */
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
  });
}

export function useSendCheer(friendId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId?: number) => api.post(`/friends/${friendId}/cheers`, { moduleId }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cheers'] }),
  });
}

/** The student's day streak (signed-in only). Refreshed after every saved answer. */
export function useStreak(enabled: boolean) {
  return useQuery({
    queryKey: ['streak'],
    queryFn: () => api.get('/streak', StreakSummary),
    enabled,
  });
}

/**
 * The four badges, earned or locked (signed-in only; badges are private). The progress
 * store refreshes this after the saves that can award one: answers, modules and the warm-up.
 */
export function useBadges(enabled: boolean) {
  return useQuery({
    queryKey: ['badges'],
    queryFn: () => api.get('/badges', z.array(Badge)),
    enabled,
  });
}

/**
 * Change the display name, password or theme. The reply is the updated user, so the header
 * (and anything else reading `['me']`) updates at once.
 */
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AccountPatchBody) => api.patch('/account', body, PublicUser),
    onSuccess: (user) => qc.setQueryData(['me'], user),
  });
}
