import { z } from 'zod';

export type SortOrder = 'asc' | 'desc';

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  sort?: string;
  [key: string]: any;
}

export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  sort: z.string().optional(),
  // ฟิลด์กรองที่ resource.service.ts#buildWhere และ extraFilters ของแต่ละ entity ใช้ —
  // ต้องประกาศไว้ในนี้ด้วย ไม่งั้น Zod จะ strip ทิ้งก่อนถึง controller เสมอ (ค่ากรองเงียบ ๆ ไม่มีผล)
  type: z.string().optional(),
  categoryId: z.string().optional(),
  programId: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

export const getSkip = (page: number | string = 1, limit: number | string = 10): number => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 10);
  return (p - 1) * l;
};

export const getPaginationParams = (query: any) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sortBy = (query.sortBy as string) || (query.sort as string) || 'createdAt';
  const order = ((query.order || query.sortOrder || 'desc') as string).toLowerCase() === 'asc' ? 'asc' : 'desc';
  const search = (query.search as string) || '';

  return { page, limit, skip, sortBy, order, search };
};

export const buildSearchFilter = (search?: string, searchFields?: readonly string[]) => {
  if (!search || !searchFields || searchFields.length === 0) return {};
  return {
    OR: searchFields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  };
};

export const parseSort = (sort?: string, _allowedFields?: readonly string[], defaultSort?: any) => {
  if (!sort) return defaultSort || { createdAt: 'desc' };
  return defaultSort || { createdAt: 'desc' };
};