import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { RequestError } from '@/lib/api';

interface RedirectState {
  from?: string;
  reason?: string;
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as RedirectState;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<RequestError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
      navigate(state.from ?? '/', { replace: true });
    } catch (caught) {
      setError(caught instanceof RequestError ? caught : new RequestError('Sign in failed', 0));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        state.reason === 'vote'
          ? 'Sign in to cast your vote — it takes a second.'
          : 'Sign in to vote, review, and launch your own products.'
      }
      footer={
        <>
          New to Deck?{' '}
          <Link
            to="/register"
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <InlineAlert>{error.message}</InlineAlert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={error?.fieldError('email')}
          placeholder="you@example.com"
        />

        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={error?.fieldError('password')}
          placeholder="••••••••"
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          Trying the demo data?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
          Any seeded account works — for example{' '}
          <code className="rounded bg-zinc-200/70 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">
            ada@deck.dev
          </code>{' '}
          with password{' '}
          <code className="rounded bg-zinc-200/70 px-1 py-0.5 font-mono text-[11px] dark:bg-zinc-800">
            deck1234
          </code>
          .
        </p>
      </div>
    </AuthShell>
  );
}
