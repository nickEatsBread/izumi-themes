import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'previews')
mkdirSync(outDir, { recursive: true })

const posters = [
  ['210 18% 28%', '347 40% 42%'],
  ['260 16% 28%', '200 30% 40%'],
  ['150 14% 24%', '40 20% 36%'],
  ['220 20% 26%', '300 22% 38%'],
  ['30 16% 26%', '10 40% 40%'],
]

function poster(i, w, h, radius) {
  const [a, b] = posters[i % posters.length]
  return `<div class="poster" style="width:${w}px;height:${h}px;border-radius:${radius}px;background:linear-gradient(160deg,hsl(${a}),hsl(${b}))"><div class="tri"></div></div>`
}

function html(theme) {
  const t = theme.tokens
  const hsl = (key) => `hsl(${t[key]})`
  const radius = Math.round((theme.radius ?? 0.5) * 16)
  const pip = hsl('theme')
  const top = theme.shell?.nav === 'top'
  const featured = theme.heroHidden
    ? ''
    : theme.layout === 'continue'
      ? `<section class="continue">
          ${poster(0, 220, 124, radius)}
          <div class="copy">
            <div class="kicker">Continue watching</div>
            <div class="title">The evening edit</div>
            <button>Resume</button>
          </div>
        </section>`
      : theme.layout === 'portrait'
        ? `<section class="portrait">
            ${poster(0, 148, 220, radius)}
            <div class="copy">
              <div class="kicker">Featured</div>
              <div class="title">A different perspective.</div>
              <button>Watch</button>
            </div>
          </section>`
        : `<section class="hero" style="border-radius:${Math.max(radius, 10)}px">
            <div class="hero-art"></div>
            <div class="hero-copy">
              <div class="title">${theme.heroTitle}</div>
              <div class="actions"><button>${theme.cta}</button>${theme.cta2 ? `<button class="ghost">${theme.cta2}</button>` : ''}</div>
            </div>
          </section>`

  const cards = Array.from({ length: theme.cardCount }, (_, i) =>
    poster(i + 1, theme.cardW, theme.cardH, radius)).join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&family=Inter:wght@500;600;700;800&display=swap');
  html, body { margin: 0; width: 640px; height: 400px; background: #000; }
  body { display: grid; place-items: center; }
  .frame {
    width: 560px; height: 340px; border-radius: 18px; overflow: hidden;
    background: ${hsl('background')}; color: ${hsl('foreground')};
    font-family: ${theme.font === 'nunito' ? 'Nunito' : 'Inter'}, system-ui, sans-serif;
    display: grid; grid-template-columns: ${top ? '1fr' : '28px 1fr'};
    box-shadow: 0 0 0 1px ${hsl('border')};
  }
  .rail {
    background: color-mix(in srgb, ${hsl('background')} 70%, black);
    display: ${top ? 'none' : 'flex'}; align-items: flex-start; justify-content: center; padding-top: 28px;
  }
  .pip { width: 8px; height: 8px; border-radius: 50%; background: ${pip}; }
  .app { padding: 18px 20px 16px; display: flex; flex-direction: column; gap: 14px; min-width: 0; }
  .top {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 13px; letter-spacing: .04em; font-weight: 800;
  }
  .brand { text-transform: lowercase; }
  .meta { font-size: 10px; font-weight: 600; letter-spacing: .14em; color: ${hsl('mutedForeground')}; }
  .nav {
    display: ${top ? 'flex' : 'none'}; gap: 14px; font-size: 11px; font-weight: 700;
    color: ${hsl('mutedForeground')}; margin-top: -6px;
  }
  .nav span:first-child { color: ${hsl('foreground')}; }
  .hero {
    position: relative; height: ${theme.heroH}px; overflow: hidden;
    background: linear-gradient(120deg, hsl(${theme.heroA}), hsl(${theme.heroB}));
  }
  .hero-art { position: absolute; inset: 0; background:
    linear-gradient(90deg, color-mix(in srgb, ${hsl('background')} 55%, transparent), transparent 46%),
    linear-gradient(160deg, hsl(${theme.heroA}), hsl(${theme.heroB})); }
  .hero-art:after {
    content: ''; position: absolute; right: 8%; top: 12%; width: 46%; height: 120%;
    background: linear-gradient(160deg, hsl(${theme.heroB}), hsl(${theme.heroA}));
    clip-path: polygon(50% 8%, 100% 100%, 0 100%); opacity: .85;
  }
  .hero-copy { position: relative; z-index: 1; padding: 22px 22px 0; }
  .title { font-size: ${theme.titleSize}px; font-weight: 800; line-height: 1.1; max-width: 70%; }
  .actions { display: flex; gap: 8px; margin-top: 12px; }
  button {
    border: 0; border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 12px; font-weight: 700;
    background: ${hsl('primary')}; color: ${hsl('primaryForeground')};
  }
  button.ghost { background: color-mix(in srgb, ${hsl('foreground')} 14%, transparent); color: ${hsl('foreground')}; }
  .kicker { font-size: 10px; font-weight: 800; letter-spacing: .16em; color: ${hsl('mutedForeground')}; text-transform: uppercase; margin-bottom: 6px; }
  .continue, .portrait { display: flex; gap: 16px; align-items: center; }
  .row-title { font-size: 14px; font-weight: 800; margin-bottom: 8px; }
  .row { display: flex; gap: ${theme.gap}px; }
  .poster { position: relative; overflow: hidden; flex: 0 0 auto; }
  .tri {
    position: absolute; left: 18%; right: 18%; top: 28%; bottom: -8%;
    background: linear-gradient(180deg, color-mix(in srgb, white 22%, transparent), color-mix(in srgb, black 18%, transparent));
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
</style>
</head>
<body>
  <div class="frame">
    <div class="rail"><div class="pip"></div></div>
    <div class="app">
      <div class="top"><div class="brand">izumi</div><div class="meta">${theme.label} · LAYOUT PREVIEW</div></div>
      <div class="nav"><span>Home</span><span>Browse</span><span>Library</span><span>Settings</span></div>
      ${featured}
      <section>
        <div class="row-title">${theme.rowTitle}</div>
        <div class="row">${cards}</div>
      </section>
    </div>
  </div>
</body>
</html>`
}

const themes = [
  {
    id: 'izumi.kindling',
    label: 'KINDLING',
    font: 'nunito',
    radius: 0.5,
    tokens: {
      background: '220 10% 10%', foreground: '0 0% 98%', mutedForeground: '216 10% 62%',
      primary: '0 0% 100%', primaryForeground: '220 10% 10%', border: '220 8% 20%', theme: '347 79% 51%',
    },
    heroTitle: 'The evening edit',
    cta: 'Watch Now',
    cta2: 'View Details',
    heroH: 148,
    heroA: '220 16% 22%',
    heroB: '347 40% 36%',
    titleSize: 26,
    rowTitle: 'Your next watch',
    cardW: 78, cardH: 112, gap: 12, cardCount: 5,
  },
  {
    id: 'izumi.ledger',
    label: 'LEDGER',
    font: 'inter',
    radius: 0.5,
    tokens: {
      background: '0 0% 3%', foreground: '0 0% 90%', mutedForeground: '0 0% 58%',
      primary: '247 69% 60%', primaryForeground: '0 0% 100%', border: '0 0% 16%', theme: '247 69% 60%',
    },
    layout: 'continue',
    rowTitle: 'Your next watch',
    cardW: 92, cardH: 52, gap: 10, cardCount: 4,
  },
  {
    id: 'izumi.tidal',
    label: 'TIDAL',
    font: 'inter',
    radius: 0.9,
    shell: { nav: 'top' },
    tokens: {
      background: '220 18% 5%', foreground: '0 0% 98%', mutedForeground: '210 12% 70%',
      primary: '0 0% 100%', primaryForeground: '220 18% 8%', border: '210 12% 18%', theme: '0 0% 100%',
    },
    heroTitle: 'Now playing',
    cta: 'Watch',
    heroH: 168,
    heroA: '220 22% 16%',
    heroB: '210 18% 28%',
    titleSize: 28,
    rowTitle: 'Your next watch',
    cardW: 70, cardH: 100, gap: 10, cardCount: 6,
  },
  {
    id: 'izumi.ember',
    label: 'EMBER',
    font: 'nunito',
    radius: 0.7,
    tokens: {
      background: '0 7% 5.5%', foreground: '0 0% 98%', mutedForeground: '0 0% 70%',
      primary: '0 0% 98%', primaryForeground: '0 7% 8%', border: '0 12% 18%', theme: '0 84% 60%',
    },
    heroTitle: 'Keep watching',
    cta: 'Resume',
    heroH: 150,
    heroA: '0 28% 16%',
    heroB: '12 50% 28%',
    titleSize: 26,
    rowTitle: 'Your next watch',
    cardW: 74, cardH: 106, gap: 10, cardCount: 5,
  },
  {
    id: 'izumi.halo',
    label: 'HALO',
    font: 'nunito',
    radius: 1,
    shell: { nav: 'top' },
    tokens: {
      background: '230 18% 6%', foreground: '210 25% 97%', mutedForeground: '220 12% 68%',
      primary: '210 25% 97%', primaryForeground: '230 18% 8%', border: '228 14% 24%', theme: '200 90% 62%',
    },
    heroTitle: 'Tonight’s pick',
    cta: 'Watch',
    heroH: 160,
    heroA: '230 24% 18%',
    heroB: '200 50% 32%',
    titleSize: 26,
    rowTitle: 'Your next watch',
    cardW: 78, cardH: 110, gap: 12, cardCount: 5,
  },
  {
    id: 'izumi.orchid',
    label: 'ORCHID',
    font: 'nunito',
    radius: 0.8,
    tokens: {
      background: '240 7% 5.5%', foreground: '0 0% 98%', mutedForeground: '0 0% 70%',
      primary: '0 0% 98%', primaryForeground: '270 16% 8%', border: '270 12% 20%', theme: '258 90% 66%',
    },
    heroTitle: 'A quieter hour',
    cta: 'Watch',
    heroH: 154,
    heroA: '270 22% 18%',
    heroB: '258 50% 34%',
    titleSize: 26,
    rowTitle: 'Your next watch',
    cardW: 76, cardH: 108, gap: 11, cardCount: 5,
  },
]

for (const theme of themes) {
  const htmlPath = join(outDir, `${theme.id}.html`)
  const pngPath = join(outDir, `${theme.id}.png`)
  writeFileSync(htmlPath, html(theme))
  const result = spawnSync(
    `npx --yes playwright screenshot --viewport-size=640,400 "${htmlPath}" "${pngPath}"`,
    { cwd: root, stdio: 'inherit', shell: true },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
  console.log('wrote', theme.id)
}
