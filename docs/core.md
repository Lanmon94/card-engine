# @card-engine/core — 数据层使用说明

`@card-engine/core` 是牌类游戏的纯逻辑层，**零运行时依赖**。提供数据模型、工厂函数、状态 reducer、工具函数。可以在任何 JS/TS 环境使用（Node.js、浏览器、小程序逻辑层），与 UI 完全解耦。

## 目录

- [快速开始](#快速开始)
- [Card：单张牌的模型](#card单张牌的模型)
- [Deck：临时牌堆](#deck临时牌堆)
- [Hand：手牌（不可变）](#hand手牌不可变)
- [Pile：桌面牌堆（不可变）](#pile桌面牌堆不可变)
- [GameState 与 reduce：状态流转](#gamestate-与-reduce状态流转)
- [GameAction：所有动作类型](#gameaction所有动作类型)
- [工具函数](#工具函数)
- [完整示例：抽牌流程](#完整示例抽牌流程)
- [设计决策](#设计决策)

---

## 快速开始

```ts
import {
  createStandardDeck,
  createHand,
  createPile,
  createGameState,
  reduce,
  PileType,
} from '@card-engine/core';

// 1. 准备一副洗好的牌
const deck = createStandardDeck({ shuffle: true });

// 2. 创建游戏状态
const state = createGameState({
  stock: createPile('stock', PileType.Stock, { cards: deck.cards }),
  hand: createHand(),
  waste: createPile('waste', PileType.Waste),
});

// 3. 抽牌
const nextState = reduce(state, {
  type: 'DRAW',
  from: 'stock',
  to: 'hand',
  count: 3,
});

console.log(nextState.zones.hand.size); // 3
console.log(nextState.turn);            // 1
```

---

## Card：单张牌的模型

一张牌由一个唯一的 `id`、一个面朝状态 `face`、可选的 `rank`/`suit` 和任意 `meta` 元数据组成。Rank 和 Suit 可选，因此可以表示扑克牌、UNO、塔罗、TCG 等任意卡牌类型。

### 基础类型

```ts
enum Rank { Ace = 1, Two = 2, ..., King = 13 }
enum Suit { Clubs = 'clubs', Diamonds = 'diamonds', Hearts = 'hearts', Spades = 'spades' }
enum CardFace { Up = 'up', Down = 'down' }
type CardId = string;
```

### Card 接口

```ts
interface Card {
  readonly id: CardId;                    // 唯一标识
  readonly face: CardFace;                // 面朝上/下
  readonly rank?: Rank;                   // 点数（鬼牌为 undefined）
  readonly suit?: Suit;                   // 花色（鬼牌为 undefined）
  readonly meta?: Record<string, unknown>;// 任意元数据
}
```

所有字段都是 `readonly`。修改牌的状态（如翻面）通过 `reduce` 和 `FLIP` action 完成，生成新的 Card 对象。

### 创建 Card

```ts
import { createCard, Rank, Suit, CardFace } from '@card-engine/core';

// 标准牌
const aceSpades = createCard(Rank.Ace, Suit.Spades);
// → { id: 'card-1715000000-0-x7f3k2', face: 'down', rank: 1, suit: 'spades' }

// 自定义 ID 和朝向
const kingHearts = createCard(Rank.King, Suit.Hearts, {
  id: 'my-king',
  face: CardFace.Up,
});

// 鬼牌（无 rank/suit，用 meta 标记）
const joker1 = createCard(undefined, undefined, { meta: { joker: true, index: 0 } });
```

**注意**：大多数场景不需要手动 `createCard`。用 `createStandardDeck()` 生成整副牌更常见。

---

## Deck：临时牌堆

Deck 是**唯一可变的数据结构**。它只是初始化的临时工具——洗牌、发牌，之后就不需要了。游戏运行期间的状态由 `Hand`、`Pile` 和 `GameState` 承载。

### Deck 接口

```ts
interface Deck {
  readonly cards: readonly Card[];
  readonly remaining: number;

  shuffle(): Deck;                   // Fisher-Yates 原地洗牌，返回 this
  draw(count?: number): Card[];      // 从顶部抽 count 张
  drawOne(): Card | undefined;       // 抽一张
  addToTop(cards: Card[]): Deck;     // 放回顶部
  addToBottom(cards: Card[]): Deck;  // 放回底部
  peek(count?: number): Card[];      // 查看顶部，不抽走
  reset(): Deck;                     // 恢复到创建时的原始牌序
}
```

所有修改方法都返回 `this`，支持链式调用。**"顶部"指数组末尾**——`draw()` 从数组末尾弹出。

### 创建 Deck

```ts
import { createDeck, createStandardDeck } from '@card-engine/core';

// 标准 52 张扑克牌，立即洗牌
const deck = createStandardDeck({ shuffle: true });

// 带 2 张鬼牌
const deckWithJokers = createStandardDeck({ shuffle: true, jokers: 2 });

// 从任意 Card[] 创建
const customDeck = createDeck([cardA, cardB, cardC]);
```

### 典型用法：发牌

```ts
const deck = createStandardDeck({ shuffle: true });

// 每人发 5 张
const player1Cards = deck.draw(5);
const player2Cards = deck.draw(5);

// 剩余牌创建为抽牌堆
const stock = createPile('stock', PileType.Stock, { cards: deck.cards });
```

---

## Hand：手牌（不可变）

Hand 代表玩家手牌，**不可变**——每次 `add`、`remove`、`sort` 都返回新实例，原实例不变。

### Hand 接口

```ts
interface Hand {
  readonly cards: readonly Card[];
  readonly size: number;

  add(card: Card): Hand;                                // 返回新 Hand
  remove(cardId: CardId): Hand;                         // 返回新 Hand
  sort(comparator: (a: Card, b: Card) => number): Hand;  // 返回新 Hand
  hasCard(cardId: CardId): boolean;
}
```

### 创建 Hand

```ts
import { createHand } from '@card-engine/core';

const empty = createHand();                  // 空手
const withCards = createHand([card1, card2]); // 带初始牌
```

### 操作

```ts
let hand = createHand();

hand = hand.add(card1);                     // 加一张
hand = hand.add(card2);
hand = hand.remove(card1.id);               // 移除一张

// 排序（调用方自定义比较器）
hand = hand.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));

// 检查
hand.hasCard(card1.id);  // false（已移除）
```

**为什么不可变**：方便做 undo/redo、状态快照、React 状态管理（直接 `setState` 新对象即可触发重渲染）。

---

## Pile：桌面牌堆（不可变）

Pile 代表桌面上的一个牌区——抽牌堆、弃牌堆、出牌区、接龙牌列等。同样**不可变**。

### PileType 枚举

```ts
enum PileType {
  Stock      = 'stock',       // 抽牌堆（发牌来源）
  Waste      = 'waste',       // 弃牌堆
  Tableau    = 'tableau',     // 桌面牌列（如接龙）
  Foundation = 'foundation',  // 基础牌堆（如接龙的收牌区）
  PlayArea   = 'playArea',    // 出牌区
  Custom     = 'custom',      // 自定义类型
}
```

这个标签纯粹是语义标注，不影响 Pile 的行为。你可以用它在 UI 层根据 `pile.type` 切换不同的渲染方式。

### Pile 接口

```ts
interface Pile {
  readonly id: string;                          // 在 GameState.zones 中的 key
  readonly type: PileType;                      // 语义类别
  readonly cards: readonly Card[];
  readonly faceDirection: CardFace;             // 此堆牌的默认朝向
  readonly maxSize?: number;                    // 容量上限

  canAccept(card: Card): boolean;               // 规则校验
  addCard(card: Card): Pile;                    // 返回新 Pile
  removeCard(cardId: CardId): Pile;             // 返回新 Pile
}
```

### 创建 Pile

```ts
import { createPile, PileType, CardFace } from '@card-engine/core';

// 简单抽牌堆
const stock = createPile('stock', PileType.Stock, {
  cards: deck.cards,
  faceDirection: CardFace.Down,
});

// 带游戏规则的接龙牌列
const column = createPile('col1', PileType.Tableau, {
  maxSize: 13,
  canAccept: (card, pile) => {
    const top = pile.cards[pile.cards.length - 1];
    if (!top) return card.rank === Rank.King; // 空列只能放 K
    return (card.rank ?? 0) === (top.rank ?? 0) - 1          // 降序
      && card.suit !== top.suit;                              // 不同花色
  },
});
```

### canAccept 回调

这是 Core v1 中**唯一的游戏规则注入点**。库本身不内置任何游戏规则，具体逻辑由消费方通过 `canAccept` 实现：

```ts
// 红7只能放在黑8上（一种接龙变体）
canAccept: (card, pile) => {
  const top = pile.cards[pile.cards.length - 1];
  if (!top) return false;
  if (card.rank !== top.rank - 1) return false;
  const isRed = (s) => s === 'hearts' || s === 'diamonds';
  const isBlack = (s) => s === 'clubs' || s === 'spades';
  return isRed(card.suit) === isBlack(top.suit);
};
```

---

## GameState 与 reduce：状态流转

`GameState` 是整个游戏在某一时刻的快照。`reduce(state, action)` 是纯函数 reducer——接收旧状态和一个 action，返回新状态。这是 Core 的核心。

### GameState 接口

```ts
interface GameState {
  readonly zones: Record<string, Zone>;  // 所有牌区（Hand | Pile）
  readonly phase: GamePhase;             // 游戏阶段
  readonly turn: number;                 // 回合计数
  readonly history: GameAction[];        // 操作日志（追加）
}

enum GamePhase {
  Setup    = 'setup',
  Playing  = 'playing',
  RoundEnd = 'roundEnd',
  GameOver = 'gameOver',
}
```

`Zone = Pile | Hand`——两种类型统一放在 `zones` 中，通过 key 区分。

### 创建 GameState

```ts
import { createGameState } from '@card-engine/core';

const state = createGameState({
  hand: createHand(),
  stock: createPile('stock', PileType.Stock, { cards: shuffledCards }),
});
```

### reduce 行为

- **纯函数**：不修改传入的 `state`，返回全新的 `GameState`
- **自动递增 `turn`**
- **自动追加 action 到 `history`**（完整审计日志，可用于 debug/回放/undo）
- **通过 key 查找 zone**：`from`/`to` 字段对应 `zones` 中的 key

```ts
const state1 = createGameState({ ... });
const state2 = reduce(state1, { type: 'DRAW', from: 'stock', to: 'hand' });

console.log(state1 === state2);          // false
console.log(state2.turn);                // 1
console.log(state2.history.length);      // 1
```

---

## GameAction：所有动作类型

`GameAction` 是一个可辨识联合（discriminated union），`type` 字段决定匹配哪个变体。

```ts
type GameAction =
  | { type: 'DEAL';      cards: CardId[]; to: string }
  | { type: 'DRAW';      from: string; to: string; count?: number }
  | { type: 'DISCARD';   cardId: CardId; from: string; to: string }
  | { type: 'MOVE';      cardId: CardId; from: string; to: string }
  | { type: 'FLIP';      cardIds: CardId[]; face: CardFace }
  | { type: 'SHUFFLE';   pileId: string }
  | { type: 'SORT_HAND'; handId: string }
  | { type: 'RESET' };
```

### 各 Action 详解

| Action | 行为 |
|---|---|
| **DEAL** | 全局搜索给定 cardId，从原有 zone 移除并加入 `to` zone。牌面变为 `Up`。适合初始发牌阶段。 |
| **DRAW** | 从 `from` zone 的末尾抽 `count` 张（默认 1），加入 `to` zone。所抽牌面变为 `Up`。 |
| **DISCARD** | 实现同 MOVE——从 `from` zone 移一张到 `to` zone。语义上区分弃牌。 |
| **MOVE** | 将指定 cardId 从 `from` zone 移动到 `to` zone。通用移动。 |
| **FLIP** | 将指定 cardId 的牌翻到指定 `face`（Up/Down）。全局搜索，不限于某个 zone。 |
| **SHUFFLE** | 原地 Fisher-Yates 洗牌，作用于 `pileId` 指定的 Pile。 |
| **SORT_HAND** | 按花色→点数的顺序排序（梅花 < 方片 < 红心 < 黑桃，点数升序）。无花色/点数的牌排到末尾。 |
| **RESET** | 保留当前 zone 结构，但重置 phase → Setup、turn → 0、清空 history。 |

### 无操作情况

所有 action 在目标 zone 不存在或牌找不到时，**静默返回原 state 的副本**（turn 仍会递增）。不抛异常。

---

## 工具函数

### generateId()

```ts
import { generateId } from '@card-engine/core';

const id = generateId(); // 'card-1715000000-5-a8f2k1'
```

格式：`card-{timestamp}-{counter}-{random6chars}`。模块级递增计数器保证同进程内唯一。

### fisherYatesShuffle

```ts
import { fisherYatesShuffle } from '@card-engine/core';

const arr = [1, 2, 3, 4, 5];
fisherYatesShuffle(arr);
// arr 被原地打乱，返回同一个引用
```

**原地修改**，返回原数组引用。`Deck.shuffle()` 内部调用此函数。

### sortByRank / sortBySuit

```ts
import { sortByRank, sortBySuit, Suit } from '@card-engine/core';

// 按点数排序（默认升序）
const sorted = sortByRank(cards);
const descending = sortByRank(cards, false);

// 按花色排序（可自定义花色顺序）
const sortedBySuit = sortBySuit(cards, [
  Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs
]);
```

都返回**新数组**，不修改原数组。无 rank/suit 的牌会排到边缘。

---

## 完整示例：抽牌流程

```ts
import {
  createStandardDeck, createHand, createPile, createGameState,
  reduce, PileType, CardFace,
} from '@card-engine/core';

// 1. 创建并洗牌
const deck = createStandardDeck({ shuffle: true });

// 2. 初始游戏状态
let state = createGameState({
  stock: createPile('stock', PileType.Stock, {
    cards: deck.cards,
    faceDirection: CardFace.Down,
  }),
  hand: createHand(),
  waste: createPile('waste', PileType.Waste, {
    faceDirection: CardFace.Up,
  }),
});

// 3. 抽 3 张到手牌
state = reduce(state, { type: 'DRAW', from: 'stock', to: 'hand', count: 3 });

// 4. 出掉第一张到弃牌堆
const firstCard = state.zones.hand.cards[0];
state = reduce(state, {
  type: 'DISCARD',
  cardId: firstCard.id,
  from: 'hand',
  to: 'waste',
});

// 5. 把手牌排序
state = reduce(state, { type: 'SORT_HAND', handId: 'hand' });

// 6. 查看当前状态
console.log(state.zones.hand.size);         // 2
console.log(state.zones.waste.cards[0].id); // firstCard.id
console.log(state.turn);                    // 3
console.log(state.history.length);          // 3
```

---

## 设计决策

### 为什么 Deck 可变，Hand/Pile 不可变

Deck 只是一个**一次性初始化工具**。洗牌、发牌完成后，游戏运行期间不再需要 Deck 本身——牌都已经在具体的 `Hand` 和 `Pile` 里了。让 Deck 可变避免了大量无意义的对象分配。

Hand 和 Pile 承载游戏状态，不可变带来了：
- 直接的 undo/redo（存旧引用即可）
- React 友好（引用变化 = 状态变化，直接 `setState`）
- 调试时可检查任意时间点状态

### 为什么 v1 不含规则引擎

`reduce()` 只做通用 zone 操作，不判断"这步合法吗"。游戏规则通过 `Pile.canAccept` 回调由消费方注入。这样 Core 不会依赖某种特定游戏——扑克、UNO、塔罗、TCG 都能用。

### 为什么 Card 的 rank/suit 可选

兼容非标准牌。UNO 有颜色和数字但不是 suit/rank 语义，TCG 可能只有名字没有点数，塔罗有"大阿卡纳"。

### 为什么 action history 是追加式

`state.history` 是完整的操作日志，可用于：
- **调试**：打印每一步操作
- **回放**：从初始状态重放到任意时刻
- **Undo**：从初始状态重放到倒数第二步
- **网络同步**：传输 action 日志比传输完整状态更轻量
