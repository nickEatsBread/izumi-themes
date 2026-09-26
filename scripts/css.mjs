// Full stylesheet check for catalog packages. The client strips what it refuses; the catalog fails
// instead, so authors see every problem before a listing ships.
import * as csstree from 'css-tree'
import { BLOCKED_AT_RULES, BLOCKED_PROPERTIES, RESERVED_PROPERTY_PREFIX, THEME_CSS_MAX_DEPTH, THEME_CSS_MAX_RULES, forbiddenCss, precheckThemeCss } from './css-policy.ts'

const DATA_IMAGE = /^data:image\/(png|jpeg|gif|webp|avif|svg\+xml)[;,]/i

export function checkThemeCss(text) {
  precheckThemeCss(text)
  const problems = []
  const ast = csstree.parse(text, { onParseError: (error) => problems.push(`parse error: ${error.formattedMessage ?? error.message}`) })
  let rules = 0
  let depth = 0
  csstree.walk(ast, {
    enter(node) {
      if (node.type === 'Block' && ++depth > THEME_CSS_MAX_DEPTH + 1) problems.push('nesting is too deep')
      if (node.type === 'Rule' || node.type === 'Atrule') if (++rules > THEME_CSS_MAX_RULES) problems.push('too many rules')
      if (node.type === 'Atrule' && BLOCKED_AT_RULES.includes(csstree.keyword(node.name).basename)) problems.push(`@${node.name} is not allowed`)
      if (node.type === 'Url' && !DATA_IMAGE.test(node.value)) problems.push(`url(${node.value}) is not allowed`)
      if (node.type === 'Declaration') {
        const property = node.property.toLowerCase()
        const value = csstree.generate(node.value)
        if (BLOCKED_PROPERTIES.includes(property)) problems.push(`${property} is not allowed`)
        if (property.startsWith(RESERVED_PROPERTY_PREFIX)) problems.push(`${property} is reserved`)
        if (property.startsWith('--') && value.includes('\\')) problems.push(`${property} may not contain escapes`)
        const issue = forbiddenCss(value)
        if (issue) problems.push(`${property}: ${issue}`)
      }
    },
    leave(node) {
      if (node.type === 'Block') depth--
    },
  })
  if (problems.length) throw new Error(`Theme stylesheet rejected:\n  ${[...new Set(problems)].join('\n  ')}`)
}
