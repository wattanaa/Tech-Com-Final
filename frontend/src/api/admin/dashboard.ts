import { get } from '../client';

export interface DashboardStats {
  cards: {
    newsPublished: number;
    newsPending: number;
    activities: number;
    projects: number;
    teachers: number;
    students: number;
    courses: number;
    unreadMessages: number;
    totalViews: number;
  };
  chart: { label: string; points: { month: string; count: number }[] };
  recentNews: {
    id: string;
    title: string;
    slug: string;
    status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
    views: number;
    publishedAt: string | null;
    createdAt: string;
    author: { name: string } | null;
  }[];
  recentActivity: {
    id: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE';
    entity: string;
    entityId: string | null;
    createdAt: string;
    user: { name: string } | null;
  }[];
  system: { database: { ok: boolean; latencyMs: number }; uptimeSeconds: number; memoryMb: number };
}

export const getDashboardStats = () => get<DashboardStats>('/admin/dashboard/stats');
