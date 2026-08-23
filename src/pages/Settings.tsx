import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CharCount, Input, Textarea } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { request, RequestError, setStoredToken } from '@/lib/api';
import type { AuthUser } from '@/types';

const LIMITS = { name: 60, headline: 80, bio: 280 };

/**
 * Your account: who you are, and how you get in.
 *
 * Two forms on one page, and they are deliberately separate submissions. A
 * password change needs the current password and reissues a token; folding it
 * into the profile save would mean typing your password to fix a typo in your
 * bio, and would make an ordinary save capable of locking you out.
 */
export function Settings() {
  const { user } = useAuth();

  /* RequireAuth guards the route, so this is a render-order guard rather than
     an access check — the provider resolves `user` a tick after mount. */
  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b-2 border-edge pb-6">
        <h1 className="display-tight text-[clamp(2rem,5vw,3rem)] uppercase">Your profile</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted text-pretty">
          How you appear on Deck. Your public page is{' '}
          <Link
            to={`/u/${user.username}`}
            className="font-bold text-body underline underline-offset-2"
          >
            @{user.username}
          </Link>
          .
        </p>
      </header>

      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  );
}

function ProfileForm({ user }: { user: AuthUser }) {
  const { updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user.name,
    headline: user.headline ?? '',
    bio: user.bio ?? '',
    websiteUrl: user.websiteUrl ?? '',
  });
  /* The uploader deals in arrays because it also drives galleries; an avatar is
     the one-element case. */
  const [avatar, setAvatar] = useState<string[]>(user.avatarUrl ? [user.avatarUrl] : []);

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
      const updated = await request<AuthUser>('patch', '/auth/me', {
        name: form.name.trim(),
        headline: form.headline.trim(),
        bio: form.bio.trim(),
        websiteUrl: form.websiteUrl.trim(),
        /* Empty string, not undefined: undefined means "leave it alone" to the
           server, so clearing an avatar would silently do nothing. */
        avatarUrl: avatar[0] ?? '',
      });
      updateUser(updated);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause : new Error('We could not save that'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-8 p-5 sm:p-6">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Details
        </h2>

        {error && !(error instanceof RequestError && error.fields.length) && (
          <InlineAlert>{error.message}</InlineAlert>
        )}

        {/* The live preview is the avatar as the rest of Deck draws it, beside
            the uploader — a 300px upload thumbnail tells you nothing about how
            a 32px circle beside your name will read. */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 text-center">
            <Avatar
              user={{ ...user, name: form.name || user.name, avatarUrl: avatar[0] }}
              size="lg"
            />
            <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
              Preview
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <ImageUpload
              label="Photo"
              aspect="square"
              value={avatar}
              onChange={setAvatar}
              error={fieldError('avatarUrl')}
              hint="Square works best. Without one, Deck draws your initials."
            />
          </div>
        </div>

        <Input
          label="Name"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          error={fieldError('name')}
          maxLength={LIMITS.name}
          counter={<CharCount value={form.name} max={LIMITS.name} />}
        />

        <Input
          label="Headline"
          value={form.headline}
          onChange={(event) => setForm({ ...form, headline: event.target.value })}
          error={fieldError('headline')}
          maxLength={LIMITS.headline}
          hint="One line, shown under your name."
          placeholder="Building hardware in Lagos"
          counter={<CharCount value={form.headline} max={LIMITS.headline} />}
        />

        <Textarea
          label="Bio"
          rows={3}
          value={form.bio}
          onChange={(event) => setForm({ ...form, bio: event.target.value })}
          error={fieldError('bio')}
          maxLength={LIMITS.bio}
          counter={<CharCount value={form.bio} max={LIMITS.bio} />}
        />

        <Input
          label="Website"
          type="url"
          value={form.websiteUrl}
          onChange={(event) => setForm({ ...form, websiteUrl: event.target.value })}
          error={fieldError('websiteUrl')}
          hint="Include https://"
          placeholder="https://example.com"
        />

        {/* Username and email are not here. Both are identity rather than
            presentation: a username is in every link anybody has shared to your
            profile, and changing an email is an account-recovery flow with a
            confirmation step, not a text field. */}
        <dl className="grid gap-3 border-t-2 border-edge pt-4 sm:grid-cols-2">
          <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Username
            </dt>
            <dd className="mt-0.5 font-mono text-sm">@{user.username}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Email
            </dt>
            <dd className="mt-0.5 truncate font-mono text-sm">{user.email}</dd>
          </div>
          <p className="text-xs leading-relaxed text-muted text-pretty sm:col-span-2">
            Neither can be changed here — your username is in every link anyone has shared to your
            profile. Get in touch if you need one moved.
          </p>
        </dl>

        {saved && !error && (
          <p className="border-2 border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
            Saved
          </p>
        )}

        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </form>
    </Card>
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
        <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
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
          <p className="border-2 border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
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
