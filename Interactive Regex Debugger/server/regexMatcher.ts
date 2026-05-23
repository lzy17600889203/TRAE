import type { RegexNode, FSMState, MatchStep, RegexWarning } from '../shared/types'

interface BacktrackPoint {
  stateId: number
  inputIndex: number
  captureGroups: Record<number, { value: string; start: number; end: number }>
  transitionIndex: number
  nodesVisited: string[]
}

export class RegexMatcher {
  private ast: RegexNode
  private fsmStates: FSMState[]
  private startState: number
  private acceptStates: number[]
  private pattern: string
  private testString: string
  private flags: Set<string>
  private maxSteps: number
  private maxBacktracks: number

  constructor(
    ast: RegexNode,
    fsm: { states: FSMState[]; startState: number; acceptStates: number[] },
    pattern: string,
    testString: string,
    flags: string
  ) {
    this.ast = ast
    this.fsmStates = fsm.states
    this.startState = fsm.startState
    this.acceptStates = fsm.acceptStates
    this.pattern = pattern
    this.testString = testString
    this.flags = new Set(flags.split(''))
    this.maxSteps = 10000
    this.maxBacktracks = 5000
  }

  match(): { steps: MatchStep[]; finalResult: { matched: boolean; matchIndex: number | null; captureGroups: Record<number, { value: string; start: number; end: number }> }; warnings: RegexWarning[] } {
    const steps: MatchStep[] = []
    const warnings: RegexWarning[] = []

    if (this.detectCatastrophicBacktracking()) {
      warnings.push({
        type: 'catastrophic-backtrack',
        message: 'Detected potential catastrophic backtracking pattern. Execution may be slow.',
        position: 0
      })
    }

    const globalMatch = this.flags.has('g')
    const multiLine = this.flags.has('m')
    const caseInsensitive = this.flags.has('i')

    let currentIndex = 0
    let totalSteps = 0
    let totalBacktracks = 0
    let finalMatched = false
    let finalMatchIndex: number | null = null
    let finalCaptureGroups: Record<number, { value: string; start: number; end: number }> = {}

    while (currentIndex <= this.testString.length) {
      const result = this.matchAt(currentIndex, totalSteps, totalBacktracks, multiLine, caseInsensitive)

      steps.push(...result.steps)
      totalSteps += result.steps.length
      totalBacktracks += result.backtrackCount

      if (result.matched) {
        finalMatched = true
        finalMatchIndex = currentIndex
        finalCaptureGroups = result.captureGroups

        if (!globalMatch) {
          break
        }

        if (result.endIndex > currentIndex) {
          currentIndex = result.endIndex
        } else {
          currentIndex++
        }
      } else {
        currentIndex++
      }

      if (totalSteps > this.maxSteps || totalBacktracks > this.maxBacktracks) {
        warnings.push({
          type: 'performance',
          message: `Execution stopped after ${totalSteps} steps and ${totalBacktracks} backtracks to prevent infinite loop`,
          position: currentIndex
        })
        break
      }
    }

    return {
      steps,
      finalResult: {
        matched: finalMatched,
        matchIndex: finalMatchIndex,
        captureGroups: finalCaptureGroups
      },
      warnings
    }
  }

  private matchAt(
    startIndex: number,
    stepOffset: number,
    backtrackOffset: number,
    multiLine: boolean,
    caseInsensitive: boolean
  ): { steps: MatchStep[]; matched: boolean; endIndex: number; captureGroups: Record<number, { value: string; start: number; end: number }>; backtrackCount: number } {
    const steps: MatchStep[] = []
    const backtrackStack: BacktrackPoint[] = []
    let currentState = this.startState
    let currentInputIndex = startIndex
    let currentCaptureGroups: Record<number, { value: string; start: number; end: number }> = {}
    let transitionIndex = 0
    let nodesVisited: string[] = []
    let backtrackCount = 0
    let matched = false
    let endIndex = startIndex

    const getCurrentChar = (): string | null => {
      if (currentInputIndex >= this.testString.length) return null
      return this.testString[currentInputIndex]
    }

    const matchesChar = (symbol: string | null, char: string | null): boolean => {
      if (symbol === null) return true
      if (char === null) return symbol === '$' || symbol === '\\b' || symbol === '\\B'
      if (symbol === '.') return char !== '\n' || !multiLine
      if (symbol === '^') return currentInputIndex === startIndex
      if (symbol === '$') return currentInputIndex === this.testString.length
      if (symbol === '\\b') {
        const isWordChar = (c: string | null) => c !== null && /[a-zA-Z0-9_]/.test(c)
        const prevChar = currentInputIndex > startIndex ? this.testString[currentInputIndex - 1] : null
        return isWordChar(char) !== isWordChar(prevChar)
      }
      if (symbol === '\\B') {
        const isWordChar = (c: string | null) => c !== null && /[a-zA-Z0-9_]/.test(c)
        const prevChar = currentInputIndex > startIndex ? this.testString[currentInputIndex - 1] : null
        return isWordChar(char) === isWordChar(prevChar)
      }
      if (symbol.startsWith('[')) {
        return this.matchesCharacterClass(symbol, char, caseInsensitive)
      }
      if (symbol === '\\d') return /\d/.test(char)
      if (symbol === '\\D') return !/\d/.test(char)
      if (symbol === '\\w') return /\w/.test(char)
      if (symbol === '\\W') return !/\w/.test(char)
      if (symbol === '\\s') return /\s/.test(char)
      if (symbol === '\\S') return !/\s/.test(char)
      if (caseInsensitive) return symbol.toLowerCase() === char.toLowerCase()
      return symbol === char
    }

    let stepId = stepOffset

    while (true) {
      if (this.acceptStates.includes(currentState) && currentInputIndex >= startIndex) {
        matched = true
        endIndex = currentInputIndex

        steps.push({
          stepId: stepId++,
          stateId: currentState,
          inputIndex: currentInputIndex,
          currentChar: getCurrentChar(),
          matched: true,
          captureGroups: { ...currentCaptureGroups },
          action: 'accept',
          nodesVisited: [...nodesVisited]
        })
        break
      }

      const state = this.fsmStates.find(s => s.id === currentState)
      if (!state) {
        break
      }

      let transitionFound = false

      while (transitionIndex < state.transitions.length) {
        const transition = state.transitions[transitionIndex]

        if (transition.isEpsilon) {
          backtrackStack.push({
            stateId: currentState,
            inputIndex: currentInputIndex,
            captureGroups: { ...currentCaptureGroups },
            transitionIndex: transitionIndex + 1,
            nodesVisited: [...nodesVisited]
          })

          currentState = transition.targetStateId
          if (transition.nodeId) nodesVisited.push(transition.nodeId)
          transitionIndex = 0
          transitionFound = true

          steps.push({
            stepId: stepId++,
            stateId: currentState,
            inputIndex: currentInputIndex,
            currentChar: getCurrentChar(),
            matched: true,
            captureGroups: { ...currentCaptureGroups },
            action: 'epsilon',
            nodesVisited: [...nodesVisited]
          })
          break
        } else {
          const char = getCurrentChar()
          if (char !== null && matchesChar(transition.symbol, char)) {
            backtrackStack.push({
              stateId: currentState,
              inputIndex: currentInputIndex,
              captureGroups: { ...currentCaptureGroups },
              transitionIndex: transitionIndex + 1,
              nodesVisited: [...nodesVisited]
            })

            currentState = transition.targetStateId
            currentInputIndex++
            if (transition.nodeId) nodesVisited.push(transition.nodeId)
            transitionIndex = 0
            transitionFound = true

            steps.push({
              stepId: stepId++,
              stateId: currentState,
              inputIndex: currentInputIndex,
              currentChar: getCurrentChar(),
              matched: true,
              captureGroups: { ...currentCaptureGroups },
              action: 'consume',
              nodesVisited: [...nodesVisited]
            })
            break
          }
        }
        transitionIndex++
      }

      if (!transitionFound) {
        if (backtrackStack.length > 0) {
          const backtrackPoint = backtrackStack.pop()!
          currentState = backtrackPoint.stateId
          currentInputIndex = backtrackPoint.inputIndex
          currentCaptureGroups = backtrackPoint.captureGroups
          transitionIndex = backtrackPoint.transitionIndex
          nodesVisited = backtrackPoint.nodesVisited
          backtrackCount++

          steps.push({
            stepId: stepId++,
            stateId: currentState,
            inputIndex: currentInputIndex,
            currentChar: getCurrentChar(),
            matched: false,
            captureGroups: { ...currentCaptureGroups },
            action: 'backtrack',
            backtrackFrom: backtrackPoint.stateId,
            nodesVisited: [...nodesVisited]
          })

          if (backtrackCount > this.maxBacktracks) {
            break
          }
        } else {
          steps.push({
            stepId: stepId++,
            stateId: currentState,
            inputIndex: currentInputIndex,
            currentChar: getCurrentChar(),
            matched: false,
            captureGroups: {},
            action: 'fail',
            nodesVisited: [...nodesVisited]
          })
          break
        }
      }
    }

    return {
      steps,
      matched,
      endIndex,
      captureGroups: currentCaptureGroups,
      backtrackCount
    }
  }

  private matchesCharacterClass(pattern: string, char: string, caseInsensitive: boolean): boolean {
    let negate = false
    let startIndex = 1

    if (pattern[1] === '^') {
      negate = true
      startIndex = 2
    }

    const content = pattern.slice(startIndex, -1)
    let matched = false

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '\\') {
        i++
        if (content[i] === 'd') {
          if (/\d/.test(char)) { matched = true; break }
        } else if (content[i] === 'D') {
          if (!/\d/.test(char)) { matched = true; break }
        } else if (content[i] === 'w') {
          if (/\w/.test(char)) { matched = true; break }
        } else if (content[i] === 'W') {
          if (!/\w/.test(char)) { matched = true; break }
        } else if (content[i] === 's') {
          if (/\s/.test(char)) { matched = true; break }
        } else if (content[i] === 'S') {
          if (!/\s/.test(char)) { matched = true; break }
        } else {
          const target = caseInsensitive ? content[i].toLowerCase() : content[i]
          const testChar = caseInsensitive ? char.toLowerCase() : char
          if (target === testChar) { matched = true; break }
        }
      } else if (i + 2 < content.length && content[i + 1] === '-') {
        const start = content[i]
        const end = content[i + 2]
        const targetStart = caseInsensitive ? start.toLowerCase() : start
        const targetEnd = caseInsensitive ? end.toLowerCase() : end
        const testChar = caseInsensitive ? char.toLowerCase() : char
        if (testChar >= targetStart && testChar <= targetEnd) {
          matched = true
          break
        }
        i += 2
      } else {
        const target = caseInsensitive ? content[i].toLowerCase() : content[i]
        const testChar = caseInsensitive ? char.toLowerCase() : char
        if (target === testChar) { matched = true; break }
      }
    }

    return negate ? !matched : matched
  }

  private detectCatastrophicBacktracking(): boolean {
    const patterns = [
      /\(\w+[+*]\)[+*]/,
      /\([^)]*[+*][^)]*\)[+*]/,
      /\(\w+\|\w+\)[+*]/
    ]

    return patterns.some(p => p.test(this.pattern))
  }
}
