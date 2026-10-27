import { cn } from '@/lib/utils';
import { gameIdMarkSvg } from '@/lib/gameIdMark';
import { GameIdMark } from './GameIdMark';

/**
 * The button other developers put on their sign-in screens, rendered here so
 * the docs can show exactly what the snippet produces.
 */
export function SignInWithGameId({
  tone = 'dark',
  className,
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-11 items-center gap-2.5 rounded-full px-5 text-[14px] font-medium tracking-[-0.01em]',
        tone === 'dark'
          ? 'bg-[#0e0e0e] text-white'
          : 'border border-[#e7e5df] bg-white text-[#0e0e0e]',
        className,
      )}
    >
      <GameIdMark className="size-6" />
      Sign in with GameID
    </span>
  );
}

/** The same button as copy-and-paste HTML, with no dependency on Deck's CSS. */
export const SIGN_IN_BUTTON_HTML = `<a href="YOUR_AUTHORIZE_URL" style="display:inline-flex;align-items:center;gap:10px;height:44px;padding:0 20px;border-radius:999px;background:#0e0e0e;color:#fff;font:500 14px/1 system-ui,sans-serif;text-decoration:none">
  ${gameIdMarkSvg(24)}
  Sign in with GameID
</a>`;
