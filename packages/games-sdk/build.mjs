// Builds the SDK three ways from one source:
//   dist/index.js + dist/index.cjs + dist/index.d.ts — the npm package
//   ../../public/sdk/deck-games-v1.js                — the script Deck serves
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const BANNER = `/*!
 * Deck Games SDK v1 — https://onedeck.africa/docs/developers
 *
 *   <script src="https://onedeck.africa/sdk/deck-games-v1.js"></script>
 *   const deck = await DeckGames.init();
 *
 * Outside Deck, init() resolves with \`standalone: true\`, so the same build
 * runs anywhere. Testing against a local copy of Deck? Allow its origin:
 *   <script src="…/deck-games-v1.js" data-deck-origins="http://localhost:3000"></script>
 *
 * Also on npm as @onedeck/games-sdk, with TypeScript types. Built from
 * packages/games-sdk in the Deck frontend; edit the source there, not here.
 */`;

rmSync('dist', { recursive: true, force: true });

const common = { entryPoints: ['src/index.ts'], bundle: true, target: 'es2020', logLevel: 'warning' };
await build({ ...common, format: 'esm', outfile: 'dist/index.js' });
await build({ ...common, format: 'cjs', outfile: 'dist/index.cjs' });
execFileSync('npx', ['tsc', '-p', '.'], { stdio: 'inherit' });
/* The script-tag entry is not part of the package's types. */
rmSync('dist/browser.d.ts', { force: true });
/* CommonJS consumers on `nodenext` need .d.cts files pointing at each other. */
for (const file of readdirSync('dist').filter((name) => name.endsWith('.d.ts'))) {
  const text = readFileSync(`dist/${file}`, 'utf8').replace(/from '(\.\/[^']+)\.js'/g, "from '$1.cjs'");
  writeFileSync(`dist/${file.replace(/\.d\.ts$/, '.d.cts')}`, text);
}

/* Readable rather than minified: developers read this file to learn the SDK. */
await build({
  entryPoints: ['src/browser.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2017',
  banner: { js: BANNER },
  outfile: '../../public/sdk/deck-games-v1.js',
  logLevel: 'warning',
});

console.log('built dist/ and public/sdk/deck-games-v1.js');
