import {
  Cheer,
  FriendGrove,
  PublicUser,
  StreakSummary,
  type FriendSummary,
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
    queryFn: () =>
      api.get<{ friends: FriendSummary[]; incoming: { id: string; fromName: string }[] }>(
        '/friends',
      ),
    enabled,
  });
}

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
