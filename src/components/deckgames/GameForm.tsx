import { useState } from 'react';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { RequestError } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  GAME_GENRES,
  GAME_GENRE_LABELS,
  type GameDetail,
  type GameDraft,
  type GameGenre,
  type GameOrientation,
} from '@/types';
import { GButton, GInput, GNotice, GSelect, GTextarea } from './ui';

/**
 * Registering a game, or editing what was registered.
 *
 * The orientation picker is drawn, not listed: three small screens, upright,
 * sideways and square, because "which way do people hold this?" is easier to
 * answer looking at a phone than reading a word.
 */
const ORIENTATIONS: { value: GameOrientation; label: string; blurb: string; shape: string }[] = [
  { value: 'portrait', label: 'Portrait', blurb: 'Held upright, one thumb', shape: 'h-14 w-8' },
  { value: 'landscape', label: 'Landscape', blurb: 'Held sideways, two hands', shape: 'h-8 w-14' },
  { value: 'both', label: 'Either way', blurb: 'Reflows to any screen', shape: 'size-10' },
];

export function GameForm({
  game,
  submitting,
  error,
  onSubmit,
  submitLabel,
  frozen,
  listingOnly,
}: {
  game?: GameDetail;
  submitting: boolean;
  error: unknown;
  onSubmit: (draft: GameDraft) => void;
  submitLabel: string;
  /** Approved games keep their address and write-up; see the API. */
  frozen?: boolean;
  /** Leave out orientation and the SDK switch — Settings has its own. */
  listingOnly?: boolean;
}) {
  const [form, setForm] = useState({
    title: game?.title ?? '',
    tagline: game?.tagline ?? '',
    description: game?.description ?? '',
    genre: (game?.genre ?? 'arcade') as GameGenre,
    coverUrl: game?.coverUrl ?? '',
    playUrl: game?.playUrl ?? '',
    orientation: (game?.orientation ?? 'landscape') as GameOrientation,
    sdk: game?.sdk ?? true,
    studio: game?.studio ?? '',
  });

  const failure = error instanceof RequestError ? error : null;
  const field = (name: string) => failure?.fieldError(name);
  const set =
    (key: 'title' | 'tagline' | 'description' | 'playUrl' | 'studio') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title: form.title.trim(),
          tagline: form.tagline.trim(),
          description: form.description.trim(),
          genre: form.genre,
          coverUrl: form.coverUrl || undefined,
          playUrl: form.playUrl.trim(),
          ...(listingOnly ? {} : { orientation: form.orientation, sdk: form.sdk }),
          studio: form.studio.trim() || undefined,
        });
      }}
      className="space-y-6"
    >
      {failure && !failure.fields.length && <GNotice tone="error">{failure.message}</GNotice>}
      {frozen && (
        <GNotice>
          This game is live, so its name, address and write-up are locked to what was reviewed. Ask
          Deck to take it down if they need to change. Orientation, the SDK and your test build can
          still be changed above.
        </GNotice>
      )}

      <fieldset disabled={frozen} className="space-y-6 disabled:opacity-60">
        <div className="grid gap-5 sm:grid-cols-2">
          <GInput
            label="Title"
            value={form.title}
            onChange={set('title')}
            maxLength={80}
            error={field('title')}
            required
          />
          <GInput
            label="Studio (optional)"
            value={form.studio}
            onChange={set('studio')}
            maxLength={60}
            hint="Shown as the maker. Leave blank to use your name."
          />
        </div>
        <GInput
          label="Tagline"
          value={form.tagline}
          onChange={set('tagline')}
          maxLength={140}
          error={field('tagline')}
          hint="One line on what it is."
          required
        />
        <GTextarea
          label="Description"
          value={form.description}
          onChange={set('description')}
          maxLength={4000}
          rows={5}
          error={field('description')}
          hint="How it plays and what makes it yours. Blank lines start new paragraphs."
          required
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <GSelect
            label="Genre"
            value={form.genre}
            onChange={(event) =>
              setForm((current) => ({ ...current, genre: event.target.value as GameGenre }))
            }
          >
            {GAME_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {GAME_GENRE_LABELS[genre]}
              </option>
            ))}
          </GSelect>
          <GInput
            label="Game URL"
            type="url"
            inputMode="url"
            placeholder="https://play.yourstudio.com/game"
            value={form.playUrl}
            onChange={set('playUrl')}
            error={field('playUrl')}
            hint="Where the live build is served, over https, on your own domain."
            required
          />
        </div>

        <ImageUpload
          label="Cover"
          hint="Wide works best. Shown in the library and behind the player."
          value={form.coverUrl ? [form.coverUrl] : []}
          onChange={(urls) => setForm((current) => ({ ...current, coverUrl: urls[0] ?? '' }))}
          error={field('coverUrl')}
        />
      </fieldset>

      {!listingOnly && (
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium tracking-[-0.01em]">
            How is it played?
          </legend>
          <div className="grid grid-cols-3 gap-3">
            {ORIENTATIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-4 text-center transition-colors duration-300',
                  form.orientation === option.value
                    ? 'border-g-ink bg-g-paper-2'
                    : 'border-g-line hover:border-g-mute',
                )}
              >
                <input
                  type="radio"
                  name="orientation"
                  value={option.value}
                  checked={form.orientation === option.value}
                  onChange={() => setForm((current) => ({ ...current, orientation: option.value }))}
                  className="sr-only"
                />
                <span className="grid h-16 place-items-center">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'rounded-[6px] border-2 transition-colors',
                      option.shape,
                      form.orientation === option.value
                        ? 'border-g-ember bg-g-ember/10'
                        : 'border-g-mute',
                    )}
                  />
                </span>
                <span>
                  <span className="block text-[13px] font-medium">{option.label}</span>
                  <span className="block text-[11px] text-g-mute">{option.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {!listingOnly && (
        <label className="flex items-start gap-3 rounded-2xl bg-g-paper-2 p-4">
          <input
            type="checkbox"
            checked={form.sdk}
            onChange={(event) => setForm((current) => ({ ...current, sdk: event.target.checked }))}
            className="mt-1 size-4 accent-[var(--g-ember)]"
          />
          <span>
            <span className="block text-[13px] font-medium">It uses the Deck Games SDK</span>
            <span className="block text-[12px] leading-relaxed text-g-mute">
              Sign-in, purchases, scores and leaderboards through Deck. Untick if your game is just
              a game with no store.
            </span>
          </span>
        </label>
      )}

      {!frozen && (
        <GButton type="submit" loading={submitting}>
          {submitLabel}
        </GButton>
      )}
    </form>
  );
}
