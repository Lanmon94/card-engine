# @card-engine

可复用的卡牌游戏引擎 —— TypeScript monorepo，包含数据模型、UI 组件和动画系统。支持标准扑克、UNO、塔罗、TCG 等任意卡牌类型。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-monorepo-orange)](https://pnpm.io/)

## 特性

- **框架无关的核心层** — `@card-engine/core` 零运行时依赖，纯 TypeScript 数据模型
- **不可变状态** — Hand 和 Pile 操作返回新实例，天然适合 React 状态管理
- **灵活的卡牌模型** — `rank`/`suit` 均为可选，兼容标准扑克、UNO、塔罗、TCG 等
- **通用 zone 操作** — 基于 reducer 模式，DRAW/DISCARD/MOVE/FLIP/SHUFFLE/SORT_HAND/RESET
- **可扩展规则** — Pile 通过 `canAccept` 回调自定义放置规则，引擎不绑定具体游戏
- **Taro 跨平台 UI** — H5、微信小程序、React Native（CSS 3D 翻转动效，RN 回退为 opacity 渐变）
- **动画系统** — 翻牌、发牌、洗牌、移动预设动画，支持序列化和编排

## 文档

完整使用文档见 [docs/README.md](./docs/README.md)，涵盖：

- [Core 使用说明](./docs/core.md) — 数据模型、状态流转、工具函数
- [UI 使用说明](./docs/ui.md) — 组件、布局、动画系统、Canvas 特效
- [牌背图案配置](./docs/card-back.md) — 图片/React/Canvas 三种自定义方式

## 包结构

| 包 | 说明 | 依赖 |
|---|------|------|
| [`@card-engine/core`](./packages/card-engine-core) | 纯 TypeScript 卡牌数据模型和工具函数 | 零依赖 |
| [`@card-engine/ui`](./packages/card-engine-ui) | Taro + React 卡牌 UI 组件和动画 | core, react, @tarojs/components |

## 快速开始

### 安装 & 构建

```bash
pnpm install
pnpm build          # 编译所有包
pnpm test           # 运行全部测试
```

### 启动浏览器 Demo

```bash
pnpm --filter @card-engine/demo dev
```

### 在项目中使用

```bash
npm install @card-engine/core @card-engine/ui
```

```ts
import {
  createStandardDeck, createHand, createPile,
  createGameState, reduce,
  PileType, CardFace,
} from '@card-engine/core';

// 创建并洗牌
const deck = createStandardDeck({ shuffle: true });

// 发 5 张到手中
let hand = createHand();
for (const card of deck.draw(5)) {
  hand = hand.add(card);
}

// 创建牌堆，自定义放置规则
const foundation = createPile('foundation', PileType.Foundation, {
  faceDirection: CardFace.Up,
  canAccept: (card, pile) => {
    // 自定义规则：只能放同花色、递增的牌
    return true;
  },
});
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

| 模块 | 导出 | 说明 |
|------|------|------|
| Card | `createCard()`, `CardFace`, `Rank`, `Suit` | 单张卡牌模型 |
| Deck | `createDeck()`, `createStandardDeck()` | 牌组，支持 shuffle/draw/peek/reset |
| Hand | `createHand()` | 手牌，不可变：add/remove/sort/hasCard |
| Pile | `createPile()`, `PileType` | 牌堆，canAccept/addCard/removeCard |
| GameState | `createGameState()`, `reduce()`, `GamePhase` | 纯函数 reducer，zone 操作 |
| Actions | `GameAction` | 可辨识联合：DRAW/DISCARD/MOVE/FLIP/SHUFFLE/SORT_HAND/RESET |
| Utils | `fisherYatesShuffle()`, `sortByRank()`, `sortBySuit()`, `generateId()` | 工具函数 |

### `@card-engine/ui`

| 模块 | 导出 | 说明 |
|------|------|------|
| Card | `Card` | 单张卡牌组件（正/反面，自定义渲染） |
| HandView | `HandView` | 手牌区（fan/linear/stacked 布局） |
| PileView | `PileView` | 牌堆区（stack/spread/grid 布局） |
| SpreadView | `SpreadView` | 展牌区（fan/grid/line 布局） |
| CardEngine | `CardEngine`, `useCardEngine` | Context Provider，全局配置 |
| useCardAnimation | `useCardAnimation` | 动画 hook（animate/sequence/stagger） |
| Presets | `flipPreset`, `dealPreset`, `shufflePreset`, `movePreset` | 预设动画 |
| CanvasShuffle | `CanvasShuffle` | Canvas 洗牌动画 |

## 项目结构

```
card-engine/
├── packages/
│   ├── card-engine-core/         # 纯 TS 数据模型（零依赖）
│   │   └── src/
│   │       ├── models/           # Card, Deck, Hand, Pile, GameState
│   │       ├── actions/          # GameAction 可辨识联合
│   │       └── utils/            # shuffle, sort, id
│   └── card-engine-ui/           # Taro React 组件 + 动画
│       └── src/
│           ├── components/       # Card, HandView, PileView, SpreadView, CardEngine
│           ├── animations/       # useCardAnimation, presets (flip/deal/shuffle/move)
│           └── platform/         # 平台检测
├── apps/
│   └── demo/                     # Vite + React 浏览器 Demo
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 开发

```bash
pnpm install                   # 安装依赖

# 类型检查
cd packages/card-engine-core && npx tsc --noEmit
cd packages/card-engine-ui && npx tsc --noEmit

# 运行测试
pnpm test                       # 所有测试
cd packages/card-engine-core && npx vitest run   # core 测试
cd packages/card-engine-ui && npx vitest run     # ui 测试

# 启动 Demo
cd apps/demo && npx vite
```

## 核心设计决策

- **Card 模型灵活** — `rank`/`suit` 可选，兼容非标准牌
- **v1 不含规则引擎** — `reduce()` 只做通用 zone 操作，具体游戏规则由消费方通过 `canAccept` 实现
- **UI 包发布 TS 源码** — 由消费方 Taro 项目的构建管线负责转译
- **动画以 CSS transition 为主** — 序列化动画描述符，跨平台适配
- **CSS 3D 翻转** — H5 和微信小程序正常工作，React Native 回退为 opacity 渐变

## License

MIT © [Lanmon94](https://github.com/Lanmon94)
