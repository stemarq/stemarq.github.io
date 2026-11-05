# Estúdio de vídeos dos projetos

Gera os vídeos de apresentação (≈80–100 s, 1920×1080, sem áudio) que abrem no botão **▶ Ver rodando** dos cards do portfólio.
Fica fora do site: o deploy publica só o `dist/`.

Cada vídeo conta a história do projeto em capítulos:

1. **Abertura** — nome, tipo de projeto e a frase que resume a ideia.
2. **O problema** — cartões no estilo de cada projeto (post-its no Xepa, cards de kanban no dashGit, terminal no GItIA, falas em pixel no Cielo, balões no Dudy, caderno no GeneTools) que voam para dentro do aparelho.
3. **Passos** — o app rodando de verdade, com legenda grande ("01 / 07", título e explicação) e **zoom que acompanha o cursor**, para dar para ler o que acontece na tela.
4. **Por dentro** — diagrama da arquitetura.
5. **Números e tecnologias**, e o **link** no fim.

## Como funciona

1. **Gravação real do app** — `record.mjs` abre o app num navegador (Playwright), executa o roteiro de `roteiros/<id>.mjs` e grava a tela em alta resolução (`scale: 2` ou `3`). Além de `footage/<id>.mp4`, salva:
   - `footage/<id>.marks.json`: o segundo em que começa cada passo (`h.mark('nome')` no roteiro);
   - `footage/<id>.cursor.json`: a trilha do cursor e os cliques — o zoom segue o cursor e cada clique vira uma onda na tela.
2. **Quadros** — `estudio/extract.mjs` converte a gravação em JPGs de 30 fps (`estudio/clips/<id>/f`).
3. **Cena 3D** — `estudio/` é uma página Three.js em que tudo é função do tempo (`renderAt(t)`); `render.mjs` renderiza quadro a quadro e o FFmpeg monta o MP4.

O roteiro do vídeo (problema, passos com legendas, diagrama, números, link e cores) fica em `estudio/projects.js`. Os passos apontam para os marcadores da gravação: `{ from: 'grana', to: 'lancar', speed: 1.8, title, text }` (aceita `'grana+1.5'`, `zoom` e `focus: [x, y]` para fixar o ponto do zoom).

## Uso

```bash
cd estudio-videos
npm install
npx playwright install chromium

npm run gravar -- xepa           # 1. grava o app (footage/xepa.*)
npm run trechos -- xepa          # 2. quadros para o estúdio
node render.mjs xepa --preview 10%,40%,85%   # prévias em prev/ (segundos ou % da duração)
npm run renderizar -- xepa       # 3. vídeo final em out/xepa.mp4
npm run publicar -- xepa         # 4. recomprime para ../public/videos, com a capa .jpg (meio do 2º passo)
```

O `render.mjs` sobe o próprio servidor do estúdio. Com pouca memória, renderize por partes, cada uma num processo curto:
`node render.mjs xepa --parte 1 3`, depois `2 3` e `3 3` — a última junta tudo em `out/xepa.mp4`.

## Como cada app é gravado

| id | De onde vem | Observação |
|----|-------------|------------|
| `cielo` | site no ar | o roteiro troca o Phaser para Canvas só na gravação (o WebGL do navegador sem janela é instável); erra uma resposta de propósito e fecha a venda |
| `dudy` | site no ar | as chamadas ao Supabase são respondidas vazias: nada chega ao banco real |
| `gene` | site no ar | — |
| `xepa` | local: `api` com `npm run dev:memoria` + `npm run demo:semear`, e o app com `npx expo start --web --no-dev --port 8081` | na web o Metro precisa de `apoio/metro.config.js` (resolve o `punycode`) e de `react-native-web`, `react-dom` e `@expo/metro-runtime`; faça isso numa cópia do repositório. O roteiro grava lançamentos, então semeie o banco de novo antes de regravar |
| `dashgit` | local: `uvicorn app.main:app --port 8765` com `DATABASE_PATH=./demo.db`, depois de rodar `apoio/seed_demo.py` copiado para a raiz do dashGit | time e issues **fictícios**; nada vem do GitLab real |
| `gitia` | local: `node src/server.js` na porta 8767 com `GITLAB_URL=http://localhost:8766` e `apoio/mock-gitlab.mjs` rodando | o Gemini é real (chave em variável de ambiente); as issues vão para o GitLab **simulado** |

O vídeo mostra uma etiqueta ("conta de demonstração", "dados fictícios", "GitLab de demonstração") quando os dados não são reais.
