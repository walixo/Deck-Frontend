import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BuildPath } from '@/components/deckgames/landing/BuildPath';
import { DeviceShowcase } from '@/components/deckgames/landing/DeviceShowcase';
import { FloatingCovers } from '@/components/deckgames/landing/FloatingCovers';
import { GamesIntro } from '@/components/deckgames/landing/GamesIntro';
import { Hero } from '@/components/deckgames/landing/Hero';
import { Library } from '@/components/deckgames/landing/Library';
import { Manifesto } from '@/components/deckgames/landing/Manifesto';
import { Players } from '@/components/deckgames/landing/Players';
import { Pledges } from '@/components/deckgames/landing/Pledges';
import { Warp } from '@/components/deckgames/landing/Warp';
import { WordStream } from '@/components/deckgames/landing/WordStream';
import { useGames } from '@/hooks/useGames';
import type { GameGenre } from '@/types';

/**
 * Deck Games' front door, `/games`.
 *
 * Paced like the video it was modelled on: warm light, a jump to light speed,
 * then a white page that unfolds one idea at a time — the device, the
 * promises, the library, the developer's road at night, and a plain closing
 * word. The library sits in the middle, not at the end, because most people
 * arriving here came to play.
 */
export function GamesHome() {
  const [genre, setGenre] = useState<GameGenre | undefined>();
  const { data: games = [], isLoading } = useGames(genre);
  const all = useGames();
  const { hash } = useLocation();

  /* React Router does not scroll to hashes; "Play now" links here. */
  useEffect(() => {
    if (hash !== '#library') return;
    const timer = window.setTimeout(
      () => document.getElementById('library')?.scrollIntoView({ behavior: 'smooth' }),
      60,
    );
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    <>
      <title>Deck Games — a new era of play</title>
      <GamesIntro />
      <Hero />
      <Warp />
      <DeviceShowcase />
      <Pledges />
      <FloatingCovers games={all.data ?? []} />
      <Library games={games} loading={isLoading} genre={genre} onGenre={setGenre} />
      <Players />
      <WordStream />
      <BuildPath />
      <Manifesto />
    </>
  );
}
