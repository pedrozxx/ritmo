/* Publica o dist/ no GitHub Pages (branch gh-pages).
   Roda o build, checa as regras antes, e empurra. `npm run deploy`. */
import { execFileSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const REMOTO = 'https://github.com/pedrozxx/ritmo.git';
const SITE = 'https://pedrozxx.github.io/ritmo/';

const rodar = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });

rodar('npm', ['run', 'check']);
rodar('npm', ['run', 'smoke']);
rodar('npm', ['run', 'build']);

if (!existsSync('dist/index.html')) throw new Error('o build não gerou dist/index.html');
rmSync('dist/.git', { recursive: true, force: true });

const git = args => rodar('git', ['-C', 'dist', ...args]);
git(['init', '-b', 'gh-pages', '-q']);
git(['add', '-A']);
git(['commit', '-q', '-m', `deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`]);
git(['push', '-f', '-q', REMOTO, 'gh-pages']);
rmSync('dist/.git', { recursive: true, force: true });

console.log(`\npublicado — ${SITE}\no GitHub Pages leva ~1 min pra trocar a versão no ar.`);
