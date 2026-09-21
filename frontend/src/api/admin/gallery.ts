import { del, get, patch, post } from '../client';
import type { Media } from '@/types';

export interface GalleryImageAdmin {
  id: string;
  caption: string | null;
  order: number;
  media: Media;
}

export const listAlbumImages = (albumId: string) => get<GalleryImageAdmin[]>(`/admin/gallery/${albumId}/images`);
export const addAlbumImages = (albumId: string, mediaIds: string[]) =>
  post<{ added: number; skipped: number }>(`/admin/gallery/${albumId}/images`, { mediaIds });
export const updateAlbumImageCaption = (id: string, caption: string) =>
  patch<GalleryImageAdmin>(`/admin/gallery/images/${id}`, { caption });
export const removeAlbumImage = (id: string) => del(`/admin/gallery/images/${id}`);
export const reorderAlbumImages = (albumId: string, items: { id: string; order: number }[]) =>
  patch<{ updated: number }>(`/admin/gallery/${albumId}/reorder`, { items });
