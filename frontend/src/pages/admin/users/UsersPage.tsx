import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listRoles } from '@/api/admin/users';
import type { AdminUserRow } from '@/types/adminContent';

const passwordRule = z
  .string()
  .min(12, 'รหัสผ่านต้องยาวอย่างน้อย 12 ตัวอักษร')
  .regex(/[A-Za-z]/, 'รหัสผ่านต้องมีตัวอักษรอย่างน้อย 1 ตัว')
  .regex(/[0-9]/, 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');

/**
 * ฟอร์มสร้าง/แก้ไขใช้ shape เดียวกันเป๊ะ (password กับ newPassword ไม่บังคับทั้งคู่)
 * เพื่อให้ z.infer ออกมาเป็นชนิดเดียวกัน — ความบังคับจริงตรวจด้วย .refine() แยกกันแทน
 * ที่ต้องทำแบบนี้เพราะ ResourceListPage.formSchema รับ schema เดียวสำหรับทั้งสองโหมด
 */
const baseShape = {
  email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง'),
  name: z.string().trim().min(2, 'กรุณากรอกชื่อ-สกุล').max(150),
  roleId: z.string().min(1, 'กรุณาเลือกบทบาท'),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  isActive: z.boolean(),
  password: z.string().optional().or(z.literal('')),
  newPassword: z.string().optional().or(z.literal('')),
};

function checkPasswordRule(value: string | undefined, ctx: z.RefinementCtx, path: string) {
  if (!value) return;
  const result = passwordRule.safeParse(value);
  if (!result.success) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: result.error.issues[0]?.message, path: [path] });
  }
}

const createUserFormSchema = z.object(baseShape).superRefine((v, ctx) => {
  if (!v.password) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'กรุณากรอกรหัสผ่าน', path: ['password'] });
  } else {
    checkPasswordRule(v.password, ctx, 'password');
  }
});
const updateUserFormSchema = z.object(baseShape).superRefine((v, ctx) => checkPasswordRule(v.newPassword, ctx, 'newPassword'));
type UserFormInput = z.infer<typeof createUserFormSchema>;

const columns: DataTableColumn<AdminUserRow>[] = [
  { header: 'ชื่อ-สกุล', cell: (u) => u.name },
  { header: 'อีเมล', cell: (u) => u.email },
  { header: 'บทบาท', cell: (u) => <Badge>{u.role.label}</Badge> },
  {
    header: 'สถานะ',
    cell: (u) =>
      u.lockedUntil && new Date(u.lockedUntil) > new Date() ? (
        <Badge color="#DC2626">ถูกล็อกชั่วคราว</Badge>
      ) : u.isActive ? (
        <Badge>ใช้งานอยู่</Badge>
      ) : (
        <Badge color="#94a3b8">ปิดใช้งาน</Badge>
      ),
  },
  {
    header: 'เข้าสู่ระบบล่าสุด',
    cell: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '—'),
  },
];

export function UsersPage() {
  useDocumentTitle('ผู้ใช้งานระบบ');
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminUserRow, UserFormInput>('users');
  const rolesQuery = useQuery({ queryKey: ['admin', 'users', 'roles'], queryFn: listRoles });

  const formFields = useMemo(() => {
    const roleOptions = (rolesQuery.data ?? []).map((r) => ({ value: r.id, label: r.label }));
    return (u?: AdminUserRow): ResourceFormField[] => [
      { name: 'name', label: 'ชื่อ-สกุล', type: 'text', colSpan: 2 },
      { name: 'email', label: 'อีเมล', type: 'text' },
      { name: 'phone', label: 'เบอร์โทร', type: 'text' },
      { name: 'roleId', label: 'บทบาท', type: 'select', options: roleOptions },
      { name: 'isActive', label: 'เปิดใช้งานบัญชีนี้', type: 'checkbox' },
      u
        ? { name: 'newPassword', label: 'ตั้งรหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)', type: 'password', colSpan: 2 }
        : { name: 'password', label: 'รหัสผ่าน', type: 'password', colSpan: 2, helperText: 'อย่างน้อย 12 ตัวอักษร มีทั้งตัวอักษรและตัวเลข' },
    ];
  }, [rolesQuery.data]);

  return (
    <div className="flex flex-col gap-6">
      <ResourceListPage<AdminUserRow, UserFormInput>
        title="ผู้ใช้งานระบบ"
        description="จัดการบัญชีผู้ดูแลและสิทธิ์การเข้าถึง — เฉพาะผู้ดูแลระบบสูงสุด"
        createLabel="เพิ่มผู้ใช้งาน"
        searchPlaceholder="ค้นหาชื่อ อีเมล…"
        emptyMessage="ยังไม่มีผู้ใช้งาน"
        columns={columns}
        formFields={formFields}
        formSchema={(u) => (u ? updateUserFormSchema : createUserFormSchema)}
        toFormDefaults={(u) => ({
          name: u?.name ?? '',
          email: u?.email ?? '',
          phone: u?.phone ?? '',
          roleId: u?.role.id ?? '',
          isActive: u?.isActive ?? true,
          password: '',
          newPassword: '',
        })}
        useList={useList}
        useCreate={useCreate}
        useUpdate={useUpdate}
        useRemove={useRemove}
        getItemLabel={(u) => u.name}
      />

      {rolesQuery.data && (
        <GlassCard padding="lg">
          <p className="mb-4 font-display text-sm font-semibold text-ink">บทบาทและสิทธิ์ในระบบ</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {rolesQuery.data.map((role) => (
              <div key={role.id} className="rounded-sm border border-hairline/15 p-3.5">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                  {role.label} <Badge>{role.userCount} คน</Badge>
                </p>
                {role.description && <p className="mt-1 text-xs text-ink-subtle">{role.description}</p>}
                <p className="mt-2 text-xs text-ink-muted">{role.permissions.length} สิทธิ์</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
