import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { RequestError } from '@/lib/api';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' });
  const [error, setError] = useState<RequestError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const user = await register({
        name: form.name.trim(),
        username: form.username.trim().toLowerCase(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate(`/u/${user.username}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof RequestError ? caught : new RequestError('Sign up failed', 0));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your Deck account"
      subtitle="Launch products, vote on what ships, and build a profile makers recognise."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

        <Input
          label="Name"
          autoComplete="name"
          required
          value={form.name}
          onChange={update('name')}
          error={error?.fieldError('name')}
          placeholder="Ada Okonkwo"
        />

        <Input
          label="Username"
          autoComplete="username"
          required
          value={form.username}
          onChange={update('username')}
          error={error?.fieldError('username')}
          hint="Letters, numbers and underscores. This becomes your profile URL."
          placeholder="ada"
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
          error={error?.fieldError('email')}
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={update('password')}
          error={error?.fieldError('password')}
          hint="At least 8 characters."
          placeholder="••••••••"
        />

        {error && error.fields.length > 0 && !error.fields.some((field) => field.field) && (
          <InlineAlert>{error.message}</InlineAlert>
        )}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
