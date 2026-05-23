export interface RegexNode {
  id: string
  type: 'start' | 'end' | 'literal' | 'quantifier' | 'group' | 'capture' | 'lookahead' | 'lookbehind' | 'any' | 'class' | 'anchor' | 'alternation' | 'backreference'
  value: string
  children?: RegexNode[]
  quantifier?: { min: number; max: number; greedy: boolean }
  negate?: boolean
  groupIndex?: number
  isNonCapture?: boolean
  isLookahead?: boolean
  isLookbehind?: boolean
  isPositive?: boolean
}

export interface FSMState {
  id: number
  isAccepting: boolean
  transitions: FSMTransition[]
  nodeId?: string
}

export interface FSMTransition {
  symbol: string | null
  targetStateId: number
  isEpsilon: boolean
  nodeId?: string
}

export interface MatchStep {
  stepId: number
  stateId: number
  inputIndex: number
  currentChar: string | null
  matched: boolean
  captureGroups: Record<number, { value: string; start: number; end: number }>
  backtrackFrom?: number
  action: 'consume' | 'epsilon' | 'backtrack' | 'fail' | 'accept'
  nodesVisited: string[]
}

export interface RegexAnalysisResult {
  ast: RegexNode
  fsm: {
    states: FSMState[]
    startState: number
    acceptStates: number[]
  }
  steps: MatchStep[]
  finalResult: {
    matched: boolean
    matchIndex: number | null
    captureGroups: Record<number, { value: string; start: number; end: number }>
  }
  warnings: RegexWarning[]
}

export interface RegexWarning {
  type: 'catastrophic-backtrack' | 'redundant-escape' | 'empty-match' | 'useless-token' | 'performance'
  message: string
  position: number
}

export interface RegexSnippet {
  id: number
  name: string
  pattern: string
  description: string
  flags: string
  createdAt: number
  updatedAt: number
}

export interface DebugHistory {
  id: number
  pattern: string
  testString: string
  flags: string
  result: string
  createdAt: number
}

export interface PresetScenario {
  id: string
  name: string
  description: string
  pattern: string
  testString: string
  flags: string
  expectedBehavior: string
  category: 'greedy' | 'backtrack' | 'lookaround' | 'email'
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'greedy-trap',
    name: '贪婪匹配陷阱场景',
    description: '演示贪婪匹配如何导致意外结果，对比贪婪与非贪婪模式的差异',
    pattern: '<.*>',
    testString: '<div>Hello</div><span>World</span>',
    flags: 'g',
    expectedBehavior: '贪婪模式会匹配从第一个<到最后一个>之间的所有内容，非贪婪<.*?>则会分别匹配每个标签',
    category: 'greedy'
  },
  {
    id: 'backtrack-disaster',
    name: '回溯灾难场景',
    description: '演示灾难性回溯（Catastrophic Backtracking）导致的性能问题',
    pattern: '^(a+)+$',
    testString: 'aaaaaaaaaaaaaaaaaaaaaaaaaX',
    flags: '',
    expectedBehavior: '由于嵌套量词导致指数级回溯尝试，输入字符串较长时会出现明显的卡顿',
    category: 'backtrack'
  },
  {
    id: 'lookaround-assertion',
    name: '零宽断言场景',
    description: '演示正向先行断言、负向先行断言等零宽断言的匹配行为',
    pattern: '\\d+(?=px|em)',
    testString: 'font-size: 16px; margin: 2em; padding: 10pt; border: 5px;',
    flags: 'g',
    expectedBehavior: '只匹配后面跟随px或em的数字，10pt不会被匹配',
    category: 'lookaround'
  },
  {
    id: 'complex-email',
    name: '复杂邮箱校验场景',
    description: '演示复杂的邮箱正则表达式匹配各种有效和无效邮箱',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    testString: 'user@example.com\ninvalid-email\nuser.name+tag@domain.co.uk\n@nouser.com',
    flags: 'm',
    expectedBehavior: '验证邮箱格式，user@example.com和user.name+tag@domain.co.uk应匹配',
    category: 'email'
  }
]
