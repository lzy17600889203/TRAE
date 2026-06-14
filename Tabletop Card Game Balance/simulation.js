// 蒙特卡洛卡牌对战模拟引擎
// 简化的类炉石风格对战模型

const MAX_TURNS = 60;
const START_HP = 30;
const START_HAND = 3;
const MAX_HAND = 10;
const MAX_MANA = 10;
const START_DECK_SIZE = 30;

// 洗牌
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 基于卡牌数据构建一套牌组：每张卡放入 2 份
function buildDeck(cards) {
  const deck = [];
  cards.forEach((c) => {
    const copies = c.copies || 2;
    for (let i = 0; i < copies; i++) {
      deck.push({
        id: c.id,
        name: c.name,
        cost: c.cost,
        attack: c.attack,
        health: c.health,
        type: c.type || 'minion',
        // 衍生数据
      });
    }
  });
  return deck;
}

// 进行一局对战
// deckA/deckB 均为 card 对象数组（完整牌组）
// 输出：{ winner: 'A' | 'B' | 'draw', turns: 回合数, firstPlayer: 'A' | 'B' }
function simulateBattle(deckA, deckB, firstPlayer, rng) {
  const state = {
    A: { hp: START_HP, mana: 0, maxMana: 0, deck: shuffle(deckA, rng), hand: [], board: [] },
    B: { hp: START_HP, mana: 0, maxMana: 0, deck: shuffle(deckB, rng), hand: [], board: [] },
  };

  // 初始手牌
  for (let i = 0; i < START_HAND; i++) {
    draw(state.A);
    draw(state.B);
  }

  let current = firstPlayer;
  let turns = 0;

  for (let t = 0; t < MAX_TURNS; t++) {
    turns = t + 1;
    const p = state[current];
    p.maxMana = Math.min(MAX_MANA, p.maxMana + 1);
    p.mana = p.maxMana;
    draw(p);

    // 出牌阶段：贪心，按能打出的最优先高费（强力）卡
    playCards(p, state[current === 'A' ? 'B' : 'A'], state, rng);

    // 攻击阶段
    attackPhase(p, state[current === 'A' ? 'B' : 'A']);

    // 检查胜负
    if (state.A.hp <= 0 && state.B.hp <= 0) {
      return { winner: 'draw', turns, firstPlayer };
    }
    if (state.A.hp <= 0) {
      return { winner: 'B', turns, firstPlayer };
    }
    if (state.B.hp <= 0) {
      return { winner: 'A', turns, firstPlayer };
    }

    current = current === 'A' ? 'B' : 'A';
  }

  // 超时平局：以血量高者胜，否则平局
  if (state.A.hp > state.B.hp) return { winner: 'A', turns, firstPlayer };
  if (state.B.hp > state.A.hp) return { winner: 'B', turns, firstPlayer };
  return { winner: 'draw', turns, firstPlayer };
}

function draw(p) {
  if (p.deck.length > 0 && p.hand.length < MAX_HAND) {
    p.hand.push(p.deck.shift());
  } else if (p.deck.length === 0) {
    // 疲劳伤害
    p.hp -= 1;
  }
}

function playCards(p, opponent, state, rng) {
  // 贪心：按费用从高到低尝试打出
  let played = true;
  while (played) {
    played = false;
    const sorted = p.hand
      .map((c, i) => ({ c, i }))
      .filter((x) => x.c.cost <= p.mana)
      .sort((a, b) => b.c.cost - a.c.cost);
    for (const { c, i } of sorted) {
      if (c.cost <= p.mana) {
        // 费用惩罚：费用越高，上场当回合的"稳定性惩罚"越强
        // 简化：高费随从第一回合不能攻击（召唤病），已在 canAttack=false 中体现
        p.mana -= c.cost;
        p.board.push({ ...c, canAttack: false, currentHealth: c.health });
        p.hand.splice(i, 1);
        played = true;
        break;
      }
    }
  }
}

function attackPhase(attacker, defender) {
  const alive = attacker.board.filter((m) => m.currentHealth > 0);
  for (const minion of alive) {
    if (minion.canAttack === false) {
      minion.canAttack = true;
      continue;
    }
    if (defender.board.length > 0) {
      const target = defender.board
        .slice()
        .sort((a, b) => a.currentHealth - b.currentHealth)[0];
      if (target && target.currentHealth > 0) {
        target.currentHealth -= minion.attack;
        minion.currentHealth -= target.attack;
        if (minion.currentHealth <= 0) continue; // 已死的随从停止
      } else {
        defender.hp -= minion.attack;
      }
    } else {
      defender.hp -= minion.attack;
    }
    if (defender.hp <= 0) return;
  }
  attacker.board = attacker.board.filter((m) => m.currentHealth > 0);
  defender.board = defender.board.filter((m) => m.currentHealth > 0);
}

// 蒙特卡洛：对某张"目标卡"做胜率评估
// 方案：A 的牌堆 = 基线牌堆 但把其中一张最弱卡替换为目标卡(2 份)
//       B 的牌堆 = 纯基线牌堆（所有卡各 2 份，去除目标卡自己）
// 这样胜率能反映"这张卡比平均水平强/弱多少"。
function runMonteCarlo(targetCard, allCards, iterations = 2000, rngSeed) {
  let seed = rngSeed || Date.now();
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rng = mulberry32(seed);

  // 评估策略（关键改进）：
  // 对比的不是与整体环境，而是与"同费用的其他卡"替换后的效果。
  // 这样高费卡不会因为总数值大天然超模，低费卡也不会天然弱小。
  // A = [目标卡 2 份] + 其他非"与目标卡同费用"卡各 2 份
  // B = [与目标卡同费用的其他卡 2 份] + 其他非"与目标卡同费用"卡各 2 份
  // 若所有同费卡数值相同，则 WR ≈ 0.5；若某卡数值超标，则 WR > 0.65。
  const otherCards = allCards.filter((c) => c.id !== targetCard.id);
  const sameCostCards = otherCards.filter((c) => c.cost === targetCard.cost);
  const diffCostCards = otherCards.filter((c) => c.cost !== targetCard.cost);

  const deckA = [];
  deckA.push({ ...targetCard });
  deckA.push({ ...targetCard });
  diffCostCards.forEach((c) => { deckA.push({ ...c }); deckA.push({ ...c }); });
  // 若还有其他同费卡，也加入 A 以维持牌堆大小一致
  sameCostCards.forEach((c) => { deckA.push({ ...c }); deckA.push({ ...c }); });

  const deckB = [];
  // B 中用一张"与目标卡同费其他卡"（如果有）来替代；否则用随机其他费替代
  let replacedBy;
  if (sameCostCards.length > 0) {
    replacedBy = sameCostCards[0];
  } else if (diffCostCards.length > 0) {
    replacedBy = diffCostCards[0];
  } else {
    replacedBy = { ...targetCard };
  }
  deckB.push({ ...replacedBy });
  deckB.push({ ...replacedBy });
  diffCostCards.forEach((c) => { deckB.push({ ...c }); deckB.push({ ...c }); });
  sameCostCards.forEach((c) => { deckB.push({ ...c }); deckB.push({ ...c }); });

  let winsA = 0;
  let winsB = 0;
  let draws = 0;
  let totalTurns = 0;
  let firstPlayerWins = 0;
  let totalFirstPlayer = 0;

  // 历史：每 100 局一个样本点
  const history = [];
  const blockSize = Math.max(50, Math.floor(iterations / 40));
  let blockWins = 0;
  let blockTotal = 0;

  for (let i = 0; i < iterations; i++) {
    const first = i % 2 === 0 ? 'A' : 'B';
    const res = simulateBattle(deckA, deckB, first, rng);
    totalTurns += res.turns;
    totalFirstPlayer += 1;
    if (res.winner === res.firstPlayer) firstPlayerWins += 1;
    if (res.winner === 'A') {
      winsA += 1;
      blockWins += 1;
    } else if (res.winner === 'B') {
      winsB += 1;
    } else {
      draws += 1;
    }
    blockTotal += 1;
    if ((i + 1) % blockSize === 0) {
      history.push({
        sample: i + 1,
        winRate: blockTotal > 0 ? blockWins / blockTotal : 0,
      });
      blockWins = 0;
      blockTotal = 0;
    }
  }
  if (blockTotal > 0) {
    history.push({
      sample: iterations,
      winRate: blockWins / blockTotal,
    });
  }

  const total = winsA + winsB + draws;
  return {
    total,
    winRateA: total > 0 ? winsA / total : 0,
    winRateB: total > 0 ? winsB / total : 0,
    drawRate: total > 0 ? draws / total : 0,
    avgTurns: totalTurns / iterations,
    firstPlayerAdvantage: totalFirstPlayer > 0 ? firstPlayerWins / totalFirstPlayer : 0.5,
    history,
  };
}

function buildDeckWithTarget(allCards, targetCard) {
  const deck = [];
  deck.push({ ...targetCard });
  deck.push({ ...targetCard });
  const others = allCards.filter((c) => c.id !== targetCard.id);
  let idx = 0;
  while (deck.length < START_DECK_SIZE) {
    deck.push({ ...others[idx % Math.max(1, others.length)] });
    idx += 1;
  }
  return deck;
}

module.exports = {
  simulateBattle,
  runMonteCarlo,
  buildDeck,
};
