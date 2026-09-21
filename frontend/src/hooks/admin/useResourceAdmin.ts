import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createResourceApi, type ContentStatus, type ListParams } from '@/api/admin/resource';

/**
 * ชุด hook มาตรฐานสำหรับ entity ที่ใช้ generic resource router ฝั่ง backend
 * ใช้ครั้งเดียวต่อ route แล้วได้ list/create/update/remove ที่ invalidate cache
 * ให้กันเองหลังบันทึกสำเร็จ — ไม่ต้องเขียน query/mutation ซ้ำทุก entity
 */
export function useResourceAdmin<TItem, TInput extends Record<string, unknown>>(route: string) {
  const api = useMemo(() => createResourceApi<TItem, TInput>(route), [route]);
  const queryClient = useQueryClient();
  const listKey = (params?: ListParams) => ['admin', route, 'list', params] as const;

  function useList(params?: ListParams) {
    return useQuery({
      queryKey: listKey(params),
      queryFn: () => api.list(params),
      placeholderData: (prev) => prev,
    });
  }

  function invalidateList() {
    return queryClient.invalidateQueries({ queryKey: ['admin', route, 'list'] });
  }

  function useCreate() {
    return useMutation({
      mutationFn: (data: TInput) => api.create(data),
      onSuccess: () => invalidateList(),
    });
  }

  function useUpdate() {
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<TInput> & { updatedAt?: string } }) =>
        api.update(id, data),
      onSuccess: () => invalidateList(),
    });
  }

  function useRemove() {
    return useMutation({
      mutationFn: (id: string) => api.remove(id),
      onSuccess: () => invalidateList(),
    });
  }

  function useItem(id: string | undefined) {
    return useQuery({
      queryKey: ['admin', route, 'item', id],
      queryFn: () => api.get(id as string),
      enabled: Boolean(id),
    });
  }

  function invalidateItem(id: string) {
    return Promise.all([invalidateList(), queryClient.invalidateQueries({ queryKey: ['admin', route, 'item', id] })]);
  }

  /** ใช้เฉพาะ entity ที่ hasStatus เป็น true — เปลี่ยนสถานะตาม workflow */
  function useChangeStatus() {
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: ContentStatus }) => api.changeStatus(id, status),
      onSuccess: (_data, vars) => invalidateItem(vars.id),
    });
  }

  /** ใช้เฉพาะ entity ที่ versioned เป็น true */
  function useVersions(id: string | undefined) {
    return useQuery({
      queryKey: ['admin', route, 'versions', id],
      queryFn: () => api.listVersions(id as string),
      enabled: Boolean(id),
    });
  }

  function useRestoreVersion(id: string) {
    return useMutation({
      mutationFn: (version: number) => api.restoreVersion(id, version),
      onSuccess: () => invalidateItem(id),
    });
  }

  return {
    api,
    useList,
    useItem,
    useCreate,
    useUpdate,
    useRemove,
    useChangeStatus,
    useVersions,
    useRestoreVersion,
  };
}
