// Fixture catalogue for theme previews: original sample titles with generated key art, so a
// preview can be rendered anywhere (including offline) without shipping licensed artwork.
// Every visual field a theme can bind — title, description, genres, score, format, studio,
// season, status, episode count, duration, rankings, next airing — is populated.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const ART_HOST = 'https://art.preview.izumi.invalid'
const YEAR = new Date().getFullYear()
const NOW = Math.floor(Date.now() / 1000)
const SEASON = ['WINTER', 'SPRING', 'SUMMER', 'FALL'][Math.floor(new Date().getMonth() / 3)]

// [romaji, english, native, genres, format, episodes, score, popularity, studio, palette, description]
const TITLES = [
  ['Tsukiyo no Kaikou', 'Moonlit Encounter', '月夜の邂逅', ['Romance', 'Drama', 'Slice of Life'], 'TV', 12, 86, 184000, 'Studio Lantern', ['#0f1a3a', '#4b3a8a', '#ffb86b'], 'A lighthouse keeper and a night-shift radio host trade letters across a bay neither of them has ever crossed, until one winter the ferry stops running.'],
  ['Kōtetsu no Sora', 'Ironclad Skies', '鋼鉄の空', ['Action', 'Mecha', 'Sci-Fi'], 'TV', 24, 82, 261000, 'Vermilion Works', ['#1a0b12', '#b3261e', '#ffd166'], 'Above a drowned continent, salvage pilots race rival guilds to the wrecks of a war nobody remembers starting.'],
  ['Hanabira Hikō', 'Petal Flight', '花びら飛行', ['Fantasy', 'Adventure'], 'TV', 13, 79, 122000, 'Orchard Animation', ['#1b2a1b', '#3b8a5a', '#ffe0f0'], 'Every spring the petal winds carry the town of Sakurajima into the sky, and every spring one girl tries to steer it home.'],
  ['Yoru no Toshokan', 'The Night Library', '夜の図書館', ['Mystery', 'Supernatural'], 'TV', 12, 84, 143000, 'Paperlight', ['#0a0a14', '#2e2a5e', '#9fd3ff'], 'The books in the Night Library are checked out by the dead, and their librarian has just been handed her first overdue notice.'],
  ['Shōnen Taikai', 'Junior Tournament', '少年大会', ['Sports', 'Comedy'], 'TV', 26, 77, 98000, 'Kickflip', ['#102a43', '#1f6feb', '#ffffff'], 'A tiny island school enters the national table-tennis circuit with four players, one paddle and a coach who has never watched a match.'],
  ['Kiseki no Mori', 'Miracle Forest', '奇跡の森', ['Fantasy', 'Slice of Life'], 'MOVIE', 1, 88, 175000, 'Orchard Animation', ['#0b1f1a', '#2c7a5b', '#f7e8a4'], 'A grieving botanist inherits a forest where the seasons run backwards.'],
  ['Zero Kōkan', 'Zero Exchange', 'ゼロ交換', ['Thriller', 'Psychological'], 'TV', 12, 81, 156000, 'Mono Frame', ['#111111', '#3a3a3a', '#ff4d57'], 'Twelve strangers wake with someone else\'s debt, and a single day to trade it away.'],
  ['Amaoto Kissa', 'Rainsound Café', '雨音喫茶', ['Slice of Life', 'Comedy'], 'TV', 12, 80, 87000, 'Paperlight', ['#1c1a2e', '#5d4e8c', '#c8f0ff'], 'A café that only opens when it rains, its regulars, and the one customer who keeps ordering the weather.'],
  ['Kaze no Ken', 'Blade of the Wind', '風の剣', ['Action', 'Adventure', 'Fantasy'], 'TV', 24, 83, 231000, 'Vermilion Works', ['#0d1b2a', '#1b998b', '#ffd166'], 'A disgraced swordswoman guards a caravan through the Whistling Pass, where every gust has a name and a grudge.'],
  ['Hoshi no Kōkai', 'Starbound Voyage', '星の航海', ['Sci-Fi', 'Adventure', 'Drama'], 'TV', 13, 85, 203000, 'Studio Lantern', ['#03050f', '#233d8f', '#ff9ecd'], 'The last generation ship reaches its destination centuries early, and nobody aboard was trained to land it.'],
  ['Neko to Kōgyō', 'The Cat and the Factory', '猫と工業', ['Comedy', 'Slice of Life'], 'ONA', 8, 74, 41000, 'Kickflip', ['#2b1d0e', '#a86b2d', '#fff1c1'], 'A stray cat is appointed safety officer of a struggling toy factory. Productivity rises.'],
  ['Shin Kaigan', 'New Shore', '新海岸', ['Drama', 'Romance'], 'TV', 12, 78, 76000, 'Mono Frame', ['#1a2634', '#3f7ca8', '#ffe9c9'], 'Two rival lifeguards share one beach, one summer and a rescue neither can talk about.'],
  ['Getsurin', 'Halo of the Moon', '月輪', ['Supernatural', 'Action', 'Horror'], 'TV', 12, 80, 132000, 'Vermilion Works', ['#0e0713', '#5b2a86', '#ff6b6b'], 'On nights with a halo around the moon, the shrine gates open both ways.'],
  ['Hikari no Rōka', 'Corridor of Light', '光の廊下', ['Mystery', 'Drama'], 'TV', 11, 87, 149000, 'Paperlight', ['#111827', '#374151', '#fde68a'], 'A hospital night nurse notices the corridor lights blink in Morse, spelling out the names of patients who have not been admitted yet.'],
  ['Tetsudō Shōjo', 'Railway Girl', '鉄道少女', ['Adventure', 'Slice of Life'], 'TV', 12, 76, 69000, 'Orchard Animation', ['#14213d', '#fca311', '#e5e5e5'], 'A conductor-in-training rides every line in the country before her grandfather\'s timetable expires.'],
  ['Kagerō Machi', 'Heat Haze Town', '陽炎町', ['Psychological', 'Mystery', 'Supernatural'], 'TV', 12, 82, 118000, 'Mono Frame', ['#3d1f0f', '#c2410c', '#fef3c7'], 'In Heat Haze Town everyone remembers a summer that never happened, except the boy who caused it.'],
  ['Aoi Hōseki', 'The Blue Gem', '青い宝石', ['Fantasy', 'Adventure', 'Romance'], 'MOVIE', 1, 84, 95000, 'Studio Lantern', ['#052e3b', '#0e7490', '#a5f3fc'], 'A jewel thief and the princess she robbed cross a desert of glass to return what neither of them stole.'],
  ['Sakamichi', 'Uphill', '坂道', ['Sports', 'Drama'], 'TV', 24, 81, 110000, 'Kickflip', ['#1f2937', '#10b981', '#f9fafb'], 'A cycling club with no hills trains for the steepest race in the country.'],
  ['Yūgure Sentō', 'Twilight Bathhouse', '夕暮れ銭湯', ['Comedy', 'Supernatural', 'Slice of Life'], 'TV', 12, 79, 64000, 'Paperlight', ['#2a1a3e', '#7c3aed', '#fbcfe8'], 'The bathhouse on Twilight Street serves humans until six and everyone else after.'],
  ['Kōri no Ōkoku', 'Kingdom of Ice', '氷の王国', ['Fantasy', 'Action', 'Drama'], 'TV', 25, 86, 268000, 'Vermilion Works', ['#0b1a2b', '#3b82f6', '#e0f2fe'], 'The winter court has ruled for a thousand years; its youngest heir is the first to feel cold.'],
]

const TAGS = ['Female Protagonist', 'Ensemble Cast', 'Urban', 'Coming of Age', 'Found Family', 'Time Manipulation', 'Iyashikei', 'Tragedy', 'Ships', 'Cute Girls Doing Cute Things']
const CHARACTERS = ['Aoi Kisaragi', 'Ren Takahashi', 'Mio Sakurai', 'Kaito Mori', 'Yuna Hoshino', 'Sora Amano', 'Haru Ishikawa', 'Nagi Fujiwara']

function mulberry(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const MEDIA = TITLES.map(([romaji, english, native, genres, format, episodes, score, popularity, studio, palette, description], index) => {
  const id = 1001 + index
  const rand = mulberry(id * 7919)
  const releasing = index % 3 === 0 && format === 'TV'
  const airedEpisodes = releasing ? Math.max(3, Math.floor(episodes * 0.55)) : episodes
  const year = releasing ? YEAR : YEAR - (index % 4)
  const nextAiringEpisode = releasing
    ? { episode: airedEpisodes + 1, airingAt: NOW + 3600 * (18 + index * 7), timeUntilAiring: 3600 * (18 + index * 7) }
    : null
  const airingSchedule = {
    nodes: Array.from({ length: Math.min(episodes, 26) }, (_, i) => ({
      episode: i + 1,
      airingAt: NOW - 7 * 24 * 3600 * (airedEpisodes - i),
    })),
  }
  return {
    id,
    idMal: 50000 + id,
    type: 'ANIME',
    isAdult: false,
    isFavourite: false,
    title: { romaji, english, native, userPreferred: romaji },
    description: `${description} ${index % 2 ? 'The second cour opens on the far side of the mountains, where the story finally has room to breathe.' : 'Quiet, generous and unexpectedly funny, it earns every one of its bigger moments.'}`,
    genres,
    format,
    status: releasing ? 'RELEASING' : 'FINISHED',
    episodes,
    duration: format === 'MOVIE' ? 104 : 24,
    averageScore: score,
    meanScore: score,
    popularity,
    trending: Math.round(popularity / (index + 3)),
    favourites: Math.round(popularity / 12),
    season: releasing ? SEASON : ['WINTER', 'SPRING', 'SUMMER', 'FALL'][index % 4],
    seasonYear: year,
    startDate: { year, month: 1 + (index % 12), day: 1 + (index % 27) },
    endDate: releasing ? { year: null, month: null, day: null } : { year, month: 1 + ((index + 3) % 12), day: 25 },
    source: ['ORIGINAL', 'MANGA', 'LIGHT_NOVEL', 'WEB_NOVEL'][index % 4],
    countryOfOrigin: 'JP',
    synonyms: [english],
    hashtag: null,
    studios: { nodes: [{ id: 700 + (index % 6), name: studio, isAnimationStudio: true }] },
    coverImage: {
      extraLarge: `${ART_HOST}/poster/${id}-xl.jpg`,
      large: `${ART_HOST}/poster/${id}-l.jpg`,
      medium: `${ART_HOST}/poster/${id}-m.jpg`,
      color: palette[2],
    },
    bannerImage: `${ART_HOST}/banner/${id}.jpg`,
    trailer: null,
    nextAiringEpisode,
    airingSchedule,
    rankings: [
      { rank: index + 1, type: 'POPULAR', allTime: false, context: 'most popular this season', year, season: SEASON, format },
      { rank: 20 - index, type: 'RATED', allTime: false, context: 'highest rated this season', year, season: SEASON, format },
    ],
    tags: TAGS.slice(index % 4, (index % 4) + 4).map((name, i) => ({ name, rank: 90 - i * 12, isGeneralSpoiler: false, isMediaSpoiler: false })),
    mediaListEntry: null,
    relations: { edges: [] },
    characters: {
      edges: CHARACTERS.slice(0, 6).map((name, i) => ({
        role: i < 2 ? 'MAIN' : 'SUPPORTING',
        node: { id: 9000 + id * 10 + i, name: { full: name, native: name }, image: { large: `${ART_HOST}/face/${id}-${i}.jpg` } },
        voiceActors: [{ id: 8000 + i, name: { full: CHARACTERS[(i + 3) % CHARACTERS.length], native: '' }, image: { large: `${ART_HOST}/face/${id}-${i + 20}.jpg` } }],
      })),
    },
    staff: { edges: [] },
    recommendations: { nodes: [] },
    externalLinks: [],
    streamingEpisodes: [],
    _palette: palette,
    _seed: Math.floor(rand() * 1e9),
    _airedEpisodes: airedEpisodes,
  }
})

// Cross-links fill in once every record exists.
for (const [index, media] of MEDIA.entries()) {
  const related = MEDIA[(index + 5) % MEDIA.length]
  const sequel = MEDIA[(index + 9) % MEDIA.length]
  media.relations = { edges: [{ relationType: 'SEQUEL', node: sequel }, { relationType: 'SIDE_STORY', node: related }] }
  media.recommendations = { nodes: [2, 4, 7, 11, 13].map((offset, i) => ({ rating: 120 - i * 15, mediaRecommendation: MEDIA[(index + offset) % MEDIA.length] })) }
}

export const mediaById = (id) => MEDIA.find((media) => media.id === Number(id))

/** A deterministic ordering per row so no two Home rows show the same posters in the same order. */
export function listMedia(args = {}) {
  let pool = MEDIA
  if (Array.isArray(args.id_in)) pool = args.id_in.map(mediaById).filter(Boolean)
  if (args.genre) pool = pool.filter((media) => media.genres.includes(args.genre))
  if (Array.isArray(args.genre_in) && args.genre_in.length) pool = pool.filter((media) => args.genre_in.some((genre) => media.genres.includes(genre)))
  if (args.search) pool = pool.filter((media) => `${media.title.romaji} ${media.title.english}`.toLowerCase().includes(String(args.search).toLowerCase()))
  const sort = Array.isArray(args.sort) ? args.sort[0] : args.sort
  const ordered = [...pool]
  if (sort === 'SCORE_DESC') ordered.sort((a, b) => b.averageScore - a.averageScore)
  else if (sort === 'POPULARITY_DESC') ordered.sort((a, b) => b.popularity - a.popularity)
  else if (sort === 'TRENDING_DESC') ordered.sort((a, b) => b.trending - a.trending)
  else if (sort === 'START_DATE_DESC') ordered.sort((a, b) => b.seasonYear - a.seasonYear)
  const salt = `${sort ?? ''}:${args.genre ?? ''}:${args.season ?? ''}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  // Rotate the list so rows sharing a sort still open on different titles.
  const rotated = ordered.slice(salt % Math.max(1, ordered.length)).concat(ordered.slice(0, salt % Math.max(1, ordered.length)))
  const perPage = Math.min(Number(args.perPage ?? 20), 50)
  const page = Math.max(1, Number(args.page ?? 1))
  return rotated.slice((page - 1) * perPage, page * perPage)
}

export function airingSchedules(args = {}) {
  return MEDIA.filter((media) => media.status === 'RELEASING').slice(0, Number(args.perPage ?? 20)).map((media, i) => ({
    id: 3000 + i,
    episode: media._airedEpisodes,
    airingAt: NOW - 3600 * (2 + i * 9),
    timeUntilAiring: -3600 * (2 + i * 9),
    media,
  }))
}

export const GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']

/** AniZip-shaped episode metadata, so the series page has titles, synopses and stills. */
export function aniZipMappings(anilistId) {
  const media = mediaById(anilistId)
  if (!media) return { episodes: {}, episodeCount: 0 }
  const count = Math.min(media.episodes, 26)
  const episodes = {}
  const verbs = ['The Lighthouse', 'A Letter Unsent', 'What the Tide Keeps', 'Second Ferry', 'Radio Silence', 'Harbour Lights', 'The Long Way Round', 'Fog Season', 'Nightwatch', 'Low Water', 'The Last Crossing', 'Morning Comes', 'Salt and Ink', 'Half a Map', 'The Quiet Bell', 'Winter Timetable', 'Signal Fire', 'Home Port', 'Open Water', 'The Cape', 'Windward', 'Anchorage', 'Slack Tide', 'Landfall', 'Departures', 'Arrivals']
  for (let n = 1; n <= count; n++) {
    episodes[String(n)] = {
      episode: String(n),
      episodeNumber: n,
      absoluteEpisodeNumber: n,
      seasonNumber: 1,
      title: { en: verbs[(n - 1) % verbs.length], 'x-jat': verbs[(n - 1) % verbs.length], ja: media.title.native },
      overview: `${media.title.english} continues as ${verbs[(n - 1) % verbs.length].toLowerCase()} pulls the crew somewhere none of them expected, and the cost of staying finally comes due.`,
      airDate: new Date((NOW - 7 * 24 * 3600 * (count - n)) * 1000).toISOString().slice(0, 10),
      runtime: media.duration,
      length: media.duration,
      rating: (7 + ((n * 37) % 25) / 10).toFixed(1),
      image: `${ART_HOST}/still/${anilistId}-${n}.jpg`,
    }
  }
  return {
    titles: { 'x-jat': media.title.romaji, en: media.title.english, ja: media.title.native },
    episodes,
    episodeCount: count,
    specialCount: 0,
    mappings: { anilist_id: media.id, mal_id: media.idMal, kitsu_id: null, anidb_id: 40000 + media.id, thetvdb_id: 300000 + media.id, imdb_id: null, themoviedb_id: null },
  }
}

// ---------------------------------------------------------------------------------------------
// Generated key art. Layered skies, mountains, a skyline and a title lockup in the app's own
// Nunito face, seeded per title so every render is identical and every title looks distinct.
let fontCss = ''
export function loadFont(izumiDir) {
  try {
    const file = join(izumiDir, 'node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2')
    fontCss = `@font-face{font-family:'Nunito';font-weight:200 1000;src:url(data:font/woff2;base64,${readFileSync(file).toString('base64')}) format('woff2')}`
  } catch { fontCss = '' }
}

function mix(hex, target, amount) {
  const parse = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16))
  const a = parse(hex), b = parse(target)
  return `#${a.map((channel, i) => Math.round(channel + (b[i] - channel) * amount).toString(16).padStart(2, '0')).join('')}`
}

function scene(media, width, height, variant = 0, { title = true, horizon = 0.62 } = {}) {
  const [deep, mid, glow] = media._palette
  const rand = mulberry(media._seed + variant * 1013)
  const night = rand() > 0.45
  const sky = night ? deep : mix(mid, '#ffffff', 0.15)
  const skyTop = night ? mix(deep, '#000000', 0.5) : mix(mid, deep, 0.6)
  const sunX = width * (0.2 + rand() * 0.6)
  const sunY = height * (horizon - 0.18 - rand() * 0.2)
  const sunR = Math.min(width, height) * (0.08 + rand() * 0.1)
  const stars = night ? Array.from({ length: 70 }, () => `<circle cx="${(rand() * width).toFixed(1)}" cy="${(rand() * height * horizon).toFixed(1)}" r="${(0.4 + rand() * 1.4).toFixed(2)}" fill="#ffffff" opacity="${(0.3 + rand() * 0.7).toFixed(2)}"/>`).join('') : ''
  const ridge = (level) => {
    const points = [`0,${height}`]
    const base = height * (horizon + level * 0.08)
    const amplitude = height * (0.16 - level * 0.035)
    const steps = 9 + level * 2
    for (let i = 0; i <= steps; i++) {
      const x = (width / steps) * i
      const y = base - Math.abs(Math.sin(i * 1.7 + level + rand() * 0.6)) * amplitude - rand() * amplitude * 0.4
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }
    points.push(`${width},${height}`)
    return `<polygon points="${points.join(' ')}" fill="${mix(deep, '#000000', 0.15 + level * 0.22)}"/>`
  }
  const skyline = (() => {
    let x = 0
    const parts = []
    const base = height * (horizon + 0.2)
    while (x < width) {
      const w = 8 + rand() * 26
      const h = 10 + rand() * height * 0.16
      parts.push(`<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${mix(deep, '#000000', 0.7)}"/>`)
      for (let wy = base - h + 6; wy < base - 4; wy += 7) {
        if (rand() > 0.55) parts.push(`<rect x="${(x + 3).toFixed(1)}" y="${wy.toFixed(1)}" width="2.5" height="3" fill="${glow}" opacity="${(0.4 + rand() * 0.6).toFixed(2)}"/>`)
      }
      x += w + 2 + rand() * 6
    }
    return parts.join('')
  })()
  const petals = Array.from({ length: 26 }, () => {
    const px = rand() * width, py = rand() * height, size = 2 + rand() * 6
    return `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${size.toFixed(1)}" ry="${(size * 0.55).toFixed(1)}" fill="${glow}" opacity="${(0.25 + rand() * 0.5).toFixed(2)}" transform="rotate(${(rand() * 360).toFixed(0)} ${px.toFixed(1)} ${py.toFixed(1)})"/>`
  }).join('')
  const lockup = title ? (() => {
    const size = Math.max(22, Math.min(width * 0.075, height * 0.14))
    const y = height * (0.16 + rand() * 0.1)
    return `<g font-family="Nunito, sans-serif" text-anchor="middle">
      <text x="${width / 2}" y="${y.toFixed(1)}" font-size="${size.toFixed(1)}" font-weight="900" fill="#ffffff" stroke="${mix(deep, '#000000', 0.6)}" stroke-width="${(size * 0.14).toFixed(1)}" paint-order="stroke" letter-spacing="${(size * 0.02).toFixed(1)}">${escapeXml(media.title.english.toUpperCase())}</text>
      <text x="${width / 2}" y="${(y + size * 0.85).toFixed(1)}" font-size="${(size * 0.42).toFixed(1)}" font-weight="700" fill="${glow}" letter-spacing="${(size * 0.12).toFixed(1)}">${escapeXml(media.title.native)}</text>
    </g>` })() : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <style>${fontCss}</style>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${sky}"/></linearGradient>
      <radialGradient id="sun"><stop offset="0" stop-color="${glow}"/><stop offset="0.55" stop-color="${glow}" stop-opacity="0.9"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${mix(deep, '#000000', 0.55)}"/><stop offset="1" stop-color="${mix(deep, '#000000', 0.85)}"/></linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#sky)"/>
    ${stars}
    <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${(sunR * 2.6).toFixed(1)}" fill="url(#sun)" opacity="0.55"/>
    <circle cx="${sunX.toFixed(1)}" cy="${sunY.toFixed(1)}" r="${sunR.toFixed(1)}" fill="${night ? '#fff7e0' : glow}"/>
    ${ridge(0)}${ridge(1)}${ridge(2)}
    ${skyline}
    <rect x="0" y="${(height * (horizon + 0.2)).toFixed(1)}" width="${width}" height="${(height * (0.8 - horizon)).toFixed(1)}" fill="url(#ground)"/>
    ${petals}
    ${lockup}
  </svg>`
}

function escapeXml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function portrait(media, width, height) {
  const [deep, , glow] = media._palette
  const rand = mulberry(media._seed + 77)
  const band = `<rect x="${width - 22}" y="0" width="22" height="${height}" fill="${glow}" opacity="0.9"/>
    <text x="${width - 6}" y="${height - 16}" font-family="Nunito, sans-serif" font-size="13" font-weight="800" fill="${mix(deep, '#000000', 0.6)}" text-anchor="end" transform="rotate(-90 ${width - 6} ${height - 16})" letter-spacing="2">${escapeXml(media.title.romaji.toUpperCase())}</text>`
  const stripes = Array.from({ length: 4 }, (_, i) => `<rect x="0" y="${(height * 0.86 + i * 5).toFixed(1)}" width="${(width * (0.25 + rand() * 0.5)).toFixed(1)}" height="2" fill="${glow}" opacity="${(0.4 + i * 0.12).toFixed(2)}"/>`).join('')
  const base = scene(media, width, height, 3, { horizon: 0.7 })
  return base.replace('</svg>', `${band}${stripes}</svg>`)
}

function face(media, index) {
  const [deep, mid, glow] = media._palette
  const rand = mulberry(media._seed + index * 31)
  const hair = mix(mid, index % 2 ? '#000000' : '#ffffff', 0.35)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="230" height="345" viewBox="0 0 230 345">
    <rect width="230" height="345" fill="${mix(deep, '#ffffff', 0.08)}"/>
    <circle cx="115" cy="330" r="150" fill="${mix(mid, deep, 0.6)}"/>
    <ellipse cx="115" cy="150" rx="70" ry="82" fill="#f5d7c4"/>
    <path d="M45 150 C40 60 190 60 185 150 C170 105 150 80 115 82 C80 80 60 105 45 150 Z" fill="${hair}"/>
    <ellipse cx="88" cy="160" rx="9" ry="13" fill="${mix(glow, '#000000', 0.7)}"/>
    <ellipse cx="142" cy="160" rx="9" ry="13" fill="${mix(glow, '#000000', 0.7)}"/>
    <circle cx="91" cy="156" r="3" fill="#fff"/><circle cx="145" cy="156" r="3" fill="#fff"/>
    <path d="M100 200 Q115 ${205 + rand() * 12} 130 200" stroke="${mix(deep, '#000000', 0.5)}" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`
}

/** Route any fixture art URL to its SVG. */
export function artwork(pathname) {
  const match = /^\/(poster|banner|still|face)\/(\d+)(?:-(\w+))?\.jpg$/.exec(pathname)
  if (!match) return null
  const media = mediaById(match[2])
  if (!media) return null
  const [, kind, , suffix] = match
  // Banners carry no lockup: the client paints the title over them, as it does over real art.
  if (kind === 'banner') return scene(media, 1900, 640, 0, { title: false, horizon: 0.58 })
  if (kind === 'poster') return portrait(media, 460, 690)
  if (kind === 'still') return scene(media, 640, 360, 10 + Number(suffix ?? 1), { title: false, horizon: 0.5 + (Number(suffix ?? 1) % 5) * 0.05 })
  if (kind === 'face') return face(media, Number(suffix ?? 0))
  return null
}
