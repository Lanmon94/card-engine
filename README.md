# @card-engine

卡牌游戏引擎 —— 可复用的 npm monorepo 包，包含数据模型、UI 组件和动画效果。

## 包结构

| 包 | 说明 | 依赖 |
|---|------|------|
| `@card-engine/core` | 纯 TypeScript 卡牌数据模型和工具函数 | 零依赖 |
| `@card-engine/ui` | Taro + React 卡牌 UI 组件和动画 | core, react, @tarojs/components |

## 快速开始

### 安装

```bash
pnpm install
pnpm build   # 编译所有包
pnpm test    # 运行所有测试
```

### 运行 Demo

```bash
pnpm --filter @card-engine/demo demo
```

### 在项目中使用

```ts
import {
  createStandardDeck, createHand, createPile,
  createGameState, reduce,
  PileType, CardFace,
} from '@card-engine/core';

// 创建洗好的标准牌组
const deck = createStandardDeck({ shuffle: true });

// 发牌
const hand = createHand();
for (const card of deck.draw(5)) {
  hand = hand.add(card);
}

// 牌堆操作
const stock = createPile('stock', PileType.Stock, { cards: deck.draw(10) });
const foundation = createPile('foundation', PileType.Foundation, {
  faceDirection: CardFace.Up,
  canAccept: (card, pile) => { /* 自定义规则 */ return true; },
});
```

### 在 Taro 项目中使用 UI 组件

```bash
npm install @card-engine/core @card-engine/ui
```

```tsx
import { CardEngine, Card, HandView, PileView } from '@card-engine/ui';

function GamePage() {
  return (
    <CardEngine state={gameState} dispatch={dispatch}>
      <HandView hand={playerHand} layout="fan" />
      <PileView pile={stockPile} layout="stack" onDraw={handleDraw} />
    </CardEngine>
  );
}
```

## API 概览

### `@card-engine/core`

- **Card** — `createCard(rank, suit)`, `CardFace`, `Rank`, `Suit`
- **Deck** — `createStandardDeck()`, 方法: shuffle/draw/peek/reset
- **Hand** — `createHand()`, 不可变方法: add/remove/sort/hasCard
- **Pile** — `createPile(id, type)`, canAccept/addCard/removeCard
- **GameState** — `createGameState()`, `reduce(state, action)`
- **Actions** — DRAW, DISCARD, MOVE, FLIP, SHUFFLE, SORT_HAND, RESET
- **Utils** — `fisherYatesShuffle()`, `sortByRank()`, `sortBySuit()`, `generateId()`

### `@card-engine/ui`

- **Card** — 单张卡牌（正/反面，自定义渲染）
- **HandView** — 手牌区（fan/linear/stacked 布局）
- **PileView** — 牌堆区（stack/spread/grid 布局）
- **SpreadView** — 展牌区（fan/grid/line 布局）
- **CardEngine** — Context Provider，全局配置
- **useCardAnimation** — 动画 hook（animate/sequence/stagger）
- **Presets** — flipPreset, dealPreset, shufflePreset, movePreset

## 项目结构

```
card-engine/
├── packages/
│   ├── card-engine-core/    # 纯 TS 数据模型（零依赖）
│   └── card-engine-ui/      # Taro React 组件 + 动画
├── apps/
│   └── demo/                # CLI 演示
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 技术栈

- TypeScript 5.x (strict)
- pnpm monorepo
- Vitest (测试)
- Taro 4.x + React 18 (UI 包运行环境)
