// A selection-set resolver over the fixture catalogue. It walks whatever the client asks for, so
// new fields in the client's fragments resolve to fixture values by name (or null), and the
// normalised cache always receives a complete document.
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { GENRES, MEDIA, airingSchedules, listMedia, mediaById } from './fixtures.mjs'

let parse
export function loadParser(izumiDir) {
  const require = createRequire(join(izumiDir, 'package.json'))
  parse = require('@0no-co/graphql.web').parse
}

const ROOT = {
  Page: () => ({
    pageInfo: { total: MEDIA.length, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: 20 },
    media: (args) => listMedia(args),
    airingSchedules: (args) => airingSchedules(args),
    mediaList: () => [],
    characters: () => [],
    staff: () => [],
    studios: () => [],
  }),
  Media: (args) => mediaById(args.id) ?? null,
  MediaListCollection: () => ({ lists: [], user: null }),
  GenreCollection: () => GENRES,
  MediaTagCollection: () => [],
  Viewer: () => null,
  User: () => null,
  Studio: (args) => ({ id: args.id, name: 'Studio Lantern', isAnimationStudio: true, media: { nodes: listMedia({ perPage: 12 }) } }),
  Staff: () => null,
  Character: () => null,
  AiringSchedule: () => null,
}

function valueOf(node, variables) {
  switch (node.kind) {
    case 'Variable': return variables[node.name.value]
    case 'IntValue': return Number.parseInt(node.value, 10)
    case 'FloatValue': return Number.parseFloat(node.value)
    case 'StringValue': case 'EnumValue': return node.value
    case 'BooleanValue': return node.value
    case 'NullValue': return null
    case 'ListValue': return node.values.map((item) => valueOf(item, variables))
    case 'ObjectValue': return Object.fromEntries(node.fields.map((field) => [field.name.value, valueOf(field.value, variables)]))
    default: return null
  }
}

function argsOf(field, variables) {
  return Object.fromEntries((field.arguments ?? []).map((argument) => [argument.name.value, valueOf(argument.value, variables)]))
}

function included(node, variables) {
  for (const directive of node.directives ?? []) {
    const condition = valueOf(directive.arguments?.[0]?.value ?? { kind: 'BooleanValue', value: true }, variables)
    if (directive.name.value === 'include' && !condition) return false
    if (directive.name.value === 'skip' && condition) return false
  }
  return true
}

function resolveSelection(selectionSet, value, variables, fragments, path) {
  if (value == null) return null
  if (Array.isArray(value)) return value.map((item) => resolveSelection(selectionSet, item, variables, fragments, path))
  const result = {}
  const visit = (selection) => {
    if (!included(selection, variables)) return
    if (selection.kind === 'FragmentSpread') {
      const fragment = fragments.get(selection.name.value)
      if (fragment) fragment.selectionSet.selections.forEach(visit)
      return
    }
    if (selection.kind === 'InlineFragment') {
      selection.selectionSet.selections.forEach(visit)
      return
    }
    const name = selection.name.value
    const key = selection.alias?.value ?? name
    if (name === '__typename') { result[key] = value.__typename ?? typenameFor(path); return }
    let field = value[name]
    if (typeof field === 'function') field = field(argsOf(selection, variables))
    if (field === undefined) field = null
    result[key] = selection.selectionSet ? resolveSelection(selection.selectionSet, field, variables, fragments, [...path, name]) : field
  }
  selectionSet.selections.forEach(visit)
  return result
}

// Typenames follow AniList's schema so the client's normalised cache keys (or deliberately
// embeds) each object exactly as it would a live response.
const TYPENAMES = {
  Page: 'Page', pageInfo: 'PageInfo', media: 'Media', Media: 'Media', mediaRecommendation: 'Media',
  title: 'MediaTitle', coverImage: 'MediaCoverImage', rankings: 'MediaRank', studios: 'StudioConnection',
  airingSchedule: 'AiringScheduleConnection', airingSchedules: 'AiringSchedule', nextAiringEpisode: 'AiringSchedule',
  startDate: 'FuzzyDate', endDate: 'FuzzyDate', startedAt: 'FuzzyDate', completedAt: 'FuzzyDate', trailer: 'MediaTrailer',
  tags: 'MediaTag', mediaListEntry: 'MediaList', mediaList: 'MediaList', relations: 'MediaConnection',
  characters: 'CharacterConnection', staff: 'StaffConnection', recommendations: 'RecommendationConnection',
  voiceActors: 'Staff', name: 'CharacterName', image: 'CharacterImage', externalLinks: 'MediaExternalLink',
  streamingEpisodes: 'MediaStreamingEpisode', lists: 'MediaListGroup', entries: 'MediaList', MediaListCollection: 'MediaListCollection',
  Studio: 'Studio', Staff: 'Staff', Character: 'Character', user: 'User', Viewer: 'User',
}
function typenameFor(path) {
  const last = path[path.length - 1]
  const parent = path[path.length - 2]
  if (last === 'nodes' || last === 'edges' || last === 'node') {
    const owner = last === 'node' ? path[path.length - 3] : parent
    const connection = { studios: 'Studio', airingSchedule: 'AiringSchedule', relations: 'Media', characters: 'Character', staff: 'Staff', recommendations: 'Recommendation', media: 'Media' }[owner] ?? 'Media'
    if (last === 'edges') return `${connection}Edge`
    return connection
  }
  return TYPENAMES[last] ?? 'Object'
}

/** Execute one GraphQL request body against the fixtures. */
export function executeGraphql(body) {
  const { query, variables = {}, operationName } = JSON.parse(body || '{}')
  const document = parse(query)
  const fragments = new Map()
  let operation
  for (const definition of document.definitions) {
    if (definition.kind === 'FragmentDefinition') fragments.set(definition.name.value, definition)
    else if (definition.kind === 'OperationDefinition' && (!operation || definition.name?.value === operationName)) operation = definition
  }
  if (!operation) throw new Error('No operation in request.')
  const resolved = { ...variables }
  for (const variable of operation.variableDefinitions ?? []) {
    const name = variable.variable.name.value
    if (resolved[name] === undefined && variable.defaultValue) resolved[name] = valueOf(variable.defaultValue, resolved)
  }
  if (operation.operation === 'mutation') return { data: null, errors: [{ message: 'Previews are read-only.' }] }
  return { data: resolveSelection(operation.selectionSet, ROOT, resolved, fragments, []) }
}
