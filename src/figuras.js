// Ilustrações dos exercícios: boneco em SVG com cinemática simples (ângulos ou alvo por IK de dois ossos)
// e animação SMIL entre poses. Sem imagem externa: funciona offline e segue as cores do tema.
/* Copiado do Volta ao Campo (criacao-rotina, src/js/figures.js). As poses e
   o desenho são os mesmos; aqui só muda a origem de f1 e do "parado". */
const f1 = n => n.toFixed(1);

/* FIGURES-START: ilustrações em SVG (boneco animado, sem imagem externa) */
const FL = { t: 30, th: 23, sh: 23, ft: 7, ua: 15, fa: 14, nk: 9, hr: 6.5 };
const GY = 102;
const rd = (d) => (d * Math.PI) / 180;
const dirA = (a) => [Math.sin(rd(a)), Math.cos(rd(a))]; // 0° = pra baixo, positivo = pra frente
const pt = (q) => `${f1(q[0])},${f1(q[1])}`;
function ik(s, l1, l2, to, b) {
  let dx = to[0] - s[0],
    dy = to[1] - s[1],
    d = Math.hypot(dx, dy) || 0.01;
  const mx = l1 + l2 - 0.01;
  if (d > mx) {
    dx *= mx / d;
    dy *= mx / d;
    d = mx;
  }
  const al = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const ang = Math.atan2(dy, dx) - (b ?? 1) * al;
  return [
    [s[0] + l1 * Math.cos(ang), s[1] + l1 * Math.sin(ang)],
    [s[0] + dx, s[1] + dy],
  ];
}
function limb(s, l1, l2, sp) {
  if (sp.to) return ik(s, l1, l2, sp.to, sp.b);
  const d1 = dirA(sp.a[0]),
    d2 = dirA(sp.a[1]);
  const m = [s[0] + l1 * d1[0], s[1] + l1 * d1[1]];
  return [m, [m[0] + l2 * d2[0], m[1] + l2 * d2[1]]];
}
function pose(p) {
  const td = [Math.sin(rd(p.t || 0)), -Math.cos(rd(p.t || 0))];
  const at = (k) => [p.h[0] + td[0] * k, p.h[1] + td[1] * k];
  const side = [td[1], -td[0]];
  const w = p.fv ? 5 : 0,
    sw = p.fv ? 9 : 0;
  const off = (q, k) => [q[0] + side[0] * k, q[1] + side[1] * k];
  const sh = at(FL.t - 3);
  const P = {
    hip: p.h,
    neck: at(FL.t),
    head: at(FL.t + FL.nk),
    hipN: off(p.h, w),
    hipF: off(p.h, -w),
    shN: off(sh, sw),
    shF: off(sh, -sw),
  };
  const toe = (q, ft) => {
    const d = dirA(ft);
    return [q[0] + FL.ft * d[0], q[1] + FL.ft * d[1]];
  };
  const ln = limb(P.hipN, FL.th, FL.sh, p.n),
    lf = limb(P.hipF, FL.th, FL.sh, p.f);
  P.kn = ln[0];
  P.an = ln[1];
  P.tn = toe(ln[1], p.n.ft ?? (p.fv ? -100 : 90));
  P.kf = lf[0];
  P.af = lf[1];
  P.tf = toe(lf[1], p.f.ft ?? (p.fv ? 100 : 90));
  const an = limb(P.shN, FL.ua, FL.fa, p.an),
    af = limb(P.shF, FL.ua, FL.fa, p.af);
  P.en = an[0];
  P.hn = an[1];
  P.ef = af[0];
  P.hf = af[1];
  return P;
}
const PATHS = {
  torso: (P, fv) =>
    fv ? `M${pt(P.shF)}L${pt(P.shN)}M${pt(P.neck)}L${pt(P.hip)}M${pt(P.hipN)}L${pt(P.hipF)}` : `M${pt(P.neck)}L${pt(P.hip)}`,
  legN: (P) => `M${pt(P.hipN)}L${pt(P.kn)}L${pt(P.an)}L${pt(P.tn)}`,
  legF: (P) => `M${pt(P.hipF)}L${pt(P.kf)}L${pt(P.af)}L${pt(P.tf)}`,
  armN: (P) => `M${pt(P.shN)}L${pt(P.en)}L${pt(P.hn)}`,
  armF: (P) => `M${pt(P.shF)}L${pt(P.ef)}L${pt(P.hf)}`,
};
function propSvg([k, a, b, c]) {
  switch (k) {
    case 'chair':
      return `<path class="pl" d="M${a + 2},${b + 4}V${GY}M${a + 28},${b + 4}V${GY}"/><rect class="pr" x="${a}" y="${b}" width="30" height="4" rx="1.5"/><rect class="pr" x="${a}" y="${b - 30}" width="4" height="30" rx="1.5"/>`;
    case 'bench':
      return `<rect class="pr" x="${a}" y="${b}" width="${c}" height="${GY - b}" rx="2"/>`;
    case 'post':
      return `<rect class="pr" x="${a}" y="30" width="6" height="${GY - 30}" rx="2"/>`;
    case 'door':
      return `<rect class="pr" x="${a}" y="-12" width="6" height="${GY + 12}"/><circle class="pk" cx="${a + 3}" cy="52" r="1.8"/>`;
    case 'wall':
      return `<rect class="pr" x="${a}" y="-12" width="8" height="${GY + 12}"/>`;
    case 'sofa':
      return `<path class="pl" d="M${a + 3},${b + 16}V${GY}M${a + 37},${b + 16}V${GY}"/><rect class="pr" x="${a}" y="${b}" width="40" height="16" rx="3"/><rect class="pr" x="${a}" y="${b - 22}" width="7" height="24" rx="3"/>`;
    case 'cushion':
      return `<ellipse class="pr" cx="${a}" cy="${GY - 2}" rx="15" ry="3.5"/>`;
    case 'mark':
      return `<rect class="mk2" x="${a - 1.5}" y="${GY - 2}" width="3" height="7" rx="1"/>`;
    case 'towel':
      return `<rect class="tw" x="${a}" y="${GY - 3}" width="${b}" height="3" rx="1"/>`;
    case 'legpress':
      // trilho a 45° e encosto inclinado do leg press
      return `<path class="pl" d="M110,56L166,0"/><path class="pr" d="M44,62L50,56L92,98L80,98Z"/>`;
    case 'pulley':
      return `<rect class="pr" x="${a - 5}" y="-12" width="10" height="5" rx="1.5"/><circle class="pk" cx="${a}" cy="-6" r="2.4"/>`;
    case 'bike':
      return `<g class="bk"><circle cx="70" cy="86" r="16"/><circle cx="152" cy="86" r="16"/><path d="M70,86L108,86L98,52M108,86L140,54L152,86M98,52L140,54M91,51H105M140,54L144,46H135"/></g><circle class="pk" cx="108" cy="86" r="3"/>`;
  }
  return '';
}
/**
 * Isometria (segurar posição): entra na posição, segura a maior parte do ciclo e volta.
 * Com "reduzir movimento" ligado, fica só a posição segurada (show: 1).
 */
const hold = (start, held, extra = {}) => ({ ...extra, k: [start, held, held], kt: [0, 0.28, 0.82, 1], dur: 3.6, show: 1 });
const ST = (x, o = {}) => ({ h: [x, 54], n: { to: [x + 3, 100] }, f: { to: [x - 4, 100] }, an: { a: [8, 14] }, af: { a: [-6, -2] }, ...o });
export const FIGURES = {
  squat: {
    k: [
      ST(108, { n: { to: [114, 100] }, f: { to: [106, 100] }, an: { a: [15, 25] }, af: { a: [10, 20] } }),
      { h: [94, 76], t: 40, n: { to: [114, 100] }, f: { to: [106, 100] }, an: { a: [80, 88] }, af: { a: [75, 85] } },
    ],
  },
  chairSquat: {
    props: [['chair', 58, 76]],
    dur: 2,
    k: [
      ST(108, { n: { to: [114, 100] }, f: { to: [106, 100] }, an: { a: [15, 25] }, af: { a: [10, 20] } }),
      { h: [88, 72], t: 42, n: { to: [114, 100] }, f: { to: [106, 100] }, an: { a: [80, 88] }, af: { a: [75, 85] } },
    ],
  },
  bulgaro: {
    props: [['bench', 62, 72, 28]],
    k: [
      { h: [120, 56], t: 8, n: { to: [128, 100] }, f: { to: [86, 70], ft: -100 }, an: { a: [10, 25] }, af: { a: [-5, 10] } },
      { h: [106, 76], t: 14, n: { to: [128, 100] }, f: { to: [86, 70], ft: -100 }, an: { a: [25, 40] }, af: { a: [10, 25] } },
    ],
  },
  stepup: {
    props: [['bench', 118, 90, 44]],
    k: [
      { h: [112, 58], t: 14, n: { to: [134, 88] }, f: { to: [104, 100] }, an: { a: [20, 25] }, af: { a: [-15, -10] } },
      { h: [134, 42], t: 2, n: { to: [136, 88] }, f: { to: [126, 76], ft: 120 }, an: { a: [-10, -5] }, af: { a: [10, 15] } },
    ],
  },
  tke: {
    props: [['post', 178]],
    band: [
      [[178, 74], 'kn'],
      [[178, 80], 'kn'],
    ],
    k: [
      { h: [104, 57], t: 2, n: { to: [113, 100] }, f: { to: [98, 100] }, an: { a: [5, 10] }, af: { a: [-5, -2] } },
      { h: [110, 54], n: { to: [113, 100] }, f: { to: [100, 100] }, an: { a: [5, 10] }, af: { a: [-5, -2] } },
    ],
  },
  spanish: {
    props: [['post', 180]],
    band: [
      [[180, 74], 'kn'],
      [[180, 80], 'kf'],
    ],
    ...hold(
      { h: [104, 56], t: 2, n: { to: [118, 100] }, f: { to: [112, 100] }, an: { a: [8, 14] }, af: { a: [4, 10] } },
      { h: [94, 76], t: 12, n: { to: [118, 100] }, f: { to: [112, 100] }, an: { a: [80, 88] }, af: { a: [76, 84] } },
    ),
  },
  kneeExt: {
    props: [['chair', 78, 78]],
    band: [[[106, 99], 'an']],
    k: [
      { h: [96, 74], t: -4, n: { a: [90, 2] }, f: { a: [88, 0] }, an: { to: [106, 77], b: -1 }, af: { to: [102, 77], b: -1 } },
      { h: [96, 74], t: -4, n: { a: [90, 84] }, f: { a: [88, 0] }, an: { to: [106, 77], b: -1 }, af: { to: [102, 77], b: -1 } },
    ],
  },
  calf: {
    props: [
      ['bench', 100, 90, 40],
      ['wall', 156],
    ],
    dur: 2.2,
    k: [
      { h: [112, 46], n: { to: [112, 92], ft: 112 }, f: { a: [-15, -80] }, an: { to: [154, 30], b: -1 }, af: { a: [-5, 0] } },
      { h: [113, 36], n: { to: [113, 82], ft: 42 }, f: { a: [-15, -80] }, an: { to: [154, 22], b: -1 }, af: { a: [-5, 0] } },
    ],
  },
  sidePlank: hold(
    { h: [101, 97], t: 84, n: { to: [56, 99] }, f: { to: [60, 96] }, an: { to: [140, 101], b: -1 }, af: { a: [175, 175] } },
    { h: [101, 90], t: 79, n: { to: [56, 99] }, f: { to: [60, 96] }, an: { to: [140, 101], b: -1 }, af: { a: [175, 175] } },
  ),
  pushup: {
    k: [
      {
        h: [110, 81],
        t: 73,
        n: { to: [66, 94], ft: 15 },
        f: { to: [69, 93], ft: 15 },
        an: { to: [136, 101], b: -1 },
        af: { to: [132, 101], b: -1 },
      },
      {
        h: [112, 90],
        t: 84.5,
        n: { to: [66, 94], ft: 15 },
        f: { to: [69, 93], ft: 15 },
        an: { to: [136, 101], b: -1 },
        af: { to: [132, 101], b: -1 },
      },
    ],
  },
  pike: {
    k: [
      {
        h: [106, 64],
        t: 130,
        n: { to: [80, 98], ft: 30 },
        f: { to: [83, 98], ft: 30 },
        an: { to: [140, 101], b: 1 },
        af: { to: [136, 101], b: 1 },
      },
      {
        h: [108, 66],
        t: 148,
        n: { to: [80, 98], ft: 30 },
        f: { to: [83, 98], ft: 30 },
        an: { to: [140, 101], b: 1 },
        af: { to: [136, 101], b: 1 },
      },
    ],
  },
  row: {
    props: [['door', 184]],
    band: [[[184, 40], 'hn']],
    k: [
      { h: [100, 56], t: 10, n: { to: [110, 100] }, f: { to: [98, 100] }, an: { to: [136, 40], b: -1 }, af: { to: [132, 41], b: -1 } },
      { h: [100, 56], t: 10, n: { to: [110, 100] }, f: { to: [98, 100] }, an: { to: [116, 42], b: -1 }, af: { to: [112, 43], b: -1 } },
    ],
  },
  press: {
    band: [[[112, 100], 'hn']],
    k: [ST(110, { an: { a: [30, 172] }, af: { a: [25, 168] } }), ST(110, { an: { a: [176, 178] }, af: { a: [172, 176] } })],
  },
  pullApart: {
    band: [['hn', 'hf']],
    k: [
      { fv: 1, h: [110, 54], n: { to: [104, 100] }, f: { to: [116, 100] }, an: { to: [107, 32], b: -1 }, af: { to: [113, 32], b: 1 } },
      { fv: 1, h: [110, 54], n: { to: [104, 100] }, f: { to: [116, 100] }, an: { a: [-92, -92] }, af: { a: [92, 92] } },
    ],
  },
  deadBug: {
    k: [
      { h: [112, 94], t: -90, n: { a: [180, 90] }, f: { a: [178, 92] }, an: { a: [180, 180] }, af: { a: [178, 178] } },
      { h: [112, 94], t: -90, n: { a: [180, 90] }, f: { a: [92, 92] }, an: { a: [-95, -95] }, af: { a: [178, 178] } },
    ],
  },
  bridge: {
    k: [
      {
        h: [110, 95.5],
        t: -90,
        n: { to: [134, 100] },
        f: { to: [130, 100] },
        an: { to: [106, 101], b: -1 },
        af: { to: [102, 101], b: -1 },
      },
      { h: [112, 74], t: -124, n: { to: [134, 100] }, f: { to: [130, 100] }, an: { to: [106, 101], b: -1 }, af: { to: [102, 101], b: -1 } },
    ],
  },
  slBridge: {
    k: [
      { h: [110, 95.5], t: -90, n: { to: [134, 100] }, f: { a: [112, 112] }, an: { to: [106, 101], b: -1 }, af: { to: [102, 101], b: -1 } },
      { h: [112, 74], t: -124, n: { to: [134, 100] }, f: { a: [125, 125] }, an: { to: [106, 101], b: -1 }, af: { to: [102, 101], b: -1 } },
    ],
  },
  towel: {
    props: [['towel', 126, 38]],
    k: [
      { h: [112, 76], t: -122, n: { to: [134, 99] }, f: { to: [131, 99] }, an: { to: [106, 101], b: -1 }, af: { to: [102, 101], b: -1 } },
      { h: [114, 85], t: -106, n: { to: [156, 99] }, f: { to: [153, 99] }, an: { to: [106, 101], b: -1 }, af: { to: [102, 101], b: -1 } },
    ],
  },
  nordic: {
    props: [
      ['sofa', 38, 70],
      ['cushion', 100],
    ],
    dur: 3.4,
    k: [
      { h: [100, 77], n: { a: [0, -90], ft: 180 }, f: { a: [3, -90], ft: 180 }, an: { a: [10, 30] }, af: { a: [5, 25] } },
      {
        h: [121, 90],
        t: 65,
        n: { a: [-65, -90], ft: 180 },
        f: { a: [-62, -90], ft: 180 },
        an: { to: [152, 101], b: 1 },
        af: { to: [148, 101], b: 1 },
      },
    ],
  },
  copenhagen: hold(
    {
      h: [98, 94],
      t: 93,
      n: { to: [52, 72], ft: -90 },
      f: { to: [70, 99], b: 1 },
      an: { to: [138, 101], b: -1 },
      af: { to: [104, 88], b: 1 },
    },
    {
      h: [97, 82],
      t: 99,
      n: { to: [52, 72], ft: -90 },
      f: { to: [70, 99], b: 1 },
      an: { to: [138, 101], b: -1 },
      af: { to: [104, 78], b: 1 },
    },
    { props: [['bench', 26, 74, 30]] },
  ),
  balance: {
    props: [['cushion', 114]],
    dur: 3,
    k: [
      { h: [110, 52], n: { to: [113, 97] }, f: { a: [70, -5] }, an: { a: [40, 50] }, af: { a: [30, 40] } },
      { h: [112, 52], t: 4, n: { to: [113, 97] }, f: { a: [70, -5] }, an: { a: [50, 60] }, af: { a: [20, 30] } },
    ],
  },
  bandWalk: {
    band: [['kn', 'kf']],
    k: [
      {
        fv: 1,
        h: [104, 62],
        n: { to: [96, 100], b: -1 },
        f: { to: [114, 100], b: 1 },
        an: { to: [97, 60], b: -1 },
        af: { to: [111, 60], b: 1 },
      },
      {
        fv: 1,
        h: [114, 62],
        n: { to: [100, 100], b: -1 },
        f: { to: [132, 100], b: 1 },
        an: { to: [107, 60], b: -1 },
        af: { to: [121, 60], b: 1 },
      },
    ],
  },
  latJump: {
    props: [['mark', 110]],
    dur: 2.4,
    k: [
      { fv: 1, h: [90, 66], n: { to: [83, 100], b: -1 }, f: { to: [97, 100], b: 1 }, an: { a: [-25, -10] }, af: { a: [25, 10] } },
      { fv: 1, h: [110, 46], n: { to: [104, 84], b: -1 }, f: { to: [116, 84], b: 1 }, an: { a: [-150, -165] }, af: { a: [150, 165] } },
      { fv: 1, h: [130, 66], n: { to: [123, 100], b: -1 }, f: { to: [137, 100], b: 1 }, an: { a: [-25, -10] }, af: { a: [25, 10] } },
      { fv: 1, h: [110, 46], n: { to: [104, 84], b: -1 }, f: { to: [116, 84], b: 1 }, an: { a: [-150, -165] }, af: { a: [150, 165] } },
    ],
  },
  snapDown: {
    kt: [0, 0.3, 0.75, 1],
    dur: 2.6,
    k: [
      { h: [110, 50], n: { to: [112, 95], ft: 35 }, f: { to: [108, 95], ft: 35 }, an: { a: [150, 158] }, af: { a: [144, 152] } },
      { h: [98, 70], t: 32, n: { to: [114, 100] }, f: { to: [110, 100] }, an: { a: [-40, -25] }, af: { a: [-45, -30] } },
      { h: [98, 70], t: 32, n: { to: [114, 100] }, f: { to: [110, 100] }, an: { a: [-40, -25] }, af: { a: [-45, -30] } },
    ],
  },
  hop: {
    kt: [0, 0.22, 0.42, 0.9, 1],
    dur: 2.8,
    show: 2,
    k: [
      { h: [74, 68], t: 30, n: { to: [84, 100] }, f: { a: [-20, -95] }, an: { a: [-50, -20] }, af: { a: [-40, -10] } },
      { h: [108, 48], t: 15, n: { a: [35, -25] }, f: { a: [-20, -95] }, an: { a: [120, 140] }, af: { a: [110, 130] } },
      { h: [134, 68], t: 30, n: { to: [144, 100] }, f: { a: [-20, -95] }, an: { a: [60, 75] }, af: { a: [50, 65] } },
      { h: [134, 68], t: 30, n: { to: [144, 100] }, f: { a: [-20, -95] }, an: { a: [60, 75] }, af: { a: [50, 65] } },
    ],
  },
  rdl: {
    band: [['tn', 'hn']],
    dur: 3,
    k: [
      ST(110, { n: { to: [112, 100] }, f: { a: [-12, -14] }, an: { a: [4, 2] }, af: { a: [-2, -2] } }),
      { h: [102, 58], t: 82, n: { to: [112, 100] }, f: { a: [-84, -86] }, an: { a: [2, 0] }, af: { a: [-4, -4] } },
    ],
  },
  lunge: {
    k: [
      ST(112, { n: { to: [116, 100] }, f: { to: [108, 100] }, an: { a: [10, 20] }, af: { a: [-10, 0] } }),
      { h: [104, 74], t: 4, n: { to: [118, 100] }, f: { to: [74, 96], ft: 50 }, an: { a: [15, 25] }, af: { a: [-15, -5] } },
    ],
  },
  quadStretch: hold(
    { h: [110, 54], f: { to: [108, 100] }, n: { to: [113, 100] }, an: { a: [5, 8] }, af: { a: [60, 80] } },
    { h: [110, 54], f: { to: [108, 100] }, n: { a: [-12, 200], ft: 215 }, an: { to: [99, 58], b: -1 }, af: { a: [60, 80] } },
  ),
  walk: {
    dur: 1.6,
    k: [
      { h: [110, 56], t: 4, n: { to: [126, 100], ft: 100 }, f: { to: [96, 98], ft: 60 }, an: { a: [-25, -10] }, af: { a: [25, 45] } },
      { h: [110, 56], t: 4, n: { to: [96, 98], ft: 60 }, f: { to: [126, 100], ft: 100 }, an: { a: [25, 45] }, af: { a: [-25, -10] } },
    ],
  },
  march: {
    dur: 1.4,
    k: [
      ST(110, { n: { a: [85, 2] }, f: { to: [107, 100] }, an: { a: [-30, 30] }, af: { a: [30, 100] } }),
      ST(110, { n: { to: [113, 100] }, f: { a: [85, 2] }, an: { a: [30, 100] }, af: { a: [-30, 30] } }),
    ],
  },
  run: {
    dur: 1.1,
    k: [
      { h: [110, 54], t: 12, n: { a: [40, -15], ft: 100 }, f: { a: [-30, -105], ft: 20 }, an: { a: [-45, 40] }, af: { a: [40, 125] } },
      { h: [110, 54], t: 12, n: { a: [-30, -105], ft: 20 }, f: { a: [40, -15], ft: 100 }, an: { a: [40, 125] }, af: { a: [-45, 40] } },
    ],
  },
  ytw: {
    dur: 2.4,
    k: [
      { h: [86, 96], t: 90, n: { a: [-90, -90], ft: 20 }, f: { a: [-88, -88], ft: 20 }, an: { a: [93, 93] }, af: { a: [95, 95] } },
      { h: [86, 96], t: 90, n: { a: [-90, -90], ft: 20 }, f: { a: [-88, -88], ft: 20 }, an: { a: [124, 124] }, af: { a: [126, 126] } },
    ],
  },
  boxing: (() => {
    const base = { h: [108, 56], n: { to: [96, 100] }, f: { to: [124, 100] } };
    const guardN = { a: [22, 158] };
    const guardF = { a: [32, 150] };
    return {
      dur: 1.8,
      k: [
        { ...base, an: guardN, af: guardF },
        { ...base, an: guardN, af: { a: [86, 88] } },
        { ...base, an: guardN, af: guardF },
        { ...base, t: 6, an: { a: [88, 90] }, af: guardF },
      ],
    };
  })(),
  legPress: (() => {
    // plataforma corre no trilho a 45°; o pé empurra ao longo dele
    const foot = (d) => ({ to: [80 + d * 0.707, 80 - d * 0.707], b: 1, ft: 205 });
    const seat = { h: [80, 80], t: -45, an: { to: [86, 84], b: -1 }, af: { to: [84, 86], b: -1 } };
    return {
      props: [['legpress']],
      lines: [
        (P) => {
          const m = [(P.an[0] + P.tn[0]) / 2, (P.an[1] + P.tn[1]) / 2];
          return [
            [m[0] - 9, m[1] - 9],
            [m[0] + 9, m[1] + 9],
          ];
        },
      ],
      dur: 2.6,
      k: [
        { ...seat, n: foot(31), f: foot(30) },
        { ...seat, n: foot(43), f: foot(42) },
      ],
    };
  })(),
  benchPress: {
    props: [['bench', 66, 78, 64]],
    dur: 2.4,
    k: [
      {
        h: [118, 74],
        t: -90,
        n: { to: [146, 100], b: 1 },
        f: { to: [142, 100], b: 1 },
        an: { a: [180, 180] },
        af: { a: [178, 178] },
      },
      {
        h: [118, 74],
        t: -90,
        n: { to: [146, 100], b: 1 },
        f: { to: [142, 100], b: 1 },
        // halter encostando no peito: cotovelo abaixo da linha do banco, antebraço na vertical
        an: { a: [50, 185] },
        af: { a: [46, 181] },
      },
    ],
  },
  latPulldown: {
    props: [
      ['chair', 78, 78],
      ['pulley', 100],
    ],
    band: [[[100, -6], 'hn', 'cable']],
    dur: 2.6,
    k: [
      { h: [96, 74], t: -4, n: { a: [90, 2] }, f: { a: [88, 0] }, an: { a: [168, 172] }, af: { a: [165, 170] } },
      { h: [96, 74], t: -4, n: { a: [90, 2] }, f: { a: [88, 0] }, an: { to: [104, 44], b: -1 }, af: { to: [102, 45], b: -1 } },
    ],
  },
  legCurl: {
    props: [['bench', 56, 80, 96]],
    dur: 2.4,
    k: [
      {
        h: [98, 76],
        t: 90,
        n: { a: [-90, -90], ft: 20 },
        f: { a: [-88, -88], ft: 20 },
        an: { to: [140, 82], b: -1 },
        af: { to: [137, 82], b: -1 },
      },
      {
        h: [98, 76],
        t: 90,
        n: { a: [-90, 172], ft: 260 },
        f: { a: [-88, 168], ft: 260 },
        an: { to: [140, 82], b: -1 },
        af: { to: [137, 82], b: -1 },
      },
    ],
  },
  bentRow: {
    dur: 2.4,
    k: [
      { h: [100, 58], t: 58, n: { to: [108, 100] }, f: { to: [102, 100] }, an: { a: [0, 2] }, af: { a: [-2, 0] } },
      { h: [100, 58], t: 58, n: { to: [108, 100] }, f: { to: [102, 100] }, an: { to: [112, 56], b: -1 }, af: { to: [110, 57], b: -1 } },
    ],
  },
  plankTap: (() => {
    const base = { h: [110, 81], t: 73, n: { to: [66, 94], ft: 15 }, f: { to: [69, 93], ft: 15 } };
    const down = { an: { to: [136, 101], b: -1 }, af: { to: [132, 101], b: -1 } };
    return {
      dur: 2.4,
      k: [
        { ...base, ...down },
        { ...base, ...down, af: { to: [128, 74], b: 1 } },
        { ...base, ...down },
        { ...base, ...down, an: { to: [130, 73], b: 1 } },
      ],
    };
  })(),
  rearFly: {
    // de frente: braços pendurados abrem até a altura dos ombros
    dur: 2.6,
    k: [
      { fv: 1, h: [110, 54], n: { to: [104, 100] }, f: { to: [116, 100] }, an: { a: [-4, -4] }, af: { a: [4, 4] } },
      { fv: 1, h: [110, 54], n: { to: [104, 100] }, f: { to: [116, 100] }, an: { a: [-88, -88] }, af: { a: [88, 88] } },
    ],
  },
  curl: (() => {
    // rosca direta: cotovelo parado junto ao corpo, antebraço sobe (o tríceps fica no texto: de perfil some atrás da cabeça)
    const base = { h: [110, 54], n: { to: [113, 100] }, f: { to: [106, 100] } };
    return {
      dur: 2.4,
      k: [
        { ...base, an: { a: [6, 6] }, af: { a: [-2, -2] } },
        { ...base, an: { a: [10, 140] }, af: { a: [2, 136] } },
      ],
    };
  })(),
  sideAbd: {
    // deitado de lado, visto de frente: a perna de cima sobe e desce
    dur: 2.6,
    k: [
      {
        fv: 1,
        h: [96, 93],
        t: 90,
        n: { a: [-90, -90], ft: -100 },
        f: { a: [-90, -90], ft: -80 },
        an: { to: [100, 86], b: 1 },
        af: { a: [90, 90] },
      },
      {
        fv: 1,
        h: [96, 93],
        t: 90,
        n: { a: [-118, -118], ft: -128 },
        f: { a: [-90, -90], ft: -80 },
        an: { to: [100, 86], b: 1 },
        af: { a: [90, 90] },
      },
    ],
  },
  bike: (() => {
    const c = [108, 86],
      pd = (a) => [c[0] + 9 * Math.sin(rd(a)), c[1] - 9 * Math.cos(rd(a))];
    const fr = (a) => ({
      h: [98, 51],
      t: 48,
      n: { to: pd(a), b: 1 },
      f: { to: pd(a + 180), b: 1 },
      an: { to: [140, 47], b: 1 },
      af: { to: [137, 48], b: 1 },
    });
    return {
      props: [['bike']],
      band: [
        [c, 'af', 'crank'],
        [c, 'an', 'crank'],
      ],
      k: [fr(0), fr(90), fr(180), fr(270)],
      lin: 1,
      dur: 1.6,
    };
  })(),
};
function anim(attr, vals, F) {
  if (vals.length < 2) return '';
  const all = [...vals, vals[0]],
    n = all.length;
  const kt = F.kt || all.map((_, i) => (i / (n - 1)).toFixed(3));
  const spl = F.lin
    ? ''
    : ` calcMode="spline" keySplines="${Array(n - 1)
        .fill('.42 0 .58 1')
        .join(';')}"`;
  return `<animate attributeName="${attr}" dur="${F.dur || 2.8}s" repeatCount="indefinite" values="${all.join(';')}" keyTimes="${kt.join(';')}"${spl}/>`;
}
const FIGCACHE = {};
/* parado: só a pose principal, sem animar (animações desligadas no Ritmo) */
export function figSvg(key, parado = false) {
  const F = FIGURES[key];
  if (!F) return '';
  const ck = key + (parado ? ':p' : '');
  if (FIGCACHE[ck]) return FIGCACHE[ck];
  const raw = F.k || [F.p];
  let frames = raw.map(pose);
  if (parado && frames.length > 1) frames = [frames[F.show ?? 1]];
  const fv = !!raw[0].fv;
  const el = (cls, fn) => {
    const v = frames.map(fn);
    return `<path class="${cls}" d="${v[0]}">${anim('d', v, F)}</path>`;
  };
  const BAND_CLASS = { crank: 'ck', cable: 'cb' };
  const bands = (F.band || [])
    .map(([a, b, c]) =>
      el(BAND_CLASS[c] ?? 'bn', (P) => {
        const r = (x) => (typeof x === 'string' ? P[x] : x);
        return `M${pt(r(a))}L${pt(r(b))}`;
      }),
    )
    .join('');
  // Peças que acompanham o corpo (ex.: plataforma do leg press), calculadas a partir de cada pose.
  const moving = (F.lines || [])
    .map((fn) =>
      el('pm', (P) => {
        const [a, b] = fn(P);
        return `M${pt(a)}L${pt(b)}`;
      }),
    )
    .join('');
  const hx = frames.map((P) => f1(P.head[0])),
    hy = frames.map((P) => f1(P.head[1]));
  return (FIGCACHE[ck] = `<svg viewBox="0 -12 220 122" role="img" aria-label="Ilustração do movimento" focusable="false">
    <line class="gd" x1="6" x2="214" y1="${GY}" y2="${GY}"/>${(F.props || []).map(propSvg).join('')}
    ${moving}${el('bd bf', PATHS.armF)}${el('bd bf', PATHS.legF)}${bands}${el('bd', (P) => PATHS.torso(P, fv))}
    <circle class="hd" r="${FL.hr}" cx="${hx[0]}" cy="${hy[0]}">${anim('cx', hx, F)}${anim('cy', hy, F)}</circle>
    ${el('bd rl', PATHS.legN)}${el('bd', PATHS.armN)}
    <text class="lg" x="8" y="-2">rosa = perna direita (a operada)</text></svg>`);
}
