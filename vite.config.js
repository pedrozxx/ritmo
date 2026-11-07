import react from '@vitejs/plugin-react';

// No GitHub Pages o app mora em /ritmo/; em dev mora na raiz.
export default ({ command }) => ({
  base: command === 'build' ? '/ritmo/' : '/',
  plugins: [react()],
  server: { host: true },   // --host: abre na rede local
});
