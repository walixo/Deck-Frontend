import { createElement } from 'react';
import {
  AcademicCapIcon,
  BeakerIcon,
  BoltIcon,
  ChartBarIcon,
  CircleStackIcon,
  CloudIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CpuChipIcon,
  CreditCardIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  FilmIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  LockClosedIcon,
  MegaphoneIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
  PhotoIcon,
  PuzzlePieceIcon,
  RocketLaunchIcon,
  ShoppingBagIcon,
  SparklesIcon,
  SquaresPlusIcon,
  SquaresPlusIcon as FallbackIcon,
  UsersIcon,
  WindowIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useCategoryIcon, useCategoryLabel } from '@/hooks/useCategories';

/**
 * The curated icon set, keyed exactly as the backend stores it.
 *
 * These replaced a hand-drawn path per category, which had two problems that
 * only showed up once categories became something anyone could add: the paths
 * were keyed to the seven slugs Deck shipped with, so a new category had no
 * icon at all, and drawing a matching one meant a code change — which is
 * precisely what making categories dynamic was supposed to remove.
 *
 * Heroicons outline at 1.5px stroke, every one on the same optical grid, all
 * inheriting `currentColor` so they read on either canvas. Thirty consistent
 * options beat unlimited inconsistent ones.
 *
 * The keys must stay in step with CATEGORY_ICONS in the backend's constants —
 * that is the list the admin picker offers and the model validates against.
 */
export const ICON_SET = {
  'cpu-chip': CpuChipIcon,
  sparkles: SparklesIcon,
  'command-line': CommandLineIcon,
  'code-bracket': CodeBracketIcon,
  'device-phone-mobile': DevicePhoneMobileIcon,
  'globe-alt': GlobeAltIcon,
  cube: CubeIcon,
  'puzzle-piece': PuzzlePieceIcon,
  bolt: BoltIcon,
  beaker: BeakerIcon,
  'chart-bar': ChartBarIcon,
  'circle-stack': CircleStackIcon,
  cloud: CloudIcon,
  'credit-card': CreditCardIcon,
  'document-text': DocumentTextIcon,
  envelope: EnvelopeIcon,
  film: FilmIcon,
  'finger-print': FingerPrintIcon,
  'lock-closed': LockClosedIcon,
  megaphone: MegaphoneIcon,
  'musical-note': MusicalNoteIcon,
  'paint-brush': PaintBrushIcon,
  photo: PhotoIcon,
  'rocket-launch': RocketLaunchIcon,
  'shopping-bag': ShoppingBagIcon,
  'squares-plus': SquaresPlusIcon,
  users: UsersIcon,
  'wrench-screwdriver': WrenchScrewdriverIcon,
  window: WindowIcon,
  'academic-cap': AcademicCapIcon,
} as const;

export type IconKey = keyof typeof ICON_SET;

interface CategoryIconProps {
  /** A category slug. The icon is looked up from the category list. */
  category: string;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}

/**
 * The icon for a category slug.
 *
 * Resolves through the cached category list rather than a local map, so a
 * category added in the admin area gets its icon immediately with no deploy.
 * Falls back to a neutral tile glyph while the list is loading or if a slug has
 * somehow outlived its category — a missing icon should be a quiet square, not
 * a crash or a gap in the layout.
 */
export function CategoryIcon({ category, className, ...rest }: CategoryIconProps) {
  const key = useCategoryIcon(category);

  /*
   * `createElement` rather than `<Icon />` with a local variable.
   *
   * Assigning a component to a capitalised local and rendering it trips
   * `react-hooks/static-components`, which exists to catch components defined
   * inside render — those get a new type every pass and remount their whole
   * subtree. That is not what happens here: every entry in ICON_SET is a stable
   * module-level component and this only picks one. Calling createElement says
   * "select an existing component" instead of "here is a component", which is
   * both what we mean and what the rule is looking for.
   */
  return createElement(ICON_SET[key as IconKey] ?? FallbackIcon, { className, ...rest });
}

/**
 * The display label for a category slug.
 *
 * A component rather than a bare hook call so the ~10 places that used to write
 * `{CATEGORY_LABELS[slug]}` inline stay one-liners. Renders the slug humanised
 * until the list arrives, so chips never flash empty.
 */
export function CategoryLabel({ slug }: { slug: string }) {
  return <>{useCategoryLabel(slug)}</>;
}
