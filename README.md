# Ritmo

**No ar: https://pedrozxx.github.io/ritmo/**

App de rotina para **duas pessoas** (Pedro e Ana), cada uma com os próprios dados.
Checklist de **Sim / Não** em cinco pilares — faculdade, academia, dieta, estágio e
financeiro — organizado num **percurso de 90 dias** em 3 fases, com dashboard, metas
ancoradas em cada fase e controle de gastos. PWA: instala na tela de início do iPhone
e roda em tela cheia, sem App Store.

O app **nasce vazio de propósito**. Nada de dado de exemplo: cada pessoa cadastra os
próprios hábitos, refeições, exercícios, matérias, entregas, tarefas e metas.

## Comandos

```bash
npm run dev      # servidor local, acessível pela rede (--host)
npm run deploy   # check + smoke + build e publica no GitHub Pages
npm run build    # só gera o dist/
npm run check    # regras: rotina, sequência, ciclo, dieta, dinheiro, metas, CRUD
npm run smoke    # renderiza as 10 telas e os 9 editores em Node
npm run icons    # regera os ícones do app
```

## Instalar no iPhone

1. Abra **https://pedrozxx.github.io/ritmo/** no Safari.
2. Compartilhar → **Adicionar à Tela de Início**.
3. Na primeira abertura, escolha quem está usando.

Funciona sem internet depois da primeira visita e não depende do PC estar ligado.

## Como funcionam os dois perfis

Pedro e Ana são dois espaços separados no mesmo app: cada um tem rotina, dieta, metas,
histórico e dinheiro próprios. Troca-se de pessoa no topo do menu lateral, e a escolha
fica guardada até alguém trocar de novo.

Os dados de cada perfil ficam no `localStorage` **do aparelho onde foram digitados**
(`ritmo:v2:pedro` e `ritmo:v2:ana`). Ou seja: se cada um instalar no próprio iPhone,
os dois veem os dois perfis, mas cada aparelho guarda só o que foi digitado nele. Pra
compartilhar de verdade entre aparelhos seria preciso backend e login — fica pra
quando fizer falta.

## O que dá pra cadastrar

Toda lista do app tem um botão **Editar** que abre o mesmo editor: criar, mudar e
apagar. As listas são hábitos (por pilar), refeições, exercícios, matérias, entregas,
tarefas, categorias de gasto, divisão da semana de treino e metas.

Os **cinco pilares são fixos** porque cada um tem a sua tela. Os hábitos dentro deles
são todos seus.

## As regras que o app calcula sozinho

| O quê | Como |
|---|---|
| % do dia | Hábitos em "Sim" ÷ hábitos cadastrados. Hábito apagado não conta em dia nenhum. |
| Sequência | Dias seguidos com pelo menos `metaDia` % (padrão 70). Hoje fica aberto: não soma até bater, mas também não quebra. |
| Aderência do ciclo | Dias já vividos do ciclo que bateram a meta. |
| Proteína e caloria | Soma das refeições que você marcou — você não digita grama no dia a dia. |
| Dias de treino | Dias do mês com algum "Sim" no pilar Academia. |
| Média da faculdade | Média das notas das matérias cadastradas. |
| Horas de estágio | Soma das horas lançadas em cada dia da semana. |
| Saldo | Entradas − saídas do mês corrente. |

## O percurso de 90 dias

Três fases de 30 dias: **Base** (criar o hábito), **Ritmo** (subir a carga) e **Pico**
(fechar forte). A tela Percurso mostra o dia, a semana, as 13 semanas coloridas pela
aderência e as metas de cada fase. Passados os 90 dias o ciclo fecha e aparece o botão
de começar o próximo; Ajustes reinicia a qualquer momento.

Cada meta se mede de um jeito: na mão, contando um hábito no mês, fechando o mês no
positivo, pelos dias de dieta na semana ou pela proteína do dia.

## Onde mexer no código

| O quê | Arquivo |
|---|---|
| Pilares, fases e as regras | `src/store.js` |
| Campos de cada formulário | `src/store.js` → `SCHEMAS` |
| Valores padrão de um perfil novo | `src/store.js` → `CFG_PADRAO`, `novoPerfil` |
| Editor genérico e folha de baixo | `src/editor.jsx` |
| Cores, claro e escuro | `src/app.css` (tokens no `:root`) |
| Números do movimento | `src/ui.jsx` (`SUAVE`, `MOLA`, `CASCATA`) |

## Publicar uma versão nova

`npm run deploy`. O código-fonte mora no branch `main`; o site, no `gh-pages`. Em dev
o app roda na raiz (`/`) e publicado roda em `/ritmo/` — por isso o `base` do
`vite.config.js` muda conforme o comando e os caminhos do manifest e do service worker
são relativos.
