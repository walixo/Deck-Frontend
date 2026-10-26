import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/components/deckgames/motion';
import { cn } from '@/lib/utils';

/**
 * One soft, glowing solid that turns slowly and becomes the next: a rounded
 * cube, a pyramid, a naira sign, a dollar sign, and the cube again, every
 * twelve seconds.
 *
 * A single fragment shader on a plain WebGL canvas — no library. Each pixel
 * marches a ray into four signed-distance shapes and blends between them, so
 * the morph is continuous rather than a cross-fade. The solids spin; the two
 * signs only sway, so they stay readable face on. The colour is light rather
 * than paint: a cycle through blue, violet, pink, ember and amber that flows
 * across the surface with the turn and the time, brightening at the rim.
 *
 * It draws only while on screen, renders one still frame for anyone who has
 * asked for reduced motion, and leaves a soft gradient in its place where
 * WebGL is unavailable.
 */

const VERTEX = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAGMENT = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

float sdBox(vec3 p) {
  vec3 q = abs(p) - vec3(0.5);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.12;
}

/* A square-based pyramid as the meeting of five planes. A bound rather than an
   exact distance, so a ray can never overshoot through the base. */
float sdPyramid(vec3 p) {
  float h = 1.2, k = 1.0 / sqrt(h * h + 0.36);
  vec2 a = abs(p.xz);
  float faces = max(h * a.x, h * a.y) + 0.6 * p.y - 0.6 * h;
  return max(faces * k, -p.y) - 0.05;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

/* Distance to an arc of radius r about c, reaching span radians either side of
   the direction mid. */
float sdArc(vec2 p, vec2 c, float r, float mid, float span) {
  vec2 q = p - c;
  q = vec2(cos(mid) * q.x + sin(mid) * q.y, cos(mid) * q.y - sin(mid) * q.x);
  if (abs(atan(q.y, q.x)) < span) return abs(length(q) - r);
  vec2 e = r * vec2(cos(span), sin(span));
  return min(length(q - e), length(q - vec2(e.x, -e.y)));
}

/* A flat stroke drawing given depth and a soft rounded edge. */
float extrude(vec3 p, float d) {
  vec2 w = vec2(d - 0.075, abs(p.z) - 0.13);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.04;
}

/* N with two bars across it. */
float sdNaira(vec3 p) {
  vec2 q = p.xy;
  float d = sdSegment(q, vec2(-0.4, -0.6), vec2(-0.4, 0.6));
  d = min(d, sdSegment(q, vec2(0.4, -0.6), vec2(0.4, 0.6)));
  d = min(d, sdSegment(q, vec2(-0.4, 0.6), vec2(0.4, -0.6)));
  d = min(d, sdSegment(q, vec2(-0.66, 0.17), vec2(0.66, 0.17)));
  d = min(d, sdSegment(q, vec2(-0.66, -0.17), vec2(0.66, -0.17)));
  return extrude(p, d);
}

/* An S of two open arcs, with one stroke through it. */
float sdDollar(vec3 p) {
  vec2 q = p.xy;
  float d = sdArc(q, vec2(0.0, 0.27), 0.3, 2.618, 2.094);
  d = min(d, sdArc(q, vec2(0.0, -0.27), 0.3, -0.524, 2.094));
  d = min(d, sdSegment(q, vec2(0.0, -0.84), vec2(0.0, 0.84)));
  return extrude(p, d);
}

/* Cube, pyramid, naira, dollar, cube: a hold on each and a second to become
   the next. The solids are measured in the spinning frame, the signs in the
   swaying one. */
float shape(vec3 spun, vec3 swayed) {
  float c = mod(uTime, 12.0);
  float d = mix(sdBox(spun), sdPyramid(spun + vec3(0.0, 0.43, 0.0)), smoothstep(2.0, 3.0, c));
  d = mix(d, sdNaira(swayed / 0.9) * 0.9, smoothstep(5.0, 6.0, c));
  d = mix(d, sdDollar(swayed / 0.9) * 0.9, smoothstep(8.0, 9.0, c));
  return mix(d, sdBox(spun), smoothstep(11.0, 12.0, c));
}

float map(vec3 p) {
  float t = uTime;
  vec3 spun = rotX(0.45 + 0.25 * sin(t * 0.37)) * rotY(t * 0.55) * p;
  vec3 swayed = rotX(0.12 * sin(t * 0.5)) * rotY(0.55 * sin(t * 0.6)) * p;
  return shape(spun, swayed);
}

vec3 normalAt(vec3 p) {
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

/* Blue, violet, pink, ember, amber, and round again. */
vec3 palette(float x) {
  x = fract(x) * 5.0;
  vec3 c0 = vec3(0.34, 0.42, 0.97);
  vec3 c1 = vec3(0.64, 0.40, 0.94);
  vec3 c2 = vec3(0.94, 0.32, 0.56);
  vec3 c3 = vec3(0.99, 0.45, 0.28);
  vec3 c4 = vec3(0.99, 0.70, 0.36);
  float f = smoothstep(0.0, 1.0, fract(x));
  if (x < 1.0) return mix(c0, c1, f);
  if (x < 2.0) return mix(c1, c2, f);
  if (x < 3.0) return mix(c2, c3, f);
  if (x < 4.0) return mix(c3, c4, f);
  return mix(c4, c0, f);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec3 ro = vec3(0.0, 0.0, 3.8);
  vec3 rd = normalize(vec3(uv, -1.7));
  float pix = 1.0 / min(uRes.x, uRes.y);

  float t = 0.0, md = 1e9, mt = 0.0;
  bool hit = false;
  for (int i = 0; i < 90; i++) {
    float d = map(ro + rd * t);
    if (d < md) { md = d; mt = t; }
    if (d < 0.0008) { hit = true; break; }
    t += d * 0.8;
    if (t > 6.0) break;
  }

  /* Misses that passed close still get an edge, so the outline is smooth. */
  float alpha = hit ? 1.0 : 1.0 - smoothstep(0.0, 2.0 * pix * mt, md);
  if (alpha <= 0.0) { gl_FragColor = vec4(0.0); return; }

  vec3 p = ro + rd * (hit ? t : mt);
  vec3 n = normalAt(p);
  float swirl = 0.18 * sin(p.x * 3.1 + uTime * 0.9) + 0.14 * sin(p.y * 2.3 - uTime * 0.7);
  vec3 col = palette(dot(n, vec3(0.35, 0.6, 0.25)) * 0.9 + p.y * 0.35 + uTime * 0.06 + swirl);

  vec3 light = normalize(vec3(-0.5, 0.8, 0.6));
  float dif = 0.62 + 0.38 * max(dot(n, light), 0.0);
  float fres = pow(1.0 - max(dot(n, -rd), 0.0), 2.6);
  float spec = pow(max(dot(reflect(rd, n), light), 0.0), 18.0);
  col = col * dif + fres * 0.32 * vec3(1.0, 0.92, 1.0) + spec * 0.18;

  gl_FragColor = vec4(col * alpha, alpha);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

export function MorphShape({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!canvas || !gl) {
      setFailed(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      setFailed(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');

    /* Capped at 1.5x: past that the shader costs four times as much for an
       edge the eye cannot tell apart. */
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(canvas.clientWidth * scale);
      canvas.height = Math.round(canvas.clientHeight * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const start = performance.now();
    let frame = 0;
    let visible = true;
    const draw = (now: number) => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      /* The still frame lands on the cube, mid-turn. */
      gl.uniform1f(uTime, reduced ? 1.2 : (now - start) / 1000);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!reduced && visible) frame = requestAnimationFrame(draw);
    };

    const sizeObserver = new ResizeObserver(() => {
      resize();
      if (reduced) draw(performance.now());
    });
    sizeObserver.observe(canvas);
    resize();

    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible || reduced) frame = requestAnimationFrame(draw);
    });
    viewObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      viewObserver.disconnect();
      /* Free what this run made, but leave the context alive: a canvas hands
         back the same context on the next getContext, and a lost one would
         fail every compile after it (StrictMode remounts at once in dev). */
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reduced]);

  return (
    <div aria-hidden="true" className={cn('relative', className)}>
      {failed ? (
        <div className="absolute inset-[18%] rounded-[30%] bg-[conic-gradient(from_200deg,#5769f7,#a366f0,#f0528f,#fc7347,#fcb35c,#5769f7)] opacity-90 blur-md" />
      ) : (
        <canvas ref={canvasRef} className="size-full" />
      )}
    </div>
  );
}
