import { useState } from 'react';
import { MockupPreview } from '@/components/merch/MockupPreview';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Money } from '@/components/ui/Money';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert } from '@/components/ui/States';
import {
  useCreateDesign,
  useInspectArtwork,
  useLifestyleRender,
  useMyDesigns,
} from '@/hooks/useCustom';
import { RequestError } from '@/lib/api';
import { cn, formatMoney, relativeTime } from '@/lib/utils';
import {
  CUSTOM_PLACEMENTS,
  CUSTOM_PRODUCTS,
  PLACEMENT_LABELS,
  type ArtworkInspection,
  type CustomDesign,
  type CustomPlacement,
  type CustomProduct,
} from '@/types';

/**
 * Print your own artwork on Deck's stickers and apparel.
 *
 * Three steps and they are on one page on purpose: upload, choose, see it.
 * Splitting them across routes would mean losing the mockup every time somebody
 * changed their mind about a colour, and changing their mind about a colour is
 * the entire activity.
 *
 * Nothing is charged and nothing is printed until a human at Deck has looked at
 * the artwork — see the note on the CustomDesign model for why that gate is not
 * optional.
 */
export function Customise() {
  const [artwork, setArtwork] = useState<string[]>([]);
  const inspect = useInspectArtwork();

  const url = artwork[0];
  /* Held rather than read straight off the mutation so the panel survives a
     re-inspection without flashing empty. */
  const [inspection, setInspection] = useState<ArtworkInspection | null>(null);

  const onArtwork = (next: string[]) => {
    setArtwork(next);
    setInspection(null);
    if (next[0]) {
      inspect.mutate(next[0], { onSuccess: setInspection });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="border-b border-edge pb-8">
        <h1 className="display-tight text-[clamp(2rem,5vw,3rem)] uppercase">Print your own</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted text-pretty">
          Send us a PNG and we will put it on a sticker, a tee or a hoodie. Deck checks every
          design before it goes to print, so nothing is charged until it is approved.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              1 · Your artwork
            </h2>

            <div className="mt-4">
              <ImageUpload
                label="PNG file"
                aspect="square"
                value={artwork}
                onChange={onArtwork}
                hint="PNG with a transparent background. The bigger the better — 2000px or more on the long edge."
              />
            </div>

            {inspect.isPending && <Skeleton className="mt-4 h-32 w-full" />}

            {inspect.error && (
              <div className="mt-4">
                <InlineAlert>
                  {inspect.error instanceof RequestError
                    ? inspect.error.message
                    : 'We could not read that file'}
                </InlineAlert>
              </div>
            )}

            {inspection && <AnalysisPanel inspection={inspection} className="mt-4" />}
          </Card>

          <MyDesigns />
        </div>

        {url && inspection ? (
          <Configurator artworkUrl={url} inspection={inspection} />
        ) : (
          <Card className="flex min-h-80 items-center justify-center p-8 text-center">
            <p className="max-w-xs text-sm leading-relaxed text-muted text-pretty">
              Upload a PNG on the left and your mockup appears here — the actual file, on the
              actual garment, at the size it will print.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

/**
 * What Deck measured, and what it means.
 *
 * Facts first, then warnings. Somebody who uploaded a good file should see that
 * confirmed in one glance rather than having to notice the absence of problems.
 */
function AnalysisPanel({
  inspection,
  className,
}: {
  inspection: ArtworkInspection;
  className?: string;
}) {
  const { analysis } = inspection;

  return (
    <div className={cn('space-y-3', className)}>
      <dl className="grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.06em]">
        <Fact label="Size" value={`${analysis.width}×${analysis.height}`} />
        <Fact label="Prints up to" value={`${analysis.maxInchesAtGoodDpi}"`} />
        <Fact label="Background" value={analysis.transparent ? 'Transparent' : 'Solid'} />
        <Fact label="Ink coverage" value={`${Math.round(analysis.inkCoverage * 100)}%`} />
      </dl>

      <div className="flex items-center gap-2 border border-edge bg-surface-2 px-3 py-2">
        <span
          aria-hidden="true"
          className="size-5 shrink-0 border border-edge"
          style={{ background: analysis.dominantHex }}
        />
        <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          Main colour <span className="text-body">{analysis.dominantHex}</span>
        </p>
      </div>

      {analysis.warnings.length > 0 ? (
        <ul className="space-y-2">
          {analysis.warnings.map((warning) => (
            <li
              key={warning}
              className="border border-edge bg-warning px-3 py-2 text-xs leading-relaxed text-ink text-pretty"
            >
              {warning}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border border-edge bg-success px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-ink">
          Print-ready
        </p>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-edge bg-surface-2 px-2.5 py-1.5">
      <dd className="font-display text-xs tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-[9px] font-bold text-muted">{label}</dt>
    </div>
  );
}

/** The choices, and the mockup they produce. */
function Configurator({
  artworkUrl,
  inspection,
}: {
  artworkUrl: string;
  inspection: ArtworkInspection;
}) {
  const create = useCreateDesign();

  const [product, setProduct] = useState<CustomProduct>('tee');
  const [placement, setPlacement] = useState<CustomPlacement>('centre-chest');
  const [scale, setScale] = useState(60);
  const [size, setSize] = useState('M');
  const [name, setName] = useState('');
  /* Deck already worked out which colours this artwork reads on — starting on
     the best one means the first thing somebody sees is their design working. */
  const [garment, setGarment] = useState(
    inspection.analysis.suggestedGarments[0] ?? inspection.garments[0]?.id ?? 'black',
  );

  const [saved, setSaved] = useState<CustomDesign | null>(null);

  const apparel = inspection.pricing[product].apparel;
  const garmentHex =
    inspection.garments.find((entry) => entry.id === garment)?.hex ?? '#17181a';
  const price = inspection.pricing[product].priceMinor;

  const error = create.error instanceof RequestError ? create.error : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    create.mutate(
      {
        artworkUrl,
        name: name.trim(),
        product,
        garment,
        placement,
        scale,
        size: apparel ? size : undefined,
      },
      { onSuccess: setSaved },
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5 md:order-2">
        <div>
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
            Print proof
          </p>
          <MockupPreview
            artworkUrl={artworkUrl}
            product={product}
            placement={placement}
            garment={garmentHex}
            scale={scale}
            className="shadow-hard"
          />
          <p className="mt-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.06em] text-muted text-pretty">
            Your actual file, composited at the real print size and position. What you see is what
            gets printed.
          </p>
        </div>

        {saved && <LifestylePanel design={saved} available={inspection.lifestyleAvailable} />}
      </div>

      <form onSubmit={submit} className="space-y-5 md:order-1" noValidate>
        <Card className="space-y-5 p-5">
          <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
            2 · What to print it on
          </h2>

          <div className="grid grid-cols-2 gap-2">
            {CUSTOM_PRODUCTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setProduct(option);
                  /* A sticker has no chest. Snapping back to a valid placement
                     avoids a state where the mockup has nowhere to draw. */
                  if (!inspection.pricing[option].apparel) setPlacement('centre-chest');
                }}
                aria-pressed={product === option}
                className={cn(
                  'border border-edge px-3 py-2 text-left transition-colors duration-[120ms]',
                  product === option
                    ? 'bg-pop text-on-pop'
                    : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
                )}
              >
                <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                  {inspection.pricing[option].label}
                </span>
                <span className="mt-0.5 block font-display text-sm tabular-nums">
                  {formatMoney(inspection.pricing[option].priceMinor)}
                </span>
              </button>
            ))}
          </div>

          <fieldset>
            <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              Colour
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {inspection.garments.map((entry) => {
                const suggested = inspection.analysis.suggestedGarments.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setGarment(entry.id)}
                    aria-pressed={garment === entry.id}
                    aria-label={`${entry.label}${suggested ? ' — recommended' : ''}`}
                    title={`${entry.label}${suggested ? ' — your design reads well on this' : ''}`}
                    className={cn(
                      'size-9 border border-edge transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5',
                      garment === entry.id && 'outline outline-2 outline-offset-2 outline-edge',
                      /* Colours Deck does not recommend stay selectable but are
                         dimmed — it is the buyer's shirt, not Deck's. */
                      !suggested && 'opacity-40',
                    )}
                    style={{ background: entry.hex }}
                  />
                );
              })}
            </div>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted">
              Dimmed colours will not show your design well
            </p>
          </fieldset>

          {apparel && (
            <>
              <fieldset>
                <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                  Placement
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CUSTOM_PLACEMENTS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPlacement(option)}
                      aria-pressed={placement === option}
                      className={cn(
                        'border border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
                        placement === option
                          ? 'bg-deep text-on-deep'
                          : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
                      )}
                    >
                      {PLACEMENT_LABELS[option]}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
                  Size
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {inspection.sizes.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSize(option)}
                      aria-pressed={size === option}
                      className={cn(
                        'min-w-11 border border-edge px-2 py-1 font-mono text-[11px] font-bold uppercase transition-colors duration-[120ms]',
                        size === option
                          ? 'bg-deep text-on-deep'
                          : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <label className="block">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
              Print size
            </span>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="mt-2 w-full accent-pop"
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
              {scale}% of the printable area
            </span>
          </label>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
            3 · Send it for approval
          </h2>

          {error && !error.fields.length && <InlineAlert>{error.message}</InlineAlert>}

          <Input
            label="Name this design"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={error?.fieldError('name')}
            maxLength={80}
            placeholder="Deck logo tee"
            hint="Just so you can find it again."
          />

          <div className="flex items-baseline justify-between gap-3 border border-edge bg-surface-2 px-3 py-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              Price
            </span>
            <span className="font-display text-lg">
              <Money minor={price} approxClassName="text-xs font-normal" />
            </span>
          </div>

          {saved ? (
            <div className="space-y-2">
              <p className="border border-edge bg-success px-3 py-2 font-mono text-[11px] font-bold uppercase text-ink">
                Sent — reference {saved.reference}
              </p>
              <p className="text-xs leading-relaxed text-muted text-pretty">
                Deck will look at it and come back to you. Nothing has been charged.
              </p>
            </div>
          ) : (
            <Button type="submit" className="w-full" loading={create.isPending}>
              Send for approval
            </Button>
          )}

          <p className="text-center font-mono text-[9px] uppercase leading-relaxed tracking-[0.06em] text-muted">
            Only upload artwork you have the right to print
          </p>
        </Card>
      </form>
    </div>
  );
}

/** Your own designs and where each one stands. */
function MyDesigns() {
  const { data: designs } = useMyDesigns();

  if (!designs || designs.length === 0) return null;

  return (
    <Card className="p-5">
      <h2 className="border-b border-edge pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
        Your designs
      </h2>
      <ul className="mt-3 space-y-2">
        {designs.map((design) => (
          <li key={design.id} className="flex items-center gap-3 border border-edge p-2">
            <img
              src={design.artworkUrl}
              alt=""
              className="size-10 shrink-0 border border-edge bg-bone object-contain p-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
                {design.name}
              </p>
              <p className="font-mono text-[9px] uppercase text-muted">
                {design.reference} · {relativeTime(design.createdAt)}
              </p>
            </div>
            <StatusChip status={design.status} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function StatusChip({ status }: { status: CustomDesign['status'] }) {
  const tone =
    status === 'approved'
      ? 'bg-success text-ink'
      : status === 'rejected'
        ? 'bg-edge text-canvas'
        : 'bg-surface-2 text-muted';

  return (
    <span
      className={cn(
        'shrink-0 border border-edge px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.06em]',
        tone,
      )}
    >
      {status === 'submitted' ? 'In review' : status}
    </span>
  );
}

/**
 * The AI-generated scene.
 *
 * Offered only once a design has been sent — a render costs a real API call, and
 * paying for one on artwork somebody is still nudging a slider on is money spent
 * on a draft.
 *
 * Labelled hard, and deliberately placed *below* the print proof rather than
 * beside it. The two images answer different questions and only one of them is
 * a promise about what will be manufactured; a reader who confuses the pretty
 * one for the accurate one is a complaint waiting to happen.
 */
function LifestylePanel({ design, available }: { design: CustomDesign; available: boolean }) {
  const render = useLifestyleRender();

  if (!available) return null;

  return (
    <div>
      <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
        Lifestyle shot
      </p>

      {design.lifestyleUrl ? (
        <>
          <img
            src={design.lifestyleUrl}
            alt={`A generated scene showing ${design.name}`}
            className="aspect-square w-full border border-edge object-cover"
          />
          <p className="mt-2 border border-edge bg-warning px-2.5 py-1.5 font-mono text-[9px] uppercase leading-relaxed tracking-[0.06em] text-ink text-pretty">
            Generated by AI for sharing. The garment and setting are invented — the print proof
            above is the accurate one.
          </p>
        </>
      ) : (
        <div className="border border-edge bg-surface-2 p-4">
          <p className="text-xs leading-relaxed text-muted text-pretty">
            Make a photo-style shot of this on a person, for your shop page or a post. Generated by
            AI, so the scene is invented — it is for sharing, not for approving the print.
          </p>

          {render.error && (
            <p role="alert" className="mt-2 font-mono text-[10px] uppercase text-red">
              {render.error instanceof RequestError
                ? render.error.message
                : 'That did not work'}
            </p>
          )}

          <Button
            size="sm"
            variant="secondary"
            className="mt-3 w-full"
            loading={render.isPending}
            onClick={() => render.mutate(design.reference)}
          >
            {render.isPending ? 'Generating — this takes a moment' : 'Generate lifestyle shot'}
          </Button>
        </div>
      )}
    </div>
  );
}
