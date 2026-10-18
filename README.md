# Portfólio — Stephany Marques

Site pessoal interativo: hero em WebGL (blob com shader), scroll suave, projetos em scroll horizontal, esfera de tecnologias arrastável e cursor customizado.

**Stack:** Vite · Three.js · GSAP (ScrollTrigger) · Lenis

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Onde editar

| O quê | Arquivo |
|---|---|
| Textos, seções, links de contato | `index.html` |
| Projetos em destaque | `src/projects.js` |
| Atividade do GitHub (cidade 3D ao vivo) | `src/activity.js` (usuário em `GH_USER`) |
| Tecnologias da esfera | `src/sphere.js` |
| Cores e fontes | variáveis no topo de `src/style.css` |
| Foto | `public/stephany-perfil.jpg` |

## Deploy

Qualquer host estático serve a pasta `dist/` (Vercel, Netlify, GitHub Pages).
