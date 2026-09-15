import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { request, RequestError, setStoredToken } from '@/lib/api';
import type { AuthUser } from '@/types';

/** Changing how you get in. Its own page, and its own submission. */
export function AccountPassword() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="display-tight text-3xl uppercase">Password</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Changing this signs nothing else out — Deck has no other sessions to end.
        </p>
      </header>

      <PasswordForm />
    </div>
  );
}

function PasswordForm() {
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<RequestError | Error | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const fieldError = (name: string) =>
    error instanceof RequestError ? error.fieldError(name) : undefined;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      const result = await request<{ token: string; user: AuthUser }>(
        'post',
        '/auth/me/password',
        form,
      );
      /* The server reissues a token on success — store it before anything else
         so the next request cannot go out with the stale one. */
      setStoredToken(result.token);
      updateUser(result.user);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('We could not change that'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-8 p-5 sm:p-6">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Password
        </h2>

        {error && !(error instanceof RequestError && error.fields.length) && (
          <InlineAlert>{error.message}</InlineAlert>
        )}

        <Input
          label="Current password"
          type="password"
          required
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
          error={fieldError('currentPassword')}
          hint="Asked for even though you are signed in — an open session is not proof of who is typing."
        />

        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={form.newPassword}
          onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          error={fieldError('newPassword')}
          hint="At least 8 characters."
        />

        <Input
          label="New password again"
          type="password"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          error={fieldError('confirmPassword')}
        />

        {saved && !error && (
          <p className="border border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
            Password changed
          </p>
        )}

        <Button type="submit" loading={saving}>
          Change password
        </Button>
      </form>
    </Card>
  );
}
