const zlib = require("zlib");
const fs = require("fs");

function doorPixel(x, y) {
  // Rounded-square black app background, radius 112 (matches icon.svg)
  const inR = x >= 0 && x < 512 && y >= 0 && y < 512;
  const r = 112;
  const cx = Math.min(Math.max(x, r), 511 - r);
  const cy = Math.min(Math.max(y, r), 511 - r);
  const outside = Math.hypot(x - cx, y - cy) > r;
  if (!inR || outside) return [0, 0, 0, 0];

  let white = false;

  // Door outline rect (156,106,200x300, rx 16, stroke 24)
  const dx0 = 156, dy0 = 106, dx1 = 356, dy1 = 406, dr = 16, sw = 24;
  const nearDoorEdge = (() => {
    if (x < dx0 - sw || x > dx1 + sw || y < dy0 - sw || y > dy1 + sw) return false;
    const ix0 = dx0 + dr, ix1 = dx1 - dr, iy0 = dy0 + dr, iy1 = dy1 - dr;
    const ex = x < ix0 ? ix0 - x : x > ix1 ? x - ix1 : 0;
    const ey = y < iy0 ? iy0 - y : y > iy1 ? y - iy1 : 0;
    const outer = Math.hypot(ex, ey);
    // distance to inner rect edge approx: inside inner rect => distance to border
    let inner = 0;
    if (x > dx0 + sw / 2 && x < dx1 - sw / 2 && y > dy0 + sw / 2 && y < dy1 - sw / 2) {
      inner = Math.min(x - (dx0 + sw / 2), dx1 - sw / 2 - x, y - (dy0 + sw / 2), dy1 - sw / 2 - y);
    }
    return outer < dr + sw / 2 && inner < sw / 2 + 2;
  })();
  // simpler robust door ring: within outer rounded rect, outside inner rect
  const inOuterDoor = x >= dx0 && x < dx1 && y >= dy0 && y < dy1;
  const inInnerDoor = x >= dx0 + 20 && x < dx1 - 20 && y >= dy0 + 20 && y < dy1 - 20;
  if (inOuterDoor && !inInnerDoor) white = true;

  // Door handle dot
  if (Math.hypot(x - 316, y - 260) <= 14) white = true;

  // Badge ring at (340,350) r64 stroke16
  const bd = Math.hypot(x - 340, y - 350);
  if (bd <= 64 && bd >= 48) white = true;
  // Checkmark strokes
  const seg = (x1, y1, x2, y2) => {
    const vx = x2 - x1, vy = y2 - y1;
    const t = Math.min(1, Math.max(0, ((x - x1) * vx + (y - y1) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(x - (x1 + t * vx), y - (y1 + t * vy));
  };
  if (bd <= 64 && (seg(312, 350, 332, 370) <= 9 || seg(332, 370, 372, 330) <= 9)) white = true;

  if (white) return [255, 255, 255, 255];
  return [0, 0, 0, 255];
}

function writePng(size, out) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  // supersample from 512 master
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((x / size) * 512);
      const sy = Math.floor((y / size) * 512);
      const [rr, gg, bb, aa] = doorPixel(sx, sy);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = rr; raw[o + 1] = gg; raw[o + 2] = bb; raw[o + 3] = aa;
    }
  }
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  const crc = (buf) => {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 255] ^ (c >>> 8);
    const out2 = Buffer.alloc(4);
    out2.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0);
    return out2;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const td = Buffer.concat([Buffer.from(type), data]);
    return Buffer.concat([len, td, crc(td)]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(out, png);
  console.log("wrote", out, png.length, "bytes");
}

writePng(512, "public/icon-512.png");
writePng(192, "public/icon-192.png");
writePng(180, "public/apple-touch-icon.png");
