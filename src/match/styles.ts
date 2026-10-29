/**
 * Match's buttons, panels and labels, shared by the screens and the wallet:
 * soft glass and the pink-to-violet gradient, as in the launch film.
 */

/** A rounded button with no fill; add one of the fills below. */
export const PILL =
  'inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-4 text-[15px] font-semibold tracking-[-0.01em] transition-[transform,filter,background-color,box-shadow] duration-150 hover:brightness-110 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50';
/** The love gradient: pink through to violet. */
export const LOVE = 'bg-[linear-gradient(120deg,#ff5c8a,#ff7a8f_45%,#b77cff)]';
export const GLOW = 'shadow-[0_14px_40px_rgb(255_92_138_/_0.38)]';
export const PRIMARY = `${PILL} ${LOVE} ${GLOW} text-white`;
export const QUIET = `${PILL} border border-white/10 bg-white/[0.07] text-[#f4f2ee] hover:bg-white/[0.11]`;
export const EYEBROW = 'font-mono text-[11px] uppercase tracking-[0.2em] text-[#ff8fab]';
/** A glass panel: the lobby's cards. */
export const CARD =
  'rounded-[24px] border border-white/12 bg-white/[0.045] p-5 shadow-[0_24px_60px_rgb(0_0_0_/_0.3),inset_0_1px_0_rgb(255_255_255_/_0.07)] backdrop-blur-xl';
export const LABEL = 'font-mono text-[11px] uppercase tracking-[0.16em] text-white/55';
/** A small text button inside a card: History, Change. */
export const LINK = 'text-[13px] font-medium text-[#ff8fab] hover:underline underline-offset-4';
/** A text box. */
export const FIELD =
  'rounded-[16px] border border-white/12 bg-white/[0.05] outline-none transition-colors focus-within:border-[#ff5c8a]/70 focus:border-[#ff5c8a]/70';
/** The second line of a headline, fading out to the right. */
export const SOFT =
  'bg-[linear-gradient(100deg,#f4f2ee_20%,rgb(244_242_238_/_0.4)_95%)] bg-clip-text pb-[0.08em] text-transparent';
