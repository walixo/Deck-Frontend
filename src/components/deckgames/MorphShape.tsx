import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/components/deckgames/motion';
import { cn } from '@/lib/utils';

/**
 * One soft, glowing solid that turns slowly and becomes the next: a ring, a
 * rounded cube, a pyramid, and the ring again, every ten seconds.
 *
 * A single fragment shader on a plain WebGL canvas — no library. Each pixel
 * marches a ray into three signed-distance shapes and blends between them, so
 * the morph is continuous rather than a cross-fade. The colour is light rather
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

float sdTorus(vec3 p) {
  return length(vec2(length(p.xy) - 0.62, p.z)) - 0.3;
}

float sdBox(vec3 p) {
  vec3 q = abs(p) - vec3(0.5);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - 0.12;
}

float sdPyramid(vec3 p, float h) {
  float m2 = h * h + 0.25;
  p.xz = abs(p.xz);
  p.xz = (p.z > p.x) ? p.zx : p.xz;
  p.xz -= 0.5;
  vec3 q = vec3(p.z, h * p.y - 0.5 * p.x, h * p.x + 0.5 * p.y);
  float s = max(-q.x, 0.0);
  float t = clamp((q.y - 0.5 * p.z) / (m2 + 0.25), 0.0, 1.0);
  float a = m2 * (q.x + s) * (q.x + s) + q.y * q.y;
  float b = m2 * (q.x + 0.5 * t) * (q.x + 0.5 * t) + (q.y - m2 * t) * (q.y - m2 * t);
  float d2 = min(q.y, -q.x * m2 - q.y * 0.5) > 0.0 ? 0.0 : min(a, b);
  return sqrt((d2 + q.z * q.z) / m2) * sign(max(q.z, -p.y));
}

/* Ring, cube, pyramid, ring: a hold on each and a second to become the next. */
float shape(vec3 p) {
  float c = mod(uTime, 10.0);
  float torus = sdTorus(p);
  float box = sdBox(p);
  float s = 1.2;
  float pyr = sdPyramid(p / s + vec3(0.0, 0.36, 0.0), 1.0) * s - 0.05;
  float ab = smoothstep(2.4, 3.4, c);
  float bc = smoothstep(5.6, 6.6, c);
  float ca = smoothstep(8.8, 9.8, c);
  float d = mix(torus, box, ab);
  d = mix(d, pyr, bc);
  return mix(d, torus, ca);
}

float map(vec3 p) {
  float t = uTime;
  p = rotX(0.45 + 0.25 * sin(t * 0.37)) * rotY(t * 0.55) * p;
  return shape(p);
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
      /* The still frame lands on the ring, mid-turn. */
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
