import { useState } from 'react';
/* Loaded here rather than in index.css because the heading split below is a
   proposal, not the system. If it is adopted the import moves to index.css; if
   it is rejected this line and the dependency both go. 24KB latin subset. */
import '@fontsource-variable/space-grotesk';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CharCount, Input, Select, Textarea } from '@/components/ui/Field';
import { Star } from '@/components/ui/Star';
import { Stars } from '@/components/ui/Stars';
import { applyFontset, readFontset, type Fontset } from '@/lib/fontset';
import {
  ACTIVE_PALETTE,
  PALETTE_IDS,
  PALETTES,
  type PaletteId,
} from '@/lib/palettes.generated';
import { cn } from '@/lib/utils';

/**
 * The design system on one page, with every palette switchable live.
 *
 * This page exists because of a specific failure. Deck went through five full
 * palette sweeps during its build, two of which were reverted, and every one
 * was evaluated the same expensive way: apply it to fifty-odd files, look at
 * the running site, decide. Judging a palette takes seconds. Implementing one
 * took an afternoon. We were paying the implementation cost purely to generate
 * something to look at.
 *
 * So: change four values in design/tokens.json, open this page, decide. The
 * switcher below sets `data-palette` on the wrapper, and because every utility
 * compiles to `var(--color-pop)` and friends, a scoped override re-colours the
 * entire subtree with no rebuild. That single fact is what makes comparing four
 * complete directions cheap.
 *
 * Deliberately not linked from the nav. It is a workbench, not a page.
 */


/**
 * Fake launches whose logo colours are chosen to fight.
 *
 * The hardest constraint on Deck's palette is not stated anywhere in the CSS:
 * the page fills up with strangers' logos in colours nobody vetted. A palette
 * that looks composed against Deck's own screenshots can still fall apart the
 * first time somebody launches a hot pink product. These six are picked to be
 * maximally awkward — a warm red, a magenta, a saturated teal, an orange, a
 * navy and a yellow — so the clash shows up here rather than in production.
 */
const CLASH = [
  { name: 'Vermilion', logo: '#e4342a', mark: '#ffffff' },
  { name: 'Fuchsia Labs', logo: '#d81b8c', mark: '#ffffff' },
  { name: 'Teal Systems', logo: '#0f9b8e', mark: '#ffffff' },
  { name: 'Sunburst', logo: '#f5820b', mark: '#111111' },
  { name: 'Navy Compute', logo: '#1b3a8f', mark: '#ffffff' },
  { name: 'Highlighter', logo: '#f2e211', mark: '#111111' },
];

export function Styleguide() {
  const [palette, setPalette] = useState<PaletteId>(ACTIVE_PALETTE);
  /* Read once, lazily. `main.tsx` has already put the attribute on <html>, so
     this is only catching up the button's own label. */
  const [fontset, setFontset] = useState<Fontset>(readFontset);
  /* Both themes render side by side rather than behind a toggle. Half the
     contrast bugs this project shipped were "fine in the theme I was looking
     at" — seeing them together makes that class of mistake impossible to miss. */
  const active = PALETTES[palette];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="mb-3 inline-block border border-edge bg-deep px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-on-deep">
          Workbench
        </p>
        <h1 className="display-tight text-3xl uppercase sm:text-4xl">Style&nbsp;guide</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted text-pretty">
          Every token and component, both themes at once, with the palette switchable live. Judge
          a direction here before it touches the product. The rules are in{' '}
          <code className="border border-edge bg-surface-2 px-1 py-0.5 font-mono text-[11px]">
            design/CONTRACT.md
          </code>
          .
        </p>
      </header>

      {/* --------------------------------------------------------- switcher */}
      <div className="sticky top-16 z-20 mb-10 border border-edge bg-surface p-4 shadow-hard">
        <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Palette direction
        </p>
        <div className="flex flex-wrap gap-2">
          {PALETTE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPalette(id)}
              aria-pressed={palette === id}
              className={cn(
                'border border-edge px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-transform duration-[120ms] ease-[var(--ease-snap)]',
                palette === id
                  ? 'bg-pop text-on-pop shadow-hard-sm'
                  : 'bg-surface text-muted hover:-translate-y-0.5 hover:text-body',
              )}
            >
              {PALETTES[id].label}
              {id === ACTIVE_PALETTE && ' ·  live'}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted text-pretty">
          {active.note}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
          To ship one: set <span className="text-body">active</span> in design/tokens.json, then{' '}
          <span className="text-body">npm run tokens &amp;&amp; npm run check:contrast</span>
        </p>
      </div>

      <FontsetSwitch
        fontset={fontset}
        onChange={(next) => {
          applyFontset(next);
          setFontset(next);
        }}
      />

      <DisplayFaceSplit />

      <TypeSplit />

      {/* Every theme pane below scopes the chosen palette AND its own theme, so
          the two render independently on one page. */}
      <div className="space-y-10">
        <TwoUp palette={palette}>
          <Section title="Blocks">
            <div className="grid grid-cols-2 gap-3">
              <Swatch className="bg-pop text-on-pop" label="pop / on-pop" />
              <Swatch className="bg-deep text-on-deep" label="deep / on-deep" />
              <Swatch className="bg-pop-hover text-on-pop" label="pop-hover" />
              <Swatch className="bg-deep-hover text-on-deep" label="deep-hover" />
            </div>
          </Section>

          <Section title="Neutrals — the content layer">
            <div className="grid grid-cols-2 gap-3">
              <Swatch className="bg-surface text-body" label="surface" />
              <Swatch className="bg-surface-2 text-body" label="surface-2" />
              <Swatch className="bg-grey-soft text-ink" label="grey-soft" />
              <Swatch className="bg-grey text-ink" label="grey" />
              <Swatch className="bg-ink text-bone" label="ink" />
              <Swatch className="bg-edge text-canvas" label="edge / inverted error" />
            </div>
          </Section>

          <Section title="Status — three, and only three">
            <div className="grid grid-cols-3 gap-3">
              <Swatch className="bg-success text-ink" label="success" />
              <Swatch className="bg-danger text-bone" label="danger" />
              <Swatch className="bg-warning text-ink" label="warning" />
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted text-pretty">
              Semantic, never decorative, and never alone — each is always beside a word. See
              CONTRACT rule 6.
            </p>
          </Section>

          <Section title="Marks — themed, never fixed">
            <div className="space-y-2.5">
              <p className="text-sm">
                Body copy with{' '}
                <a href="#top" className="font-bold text-accent underline underline-offset-2">
                  an accent link
                </a>{' '}
                inside it, and <span className="text-muted">muted secondary text</span>.
              </p>
              <div className="h-5 w-full overflow-hidden border border-edge bg-surface-2">
                <div className="h-full w-[62%] bg-accent" />
              </div>
              <input
                className="w-full border border-accent bg-surface px-3 py-2 text-sm"
                defaultValue="Input with an accent focus border"
                readOnly
              />
            </div>
          </Section>

          <Section title="Buttons">
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Primary</Button>
              <Button variant="secondary" size="sm">
                Secondary
              </Button>
              <Button variant="accent" size="sm">
                Accent
              </Button>
              <Button variant="ghost" size="sm">
                Ghost
              </Button>
              <Button variant="danger" size="sm">
                Danger
              </Button>
              <Button size="sm" loading>
                Loading
              </Button>
              <Button size="sm" disabled>
                Disabled
              </Button>
            </div>
          </Section>

          <Section title="Chips">
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="pop">Pop</Badge>
              <Badge tone="deep">Deep</Badge>
              <Badge tone="invert">Invert</Badge>
              <Badge tone="outline">Outline</Badge>
              <Stars value={4} size="md" />
            </div>
          </Section>

          <Section title="Stars">
            <p className="mb-3 text-xs leading-relaxed text-muted text-pretty">
              From the neobrutalism.dev set. Filled, not stroked, so they hold at 12px in the
              navbar and at 80px on a page, and they take <code>currentColor</code> like every
              other mark — a star inherits whatever it sits on and inverts with the theme.
              <strong className="text-body"> Sparkle</strong> is the &ldquo;new&rdquo; marker;
              it is the one on Future Gen.
            </p>
            <div className="flex flex-wrap items-end gap-5">
              {(['sparkle', 'glint', 'burst', 'classic', 'seal', 'token'] as const).map((name) => (
                <div key={name} className="text-center">
                  <Star name={name} className="size-10 text-accent" spin={-8} />
                  <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Fields">
            <div className="space-y-3">
              <Input label="Product name" defaultValue="Lumen 3" counter={<CharCount value="Lumen 3" max={70} />} />
              <Select
                label="Category"
                options={[{ value: 'ai-model', label: 'AI Model' }]}
                defaultValue="ai-model"
              />
              <Textarea label="With an error" rows={2} error="Something needs your attention" />
            </div>
          </Section>

          <Section title="Logo clash — the real test">
            <p className="mb-3 text-xs leading-relaxed text-muted text-pretty">
              Six launches whose logos were chosen to fight each other and the palette. If a
              direction fails, it fails here first.
            </p>
            <div className="space-y-2">
              {CLASH.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-3 rounded-slab border border-edge bg-surface p-3 shadow-hard-sm"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-10 shrink-0 items-center justify-center border border-edge font-display text-sm uppercase"
                    style={{ background: item.logo, color: item.mark }}
                  >
                    {item.name.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] uppercase">
                      {item.name}
                    </span>
                    <span className="block truncate font-mono text-[10px] uppercase text-muted">
                      Developer tool · Free
                    </span>
                  </span>
                  <Badge tone="pop">★ Pick</Badge>
                  <span className="flex h-11 w-10 shrink-0 flex-col items-center justify-center border border-edge bg-surface font-mono text-muted">
                    <span aria-hidden="true" className="text-[9px]">
                      ▲
                    </span>
                    <span className="text-xs font-bold tabular-nums">42</span>
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Cards and inversion">
            <div className="space-y-3">
              <Card className="p-4">
                <h3 className="font-display text-sm uppercase">A surface card</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Neutral, because a product will sit on it.
                </p>
              </Card>
              <p className="border border-edge bg-edge px-3 py-2 font-mono text-[11px] font-bold uppercase text-canvas">
                Errors are inversion, not a hue
              </p>
            </div>
          </Section>
        </TwoUp>
      </div>
    </div>
  );
}

const ARCHIVO = "'Archivo Black', 'Helvetica Neue', Impact, sans-serif";
const GROTESK = "'Space Grotesk Variable', 'Space Grotesk', sans-serif";

/**
 * Archivo Black against Geist Black, at the sizes Deck actually sets headings.
 *
 * The question is not "which is nicer at 72px" — it is whether one family can
 * carry both roles, because if it can, Archivo Black's 47KB and a whole second
 * typeface come out of the system. Geist already ships a `100 900` axis for
 * body copy, so 900 costs nothing new.
 *
 * Everything except family and weight is held constant: same uppercase, same
 * tracking, same sizes. Two rows matter more than the rest — card titles at
 * 13px and nav at 12px are where Deck spends its headings, dozens per page, and
 * that is where a heavy grotesk usually gives up. Archivo Black was drawn as a
 * display face and holds its counters when small; Geist at 900 is a text face
 * pushed to its limit, and its bowls can fill in.
 */
const GEIST = "'Geist Variable', -apple-system, sans-serif";

function DisplayFaceSplit() {
  return (
    <section className="mb-10">
      <h2 className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
        Proposal — Geist Black instead of Archivo Black
      </h2>
      <p className="mb-4 max-w-2xl text-xs leading-relaxed text-muted text-pretty">
        Left is the system as built. Right sets every heading in Geist at 900 — the same family
        as body copy, one weight apart. If it holds, Deck drops a typeface and Archivo Black
        comes out of the bundle. Judge the bottom two rows: 13px card titles and 12px nav are
        where a text face pushed to Black usually loses its counters.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <FaceColumn
          label="Now — two families"
          note="Archivo Black 400 · +47KB"
          family={ARCHIVO}
          weight={400}
        />
        <FaceColumn
          label="Proposed — one family"
          note="Geist Variable 900 · no new file"
          family={GEIST}
          weight={900}
        />
      </div>
    </section>
  );
}

function FaceColumn({
  label,
  note,
  family,
  weight,
}: {
  label: string;
  note: string;
  family: string;
  weight: number;
}) {
  const head = { fontFamily: family, fontWeight: weight };

  return (
    <div className="rounded-slab border border-edge bg-surface shadow-hard">
      <div className="border-b border-edge bg-surface-2 px-4 py-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{label}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-muted">
          {note}
        </p>
      </div>

      <div className="divide-y divide-edge">
        <Row tier="h1 · hero · 44px">
          <p
            style={{ ...head, lineHeight: 0.95, letterSpacing: '-0.03em' }}
            className="text-[44px] uppercase"
          >
            First fans
          </p>
        </Row>

        <Row tier="h2 · section · 20px">
          <p style={{ ...head, letterSpacing: '-0.02em' }} className="text-[20px] uppercase">
            Launching today
          </p>
        </Row>

        {/* The crux. Deck renders this shape dozens of times per page. */}
        <Row tier="h3 · card title · 13px">
          <div className="space-y-2">
            {['Lumen 3', 'Standup Scribe', 'Changelog Cartographer'].map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 border border-edge bg-canvas p-2.5"
              >
                <span className="size-8 shrink-0 border border-edge bg-grey-soft" />
                <span className="min-w-0">
                  <span style={head} className="block truncate text-[13px] uppercase">
                    {name}
                  </span>
                  <span className="block truncate font-mono text-[10px] uppercase text-muted">
                    AI model · Open source
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Row>

        {/* Deck's nav is Geist Mono, not the display face — a nav row here
            would test something the site does not do. Scores and counts are
            the real small use: leaderboards, game HUDs, vote tallies. */}
        <Row tier="figures · 14px">
          <div className="flex flex-wrap items-baseline gap-5">
            {[
              ['1st', '12,480'],
              ['2nd', '9,015'],
              ['3rd', '7,604'],
            ].map(([place, score]) => (
              <span key={place} className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] uppercase text-muted">{place}</span>
                <span style={head} className="text-[14px] tabular-nums">
                  {score}
                </span>
              </span>
            ))}
          </div>
        </Row>

        {/* Counters and diagonals are where a text face at 900 gives itself
            away: the eye of an R, the join of a K, the aperture of an S. */}
        <Row tier="counters · 28px">
          <p style={{ ...head, letterSpacing: '-0.02em' }} className="text-[28px] uppercase">
            REGS 8 &amp; 0 · @#%
          </p>
        </Row>
      </div>
    </div>
  );
}

/**
 * The site-wide heading-face preview.
 *
 * Unlike every other control on this page, this one leaves the workbench: it
 * sets an attribute on `<html>` and persists it, so the rest of Deck is
 * re-lettered until it is switched back. That is deliberate — a typeface is
 * judged on a launch card and a nav bar, not on a specimen sheet, and the only
 * honest preview is one you can walk around in.
 *
 * It is loud about being a preview because a persisted global that changes how
 * the whole site looks is exactly the kind of switch somebody flips, forgets,
 * and then reports as a bug three days later.
 */
function FontsetSwitch({
  fontset,
  onChange,
}: {
  fontset: Fontset;
  onChange: (next: Fontset) => void;
}) {
  const options: { id: Fontset; label: string; note: string }[] = [
    { id: 'deck', label: 'Archivo Black', note: '400 · a second family' },
    { id: 'geist-black', label: 'Geist Black', note: '900 · one family, no extra file' },
    { id: 'sukhumvit', label: 'Sukhumvit Set', note: '700 · humanist · macOS only' },
  ];

  /*
   * Whether this machine actually has Sukhumvit Set.
   *
   * Worth checking rather than assuming, because it is the one option here that
   * is not shipped with the site: on anything but a Mac the button would still
   * highlight, the page would still change, and what you would be looking at is
   * Geist wearing Sukhumvit's label. Read once at first render — a system face
   * needs no loading, so the answer is immediate and does not change.
   */
  const [hasSukhumvit] = useState(() => {
    try {
      return document.fonts.check('700 16px "Sukhumvit Set"');
    } catch {
      /* No `document.fonts` is not the same as no font. Saying nothing beats
         claiming it is missing on the strength of a failed feature probe. */
      return true;
    }
  });

  return (
    <div className="mb-10 rounded-slab border border-edge bg-surface p-4 shadow-hard">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Heading face — previews across the whole site
        </p>
        {fontset !== 'deck' && (
          <span className="border border-edge bg-pop px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-on-pop">
            Preview active
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={fontset === option.id}
            className={cn(
              'border border-edge px-3 py-2 text-left transition-transform duration-[120ms] ease-[var(--ease-snap)]',
              fontset === option.id
                ? 'bg-pop text-on-pop shadow-hard-sm'
                : 'bg-surface text-muted hover:-translate-y-0.5 hover:text-body',
            )}
          >
            <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.06em]">
              {option.label}
              {option.id === 'deck' && ' ·  built'}
            </span>
            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.04em] opacity-75">
              {option.note}
            </span>
            {option.id === 'sukhumvit' && !hasSukhumvit && (
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.04em] text-danger">
                Not on this machine — you would be seeing Geist
              </span>
            )}
          </button>
        ))}
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted text-pretty">
        This one does not stay on the workbench. It re-points{' '}
        <code className="border border-edge bg-surface-2 px-1 py-0.5 font-mono text-[11px]">
          --font-display
        </code>{' '}
        on the document and remembers the choice, so every page you visit stays in the chosen
        face until you come back and switch it off. Case, tracking and sizes are held
        constant — only the family and the weight move, because a comparison that changes four
        things at once answers nothing.
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.06em] text-muted">
        Nothing is written to the codebase. One attribute on &lt;html&gt;, one localStorage key.
      </p>
    </div>
  );
}

/**
 * Display face versus heading face, at the sizes where the difference decides it.
 *
 * Deck sets h1 through h4 in Archivo Black. That is one face doing two jobs the
 * guide treats as separate roles: *display* (hero statements, brand moments —
 * maximum weight, meant to dominate) and *heading* (section headers, card
 * titles, navigation — read at 12–20px, dozens per page).
 *
 * Archivo Black is a single-weight heavy grotesque. At 48px that is the whole
 * point. At 13px, uppercase, repeated down a list of launches, it is a lot of
 * black in a small space and the letterforms start to close up — which is
 * exactly the size Deck uses it at most often.
 *
 * The comparison is rendered at true sizes rather than as specimens, because
 * "does this work" is a question about card titles in a list, not about the
 * alphabet at 72px.
 */
function TypeSplit() {
  return (
    <section className="mb-10">
      <h2 className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
        Proposal — split display from heading
      </h2>
      <p className="mb-4 max-w-2xl text-xs leading-relaxed text-muted text-pretty">
        Left is the system as built: Archivo Black for every heading level. Right keeps Archivo
        Black for the display role only — h1, hero statements, the wordmark — and hands every
        other heading to Space Grotesk 700. Judge the bottom two rows: card titles and
        navigation are where Deck actually spends its headings, dozens per page.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <TypeColumn
          label="Now — one face"
          note="Archivo Black, h1–h4"
          display={ARCHIVO}
          heading={ARCHIVO}
        />
        <TypeColumn
          label="Proposed — two roles"
          note="Archivo Black display · Space Grotesk 700 heading"
          display={ARCHIVO}
          heading={GROTESK}
          headingWeight={700}
        />
      </div>
    </section>
  );
}

function TypeColumn({
  label,
  note,
  display,
  heading,
  headingWeight = 400,
}: {
  label: string;
  note: string;
  display: string;
  heading: string;
  headingWeight?: number;
}) {
  const head = { fontFamily: heading, fontWeight: headingWeight };

  return (
    <div className="rounded-slab border border-edge bg-surface shadow-hard">
      <div className="border-b border-edge bg-surface-2 px-4 py-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">{label}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.04em] text-muted">
          {note}
        </p>
      </div>

      <div className="divide-y divide-edge">
        <Row tier="h1 · hero · 44px">
          <p
            style={{ fontFamily: display, lineHeight: 0.95, letterSpacing: '-0.03em' }}
            className="text-[44px] uppercase"
          >
            First fans
          </p>
        </Row>

        <Row tier="h2 · section · 20px">
          <p style={{ ...head, letterSpacing: '-0.02em' }} className="text-[20px] uppercase">
            Launching today
          </p>
        </Row>

        {/* The crux. Deck renders this shape dozens of times per page. */}
        <Row tier="h3 · card title · 13px">
          <div className="space-y-2">
            {['Lumen 3', 'Standup Scribe', 'Changelog Cartographer'].map((name) => (
              <div
                key={name}
                className="flex items-center gap-3 border border-edge bg-canvas p-2.5"
              >
                <span className="size-8 shrink-0 border border-edge bg-grey-soft" />
                <span className="min-w-0">
                  <span style={head} className="block truncate text-[13px] uppercase">
                    {name}
                  </span>
                  <span className="block truncate font-mono text-[10px] uppercase text-muted">
                    AI model · Open source
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Row>

        <Row tier="nav · 12px">
          <nav className="flex flex-wrap gap-4">
            {['Home', 'Discover', 'Picks', 'Board', 'Shop'].map((item) => (
              <span key={item} style={head} className="text-[12px] uppercase tracking-[0.04em]">
                {item}
              </span>
            ))}
          </nav>
        </Row>
      </div>
    </div>
  );
}

function Row({ tier, children }: { tier: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{tier}</p>
      {children}
    </div>
  );
}

/** One block of content rendered twice — light beside dark. */
function TwoUp({ palette, children }: { palette: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {(['light', 'dark'] as const).map((theme) => (
        <div
          key={theme}
          data-palette={palette}
          /* `.dark` here rather than on <html>: the variant is defined as
             `&:where(.dark, .dark *)`, so a wrapper flips only its subtree and
             both themes can coexist on one page. */
          className={cn(
            'overflow-hidden rounded-slab border border-edge bg-canvas',
            theme === 'dark' && 'dark',
          )}
        >
          <p className="border-b border-edge bg-surface-2 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-body">
            {theme}
          </p>
          <div className="space-y-7 p-4 text-body">{children}</div>
        </div>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-edge pb-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-body">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div
      className={cn(
        'flex min-h-14 items-end border border-edge px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase',
        className,
      )}
    >
      {label}
    </div>
  );
}
