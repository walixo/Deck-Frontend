import { useId } from 'react';
import { swatchFromHex } from '@/lib/dominantColour';
import { cn } from '@/lib/utils';

/**
 * A starting set, so the common case is one click rather than a colour dialog.
 *
 * Chosen to span the wheel rather than to match Deck's palette: this is the
 * content layer, where the colour belongs to the product and Deck's accent has
 * no business turning up. Nine covers the hues people reach for without turning
 * the picker into a paint chart — anything more specific is what the hex field
 * below it is for.
 */
const PRESETS = [
  '#b8a9fa',
  '#7c5cff',
  '#2f6df6',
  '#00a5a5',
  '#2f9e44',
  '#c9d92a',
  '#ffa552',
  '#e8590c',
  '#d6336c',
];

interface WallColourPickerProps {
  /** The chosen hex, or '' for "sample my logo". */
  value: string;
  onChange: (value: string) => void;
  /** The launch's logo, so the auto option can show what it would produce. */
  logoUrl?: string;
  error?: string;
}

/**
 * Lets a maker choose the colour their launch takes on the launch wall.
 *
 * The wall used to decide this for them by sampling the logo, which is a good
 * guess and still the default — but it is a guess, and it is wrong in the two
 * cases makers care most about: a logo that is mostly one colour the brand does
 * not actually lead with, and a greyscale mark that falls back to a neutral
 * panel indistinguishable from the launch beside it.
 *
 * Everything picked here runs through the same contrast pass as a sampled
 * colour, so the preview is honest: what it shows is what the wall renders,
 * including the nudge if the chosen colour cannot carry a 10px label at 4.5:1.
 * A maker seeing their pick shift slightly is the correct outcome — better than
 * shipping an unreadable panel, and better than refusing the colour outright.
 */
export function WallColourPicker({ value, onChange, logoUrl, error }: WallColourPickerProps) {
  const inputId = useId();
  const swatch = swatchFromHex(value);
  const auto = value === '';

  return (
    <fieldset>
      <legend className="font-mono text-[11px] font-bold uppercase tracking-[0.1em]">
        Launch wall colour
      </legend>
      <p className="mt-1.5 text-xs leading-relaxed text-muted text-pretty">
        The colour of your panel on the wall on Deck's home page. Leave it on Auto and Deck takes
        the strongest colour out of your logo.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange('')}
          aria-pressed={auto}
          className={cn(
            'border-2 border-edge px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.06em] transition-colors duration-[120ms]',
            auto ? 'bg-pop text-on-pop' : 'bg-surface text-muted hover:bg-surface-2 hover:text-body',
          )}
        >
          Auto
        </button>

        {PRESETS.map((preset) => {
          const active = value.toLowerCase() === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              aria-pressed={active}
              aria-label={`Use ${preset}`}
              /* The swatch IS the label, so the selected state cannot be shown
                 with a fill the way the Auto chip is — it would repaint the
                 thing being chosen. A ring outside the border says "this one"
                 without touching the colour. */
              className={cn(
                'size-8 border-2 border-edge transition-transform duration-[120ms] ease-[var(--ease-snap)] hover:-translate-y-0.5',
                active && 'outline outline-2 outline-offset-2 outline-edge',
              )}
              style={{ background: preset }}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor={inputId}
            className="block font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted"
          >
            Or a hex
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(event) => {
              const next = event.target.value.trim().toLowerCase();
              /* Typed a bare six digits — accept it. Makers paste hexes out of
                 Figma both ways and refusing one of them is pure friction. */
              onChange(/^[0-9a-f]{6}$/.test(next) ? `#${next}` : next);
            }}
            placeholder="#b8a9fa"
            spellCheck={false}
            maxLength={7}
            aria-invalid={Boolean(error) || undefined}
            className="mt-1 h-10 w-32 border-2 border-edge bg-surface px-3 font-mono text-[12px] font-bold uppercase tracking-[0.06em] placeholder:text-muted/70 focus:border-accent focus:outline-none"
          />
        </div>

        {/* The preview, as the wall would actually draw it: the adjusted fill,
            its companion tone, and a label in the ink that pairs with it. */}
        <div
          aria-hidden="true"
          className="flex h-10 min-w-36 items-center gap-2 border-2 border-edge px-3"
          style={
            swatch
              ? {
                  background: `linear-gradient(135deg, ${swatch.hex}, ${swatch.gradientTo})`,
                  color: swatch.ink,
                }
              : undefined
          }
        >
          {swatch ? (
            <>
              {logoUrl && (
                <img src={logoUrl} alt="" className="size-6 border border-current bg-bone object-contain p-0.5" />
              )}
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em]">
                Preview
              </span>
            </>
          ) : (
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
              {auto ? 'Sampled from your logo' : 'Not a hex yet'}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-2 font-mono text-[11px] font-bold uppercase text-red">
          {error}
        </p>
      )}
    </fieldset>
  );
}
