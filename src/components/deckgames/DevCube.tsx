import { cn } from '@/lib/utils';

/**
 * A dark puzzle cube, turning slowly in the developer hero.
 *
 * Pure CSS 3D — 26 cubelets in three layers, no canvas and no WebGL, so it
 * costs one stylesheet's worth of work and nothing to download. The whole cube
 * turns once a minute while its top layer twists a full circle in four quarter
 * turns; a full circle returns every cubelet to where it began, so the loop
 * has no seam to snap across.
 *
 * Shading is baked into each face by the direction it points (light from the
 * top left), with a few faces given a dotted mesh or a brushed finish so the
 * surface reads as machined rather than flat. Under reduced motion the global
 * rule stills it, and it rests at its opening angle.
 */

const AXIS = [-1, 0, 1] as const;

/** Each face: where it points, how it is placed, and its base tone. */
const FACES = [
  { key: 'front', place: 'translateZ(var(--half))', tone: 'from-[#262626] to-[#0f0f0f]' },
  {
    key: 'back',
    place: 'rotateY(180deg) translateZ(var(--half))',
    tone: 'from-[#1a1a1a] to-[#0a0a0a]',
  },
  {
    key: 'right',
    place: 'rotateY(90deg) translateZ(var(--half))',
    tone: 'from-[#161616] to-[#070707]',
  },
  {
    key: 'left',
    place: 'rotateY(-90deg) translateZ(var(--half))',
    tone: 'from-[#2c2c2c] to-[#121212]',
  },
  {
    key: 'top',
    place: 'rotateX(90deg) translateZ(var(--half))',
    tone: 'from-[#3d3d3d] to-[#1a1a1a]',
  },
  {
    key: 'bottom',
    place: 'rotateX(-90deg) translateZ(var(--half))',
    tone: 'from-[#0d0d0d] to-[#050505]',
  },
] as const;

/* Overlaid on a face's tone. Picked by position, so the cube is the same cube
   on every visit. */
const FINISH = {
  mesh: 'bg-[radial-gradient(circle,rgb(255_255_255/0.16)_0.7px,transparent_1.1px)] bg-[length:5px_5px]',
  brushed: 'bg-[repeating-linear-gradient(115deg,rgb(255_255_255/0.05)_0_1px,transparent_1px_4px)]',
} as const;

function finishFor(x: number, y: number, z: number, face: number): keyof typeof FINISH | null {
  const n = (x + 2) * 7 + (y + 2) * 13 + (z + 2) * 5 + face * 3;
  if (n % 9 === 0 || n % 11 === 0) return 'mesh';
  if (n % 7 === 0) return 'brushed';
  return null;
}

export function DevCube({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'relative [--gap:calc(var(--u)*0.06)] [--half:calc(var(--s)/2)] [--s:calc(var(--u)-var(--gap))] [--u:clamp(46px,6.6vw,92px)] [perspective:1800px]',
        className,
      )}
    >
      <div className="absolute left-1/2 top-1/2 animate-[var(--animate-g-cube)] [transform-style:preserve-3d] [will-change:transform]">
        {AXIS.map((y) => (
          <div
            key={y}
            className={cn(
              'absolute [transform-style:preserve-3d]',
              y === -1 && 'animate-[var(--animate-g-twist)]',
            )}
          >
            {AXIS.flatMap((x) =>
              AXIS.map((z) => {
                /* The core is never seen, even mid-twist. */
                if (x === 0 && y === 0 && z === 0) return null;
                return (
                  <div
                    key={`${x}${z}`}
                    className="absolute -ml-[var(--half)] -mt-[var(--half)] size-[var(--s)] [transform-style:preserve-3d]"
                    style={{
                      transform: `translate3d(calc(var(--u) * ${x}), calc(var(--u) * ${y}), calc(var(--u) * ${z}))`,
                    }}
                  >
                    {FACES.map((face, index) => {
                      const finish = finishFor(x, y, z, index);
                      return (
                        <div
                          key={face.key}
                          className={cn(
                            'absolute inset-0 rounded-[16%] bg-gradient-to-br shadow-[inset_0_0_0_1px_rgb(255_255_255/0.05),inset_0_1px_0_rgb(255_255_255/0.1)] [backface-visibility:hidden]',
                            face.tone,
                          )}
                          style={{ transform: face.place }}
                        >
                          {finish && (
                            <div
                              className={cn('absolute inset-[9%] rounded-[12%]', FINISH[finish])}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              }),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
