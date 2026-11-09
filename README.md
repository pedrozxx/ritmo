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
npm run smoke    # renderiza as 12 telas e os editores em Node
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

## Rotina e Progresso

A **Rotina** é o dia inteiro numa linha só, como no Volta ao Campo: começa na hora de
acordar (editável no topo da tela), passa pelos hábitos com horário, refeições e aulas
na ordem do relógio, e termina na hora de dormir, que sai 8 horas antes de acordar.
Hábito é Sim / Não, refeição é um check (o mesmo da Dieta), aula e sono são só
referência. O item de agora fica marcado. Hábito sem horário vai num card separado.

A Rotina lê as outras abas. As aulas cadastradas na Faculdade (dia, começo e fim) e o
horário do estágio (aba Estágio) entram na linha como blocos. Um hábito pode ter o
horário fixo ou depender da aula ou do estágio do dia ("O horário depende de"): aí ele
só aparece nos dias que têm aquele bloco e sai X minutos antes do começo dele. O
"Sai pra faculdade" do plano já vem assim, 30 min antes da primeira aula. Hábito que cai
no meio da aula ou do estágio, e aula que bate com estágio, ficam marcados em rosa.
Refeição e hábito do próprio bloco não contam como choque.

Dia de aula com estágio de manhã (o estágio acaba até 3 h antes da aula) tem regra
própria: o "Sai pra faculdade" sai direto do estágio, na hora que ele acaba, e cada
refeição pode mudar de lugar nesses dias ("Em dia de aula com estágio de manhã"): no
estágio, 30 min depois de começar, ou na faculdade, 30 min depois de sair do estágio.
No plano do Pedro o café vai pro estágio e o almoço pra faculdade.

Os trajetos ficam em Ajustes (até o estágio e até a faculdade, em minutos). A Rotina põe
"Sai pro estágio" sozinha, no começo do estágio menos o trajeto, e o "Acorda" avisa
quando não sobram 45 min entre acordar e sair pro primeiro compromisso do dia, dizendo
a hora que caberia. O trecho do estágio até a faculdade tem campo próprio (em branco,
usa o de casa): com ele a Rotina marca "chega atrasado" quando a chegada passa do começo
da aula, e "em cima da aula" quando o almoço na faculdade não cabe 20 min antes dela.

A hora de acordar vale todo dia, mas um dia da semana pode ter a sua (botão embaixo
do Acorda, na Rotina). Dormir sai do acordar do dia seguinte: se terça acorda mais
cedo, quem dorme mais cedo é a segunda.

Refeição conta no % do dia e no anel da Dieta como um item do pilar: marcada vale
"Sim", e Almoço 1 ou 2 resolvem o mesmo almoço. Ela só entra na conta a partir do
primeiro dia em que alguma refeição foi marcada, pra não reescrever o histórico de antes.

O **Progresso** mostra a média dos últimos 7 e 30 dias, a sequência atual e a melhor,
as últimas 12 semanas dia a dia, a média por semana, cada pilar e cada hábito do mais
furado pro mais firme. O histórico começa no primeiro dia com resposta: antes disso
nada conta, e depois dele dia em branco conta como zero.

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
