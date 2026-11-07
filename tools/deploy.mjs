/* Publica o dist/ no GitHub Pages (branch gh-pages).
   Roda o build, checa as regras antes, e empurra. `npm run deploy`. */
import { execFileSync } from 'node:child_process';
import { rmSync, existsSync } from 'node:fs';

const REMOTO = 'https://github.com/pedrozxx/ritmo.git';
const SITE = 'https://pedrozxx.github.io/ritmo/';

/* chama o npm.cmd direto no Windows em vez de ligar o shell: com shell ligado
   os argumentos não são protegidos e a mensagem do commit se parte em pedaços. */
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const rodar = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

rodar(NPM, ['run', 'check']);
rodar(NPM, ['run', 'smoke']);
rodar(NPM, ['run', 'build']);

if (!existsSync('dist/index.html')) throw new Error('o build não gerou dist/index.html');
rmSync('dist/.git', { recursive: true, force: true });

const git = args => rodar('git', ['-C', 'dist', ...args]);
git(['init', '-b', 'gh-pages', '-q']);
git(['add', '-A']);
git(['commit', '-q', '-m', `deploy ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`]);
git(['push', '-f', '-q', REMOTO, 'gh-pages']);
rmSync('dist/.git', { recursive: true, force: true });

console.log(`\npublicado — ${SITE}\no GitHub Pages leva ~1 min pra trocar a versão no ar.`);
