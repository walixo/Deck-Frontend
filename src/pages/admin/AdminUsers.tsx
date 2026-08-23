import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { VerifiedMark } from '@/components/ui/VerifiedMark';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/States';
import { useAdminUsers, useSetVerified, useUpdateRole } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import type { AdminUser } from '@/types';

/**
 * People, and who among them is staff.
 *
 * The search box is uncontrolled and submitted rather than filtered per
 * keystroke — a role list is not a thing you want re-querying on every letter,
 * and the URL is not the source of truth here the way it is on Discover.
 */
export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const { data: users, isLoading } = useAdminUsers(search, role);

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const field = new FormData(event.currentTarget).get('q');
          setSearch(typeof field === 'string' ? field.trim() : '');
        }}
        className="mb-4 flex flex-wrap gap-2"
        role="search"
      >
        <input
          name="q"
          type="search"
          defaultValue={search}
          placeholder="NAME, HANDLE OR EMAIL"
          aria-label="Search people"
          className="h-11 min-w-0 flex-1 border-2 border-edge bg-surface px-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] placeholder:text-muted/70 focus:border-accent focus:outline-none"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2">
        {[
          { value: '', label: 'Everyone' },
          { value: 'admin', label: 'Staff' },
          { value: 'user', label: 'Members' },
        ].map((option) => (
          <button
            key={option.value || 'all'}
            type="button"
            onClick={() => setRole(option.value)}
            aria-pressed={role === option.value}
            className={`border-2 border-edge px-3 py-1.5 font-mono text-[12px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms] ${
              role === option.value
                ? 'bg-pop text-on-pop'
                : 'bg-surface text-muted hover:bg-surface-2 hover:text-body'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </div>
      ) : !users?.data.length ? (
        <EmptyState title="Nobody matches that" description="Try a different name or handle." />
      ) : (
        <>
          <ul className="space-y-2">
            {users.data.map((person) => (
              <li key={person.id}>
                <PersonRow person={person} />
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-muted">
            Showing {users.data.length} of {users.meta.total}
          </p>
        </>
      )}
    </div>
  );
}

function PersonRow({ person }: { person: AdminUser }) {
  const { user } = useAuth();
  const update = useUpdateRole();
  const verify = useSetVerified();
  const [error, setError] = useState<string | null>(null);

  const isAdmin = person.role === 'admin';
  const isSelf = user?.id === person.id;

  const toggle = async () => {
    setError(null);
    try {
      await update.mutateAsync({ id: person.id, role: isAdmin ? 'user' : 'admin' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  /*
   * A reason is required in both directions, and the server enforces it too.
   * The mark is a public claim Deck makes on somebody's behalf, so "why" has to
   * outlive whoever clicked — especially for removals, which people notice.
   */
  const toggleVerified = async () => {
    setError(null);
    const reason = window.prompt(
      person.verified
        ? `Why is verification being removed from @${person.username}?`
        : `What is @${person.username}'s verification based on?`,
    );
    if (!reason || reason.trim().length < 4) return;

    try {
      await verify.mutateAsync({ id: person.id, verified: !person.verified, reason: reason.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That did not go through');
    }
  };

  return (
    <div className="rounded-slab border-2 border-edge bg-surface p-3">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar user={person} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 font-display text-sm uppercase">
            <Link to={`/u/${person.username}`} className="hover:underline underline-offset-2">
              {person.name}
            </Link>
            {person.verified && <VerifiedMark name={person.name} />}
            {isAdmin && (
              <span className="border-2 border-edge bg-edge px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-canvas">
                Staff
              </span>
            )}
            {isSelf && (
              <span className="border-2 border-edge bg-deep px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-on-deep">
                You
              </span>
            )}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-muted">{person.email}</p>
        </div>

        {/*
          Self-demotion is refused by the server too. Hiding the button as well
          means the guard never has to fire for an honest misclick — the API
          check is the one that matters, this is just not offering the rake.
        */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Verification is about identity, staff is about privileges — an
              admin can hold either, both or neither, so they are separate
              controls rather than one combined state. */}
          <Button
            size="sm"
            variant="secondary"
            onClick={() => void toggleVerified()}
            loading={verify.isPending}
          >
            {person.verified ? 'Unverify' : 'Verify'}
          </Button>

          {/*
            Self-demotion is refused by the server too. Hiding the button as
            well means the guard never has to fire for an honest misclick — the
            API check is the one that matters, this is just not offering the rake.
          */}
          {!isSelf && (
            <Button
              size="sm"
              variant={isAdmin ? 'secondary' : 'primary'}
              onClick={() => void toggle()}
              loading={update.isPending}
            >
              {isAdmin ? 'Remove staff' : 'Make staff'}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-2 border-2 border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas"
        >
          {error}
        </p>
      )}
    </div>
  );
}
