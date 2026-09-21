import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { getPaginationParams } from '../utils/pagination';

const prisma = new PrismaClient();

export const getNewsList = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip, sortBy, order, search } = getPaginationParams(req.query);
    const categoryId = req.query.categoryId as string;

    // เงื่อนไข Filter & Search
    const where: Prisma.NewsWhereInput = {
      deletedAt: null,
      ...(categoryId ? { categoryId } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [items, total] = await Promise.all([
      prisma.news.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: { category: true, author: { select: { name: true } }, coverImage: true },
      }),
      prisma.news.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
// วางไว้นอกสุดของไฟล์ (ระดับเดียวกับ export ฟังก์ชันอื่นๆ)
export const getNewsBySlug = async (_req: any, res: any) => {
  res.json({ data: null });
};
