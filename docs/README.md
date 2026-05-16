# 卡牌引擎文档

`card-engine` 是一个 pnpm monorepo，为牌类游戏提供**数据层 + UI 层**的通用基础设施。两个包职责分明，可独立使用。

## 包概览

| 包 | 职责 | 运行时依赖 | 发布形式 |
|---|---|---|---|
| `@card-engine/core` | 数据模型、状态流转（纯逻辑，零依赖） | 无 | 编译后的 JS + 类型声明 |
| `@card-engine/ui` | React/Taro 组件、布局、动画 | `@card-engine/core`、`@tarojs/components` | TS 源码（由消费方编译） |

## 核心概念

```
@card-engine/core（纯逻辑，与 UI 无关）        @card-engine/ui（渲染 + 动画）
┌──────────────────────────────┐          ┌──────────────────────────────┐
│ Card, Deck, Hand, Pile      │          │ CardEngine (Context)          │
│ GameState                   │─────────▶│ Card, CardFace, CardBack      │
│ reduce(state, action)       │  数据    │ HandView, PileView, SpreadView│
│ sortByRank, sortBySuit      │  驱动    │ CanvasShuffle, CanvasRiffle   │
│ fisherYatesShuffle          │          │ AnimationDescriptor + Presets │
└──────────────────────────────┘          └──────────────────────────────┘
```

**Core 是"扑克牌的数学规则"**——牌是什么、手牌怎么操作、牌堆如何验证、状态如何流转。完全可以在 Node.js 里跑，不依赖任何 UI 框架。

**UI 是"扑克牌在屏幕上的样子"**——牌怎么摆、翻牌动画怎么做、洗牌特效怎么画。换不同的 UI 方案，Core 完全不用动。

## 文档索引

- **[Core 使用说明](./core.md)** — 数据模型（Card/Deck/Hand/Pile/GameState）、状态流转（reduce）、工具函数
- **[UI 使用说明](./ui.md)** — 组件（Card/HandView/PileView/SpreadView）、动画系统、Canvas 洗牌
- **[牌背图案配置](./card-back.md)** — `cardBackImage`、`renderBack`、`drawBack` 三种方式及优先级

## 快速链接

- 首发牌：`createStandardDeck()` → `deck.shuffle()` → `deck.draw(5)`
- 创建手牌：`createHand(cards)` → `hand.add(card)` → `hand.remove(id)` → `hand.sort(comparator)`
- 创建牌堆：`createPile('draw', PileType.Stock, { cards, canAccept })`
- 状态流转：`reduce(state, { type: 'DRAW', from: 'stock', to: 'hand' })`
- 渲染手牌：`<HandView hand={hand} layout="fan" />`
- 翻牌动画：`flipPreset(cardId, 'card')` → `<Card flipOnTap />`
