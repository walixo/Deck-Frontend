# Deck's design contract

Rules a palette must satisfy **before** anyone edits a component.

This file exists because Deck went through five full palette sweeps in one
build — cobalt, lavender+amber, violet, back to lavender+amber, lime+slate —
and each was evaluated by shipping it to fifty-odd files and then looking. Two
of those five were reverted. None of them failed for a reason that needed the
whole codebase to discover; every one could have been settled in a minute
against the rules below.

Check a proposal here first. Then look at it on `/styleguide`. Only then touch
code.

---

## 1. The content layer is neutral. Accents live in the chrome.

Deck's pages are mostly **other people's logos, in whatever colours those
people chose**. Every surface a product sits on or beside must be greyscale:

- launch cards, merch cards, cart rows
- logo monograms and avatars
- launch-wall panels
- profile and spotlight bars

Accents are permitted only on **chrome and interaction**: primary buttons,
active filter pills, the vote control, focus rings, rank medals, status chips,
page eyebrows.

The test: *would this colour ever land next to a logo it did not choose?* If
yes, it is neutral.

> Neubrutalism's own guidance agrees — "don't let every component compete at
> maximum saturation." A launch board has a harder version of that problem than
> most sites, because the competing colour arrives from strangers.

## 2. Every pair clears WCAG, on both canvases.

- Body text: **4.5:1**
- Non-text marks — focus rings, borders that carry meaning, progress fills,
  icons: **3:1**

Enforced by `npm run check:contrast`, which runs every pair in every palette
against both the light and dark canvas. It is not advisory; it exits non-zero.

Two real bugs it now catches for free: `text-lavender` links at **1.87:1** on
the light canvas, and a fundraise progress bar at **1.40:1** against its own
track.

## 3. Blocks are fixed. Marks are themed.

- **Blocks** (`pop`, `deep`) are identical in both themes. A filled panel
  brings its own background *and* its own text, so it does not care what the
  page behind it is doing. Each carries its partner: `bg-pop text-on-pop`.
- **Marks** (`accent`) are themed, and must be. No single colour clears 4.5:1
  against both `#FAF9F5` and `#151515` — light demands a luminance under 0.17,
  dark demands over 0.20. The arithmetic forbids it.

Corollary: detail drawn *inside* a block (illustration marks, mascot eyes)
takes the partner colour, never `--edge`. `--edge` flips with the theme while
the block does not, so an edge-coloured mark inside a block is guaranteed to
vanish in one theme or the other.

## 4. Name by role, never by hue.

`pop`, `deep`, `on-pop`, `on-deep`, `accent`. Never `lime`, `slate`, `amber`.

A component written as `bg-lime` is wrong the moment the palette changes, and
that wrongness is invisible — the class still compiles, it just renders the
wrong intent. Role names are also what let `/styleguide` swap the entire system
live, which is the only reason evaluating a palette is now cheap.

## 5. It has to survive greyscale.

If two states are distinguishable only by hue, they are not distinguishable.
Every filled block also carries a 2px border, and every status chip carries a
word. Rank, state and category must all still read with the colour removed.

## 6. Status has three colours, and only three.

This rule used to say status had *none* — that anything wrong was shown by
inversion (`bg-edge` with `text-canvas`) and Deck spent no hue on it. That held
while the only states were "fine" and "broken". It stopped holding once there
were outcomes a reader has to tell apart at a glance and act on differently:
a raise that was approved, a button that destroys something, a field that needs
another look.

So there are now exactly three, and they are semantic — they mean a state, never
a brand:

| Token | Value | Means | Carries |
|---|---|---|---|
| `success` | `#2F9E44` | done, approved, live | ink at 5.5:1 |
| `danger` | `#C92A2A` | destructive, refused, failed | bone at 5.2:1 |
| `warning` | `#FCC419` | needs another look, not yet wrong | ink at 11.7:1 |

Three constraints keep this from becoming a fourth palette:

1. **They never appear as decoration.** No status colour is a background for a
   card, a heading, a nav item or anything a product sits beside. Rule 1 still
   applies to them in full.
2. **They never carry meaning alone.** Every one is accompanied by a word —
   "Approved", "Delete", the error text itself. Rule 5 still applies: remove the
   colour and the state must still read.
3. **Inversion is still the fallback** for anything that has no defined status,
   and it is still how a form's invalid *field* is marked. The message beside it
   is `warning`; the field itself is not.

`success` is the only green that clears 3:1 against **both** canvases, which is
why it is the darker of the candidates. `warning` is 1.5:1 against the light
canvas and that is fine — it is a filled block with a 2px border, which is how
every block in this system separates itself, and it is never used as a mark.

---

## Exemptions

Standing, and deliberate:

- **Badge tones** (`badge-*`). Fifteen achievements in two colours read as a
  spreadsheet; a badge has to be recognisable before you have read its name.
  They live on profile pages, not beside product logos, so rule 1 does not
  bite. Every one takes ink at 9:1 or better.
- **Black and white.**
- **The notification red** (`#E02B20`). One use, chosen for its white text at
  4.6:1. A count that shares the brand accent stops reading as "something needs
  you".
- **The three status colours** (`success`, `danger`, `warning`). Scoped by
  rule 6 above rather than by this list, because they are part of the system
  now rather than escapes from it.
- **The verification blue** (`#1D9BF0`). One use, beside a name. It is a
  convention people already read without being taught — a blue check means
  "this account is who it says it is" everywhere else on the internet, and
  spending Deck's own accent on it would both weaken the accent and make the
  mark ambiguous. Carries white at 3.1:1, which clears the non-text floor for a
  glyph; it is never used behind text.

---

## Workflow

1. Check the proposal against the six rules above.
2. Add it to `design/tokens.json` as a new entry under `palettes`.
3. `npm run tokens && npm run check:contrast`.
4. Open `/styleguide`, switch to it, look at both themes and the logo-clash
   strip.
5. Only if it survives all that: set `active` and regenerate.

Steps 1–4 cost about a minute. Step 5 is the only one that touches the product.
