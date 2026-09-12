import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api-client';

import { useCurrentUser, useLogin } from '../api/auth-queries';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const session = useCurrentUser();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  if (session.isPending) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Skeleton className="h-72 w-full max-w-md" />
      </div>
    );
  }

  if (session.data) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
    } catch {
      // Field-level and form-level errors are read from the mutation below.
    }
  });

  const isBusy = isSubmitting || loginMutation.isPending;
  const loginError =
    loginMutation.error instanceof ApiError ? loginMutation.error.message : undefined;

  return (
    <div className="bg-background flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 grid size-9 place-items-center rounded-md text-sm font-bold">
            C
          </div>
          <CardTitle className="text-xl">Sign in to Cloudesh HR</CardTitle>
          <CardDescription>Use the email and password you were given.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(event) => void onSubmit(event)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? 'login-email-error' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p id="login-email-error" className="text-destructive text-xs" role="alert">
                  {errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? 'login-password-error' : undefined}
                {...register('password')}
              />
              {errors.password ? (
                <p id="login-password-error" className="text-destructive text-xs" role="alert">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {loginError ? (
              <p className="text-destructive text-sm" role="alert">
                {loginError}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={isBusy}>
              {isBusy ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
