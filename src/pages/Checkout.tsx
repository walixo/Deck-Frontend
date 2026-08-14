import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageBanner } from '@/components/ui/Ambient';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { EmptyState, InlineAlert } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { usePlaceOrder, useShippingQuote } from '@/hooks/useMerch';
import { RequestError } from '@/lib/api';
import { formatMoney } from '@/lib/utils';

export function Checkout() {
  const { user } = useAuth();
  const { lines, subtotalMinor, clear } = useCart();
  const { data: quote } = useShippingQuote(subtotalMinor);
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: user?.email ?? '',
    fullName: user?.name ?? '',
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    country: '',
  });

  const error = placeOrder.error instanceof RequestError ? placeOrder.error : null;
  const shippingMinor = quote?.shippingMinor ?? 0;
  const totalMinor = subtotalMinor + shippingMinor;

  const update =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    placeOrder.mutate(
      {
        // SKUs and quantities only — the server prices the order.
        lines: lines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
        email: form.email.trim(),
        shippingAddress: {
          fullName: form.fullName.trim(),
          line1: form.line1.trim(),
          line2: form.line2.trim() || undefined,
          city: form.city.trim(),
          postcode: form.postcode.trim(),
          country: form.country.trim(),
        },
      },
      {
        onSuccess: (order) => {
          clear();
          if (order.authorizationUrl) {
            // Hand off to Paystack's hosted checkout.
            window.location.href = order.authorizationUrl;
            return;
          }
          // No payment provider configured — go straight to the order page.
          navigate(`/orders/${order.reference}`);
        },
      },
    );
  };

  if (lines.length === 0 && !placeOrder.isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          title="Nothing to check out"
          description="Your cart is empty."
          action={<ButtonLink to="/shop">Browse merch</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="relative isolate mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <PageBanner />

      <header className="mb-8">
        <h1 className="display-tight text-4xl uppercase sm:text-5xl">Checkout</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted text-pretty">
          Where should this go? Payment happens on Paystack's secure page — Deck never sees your
          card details.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <form onSubmit={submit} className="space-y-6" noValidate>
          {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Contact
            </h2>
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              error={error?.fieldError('email')}
              hint="Your receipt and shipping updates go here."
              placeholder="you@example.com"
            />
          </Card>

          <Card className="space-y-5 p-5 sm:p-6">
            <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Shipping address
            </h2>

            <Input
              label="Full name"
              required
              value={form.fullName}
              onChange={update('fullName')}
              error={error?.fieldError('shippingAddress.fullName')}
            />
            <Input
              label="Address line 1"
              required
              value={form.line1}
              onChange={update('line1')}
              error={error?.fieldError('shippingAddress.line1')}
            />
            <Input
              label="Address line 2 (optional)"
              value={form.line2}
              onChange={update('line2')}
              error={error?.fieldError('shippingAddress.line2')}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="City"
                required
                value={form.city}
                onChange={update('city')}
                error={error?.fieldError('shippingAddress.city')}
              />
              <Input
                label="Postcode"
                required
                value={form.postcode}
                onChange={update('postcode')}
                error={error?.fieldError('shippingAddress.postcode')}
              />
            </div>
            <Input
              label="Country"
              required
              value={form.country}
              onChange={update('country')}
              error={error?.fieldError('shippingAddress.country')}
            />
          </Card>

          <Button type="submit" size="lg" loading={placeOrder.isPending} className="w-full">
            {placeOrder.isPending ? 'Placing order' : `Pay ${formatMoney(totalMinor)}`}
          </Button>
        </form>

        <aside className="lg:sticky lg:top-24">
          <Card className="p-5">
            <h2 className="border-b-2 border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
              Order
            </h2>

            <ul className="mt-4 space-y-2.5">
              {lines.map((line) => (
                <li key={line.sku} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{line.name}</span>
                    <span className="font-mono text-[10px] font-bold uppercase text-muted">
                      {[line.size, line.colour].filter(Boolean).join(' · ') || line.sku} ×{' '}
                      {line.quantity}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums">
                    {formatMoney(line.unitPriceMinor * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t-2 border-edge pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(subtotalMinor)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Shipping</dt>
                <dd className="tabular-nums">
                  {shippingMinor === 0 ? 'Free' : formatMoney(shippingMinor)}
                </dd>
              </div>
              <div className="flex justify-between gap-3 border-t-2 border-edge pt-2">
                <dt className="font-display uppercase">Total</dt>
                <dd className="font-display text-lg tabular-nums">{formatMoney(totalMinor)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-[11px] leading-relaxed text-muted">
              The server reprices every line before charging, so this total is confirmed against
              live stock and prices.
            </p>

            <Link
              to="/cart"
              className="mt-4 block font-mono text-[11px] font-bold uppercase underline-offset-4 hover:underline"
            >
              ← Back to cart
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  );
}
