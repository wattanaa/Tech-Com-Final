import { Controller, useForm, type DefaultValues, type FieldValues, type Path, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import { Button } from '@/components/ui/Button';
import { TagsInput } from './TagsInput';
import { ImagePickerField } from './ImagePickerField';
import { MediaPickerField, type MediaPreview } from './MediaPickerField';
import { cn } from '@/utils/cn';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'select'
  | 'multiselect'
  | 'tags'
  | 'date'
  | 'color'
  | 'image'
  | 'media'
  | 'password';

export interface SelectOption {
  value: string;
  label: string;
}

export interface ResourceFormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  options?: SelectOption[];
  /** กินพื้นที่ 2 คอลัมน์ในตาราง grid 2 คอลัมน์ — ใช้กับข้อความยาว เช่น รายละเอียด */
  colSpan?: 1 | 2;
  rows?: number;
  /** เฉพาะ type: 'image'/'media' — ไฟล์ที่เลือกไว้อยู่แล้วตอนแก้ไข (ไม่มีค่าตอนสร้างใหม่) */
  initialPreview?: MediaPreview | null;
}

interface ResourceFormProps<T extends FieldValues> {
  fields: ResourceFormField[];
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  onSubmit: (values: T) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
  submitError?: string | null;
  /** ซ่อนปุ่มยกเลิก — ใช้กับฟอร์มที่ไม่ได้อยู่ใน modal/หน้าที่ต้อง navigate กลับ เช่น แท็บตั้งค่า */
  hideCancel?: boolean;
}

/** ฟอร์มสร้าง/แก้ไขที่ประกอบขึ้นจาก field config — ใช้ซ้ำได้กับทุก entity แค่เปลี่ยน fields/schema */
export function ResourceForm<T extends FieldValues>({
  fields,
  schema,
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'บันทึก',
  submitError,
  hideCancel = false,
}: ResourceFormProps<T>) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<T>({ resolver: zodResolver(schema) as Resolver<T>, defaultValues });

  const inputClass =
    'glass w-full rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500';

  // select/image ผูกกับ id อ้างอิง (cuid) เสมอ — backend ปฏิเสธ '' เป็นรูปแบบ cuid ไม่ได้
  // (ต่างจากช่องข้อความว่างที่ backend ยอมรับ) ส่งเป็น undefined แทนเมื่อผู้ใช้ไม่ได้เลือกอะไร
  // password ก็เช่นกัน — ช่องรหัสผ่านที่เว้นว่างไว้ (เช่น "ไม่เปลี่ยนรหัสผ่าน") ต้องไม่ส่ง '' ไปให้ผ่าน min-length validation ไม่ได้
  const submit = handleSubmit((values) => {
    const sanitized = { ...values } as Record<string, unknown>;
    for (const field of fields) {
      if (
        (field.type === 'select' || field.type === 'image' || field.type === 'media' || field.type === 'password') &&
        sanitized[field.name] === ''
      ) {
        sanitized[field.name] = undefined;
      }
    }
    return onSubmit(sanitized as T);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const name = field.name as Path<T>;
          const error = errors[field.name as keyof typeof errors] as { message?: string } | undefined;
          const wrapperClass = cn('flex flex-col gap-1.5', field.colSpan === 2 && 'sm:col-span-2');

          if (field.type === 'checkbox') {
            return (
              <label key={field.name} className={cn(wrapperClass, '!flex-row items-center gap-2.5')}>
                <input type="checkbox" {...register(name)} className="size-4 rounded border-hairline/30" />
                <span className="text-sm font-medium text-ink">{field.label}</span>
              </label>
            );
          }

          return (
            <div key={field.name} className={wrapperClass}>
              <label htmlFor={field.name} className="text-sm font-medium text-ink">
                {field.label}
              </label>

              {field.type === 'textarea' && (
                <textarea
                  id={field.name}
                  rows={field.rows ?? 4}
                  placeholder={field.placeholder}
                  {...register(name)}
                  className={inputClass}
                />
              )}

              {field.type === 'select' && (
                <select id={field.name} {...register(name)} className={inputClass}>
                  <option value="">— เลือก —</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'multiselect' && (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: { value, onChange } }) => {
                    const arr: string[] = Array.isArray(value) ? value : [];
                    return (
                      <div className="glass flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-sm p-3">
                        {field.options?.map((opt) => {
                          const checked = arr.includes(opt.value);
                          return (
                            <label key={opt.value} className="flex items-center gap-2 text-sm text-ink">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  onChange(checked ? arr.filter((v) => v !== opt.value) : [...arr, opt.value])
                                }
                                className="size-4 rounded border-hairline/30"
                              />
                              {opt.label}
                            </label>
                          );
                        })}
                        {(!field.options || field.options.length === 0) && (
                          <p className="text-xs text-ink-subtle">ไม่มีตัวเลือก</p>
                        )}
                      </div>
                    );
                  }}
                />
              )}

              {field.type === 'image' && (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: { value, onChange } }) => (
                    <ImagePickerField
                      value={value as string | undefined}
                      initialPreview={field.initialPreview}
                      onChange={onChange}
                    />
                  )}
                />
              )}

              {field.type === 'media' && (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: { value, onChange } }) => (
                    <MediaPickerField
                      value={value as string | undefined}
                      initialPreview={field.initialPreview}
                      onChange={onChange}
                    />
                  )}
                />
              )}

              {field.type === 'tags' && (
                <Controller
                  control={control}
                  name={name}
                  render={({ field: { value, onChange } }) => (
                    <TagsInput
                      value={Array.isArray(value) ? value : []}
                      onChange={onChange}
                      placeholder={field.placeholder}
                    />
                  )}
                />
              )}

              {(field.type === 'text' ||
                field.type === 'number' ||
                field.type === 'date' ||
                field.type === 'color' ||
                field.type === 'password') && (
                <input
                  id={field.name}
                  type={field.type === 'text' ? 'text' : field.type}
                  placeholder={field.placeholder}
                  autoComplete={field.type === 'password' ? 'new-password' : undefined}
                  {...register(name, field.type === 'number' ? { valueAsNumber: true } : undefined)}
                  className={field.type === 'color' ? 'h-11 w-20 rounded-sm border border-hairline/20 bg-transparent' : inputClass}
                />
              )}

              {field.helperText && <p className="text-xs text-ink-subtle">{field.helperText}</p>}
              {error?.message && <p className="text-xs text-danger">{error.message}</p>}
            </div>
          );
        })}
      </div>

      {submitError && (
        <p role="alert" className="rounded-sm border border-danger/25 bg-danger/[0.08] px-3.5 py-2.5 text-sm text-danger">
          {submitError}
        </p>
      )}

      <div className="mt-2 flex justify-end gap-2.5">
        {!hideCancel && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
