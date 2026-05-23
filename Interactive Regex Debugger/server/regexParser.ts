import type { RegexNode, RegexWarning } from '../shared/types'

export class RegexParser {
  private pattern: string
  private pos: number
  private warnings: RegexWarning[]
  private captureIndex: number

  constructor(pattern: string) {
    this.pattern = pattern
    this.pos = 0
    this.warnings = []
    this.captureIndex = 0
  }

  parse(): { ast: RegexNode; warnings: RegexWarning[] } {
    this.pos = 0
    this.captureIndex = 0
    this.warnings = []

    const ast = this.parseAlternation()

    if (this.pos < this.pattern.length) {
      this.warnings.push({
        type: 'useless-token',
        message: `Unexpected token at position ${this.pos}`,
        position: this.pos
      })
    }

    return { ast, warnings: this.warnings }
  }

  private parseAlternation(): RegexNode {
    const alternatives: RegexNode[] = []
    const left = this.parseSequence()
    alternatives.push(left)

    while (this.peek() === '|') {
      this.advance()
      const right = this.parseSequence()
      alternatives.push(right)
    }

    if (alternatives.length === 1) {
      return alternatives[0]
    }

    return {
      id: `alt-${this.pos}`,
      type: 'alternation',
      value: '|',
      children: alternatives
    }
  }

  private parseSequence(): RegexNode {
    const items: RegexNode[] = []

    while (this.pos < this.pattern.length && this.peek() !== '|' && this.peek() !== ')') {
      const item = this.parseTerm()
      if (item) {
        items.push(item)
      }
    }

    if (items.length === 0) {
      return {
        id: `empty-${this.pos}`,
        type: 'start',
        value: ''
      }
    }

    if (items.length === 1) {
      return items[0]
    }

    return {
      id: `seq-${this.pos}`,
      type: 'start',
      value: '',
      children: items
    }
  }

  private parseTerm(): RegexNode | null {
    if (this.pos >= this.pattern.length) return null

    const startPos = this.pos

    if (this.peek() === '(') {
      return this.parseGroup()
    }

    if (this.peek() === '[') {
      return this.parseCharacterClass()
    }

    if (this.peek() === '\\') {
      return this.parseEscape()
    }

    if (this.peek() === '.') {
      this.advance()
      const node: RegexNode = {
        id: `any-${startPos}`,
        type: 'any',
        value: '.'
      }
      return this.parseQuantifier(node)
    }

    if (this.peek() === '^' || this.peek() === '$') {
      const char = this.advance()
      return {
        id: `anchor-${startPos}`,
        type: 'anchor',
        value: char
      }
    }

    const char = this.advance()
    const node: RegexNode = {
      id: `lit-${startPos}`,
      type: 'literal',
      value: char
    }

    return this.parseQuantifier(node)
  }

  private parseGroup(): RegexNode {
    const startPos = this.pos
    this.advance()

    let isNonCapture = false
    let isLookahead = false
    let isLookbehind = false
    let isPositive = true
    let lookaheadChar = ''

    if (this.peek() === '?') {
      this.advance()

      if (this.peek() === ':') {
        this.advance()
        isNonCapture = true
      } else if (this.peek() === '=' || this.peek() === '!') {
        isLookahead = true
        lookaheadChar = this.advance()
        isPositive = lookaheadChar === '='
      } else if (this.peek() === '<') {
        this.advance()
        if (this.peek() === '=' || this.peek() === '!') {
          isLookbehind = true
          lookaheadChar = this.advance()
          isPositive = lookaheadChar === '='
        }
      }
    }

    let groupIndex: number | undefined
    if (!isNonCapture && !isLookahead && !isLookbehind) {
      this.captureIndex++
      groupIndex = this.captureIndex
    }

    const content = this.parseAlternation()

    if (this.peek() === ')') {
      this.advance()
    } else {
      this.warnings.push({
        type: 'useless-token',
        message: 'Missing closing parenthesis',
        position: startPos
      })
    }

    const node: RegexNode = {
      id: `group-${startPos}`,
      type: isLookahead ? 'lookahead' : isLookbehind ? 'lookbehind' : 'group',
      value: isNonCapture ? '(?:...)' : isLookahead ? (isPositive ? '(?=...)' : '(?!...)') : isLookbehind ? (isPositive ? '(?<=...)' : '(?<!...)') : '(...)',
      children: [content],
      isNonCapture,
      isLookahead,
      isLookbehind,
      isPositive,
      groupIndex
    }

    return this.parseQuantifier(node)
  }

  private parseCharacterClass(): RegexNode {
    const startPos = this.pos
    this.advance()

    let negate = false
    if (this.peek() === '^') {
      negate = true
      this.advance()
    }

    const characters: string[] = []
    while (this.pos < this.pattern.length && this.peek() !== ']') {
      if (this.peek() === '\\') {
        this.advance()
        const escaped = this.parseEscapeChar()
        characters.push(escaped)
      } else {
        const char = this.advance()
        if (this.peek() === '-' && this.pos + 1 < this.pattern.length && this.pattern[this.pos + 1] !== ']') {
          this.advance()
          const endChar = this.peek()
          if (endChar !== ']') {
            this.advance()
            const startCode = char.charCodeAt(0)
            const endCode = endChar.charCodeAt(0)
            for (let i = startCode; i <= endCode; i++) {
              characters.push(String.fromCharCode(i))
            }
            continue
          }
        }
        characters.push(char)
      }
    }

    if (this.peek() === ']') {
      this.advance()
    }

    const node: RegexNode = {
      id: `class-${startPos}`,
      type: 'class',
      value: `[${negate ? '^' : ''}${characters.join('')}]`,
      negate
    }

    return this.parseQuantifier(node)
  }

  private parseEscape(): RegexNode {
    const startPos = this.pos
    this.advance()

    const char = this.peek()

    if (char === 'd') {
      this.advance()
      return this.parseQuantifier({ id: `class-${startPos}`, type: 'class', value: '\\d' })
    }
    if (char === 'D') {
      this.advance()
      return this.parseQuantifier({ id: `class-${startPos}`, type: 'class', value: '\\D' })
    }
    if (char === 'w') {
      this.advance()
      return this.parseQuantifier({ id: `class-${startPos}`, type: 'class', value: '\\w' })
    }
    if (char === 'W') {
      this.advance()
      return this.parseQuantifier({ id: `class-${startPos}`, type: 'class', value: '\\W' })
    }
    if (char === 's') {
      this.advance()
      return this.parseQuantifier({ id: `class-${startPos}`, type: 'class', value: '\\s' })
    }
    if (char === 'S') {
      this.advance()
      return this.parseQuantifier({ id: `class-${startPos}`, type: 'class', value: '\\S' })
    }
    if (char === 'b') {
      this.advance()
      return this.parseQuantifier({ id: `anchor-${startPos}`, type: 'anchor', value: '\\b' })
    }
    if (char === 'B') {
      this.advance()
      return this.parseQuantifier({ id: `anchor-${startPos}`, type: 'anchor', value: '\\B' })
    }

    if (char >= '1' && char <= '9') {
      this.advance()
      return this.parseQuantifier({
        id: `backref-${startPos}`,
        type: 'backreference',
        value: `\\${char}`,
        groupIndex: parseInt(char)
      })
    }

    this.advance()
    return this.parseQuantifier({
      id: `lit-${startPos}`,
      type: 'literal',
      value: char
    })
  }

  private parseEscapeChar(): string {
    const char = this.peek()

    if (char === 'd') { this.advance(); return '\\d' }
    if (char === 'D') { this.advance(); return '\\D' }
    if (char === 'w') { this.advance(); return '\\w' }
    if (char === 'W') { this.advance(); return '\\W' }
    if (char === 's') { this.advance(); return '\\s' }
    if (char === 'S') { this.advance(); return '\\S' }

    this.advance()
    return char
  }

  private parseQuantifier(node: RegexNode): RegexNode {
    const startPos = this.pos

    if (this.peek() === '*') {
      this.advance()
      let greedy = true
      if (this.peek() === '?') {
        this.advance()
        greedy = false
      }
      return {
        id: `quant-${startPos}`,
        type: 'quantifier',
        value: greedy ? '*' : '*?',
        children: [node],
        quantifier: { min: 0, max: Infinity, greedy }
      }
    }

    if (this.peek() === '+') {
      this.advance()
      let greedy = true
      if (this.peek() === '?') {
        this.advance()
        greedy = false
      }
      return {
        id: `quant-${startPos}`,
        type: 'quantifier',
        value: greedy ? '+' : '+?',
        children: [node],
        quantifier: { min: 1, max: Infinity, greedy }
      }
    }

    if (this.peek() === '?') {
      this.advance()
      let greedy = true
      if (this.peek() === '?') {
        this.advance()
        greedy = false
      }
      return {
        id: `quant-${startPos}`,
        type: 'quantifier',
        value: greedy ? '?' : '??',
        children: [node],
        quantifier: { min: 0, max: 1, greedy }
      }
    }

    if (this.peek() === '{') {
      this.advance()
      const minStr = this.readNumber()
      const min = minStr ? parseInt(minStr) : 0

      let max = min
      if (this.peek() === ',') {
        this.advance()
        const maxStr = this.readNumber()
        max = maxStr ? parseInt(maxStr) : Infinity
      }

      if (this.peek() === '}') {
        this.advance()
      }

      let greedy = true
      if (this.peek() === '?') {
        this.advance()
        greedy = false
      }

      if (min === 0 && max === Infinity) {
        this.warnings.push({
          type: 'redundant-escape',
          message: '{0,} is equivalent to *',
          position: startPos
        })
      }

      return {
        id: `quant-${startPos}`,
        type: 'quantifier',
        value: `{${min},${max === Infinity ? '' : max}}${greedy ? '' : '?'}`,
        children: [node],
        quantifier: { min, max, greedy }
      }
    }

    return node
  }

  private readNumber(): string {
    let result = ''
    while (this.pos < this.pattern.length && /\d/.test(this.peek())) {
      result += this.advance()
    }
    return result
  }

  private peek(): string {
    return this.pattern[this.pos] || ''
  }

  private advance(): string {
    return this.pattern[this.pos++] || ''
  }
}
