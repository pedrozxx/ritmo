/* Gera os ícones do app: anel branco com o marcador rosa sobre o lilás.
   PNG escrito na mão com o zlib do node — sem dependência de imagem. */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const LILAS = [0x6b, 0x3f, 0xc9];
const BRANCO = [0xff, 0xff, 0xff];
const ROSA = [0xec, 0x9b, 0xbd];

const crcTabela = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTabela[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const pedaco = (tipo, dados) => {
  const t = Buffer.from(tipo, 'ascii');
  const tam = Buffer.alloc(4); tam.writeUInt32BE(dados.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, dados])));
  return Buffer.concat([tam, t, dados, crc]);
};
const png = (lado, pixel) => {
  const linhas = [];
  for (let y = 0; y < lado; y++) {
    const linha = Buffer.alloc(1 + lado * 3);
    for (let x = 0; x < lado; x++) {
      const [r, g, b] = pixel(x + 0.5, y + 0.5);
      linha[1 + x * 3] = r; linha[2 + x * 3] = g; linha[3 + x * 3] = b;
    }
    linhas.push(linha);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0); ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8 bits, RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(Buffer.concat(linhas), { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
};

// mistura suave na borda: 1.2px de transição, senão o anel fica serrilhado
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const borda = (d, r, suave) => Math.min(1, Math.max(0, (r - d) / suave + 0.5));

function desenho(lado) {
  const c = lado / 2, suave = lado / 160 + 0.6;
  const rFora = lado * 0.345, rDentro = lado * 0.275;
  const rMarca = lado * 0.062, marcaY = c - (rFora + rDentro) / 2;
  return (x, y) => {
    const d = Math.hypot(x - c, y - c);
    const anel = borda(d, rFora, suave) * (1 - borda(d, rDentro, suave));
    let cor = mix(LILAS, BRANCO, anel);
    const dm = Math.hypot(x - c, y - marcaY);
    return mix(cor, ROSA, borda(dm, rMarca, suave));
  };
}

mkdirSync(new URL('../public/', import.meta.url), { recursive: true });
for (const [arquivo, lado] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL('../public/' + arquivo, import.meta.url), png(lado, desenho(lado)));
  console.log('ok', arquivo, lado + 'px');
}
