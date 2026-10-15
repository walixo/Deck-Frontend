import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { span, useReducedMotion, useScrollProgress } from '../motion';

/**
 * The jump to light speed between the hero and the arcade.
 *
 * A pinned scene: the section is taller than the screen, its canvas sticks,
 * and scrolling through it drives the streaks from a drift to a rush. Near the
 * end the light floods white and hands over to the white page below, the way
 * the video cuts from the burst to its first white section.
 */
export function Warp() {
  const [sectionRef, progress] = useScrollProgress<HTMLElement>();
  const reduced = useReducedMotion();

  const title = span(progress, 0.12, 0.38) * (1 - span(progress, 0.7, 0.86));
  const flood = span(progress, 0.78, 1);

  return (
    <section ref={sectionRef} aria-label="Into the arcade" className="relative h-[220vh] bg-black">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <WarpField speed={reduced ? 0 : 0.15 + progress * 1.6} className="absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center text-white">
          <p
            className="text-[clamp(2rem,5.5vw,4.5rem)] font-medium leading-[0.98] tracking-[-0.05em] text-balance"
            style={{ opacity: reduced ? 1 : title, transform: `scale(${0.92 + title * 0.08})` }}
          >
            Step inside the arcade
          </p>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-g-paper"
          style={{ opacity: reduced ? 0 : flood }}
        />
      </div>
    </section>
  );
}

const COLOURS = ['#3fd1c1', '#9b7bff', '#ff6a3d', '#ffd27a', '#ff4f9a', '#7cc4ff'];

interface Streak {
  angle: number;
  distance: number;
  speed: number;
  length: number;
  colour: string;
  width: number;
}

/**
 * Streaks radiating from the centre. `speed` is read through a ref so a
 * changing scroll position never restarts the animation — it only leans on
 * the accelerator.
 */
export function WarpField({ speed, className }: { speed: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;

    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const spawn = (anywhere: boolean): Streak => ({
      angle: Math.random() * Math.PI * 2,
      distance: anywhere ? Math.random() * Math.hypot(width, height) * 0.5 : Math.random() * 40,
      speed: 0.4 + Math.random() * 1.6,
      length: 20 + Math.random() * 90,
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      width: 0.6 + Math.random() * 1.6,
    });

    resize();
    const count = width < 640 ? 160 : 280;
    const streaks = Array.from({ length: count }, () => spawn(true));

    const draw = () => {
      frame = 0;
      const boost = speedRef.current;
      const cx = width / 2;
      const cy = height / 2;
      const reach = Math.hypot(width, height) * 0.55;

      /* A translucent wash instead of a clear leaves short trails. */
      context.fillStyle = 'rgba(0,0,0,0.32)';
      context.fillRect(0, 0, width, height);
      context.lineCap = 'round';

      for (const streak of streaks) {
        const step = streak.speed * (1 + boost * 14) * (0.3 + streak.distance / reach);
        streak.distance += step;
        if (streak.distance > reach) Object.assign(streak, spawn(false));

        const fade = Math.min(1, streak.distance / (reach * 0.35));
        const tail = streak.length * (0.4 + boost * 1.4) * fade;
        const cos = Math.cos(streak.angle);
        const sin = Math.sin(streak.angle);

        context.globalAlpha = 0.25 + fade * 0.75;
        context.strokeStyle = streak.colour;
        context.lineWidth = streak.width * (0.6 + fade);
        context.beginPath();
        context.moveTo(cx + cos * streak.distance, cy + sin * streak.distance);
        context.lineTo(cx + cos * (streak.distance + tail), cy + sin * (streak.distance + tail));
        context.stroke();
      }
      context.globalAlpha = 1;

      if (visible && speedRef.current > 0) frame = requestAnimationFrame(draw);
    };

    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);
    /* Reduced motion: paint a moment of the burst and stop there. */
    if (speedRef.current === 0) {
      for (let i = 0; i < 40; i += 1) draw();
    } else {
      frame = requestAnimationFrame(draw);
    }

    /* Off screen, nothing is drawn. */
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame && speedRef.current > 0) frame = requestAnimationFrame(draw);
    });
    observer.observe(canvas);
    window.addEventListener('resize', resize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('block size-full', className)} />;
}
