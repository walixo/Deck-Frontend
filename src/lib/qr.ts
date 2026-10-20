/**
 * A small QR code encoder: byte mode, error correction level M, versions 1–10.
 *
 * Enough for a link — version 10 at M holds 213 bytes, and a launch URL is a
 * fifth of that — without pulling a library onto the landing page for one
 * picture. It follows the standard (ISO/IEC 18004) step for step: pick the
 * smallest version that fits, add Reed–Solomon error correction, interleave the
 * blocks, lay the bits into the grid around the function patterns, then try all
 * eight masks and keep the one with the lowest penalty.
 *
 * Returns the module grid, `true` for dark, with no quiet zone — the caller
 * draws the margin.
 */

/* Per version (index 0 unused), for level M. */
const ECC_PER_BLOCK = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
/* Level M's two-bit code in the format information. */
const FORMAT_M = 0;
const MAX_VERSION = 10;

function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK[version]! * BLOCKS[version]!;
}

/* GF(2^8) with the QR polynomial 0x11D. */
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gfMul(result[j]!, root);
      if (j + 1 < degree) result[j]! ^= result[j + 1]!;
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i]! ^= gfMul(coef, factor);
    });
  }
  return result;
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.ceil((version * 4 + 4) / (count * 2 - 2)) * 2;
  const size = version * 4 + 17;
  const result = [6];
  for (let pos = size - 7; result.length < count; pos -= step) result.splice(1, 0, pos);
  return result;
}

const bit = (value: number, index: number) => ((value >>> index) & 1) !== 0;

export function qrMatrix(text: string): boolean[][] {
  const bytes = [...new TextEncoder().encode(text)];

  /* The smallest version that holds it. Byte mode, so the header is a 4-bit
     mode and an 8-bit length (16-bit from version 10). */
  let version = 1;
  for (; version <= MAX_VERSION; version += 1) {
    const lengthBits = version < 10 ? 8 : 16;
    if (4 + lengthBits + bytes.length * 8 <= dataCodewords(version) * 8) break;
  }
  if (version > MAX_VERSION) throw new Error('Too long for a QR code this small');

  /* The bit stream: mode, length, data, terminator, then padding. */
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  const capacity = dataCodewords(version) * 8;
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  }

  /* Split into blocks, add error correction to each, and interleave. */
  const blockCount = BLOCKS[version]!;
  const eccLength = ECC_PER_BLOCK[version]!;
  const raw = Math.floor(rawDataModules(version) / 8);
  const shortBlocks = blockCount - (raw % blockCount);
  const shortLength = Math.floor(raw / blockCount);
  const divisor = rsDivisor(eccLength);
  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < blockCount; i += 1) {
    const chunk = data.slice(k, k + shortLength - eccLength + (i < shortBlocks ? 0 : 1));
    k += chunk.length;
    const ecc = rsRemainder(chunk, divisor);
    if (i < shortBlocks) chunk.push(0);
    blocks.push(chunk.concat(ecc));
  }
  const codewords: number[] = [];
  for (let i = 0; i < blocks[0]!.length; i += 1) {
    blocks.forEach((block, j) => {
      if (i !== shortLength - eccLength || j >= shortBlocks) codewords.push(block[i]!);
    });
  }

  /* The grid, and which cells belong to the fixed patterns. */
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fixed = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (x: number, y: number, dark: boolean) => {
    modules[y]![x] = dark;
    fixed[y]![x] = true;
  };

  for (let i = 0; i < size; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }
  for (const [cx, cy] of [
    [3, 3],
    [size - 4, 3],
    [3, size - 4],
  ] as const) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const ring = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, ring !== 2 && ring !== 4);
      }
    }
  }
  const align = alignmentPositions(version);
  align.forEach((ay, i) =>
    align.forEach((ax, j) => {
      const corner =
        (i === 0 && j === 0) ||
        (i === 0 && j === align.length - 1) ||
        (i === align.length - 1 && j === 0);
      if (corner) return;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }),
  );

  const drawFormat = (mask: number) => {
    const value = (FORMAT_M << 3) | mask;
    let rem = value;
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const format = ((value << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i += 1) set(8, i, bit(format, i));
    set(8, 7, bit(format, 6));
    set(8, 8, bit(format, 7));
    set(7, 8, bit(format, 8));
    for (let i = 9; i < 15; i += 1) set(14 - i, 8, bit(format, i));
    for (let i = 0; i < 8; i += 1) set(size - 1 - i, 8, bit(format, i));
    for (let i = 8; i < 15; i += 1) set(8, size - 15 + i, bit(format, i));
    set(8, size - 8, true);
  };
  drawFormat(0);

  if (version >= 7) {
    let rem = version;
    for (let i = 0; i < 12; i += 1) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const info = (version << 12) | rem;
    for (let i = 0; i < 18; i += 1) {
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, bit(info, i));
      set(b, a, bit(info, i));
    }
  }

  /* The data, in the zigzag: two columns at a time, right to left, skipping
     the vertical timing column. */
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (fixed[y]![x] || index >= codewords.length * 8) continue;
        modules[y]![x] = bit(codewords[index >>> 3]!, 7 - (index & 7));
        index += 1;
      }
    }
  }

  const masked = (mask: number) =>
    modules.map((row, y) =>
      row.map((dark, x) => {
        if (fixed[y]![x]) return dark;
        let flip: boolean;
        switch (mask) {
          case 0:
            flip = (x + y) % 2 === 0;
            break;
          case 1:
            flip = y % 2 === 0;
            break;
          case 2:
            flip = x % 3 === 0;
            break;
          case 3:
            flip = (x + y) % 3 === 0;
            break;
          case 4:
            flip = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            flip = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            flip = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            flip = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        return dark !== flip;
      }),
    );

  /* Pick the mask the standard prefers. Runs, 2×2 blocks and balance are
     scored; the finder-lookalike rule is left out — any mask scans, this only
     nudges toward the cleanest one. */
  const penalty = (grid: boolean[][]) => {
    let score = 0;
    const runs = (line: boolean[]) => {
      let run = 1;
      for (let i = 1; i <= line.length; i += 1) {
        if (i < line.length && line[i] === line[i - 1]) run += 1;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
    };
    grid.forEach((row) => runs(row));
    for (let x = 0; x < size; x += 1) runs(grid.map((row) => row[x]!));
    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const c = grid[y]![x];
        if (c === grid[y]![x + 1] && c === grid[y + 1]![x] && c === grid[y + 1]![x + 1]) score += 3;
      }
    }
    const dark = grid.reduce((n, row) => n + row.filter(Boolean).length, 0);
    score += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    return score;
  };

  let best: boolean[][] = modules;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    drawFormat(mask);
    const grid = masked(mask);
    const score = penalty(grid);
    if (score < bestScore) {
      bestScore = score;
      best = grid;
    }
  }
  return best;
}
