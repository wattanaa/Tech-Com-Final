import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';

const loginSchema = z.object({
  email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  useDocumentTitle('เข้าสู่ระบบหลังบ้าน');
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    try {
      await login(values);
      const redirect = params.get('redirect');
      navigate(redirect && redirect.startsWith('/admin') ? redirect : '/admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fields) {
          for (const [field, message] of Object.entries(err.fields)) {
            setError(field as keyof LoginFormValues, { message });
          }
        }
        setFormError(err.message);
      } else {
        setFormError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <GlassCard variant="strong" padding="lg" className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="font-display text-lg font-bold text-ink">เข้าสู่ระบบหลังบ้าน</p>
          <p className="mt-1 text-sm text-ink-muted">แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              {...register('email')}
              className="glass rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="glass rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
            />
            {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
          </div>

          {formError && (
            <p
              role="alert"
              className="rounded-sm border border-danger/25 bg-danger/[0.08] px-3.5 py-2.5 text-sm text-danger"
            >
              {formError}
            </p>
          )}

          <Button
            type="submit"
            isLoading={isSubmitting}
            leftIcon={<LogIn className="size-4" aria-hidden />}
            className="mt-2 w-full"
          >
            เข้าสู่ระบบ
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
