/* Publica o dist/ no GitHub Pages (branch gh-pages).
   Roda o build, checa as regras antes, e empurra. `npm run deploy`. */
import { execFileSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const REMOTO = 'https://github.com/pedrozxx/ritmo.git';
const SITE = 'https://pedrozxx.github.io/ritmo/';

const rodar = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

/* Chama o node direto em vez do npm. No Windows o npm é um .cmd, e desde o
   Node 20.12 rodar .cmd sem shell dá EINVAL — e com shell o próprio Node
   avisa que os argumentos não são escapados. Pelo node não existe nenhum dos
   dois problemas, e ainda pula a partida do npm três vezes. */
const node = (...args) => rodar(process.execPath, args);

node('src/check.mjs');
node('src/smoke.mjs');
node('node_modules/vite/bin/vite.js', 'build');

if (!existsSync('dist/index.html')) throw new Error('o build não gerou dist/index.html');
rmSync('dist/.git', { recursive: true, force: true });

const git = args => rodar('git', ['-C', 'dist', ...args]);
git(['init', '-b', 'gh-pages', '-q']);
git(['add', '-A']);
git(['commit', '-q', '-m', `deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`]);
git(['push', '-f', '-q', REMOTO, 'gh-pages']);
rmSync('dist/.git', { recursive: true, force: true });

console.log(`\npublicado — ${SITE}\no GitHub Pages leva ~1 min pra trocar a versão no ar.`);
