# Estúdio de vídeos dos projetos

Gera os vídeos de apresentação (≈32 s, 1920×1080, sem áudio) que abrem no botão **▶ Ver rodando** dos cards do portfólio.
Fica fora do site: o deploy publica só o `dist/`.

Cada vídeo junta duas coisas:

1. **Gravação real do app** — `record.mjs` abre o app num navegador (Playwright), executa o roteiro de cliques de `roteiros/<id>.mjs` e grava a tela (`footage/<id>.mp4`, mais uma folha de contato `footage/<id>-sheet.png` para escolher os trechos).
2. **Cena 3D** — `estudio/` é uma página Three.js que põe os trechos escolhidos na tela de um celular, tablet ou notebook, com título, frase, destaques, "Feito com" e o link final. `render.mjs` renderiza quadro a quadro (30 fps) e o FFmpeg monta o MP4.

## Uso

```bash
cd estudio-videos
npm install
npx playwright install chromium

npm run gravar -- cielo          # 1. grava o app (footage/cielo.mp4)
# 2. escolha os trechos em estudio/projects.js (clips: [início, fim] em segundos da gravação)
npm run trechos -- cielo         # 3. corta os trechos em quadros
npm run servidor                 # 4. em outro terminal: serve o estúdio em 127.0.0.1:8790
node render.mjs cielo --preview 1,12,30   # prévias em prev/ (opcional)
npm run renderizar -- cielo      # 5. vídeo final em out/cielo.mp4
npm run publicar -- cielo        # 6. copia para ../public/videos (com a capa .jpg)
```

Textos (frase, destaques, tecnologias, link) e cores de cada vídeo ficam em `estudio/projects.js`.

## Como cada app é gravado

| id | De onde vem | Observação |
|----|-------------|------------|
| `cielo` | site no ar | o roteiro troca o Phaser para Canvas só na gravação (o WebGL do navegador sem janela é instável) |
| `dudy` | site no ar | as chamadas ao Supabase são respondidas vazias: nada chega ao banco real |
| `gene` | site no ar | — |
| `xepa` | local: `api` com `npm run dev:memoria` + `npm run demo:semear`, e o app com `npx expo start --web --no-dev --port 8081` | na web o Metro precisa de `apoio/metro.config.js` (resolve o `punycode`) e de `react-native-web`, `react-dom` e `@expo/metro-runtime`; faça isso numa cópia do repositório |
| `dashgit` | local: `uvicorn app.main:app --port 8765` com `DATABASE_PATH=./demo.db`, depois de rodar `apoio/seed_demo.py` copiado para a raiz do dashGit | time e issues **fictícios**; nada vem do GitLab real |
| `gitia` | local: `node src/server.js` na porta 8767 com `GITLAB_URL=http://localhost:8766` e `apoio/mock-gitlab.mjs` rodando | o Gemini é real (usa a chave do `.env`); as issues vão para o GitLab **simulado** |

O vídeo mostra uma etiqueta ("conta de demonstração", "dados fictícios", "GitLab de demonstração") quando os dados não são reais.
