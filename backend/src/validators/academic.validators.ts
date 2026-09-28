import { z } from 'zod';
import {
  emailField,
  optionalCuid,
  optionalText,
  phoneField,
  stringArray,
  thaiText,
  toUpdateSchema,
  urlField,
} from './common.js';

// ─────────────────────────────  ครูและบุคลากร  ─────────────────────────────

const teacherShape = {
  prefix: thaiText('คำนำหน้าชื่อ', 1, 30),
  firstName: thaiText('ชื่อ', 1, 100),
  lastName: thaiText('นามสกุล', 1, 100),
  position: thaiText('ตำแหน่ง', 1, 150),
  academicRank: optionalText(150),
  typeId: optionalCuid,
  specialties: stringArray(10),
  bio: z.string().trim().max(3_000).nullish(),
  email: emailField.nullish().or(z.literal('')),
  phone: phoneField,
  facebook: urlField,
  line: optionalText(100),
  order: z.number().int().min(0).max(999).default(0),
  isVisible: z.boolean().default(true),
  photoId: optionalCuid,
};

export const createTeacherSchema = z.object(teacherShape);
export const updateTeacherSchema = toUpdateSchema(teacherShape);

// ───────────────────────────────  นักศึกษา  ───────────────────────────────

const studentShape = {
  studentCode: z
    .string()
    .trim()
    .min(4, 'กรุณากรอกรหัสนักศึกษา')
    .max(20)
    .regex(/^[0-9-]+$/, 'รหัสนักศึกษาใส่ได้เฉพาะตัวเลข'),
  prefix: thaiText('คำนำหน้าชื่อ', 1, 30),
  firstName: thaiText('ชื่อ', 1, 100),
  lastName: thaiText('นามสกุล', 1, 100),
  level: thaiText('ระดับชั้น', 1, 30),
  classRoom: optionalText(30),
  year: z.number().int().min(2500).max(2700),
  programId: optionalCuid,
  photoId: optionalCuid,
  isVisible: z.boolean().default(true),
};

export const createStudentSchema = z.object(studentShape);
export const updateStudentSchema = toUpdateSchema(studentShape);

// ───────────────────────────────  หลักสูตร  ───────────────────────────────

const programShape = {
  code: z.string().trim().min(2, 'กรุณากรอกรหัสหลักสูตร').max(20),
  name: thaiText('ชื่อหลักสูตร', 5, 250),
  nameEn: optionalText(250),
  level: z.enum(['POR_WOR_CHOR', 'POR_WOR_SOR'], {
    errorMap: () => ({ message: 'กรุณาเลือกระดับ ปวช. หรือ ปวส.' }),
  }),
  duration: thaiText('ระยะเวลาเรียน', 1, 50),
  description: thaiText('รายละเอียดหลักสูตร', 10, 5_000),
  skills: stringArray(15),
  order: z.number().int().min(0).max(999).default(0),
  isVisible: z.boolean().default(true),
  imageId: optionalCuid,
};

export const createProgramSchema = z.object(programShape);
export const updateProgramSchema = toUpdateSchema(programShape);

// ────────────────────────────────  รายวิชา  ────────────────────────────────

const courseShape = {
  code: z
    .string()
    .trim()
    .min(4, 'กรุณากรอกรหัสวิชา')
    .max(20)
    .regex(/^[0-9A-Za-z-]+$/, 'รหัสวิชาใส่ได้เฉพาะตัวเลข ตัวอักษร และขีดกลาง'),
  name: thaiText('ชื่อวิชา', 3, 250),
  nameEn: optionalText(250),
  credits: z.number().int().min(0).max(30),
  hours: z.number().int().min(0).max(60),
  theoryHours: z.number().int().min(0).max(60).default(0),
  practiceHours: z.number().int().min(0).max(60).default(0),
  description: thaiText('คำอธิบายรายวิชา', 10, 5_000),
  term: optionalText(20),
  programId: z.string().cuid({ message: 'กรุณาเลือกหลักสูตร' }),
  imageId: optionalCuid,
  isVisible: z.boolean().default(true),
  /** ครูผู้สอนประจำวิชา */
  teacherIds: z.array(z.string().cuid()).max(10).default([]),
};

export const createCourseSchema = z.object(courseShape).refine(
  (v) => v.theoryHours + v.practiceHours <= v.hours,
  {
    message: 'ชั่วโมงทฤษฎีรวมกับชั่วโมงปฏิบัติต้องไม่เกินชั่วโมงเรียนทั้งหมด',
    path: ['practiceHours'],
  },
);

export const updateCourseSchema = toUpdateSchema(courseShape);
