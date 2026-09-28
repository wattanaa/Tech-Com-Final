import type { ResourceConfig } from './types.js';
import {
  createNewsSchema,
  updateNewsSchema,
  createActivitySchema,
  updateActivitySchema,
  createProjectSchema,
  updateProjectSchema,
} from '../validators/content.validators.js';
import {
  createTeacherSchema,
  updateTeacherSchema,
  createStudentSchema,
  updateStudentSchema,
  createProgramSchema,
  updateProgramSchema,
  createCourseSchema,
  updateCourseSchema,
} from '../validators/academic.validators.js';
import {
  createFacilitySchema,
  updateFacilitySchema,
  createAlbumSchema,
  updateAlbumSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../validators/site.validators.js';

/** ข้อมูลรูปภาพที่ต้องใช้แสดงผล — เลือกเฉพาะฟิลด์ที่จำเป็น ไม่ส่งทั้งก้อน */
const mediaSelect = { select: { id: true, url: true, thumbnailUrl: true, alt: true } };
const categorySelect = { select: { id: true, name: true, slug: true, color: true } };

/** แปลง array ของ id เป็นคำสั่งสร้างความสัมพันธ์แบบหลายต่อหลายของ Prisma */
function linkMany(
  input: Record<string, unknown>,
  inputKey: string,
  relation: string,
  foreignKey: string,
  mode: 'create' | 'update',
): Record<string, unknown> {
  const { [inputKey]: ids, ...rest } = input;
  if (!Array.isArray(ids)) return rest;

  const create = ids.filter((v): v is string => typeof v === 'string').map((id) => ({ [foreignKey]: id }));

  return {
    ...rest,
    // ตอนแก้ไขต้องล้างของเดิมก่อน ไม่งั้นจะกลายเป็นเพิ่มทับของเก่า
    [relation]: mode === 'create' ? { create } : { deleteMany: {}, create },
  };
}

// ════════════════════════════  นิยามทุก Entity  ════════════════════════════

export const newsResource: ResourceConfig = {
  model: 'news',
  entity: 'News',
  route: 'news',
  label: 'ข่าว',
  permission: 'news',
  searchFields: ['title', 'excerpt', 'content'],
  sortFields: ['publishedAt', 'createdAt', 'title', 'views'],
  defaultSort: { publishedAt: 'desc' },
  publicInclude: { category: categorySelect, coverImage: mediaSelect },
  adminInclude: {
    category: categorySelect,
    coverImage: mediaSelect,
    author: { select: { id: true, name: true } },
  },
  hasStatus: true,
  hasSlug: true,
  softDelete: true,
  versioned: true,
  hasViews: true,
  slugFrom: 'title',
  createSchema: createNewsSchema,
  updateSchema: updateNewsSchema,
  extraFilters: (q) =>
    q.from || q.to
      ? { publishedAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
      : undefined,
};

export const activityResource: ResourceConfig = {
  model: 'activity',
  entity: 'Activity',
  route: 'activities',
  label: 'กิจกรรม',
  permission: 'activity',
  searchFields: ['title', 'description', 'location'],
  sortFields: ['startDate', 'createdAt', 'title', 'views'],
  defaultSort: { startDate: 'desc' },
  publicInclude: { category: categorySelect, coverImage: mediaSelect },
  hasStatus: true,
  hasSlug: true,
  softDelete: true,
  versioned: true,
  hasViews: true,
  slugFrom: 'title',
  createSchema: createActivitySchema,
  updateSchema: updateActivitySchema,
  extraFilters: (q) =>
    q.from || q.to
      ? { startDate: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
      : undefined,
};

export const projectResource: ResourceConfig = {
  model: 'project',
  entity: 'Project',
  route: 'projects',
  label: 'ผลงาน',
  permission: 'project',
  searchFields: ['name', 'description', 'award'],
  sortFields: ['year', 'createdAt', 'name'],
  defaultSort: { year: 'desc' },
  publicInclude: {
    category: categorySelect,
    coverImage: mediaSelect,
    advisor: { select: { id: true, prefix: true, firstName: true, lastName: true } },
    members: {
      select: {
        role: true,
        student: { select: { id: true, prefix: true, firstName: true, lastName: true, level: true } },
      },
    },
  },
  hasStatus: true,
  hasSlug: true,
  softDelete: true,
  versioned: true,
  hasViews: false,
  slugFrom: 'name',
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  transformInput: (input, mode) => linkMany(input, 'memberIds', 'members', 'studentId', mode),
};

export const teacherResource: ResourceConfig = {
  model: 'teacher',
  entity: 'Teacher',
  route: 'teachers',
  label: 'บุคลากร',
  permission: 'teacher',
  searchFields: ['firstName', 'lastName', 'position', 'bio'],
  sortFields: ['order', 'firstName', 'createdAt'],
  defaultSort: { order: 'asc' },
  publicInclude: {
    photo: mediaSelect,
    type: categorySelect,
    courses: { select: { course: { select: { id: true, code: true, name: true } } } },
  },
  hasStatus: false,
  hasSlug: false,
  softDelete: true,
  versioned: false,
  hasViews: false,
  lookupField: 'id',
  createSchema: createTeacherSchema,
  updateSchema: updateTeacherSchema,
  publicWhere: { isVisible: true },
  extraFilters: (q) => (q.type ? { typeId: q.type } : undefined),
};

export const studentResource: ResourceConfig = {
  model: 'student',
  entity: 'Student',
  route: 'students',
  label: 'นักศึกษา',
  permission: 'student',
  searchFields: ['firstName', 'lastName', 'studentCode'],
  sortFields: ['studentCode', 'firstName', 'year', 'createdAt'],
  defaultSort: { studentCode: 'asc' },
  publicInclude: {
    photo: mediaSelect,
    program: { select: { id: true, code: true, name: true, level: true } },
  },
  hasStatus: false,
  hasSlug: false,
  softDelete: true,
  versioned: false,
  hasViews: false,
  lookupField: 'id',
  createSchema: createStudentSchema,
  updateSchema: updateStudentSchema,
  publicWhere: { isVisible: true },
};

export const programResource: ResourceConfig = {
  model: 'program',
  entity: 'Program',
  route: 'programs',
  label: 'หลักสูตร',
  permission: 'program',
  searchFields: ['name', 'nameEn', 'code', 'description'],
  sortFields: ['order', 'code', 'name'],
  defaultSort: { order: 'asc' },
  publicInclude: {
    image: mediaSelect,
    _count: { select: { courses: true, students: true } },
  },
  hasStatus: false,
  hasSlug: false,
  softDelete: true,
  versioned: false,
  hasViews: false,
  lookupField: 'code',
  createSchema: createProgramSchema,
  updateSchema: updateProgramSchema,
  publicWhere: { isVisible: true },
  extraFilters: (q) => (q.type ? { level: q.type } : undefined),
};

export const courseResource: ResourceConfig = {
  model: 'course',
  entity: 'Course',
  route: 'courses',
  label: 'รายวิชา',
  permission: 'course',
  searchFields: ['name', 'nameEn', 'code', 'description'],
  sortFields: ['code', 'name', 'credits', 'createdAt'],
  defaultSort: { code: 'asc' },
  publicInclude: {
    image: mediaSelect,
    program: { select: { id: true, code: true, name: true, level: true } },
    teachers: {
      select: {
        teacher: { select: { id: true, prefix: true, firstName: true, lastName: true } },
      },
    },
  },
  hasStatus: false,
  hasSlug: false,
  softDelete: true,
  versioned: false,
  hasViews: false,
  lookupField: 'code',
  createSchema: createCourseSchema,
  updateSchema: updateCourseSchema,
  publicWhere: { isVisible: true },
  transformInput: (input, mode) => linkMany(input, 'teacherIds', 'teachers', 'teacherId', mode),
};

export const facilityResource: ResourceConfig = {
  model: 'facility',
  entity: 'Facility',
  route: 'facilities',
  label: 'ห้องปฏิบัติการ',
  permission: 'facility',
  searchFields: ['name', 'description', 'location'],
  sortFields: ['order', 'name', 'computerCount'],
  defaultSort: { order: 'asc' },
  publicInclude: { coverImage: mediaSelect },
  hasStatus: false,
  hasSlug: true,
  softDelete: true,
  versioned: false,
  hasViews: false,
  slugFrom: 'name',
  createSchema: createFacilitySchema,
  updateSchema: updateFacilitySchema,
  publicWhere: { isVisible: true },
};

export const albumResource: ResourceConfig = {
  model: 'album',
  entity: 'Album',
  route: 'albums',
  label: 'อัลบั้มภาพ',
  permission: 'gallery',
  searchFields: ['name', 'description'],
  sortFields: ['eventDate', 'order', 'name', 'createdAt'],
  defaultSort: { eventDate: 'desc' },
  publicInclude: {
    coverImage: mediaSelect,
    _count: { select: { images: true } },
  },
  hasStatus: false,
  hasSlug: true,
  softDelete: true,
  versioned: false,
  hasViews: false,
  slugFrom: 'name',
  createSchema: createAlbumSchema,
  updateSchema: updateAlbumSchema,
  publicWhere: { isPublished: true },
};

export const categoryResource: ResourceConfig = {
  model: 'category',
  entity: 'Category',
  route: 'categories',
  label: 'หมวดหมู่',
  permission: 'news',
  searchFields: ['name'],
  sortFields: ['order', 'name'],
  defaultSort: { order: 'asc' },
  hasStatus: false,
  hasSlug: false,
  softDelete: false,
  versioned: false,
  hasViews: false,
  lookupField: 'id',
  createSchema: createCategorySchema,
  updateSchema: updateCategorySchema,
  extraFilters: (q) => (q.type ? { type: q.type } : undefined),
};

/** ทุก entity ที่ใช้ CRUD ชุดมาตรฐาน — routes/index.ts วนสร้าง router จากรายการนี้ */
export const allResources: ResourceConfig[] = [
  newsResource,
  activityResource,
  projectResource,
  teacherResource,
  studentResource,
  programResource,
  courseResource,
  facilityResource,
  albumResource,
  categoryResource,
];
