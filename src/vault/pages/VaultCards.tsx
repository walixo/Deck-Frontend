import { naira } from '../format';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { RevealButton, StatusChip } from '../components';
import { useMyCards, useRevealCard } from '../useVault';

/**
 * Cards the signed-in person bought on the storefront.
 *
 * The list never contains a code. Each one is fetched on demand, one at a
 * time, so a glance at this page over somebody's shoulder — or a screenshot of
 * it — does not hand over every card they own.
 */
export function VaultCards() {
  const { isAuthenticated } = useAuth();
  const { data: cards, isLoading } = useMyCards();
  const reveal = useRevealCard();
  const [shown, setShown] = useState<Record<string, { code: string; pin: string | null }>>({});

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="display-tight text-2xl">Sign in to see your cards</h1>
        <a
          href={`https://onedeck.africa/login?next=${encodeURIComponent(window.location.href)}`}
          className="mt-6 inline-block rounded-xl bg-deep px-5 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-on-deep"
        >
          Sign in on Deck
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="display-tight text-3xl">Your cards</h1>

      {isLoading ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : cards?.length ? (
        <ul className="mt-8 space-y-3">
          {cards.map((card) => (
            <li key={card.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-display text-base">
                      {card.issuer.name}
                      <StatusChip status={card.status} />
                    </p>
                    <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.06em] text-muted">
                      ···· {card.last4}
                      {card.recipientName && ` · for ${card.recipientName}`}
                      {card.expiresAt &&
                        ` · expires ${new Date(card.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <p className="text-right">
                    <span className="block font-display text-xl tabular-nums">
                      {naira(card.balanceMinor)}
                    </span>
                    {card.balanceMinor !== card.faceValueMinor && (
                      <span className="font-mono text-[11px] text-muted">
                        of {naira(card.faceValueMinor)}
                      </span>
                    )}
                  </p>
                </div>

                <div className="mt-4 border-t border-line pt-4">
                  <RevealButton
                    revealed={shown[card.id] ?? null}
                    pending={reveal.isPending && reveal.variables === card.id}
                    onReveal={() =>
                      reveal.mutate(card.id, {
                        onSuccess: (data) => setShown((prev) => ({ ...prev, [card.id]: data })),
                      })
                    }
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="No cards yet"
            description="Anything you buy in the shop lands here."
            action={
              <Link
                to="/shop"
                className="inline-block rounded-xl bg-deep px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-on-deep"
              >
                Browse the shop
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}
