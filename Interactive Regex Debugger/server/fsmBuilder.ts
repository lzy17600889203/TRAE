import type { RegexNode, FSMState, FSMTransition } from '../shared/types'

interface FSMBuilderState {
  nextStateId: number
  states: FSMState[]
}

export class FSMBuilder {
  private state: FSMBuilderState

  constructor() {
    this.state = {
      nextStateId: 0,
      states: []
    }
  }

  build(ast: RegexNode): { states: FSMState[]; startState: number; acceptStates: number[] } {
    this.state = {
      nextStateId: 0,
      states: []
    }

    const startState = this.createState(false)
    const acceptState = this.createState(true)

    this.buildTransitions(ast, startState, acceptState)

    return {
      states: this.state.states,
      startState: startState,
      acceptStates: [acceptState]
    }
  }

  private createState(isAccepting: boolean): number {
    const id = this.state.nextStateId++
    this.state.states.push({
      id,
      isAccepting,
      transitions: []
    })
    return id
  }

  private addTransition(from: number, to: number, symbol: string | null, isEpsilon: boolean, nodeId?: string): void {
    const state = this.state.states.find(s => s.id === from)
    if (state) {
      state.transitions.push({
        symbol,
        targetStateId: to,
        isEpsilon,
        nodeId
      })
    }
  }

  private buildTransitions(node: RegexNode, from: number, to: number): void {
    switch (node.type) {
      case 'start':
      case 'end':
        if (node.children) {
          let currentFrom = from
          for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i]
            if (i === node.children.length - 1) {
              this.buildTransitions(child, currentFrom, to)
            } else {
              const intermediate = this.createState(false)
              this.buildTransitions(child, currentFrom, intermediate)
              currentFrom = intermediate
            }
          }
        } else {
          this.addTransition(from, to, null, true, node.id)
        }
        break

      case 'literal':
        this.addTransition(from, to, node.value, false, node.id)
        break

      case 'any':
        this.addTransition(from, to, '.', false, node.id)
        break

      case 'class':
        this.addTransition(from, to, node.value, false, node.id)
        break

      case 'anchor':
        this.addTransition(from, to, node.value, false, node.id)
        break

      case 'backreference':
        this.addTransition(from, to, node.value, false, node.id)
        break

      case 'quantifier': {
        const child = node.children?.[0]
        if (child && node.quantifier) {
          const { min, max, greedy } = node.quantifier

          for (let i = 0; i < min; i++) {
            const intermediate = this.createState(false)
            this.buildTransitions(child, from, intermediate)
            from = intermediate
          }

          if (max === Infinity) {
            const loopState = this.createState(false)
            if (greedy) {
              this.buildTransitions(child, from, loopState)
              this.addTransition(loopState, from, null, true, node.id)
              this.addTransition(loopState, to, null, true, node.id)
            } else {
              this.addTransition(from, to, null, true, node.id)
              this.buildTransitions(child, from, loopState)
              this.addTransition(loopState, from, null, true, node.id)
            }
          } else if (max > min) {
            const optionalStates: number[] = []
            for (let i = 0; i < max - min; i++) {
              const intermediate = this.createState(false)
              optionalStates.push(intermediate)
            }

            let currentFrom = from
            for (let i = 0; i < optionalStates.length; i++) {
              if (greedy) {
                this.buildTransitions(child, currentFrom, optionalStates[i])
                this.addTransition(optionalStates[i], to, null, true, node.id)
              } else {
                this.addTransition(currentFrom, to, null, true, node.id)
                this.buildTransitions(child, currentFrom, optionalStates[i])
              }
              currentFrom = optionalStates[i]
            }
            this.buildTransitions(child, currentFrom, to)
          } else {
            this.buildTransitions(child, from, to)
          }
        }
        break
      }

      case 'group':
      case 'capture':
      case 'lookahead':
      case 'lookbehind': {
        if (node.children?.[0]) {
          this.buildTransitions(node.children[0], from, to)
        }
        break
      }

      case 'alternation': {
        if (node.children) {
          for (const child of node.children) {
            this.buildTransitions(child, from, to)
          }
        }
        break
      }
    }
  }
}
