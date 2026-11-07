# Ritmo

**No ar: https://pedrozxx.github.io/ritmo/**

App de rotina: checklist de **Sim / Não** para faculdade, academia, dieta, estágio e
financeiro, organizado num **percurso de 90 dias** em 3 fases. Tem dashboard, metas
ancoradas em cada fase e controle de gastos. PWA — instala na tela de início do iPhone
e roda em tela cheia, sem App Store.

## Comandos

```bash
npm run dev      # servidor local, acessível pela rede (--host)
npm run deploy   # check + smoke + build e publica no GitHub Pages
npm run build    # só gera o dist/
npm run check    # regras: sequência, ciclo, dieta, dinheiro
npm run smoke    # renderiza as 10 telas em Node pra pegar erro de render
npm run icons    # regera os ícones do app
```

## Instalar no iPhone

1. Abra **https://pedrozxx.github.io/ritmo/** no Safari.
2. Compartilhar → **Adicionar à Tela de Início**.

Pronto: abre em tela cheia, com ícone próprio, funciona sem internet depois da
primeira visita e não depende do PC estar ligado.

## Publicar uma versão nova

`npm run deploy` — roda as verificações, builda e empurra o `dist/` pro branch
`gh-pages`. O GitHub Pages troca a versão no ar em cerca de um minuto. O código-fonte
mora no branch `main`; o site, no `gh-pages`.

Em dev o app roda na raiz (`/`) e publicado roda em `/ritmo/` — por isso o `base` do
`vite.config.js` muda conforme o comando, e os caminhos do manifest e do service
worker são relativos.

## Onde mexer

| O quê | Arquivo |
|---|---|
| Os 12 hábitos e os 5 pilares | `src/store.js` → `PILARES` |
| Regra da sequência (70% do dia) | `src/store.js` → `META_DIA` |
| As 3 fases do ciclo | `src/store.js` → `FASES` e `CICLO_DIAS` |
| Refeições, proteína, kcal, água | `src/store.js` → `REFEICOES`, `META_PROTEINA`, `GARRAFAS` |
| Metas e a fase de cada uma | `src/store.js` → `METAS_PADRAO` |
| Matérias, exercícios, entregas, horas | `src/screens.jsx` (constantes no topo) |
| Cores, claro e escuro | `src/app.css` (tokens no `:root`) |
| Números do movimento | `src/ui.jsx` (`SUAVE`, `MOLA`, `CASCATA`) |

## Como funciona a sequência

Um dia entra na sequência quando pelo menos **70%** dos itens estão em "Sim".
O dia de hoje fica aberto: enquanto não bate a meta ele não soma, mas também não
quebra a contagem — só vira falha quando passa da meia-noite.

## O percurso de 90 dias

O ciclo começa na data em `cicloInicio` e tem 3 fases de 30 dias — **Base** (criar o
hábito), **Ritmo** (subir a carga) e **Pico** (fechar forte). A tela Percurso mostra em
que dia e semana você está, as 13 semanas coloridas pela aderência de cada uma, e as
metas de cada fase. A aderência do ciclo é a fração dos dias já vividos que bateram os
70%. Passados os 90 dias o ciclo fecha e aparece o botão de começar o próximo —
Ajustes também reinicia a qualquer momento.

## A dieta

As 6 refeições do dia são um checklist: marcar uma soma a proteína e as calorias dela,
então **os gramas são derivados, não digitados**. A água são 6 garrafas de 500 ml que
enchem no toque. Além disso o pilar Dieta tem 3 itens de Sim / Não (não saí da dieta,
levei a marmita, tomei a creatina) que entram na rotina do dia como qualquer outro.

## Onde os dados ficam

Tudo no `localStorage` do próprio aparelho, sob a chave `ritmo:v1`. Não tem servidor,
login nem nuvem. Apagar os dados do site apaga o histórico.

Os dados que vêm na primeira abertura são **exemplo** e estão marcados como tal no app —
"Limpar" no banner (ou em Ajustes) zera e começa o histórico de verdade.
