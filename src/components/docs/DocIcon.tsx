import {
  ArchiveBoxIcon,
  ArrowsRightLeftIcon,
  BanknotesIcon,
  BeakerIcon,
  BoltIcon,
  BookOpenIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentCheckIcon,
  CodeBracketIcon,
  CpuChipIcon,
  CreditCardIcon,
  CubeIcon,
  CursorArrowRaysIcon,
  DeviceTabletIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  KeyIcon,
  LockClosedIcon,
  MapIcon,
  PuzzlePieceIcon,
  QrCodeIcon,
  ScaleIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  ShoppingCartIcon,
  SignalIcon,
  SparklesIcon,
  TicketIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

/**
 * The small mark beside a page in the docs sidebar.
 *
 * A page names a role — `key`, `money`, `errors` — rather than an icon
 * component, so the four content files stay prose and data and never import a
 * glyph. It also means one decision changes every product at once: swap what
 * `errors` draws here and Developers, Circuit, GameID and Vault all follow.
 *
 * Names are roles and not shapes for the reason CONTRACT rule 4 gives about
 * colour: `warning` survives a redraw, `triangle` is wrong the moment the
 * drawing changes and wrong invisibly, because it still compiles.
 */

const ICONS = {
  intro: BookOpenIcon,
  start: BoltIcon,
  key: KeyIcon,
  code: CodeBracketIcon,
  webhook: SignalIcon,
  money: BanknotesIcon,
  shield: ShieldCheckIcon,
  errors: ExclamationTriangleIcon,
  sandbox: BeakerIcon,
  screen: DeviceTabletIcon,
  players: UsersIcon,
  challenge: PuzzlePieceIcon,
  sdk: CubeIcon,
  build: WrenchScrewdriverIcon,
  wasm: CpuChipIcon,
  identity: IdentificationIcon,
  button: CursorArrowRaysIcon,
  flow: ArrowsRightLeftIcon,
  token: TicketIcon,
  catalogue: BuildingStorefrontIcon,
  order: ShoppingCartIcon,
  card: CreditCardIcon,
  redeem: QrCodeIcon,
  mint: SparklesIcon,
  hosted: ServerStackIcon,
  review: ClipboardDocumentCheckIcon,
  lock: LockClosedIcon,
  map: MapIcon,
  vault: ArchiveBoxIcon,
  rules: ScaleIcon,
} as const;

/** Every mark a doc page may ask for. */
export type DocIconName = keyof typeof ICONS;

export function DocIcon({ name, className }: { name: DocIconName; className?: string }) {
  const Glyph = ICONS[name];
  /* `shrink-0`: a long page title wraps, and without it the glyph is squeezed
     into an ellipse rather than the line simply running on. */
  return <Glyph aria-hidden="true" className={cn('size-[18px] shrink-0', className)} />;
}
