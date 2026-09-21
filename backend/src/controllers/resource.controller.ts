import type { Request, Response } from 'express';
import type { ContentStatus } from '@prisma/client';
import type { ResourceService } from '../services/resource.service.js';
import { buildMeta, sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { listQuerySchema, type ListQuery } from '../utils/pagination.js';
import { compareVersions, listVersions } from '../services/version.service.js';

/** ดึง query ที่ผ่าน Zod แล้ว (validate middleware เก็บไว้ที่ req.validatedQuery) */
function query(req: Request): ListQuery {
  return (req.validatedQuery as ListQuery | undefined) ?? listQuerySchema.parse(req.query);
}

/**
 * สร้าง controller ครบชุดจาก service ของ entity นั้น
 * controller มีหน้าที่แค่รับ request และส่ง response — ตรรกะทั้งหมดอยู่ใน service
 */
export function createResourceController(service: ResourceService) {
  const { config } = service;

  return {
    /** GET /:route — รายการสำหรับหน้าเว็บสาธารณะ */
    async listPublic(req: Request, res: Response) {
      const q = query(req);
      const { items, total } = await service.list(q, true);
      sendSuccess(res, items, 200, buildMeta(q.page ?? 1, q.limit ?? 10, total));
    },

    /** GET /admin/:route — รายการสำหรับหลังบ้าน เห็นทุกสถานะ */
    async listAdmin(req: Request, res: Response) {
      const q = query(req);
      const { items, total } = await service.list(q, false);
      sendSuccess(res, items, 200, buildMeta(q.page ?? 1, q.limit ?? 10, total));
    },

    /** GET /:route/:identifier — รายละเอียดสำหรับหน้าเว็บ พร้อมนับยอดเข้าชม */
    async getPublic(req: Request, res: Response) {
      const item = await service.getOne(String(req.params.identifier), true);
      if (config.hasViews && typeof item.id === 'string') {
        void service.incrementViews(item.id);
      }
      sendSuccess(res, item);
    },

    /** GET /admin/:route/:id — รายละเอียดสำหรับหลังบ้าน ไม่นับยอดเข้าชม */
    async getAdmin(req: Request, res: Response) {
      sendSuccess(res, await service.getOne(String(req.params.id), false));
    },

    async create(req: Request, res: Response) {
      sendCreated(res, await service.create(req, req.body as Record<string, unknown>));
    },

    async update(req: Request, res: Response) {
      const updated = await service.update(
        req,
        String(req.params.id),
        req.body as Record<string, unknown>,
      );
      sendSuccess(res, updated);
    },

    async remove(req: Request, res: Response) {
      await service.remove(req, String(req.params.id));
      sendNoContent(res);
    },

    async changeStatus(req: Request, res: Response) {
      const { status } = req.body as { status: ContentStatus };
      sendSuccess(res, await service.changeStatus(req, String(req.params.id), status));
    },

    async listVersions(req: Request, res: Response) {
      sendSuccess(res, await listVersions(config.entity, String(req.params.id)));
    },

    async compareVersions(req: Request, res: Response) {
      const from = Number(req.query.from);
      const to = Number(req.query.to);
      sendSuccess(res, await compareVersions(config.entity, String(req.params.id), from, to));
    },

    async restoreVersion(req: Request, res: Response) {
      const version = Number(req.params.version);
      sendSuccess(res, await service.restoreVersion(req, String(req.params.id), version));
    },
  };
}
