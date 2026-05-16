# @card-engine/ui — 组件与动画使用说明

`@card-engine/ui` 是基于 Taro + React 的卡牌 UI 组件库。提供牌面渲染、布局组件、动画系统、Canvas 特效。依赖 `@card-engine/core` 和 `@tarojs/components`。

## 目录

- [快速开始](#快速开始)
- [CardEngine：全局配置与 Context](#cardengine全局配置与-context)
- [Card：单张牌组件](#card单张牌组件)
- [CardFace / CardBack：子组件](#cardface--cardback子组件)
- [HandView：手牌布局](#handview手牌布局)
- [PileView：牌堆布局](#pileview牌堆布局)
- [SpreadView：自由展示布局](#spreadview自由展示布局)
- [动画系统概述](#动画系统概述)
- [AnimationDescriptor：动画描述数据](#animationdescriptor动画描述数据)
- [useCardAnimation：动画驱动 Hook](#usecardanimation动画驱动-hook)
- [动画预设](#动画预设)
- [CSS 动画适配器](#css-动画适配器)
- [翻转样式工具函数](#翻转样式工具函数)
- [CanvasShuffle：Canvas 洗牌动画](#canvasshufflecanvas-洗牌动画)
- [CanvasRiffleShuffle：交错式洗牌动画](#canvasriffleshuffle交错式洗牌动画)
- [平台检测](#平台检测)
- [牌背图案配置](#牌背图案配置)

---

## 快速开始

```tsx
import { CardEngine, HandView, PileView, Card, useCardEngine } from '@card-engine/ui';
import { createGameState, createHand, createPile, PileType, reduce } from '@card-engine/core';

function App() {
  const [state, setState] = useState(() =>
    createGameState({
      hand: createHand([/* 初始手牌 */]),
      stock: createPile('stock', PileType.Stock, { cards: deckCards }),
    })
  );

  return (
    <CardEngine state={state} dispatch={(action) => setState(prev => reduce(prev, action))}>
      <HandView hand={state.zones.hand} layout="fan" />
      <PileView pile={state.zones.stock} layout="stack" />
    </CardEngine>
  );
}
```

---

## CardEngine：全局配置与 Context

`CardEngine` 是 UI 层的根节点。它通过 React Context 向下传递全局配置、游戏状态和 dispatch 函数。所有子组件通过 `useCardEngine()` 读取这些信息。

### Props

```ts
interface CardEngineProps {
  state: GameState;                            // 来自 core 的游戏状态
  dispatch?: (action: GameAction) => void;      // 可选，用于组件内部触发 action
  config?: CardEngineConfig;                    // 全局 UI 配置
  children: React.ReactNode;
}
```

### CardEngineConfig

```ts
interface CardEngineConfig {
  size?: 'sm' | 'md' | 'lg' | { width: number; height: number };  // 默认 'md'
  rounded?: boolean;       // 卡牌圆角，默认 true
  shadow?: boolean;        // 卡牌阴影，默认 true
  renderFace?: (card: CardData) => ReactNode;      // 全局自定义牌面
  renderBack?: () => ReactNode;                    // 全局自定义牌背（React 渲染路径）
  cardBackImage?: string;                          // 牌背图片 URL
  drawBack?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;  // Canvas 牌背绘制
}
```

### useCardEngine Hook

```ts
const { config, state, dispatch } = useCardEngine();
```

`dispatch` 可能为 `undefined`（如果 `CardEngine` 没传 `dispatch` prop）。所有需要触发 action 的组件应做防御性检查。

---

## Card：单张牌组件

单张牌的渲染组件，支持 CSS 3D 翻转、进场动画、选中高亮、自定义渲染。

### Props

```ts
interface CardProps {
  card: CardData;                    // 牌数据（来自 core）
  size?: 'sm' | 'md' | 'lg' | { width: number; height: number };
  rounded?: boolean;                 // 默认 true
  shadow?: boolean;                  // 默认 true
  disabled?: boolean;                // 禁用交互（半透明 + 无指针事件）
  selected?: boolean;                // 蓝色发光选中框
  flipOnTap?: boolean;               // 点击翻牌
  flipDuration?: number;              // 翻牌动画时长 ms，默认 400
  animateIn?: 'deal' | 'none';       // 进场动画类型
  onTap?: (card: CardData) => void;
  onLongPress?: (card: CardData) => void;
  renderFace?: (card: CardData) => ReactNode;    // 自定义牌面（覆盖全局）
  renderBack?: () => ReactNode;                  // 自定义牌背（覆盖全局）
  renderCorner?: (card: CardData) => ReactNode;  // 自定义角标
  className?: string;
  style?: React.CSSProperties;
}
```

### 翻转机制

使用 CSS `perspective` + `rotateY` 实现 3D 翻转。内部结构：

```
容器 (perspective: 800px)
  └─ 旋转层 (rotateY(0deg) → rotateY(180deg))
       ├─ 正面 (backface-visibility: hidden)
       └─ 背面 (backface-visibility: hidden, 预旋转 180deg)
```

**React Native 回退**：RN 不支持 3D CSS，回退为 opacity 交叉渐变——正面 `opacity: 1 → 0`，背面 `opacity: 0 → 1`。视觉上不如 3D 翻转，但功能完整。

### 进场动画

设置 `animateIn="deal"`，Card 挂载时会从上方（y=-80）飞入到最终位置，时长 350ms。通过 `dealPreset` + `useCardAnimation` 驱动。

### 牌背渲染优先级

`renderBack` prop → `CardEngineConfig.renderBack` → `CardEngineConfig.cardBackImage` → 默认菱形图案

详见 [牌背图案配置](./card-back.md)。

---

## CardFace / CardBack：子组件

### CardFace

渲染牌的正面。当 `rank`/`suit` 都有值时显示标准布局（左上角点数+花色、中央水印符号、右下角倒置），否则显示灰色 "?"。

支持 `renderCorner` prop 完全接管角标渲染。

### CardBack

渲染牌的背面。`imageSrc` 存在时显示图片，否则显示默认菱形图案（深蓝底 `#2c3e50` + 旋转方块）。

两个组件的 `renderBack`/`renderFace` 回调都可以通过 Card 的 prop 或 CardEngine 的全局 config 指定。

---

## HandView：手牌布局

将 Hand 对象渲染为可视化手牌。支持三种布局模式。

### Props

```ts
interface HandViewProps {
  hand: HandData;                       // 必须有 cards 字段
  layout?: 'fan' | 'linear' | 'stacked'; // 默认 'linear'
  overlap?: number;                     // 牌间重叠 px，默认 30
  maxVisible?: number;                  // 最多可见几张，多余的显示 "+N"
  selectedIds?: CardId[];               // 选中的牌 ID
  selectable?: boolean;                 // 允许点击选中
  animateCards?: boolean;               // 新增牌播放进场动画
  onSelect?: (cardId: CardId) => void;
  onCardTap?: (cardId: CardId) => void;
  renderCard?: (cardId: CardId, index: number) => ReactNode;
  cardSize?: CardProps['size'];
  className?: string;
  style?: React.CSSProperties;
}
```

### 布局对比

| 布局 | 效果 | 适用场景 |
|------|------|----------|
| **linear** | 水平排列，每张牌向左重叠 `overlap` px，z-index 递增 | 传统卡牌游戏（扑克、UNO） |
| **fan** | 扇形展开，每张牌旋转 `offset * overlap * 0.5` deg，垂直偏移 | 展示手牌全貌、选择界面 |
| **stacked** | 堆叠，每张牌略微向右下偏移 | 紧凑展示、小屏幕 |

### 新牌检测

`animateCards` 开启后，HandView 通过 `useRef` 记录上一次渲染时的牌 ID 列表。新的 ID（上次不在）会被标记，对应的 Card 会播放进场动画。

---

## PileView：牌堆布局

将 Pile 对象渲染为可视化牌堆。支持叠放、摊开、网格三种布局，以及 4 种洗牌动画变体。

### Props

```ts
interface PileViewProps {
  pile: PileData;
  layout?: 'stack' | 'spread' | 'grid';      // 默认 'stack'
  spreadOffset?: number;                      // spread 模式每张牌偏移 px，默认 4
  faceUp?: boolean;                           // 覆盖牌的朝向
  animateCards?: boolean;
  shuffling?: boolean;                        // 播放洗牌动画
  shuffleVariant?: 'transition' | 'dance' | 'arc' | 'rattle';  // 默认 'transition'
  onCardTap?: (card: CardData, index: number) => void;
  onDraw?: (pile: PileData) => void;          // 点击牌堆本身
  renderCard?: (card: CardData, index: number) => ReactNode;
  renderEmpty?: () => ReactNode;              // 空堆占位渲染
  cardSize?: CardProps['size'];
  className?: string;
  style?: React.CSSProperties;
}
```

### 布局行为

- **stack**：只渲染顶部一张牌。牌数 > 1 时显示计数标记。适合抽牌堆、弃牌堆。
- **spread**：纵向展开，每张牌偏移 `index * spreadOffset` px，z-index 递增。容器高度自适应。
- **grid**：牌相对定位，适合外层用 CSS grid/flex 控制。

### 洗牌动画变体

| 变体 | 实现方式 | 效果 |
|------|----------|------|
| `transition` | `shufflePreset` + `useCardAnimation` | 整堆微抖动（平移 3px、旋转 3deg、缩放 0.95） |
| `dance` | CSS `@keyframes card-shuffle-dance` (600ms) | 12 步弹跳动画——快速随机位移+旋转+缩放 |
| `arc` | CSS `@keyframes card-shuffle-arc` (700ms) | 8 步左右扫动+抬升，类似发牌手的花式动作 |
| `rattle` | CSS `@keyframes card-shuffle-rattle` (350ms) | 17 步微抖动，快速高频小位移 |

### 空状态

无牌时显示虚线边框占位（80×112px），文字 "Empty"。可通过 `renderEmpty` 自定义。

---

## SpreadView：自由展示布局

不绑定 Hand 或 Pile，直接接收 `Card[]` 数组渲染。适合展示一组自由排列的牌（如场上的公共牌）。

### Props

```ts
interface SpreadViewProps {
  cards: readonly CardData[];
  layout?: 'fan' | 'grid' | 'line';   // 默认 'line'
  fanAngle?: number;                  // fan 模式扇形角度，默认 30
  rows?: number;                      // grid 模式行数
  columns?: number;                   // grid 模式列数（默认自动计算）
  animateCards?: boolean;
  onCardTap?: (card: CardData, index: number) => void;
  renderCard?: (card: CardData, index: number) => ReactNode;
  cardSize?: CardProps['size'];
  className?: string;
  style?: React.CSSProperties;
}
```

### 布局行为

- **line**：水平 flex 排列，8px 间距，居中。
- **fan**：以底部中心为原点旋转，每张牌旋转 `(index - mid) * (fanAngle / total)` deg，重叠 -20px。
- **grid**：CSS grid 布局，`gridTemplateColumns = repeat(cols, 1fr)`。

---

## 动画系统概述

UI 包的动画系统基于**描述符驱动**架构，分为三层：

```
AnimationDescriptor（数据）     →  描述"什么动画"
    │
    ▼
useCardAnimation（Hook）         →  驱动动画生命周期
    │
    ▼
animationToStyle（适配器）       →  转换为 CSS transform/transition
```

加一层预设函数（presets），提供常见动画的工厂方法，简化使用。

---

## AnimationDescriptor：动画描述数据

纯数据对象，不包含任何执行逻辑。

```ts
interface AnimationDescriptor {
  id: string;                                       // 唯一标识
  type: 'flip' | 'deal' | 'shuffle' | 'move' | 'custom';
  target: AnimationTarget;                          // 动画目标
  duration: number;                                 // 毫秒
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  from?: TransformState;                            // 起始状态
  to: TransformState;                               // 结束状态
  onComplete?: () => void;
}

interface TransformState {
  x?: number;        // 水平位移 px
  y?: number;        // 垂直位移 px
  rotate?: number;   // 旋转角度 deg
  rotateY?: number;  // Y 轴旋转 deg（翻转用）
  scale?: number;    // 缩放
  opacity?: number;  // 透明度
}

type AnimationTarget =
  | { type: 'card'; cardId: CardId }
  | { type: 'pile'; pileId: string }
  | { type: 'element'; selector: string };
```

---

## useCardAnimation：动画驱动 Hook

驱动动画的三阶段生命周期：

```
idle → from → to → done
```

- **idle**：无描述符或已结束，不渲染任何样式
- **from**：传入描述符后立即设置 "from" 状态（`transition: none`，瞬间到位）
- **to**：下一个 animation frame 设置 "to" 状态（带 CSS transition），动画开始
- **done**：`duration + 50ms` 后标记完成，调用 `onComplete`，还原到 idle

```ts
const { style, phase, isAnimating } = useCardAnimation(descriptor);

// style 直接合并到组件上即可
return <View style={{ ...myStyle, ...style }} />;
```

---

## 动画预设

预设是 `AnimationDescriptor` 的工厂函数，封装常见动画的参数。

### dealPreset

```ts
dealPreset(targetId: string, opts: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration?: number;  // 默认 300
}): AnimationDescriptor
```

从 `from` 位置（scale 0.8, opacity 0）飞到 `to` 位置（scale 1, opacity 1）。ease-out。

### flipPreset

```ts
flipPreset(targetId: string, targetType: 'card' | 'element', opts?: {
  duration?: number;       // 默认 400
  fromFaceDown?: boolean;  // 默认 true
}): AnimationDescriptor
```

若 `fromFaceDown` 为 true：rotateY 0→180（翻到背面）。为 false：180→0（翻到正面）。ease-in-out。

### movePreset

```ts
movePreset(targetId: string, opts: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  duration?: number;  // 默认 350
}): AnimationDescriptor
```

纯位移，无缩放/透明变化。ease-in-out。

### shufflePreset

```ts
shufflePreset(targetId: string, opts?: {
  duration?: number;  // 默认 500
}): AnimationDescriptor
```

目标类型为 `pile`，微抖动效果（平移 3px、旋转 3deg、缩放 0.95）。ease-in-out。

---

## CSS 动画适配器

`animationToStyle` 将 `AnimationDescriptor` 转换为可用的 CSS 样式对象。

```ts
import { animationToStyle } from '@card-engine/ui';

const style = animationToStyle(descriptor);
// { transform: 'translate(10px, 20px) rotate(5deg) scale(1.1)',
//   opacity: 1,
//   transition: 'transform 400ms ease-out, opacity 400ms ease-out',
//   transformOrigin: 'center center',
//   willChange: 'transform, opacity' }
```

另有 `applyCSSAnimation(element, descriptor)` 用于命令式操作（直接操作 DOM 元素），返回清理函数。

---

## 翻转样式工具函数

一组平台感知的样式计算函数，Card 组件内部使用，也可用于自定义翻转组件：

```ts
import { getFlipContainerStyle, getFlipInnerStyle, getFlipFaceStyle, getFlipBackStyle } from '@card-engine/ui';

// 容器：perspective 800px（所有平台）
const container = getFlipContainerStyle(platform, flipped);

// 内层：rotateY(0deg) → rotateY(180deg)，RN 用 opacity
const inner = getFlipInnerStyle(platform, flipped, duration);

// 正面/背面：backface-visibility: hidden（RN 用绝对定位）
const face = getFlipFaceStyle(platform);
const back = getFlipBackStyle(platform);
```

---

## CanvasShuffle：Canvas 洗牌动画

基于 HTML5 Canvas 的洗牌动画组件，牌从左右两侧沿抛物线飞入并聚集成堆。使用 `requestAnimationFrame` 驱动，不受 React 渲染管线限制。

### Props

```ts
interface CanvasShuffleProps {
  cards: CardData[];            // 要洗的牌
  trigger: number;              // 递增此值触发新动画
  cardWidth?: number;           // 默认 70
  cardHeight?: number;          // 默认 100
  faceUp?: boolean;             // 默认 false
  canvasWidth?: number;         // 默认 520
  canvasHeight?: number;        // 默认 300
  staggerMs?: number;           // 每张牌出发间隔，默认 130
  flightDurationMs?: number;    // 单张牌飞行时长，默认 600
  arcHeightPx?: number;         // 抛物线高度，默认 140
  onComplete?: () => void;
}
```

### 内部机制

1. **纹理缓存**：每张牌的正面/背面预渲染到离屏 canvas，避免每帧重绘。缓存 key 为 `"{cardId}-{faceUp/down}-{w}x{h}"`。
2. **牌背渲染优先级**：`config.drawBack` > `config.cardBackImage`（异步加载）> 默认菱形图案。
3. **DPR 适配**：canvas 内部分辨率 = 逻辑尺寸 × `devicePixelRatio`，确保 Retina 屏清晰。
4. **抛物线轨迹**：X 线性插值，Y = `centerY - arcHeight * sin(progress * PI)`。
5. **交替入位**：偶数索引从左侧飞入，奇数从右侧。着陆后有衰减抖动效果。
6. **缓动**：`easeOutCubic` = `1 - (1-t)^3`。

### 用法

```tsx
function ShuffleButton() {
  const [trigger, setTrigger] = useState(0);

  return (
    <>
      <CanvasShuffle
        cards={cards}
        trigger={trigger}
        onComplete={() => console.log('洗牌完成')}
      />
      <button onClick={() => setTrigger(t => t + 1)}>洗牌</button>
    </>
  );
}
```

---

## CanvasRiffleShuffle：交错式洗牌动画

Canvas 交错式（鸽尾式）洗牌——牌分成两半、向两侧滑开、交替插回并拢。

### Props

```ts
interface CanvasRiffleShuffleProps {
  cards: CardData[];
  trigger: number;
  cardWidth?: number;           // 默认 70
  cardHeight?: number;          // 默认 100
  faceUp?: boolean;             // 默认 false
  canvasWidth?: number;         // 默认 520
  canvasHeight?: number;        // 默认 300
  staggerMs?: number;           // 交替插回间隔，默认 30
  flightDurationMs?: number;    // 单张牌下落时长，默认 200
  arcHeightPx?: number;         // 下落弧高，默认 35
  onComplete?: () => void;
}
```

### 动画阶段

```
idle → splitting (250ms) → riffling → settling (120ms) → settled
```

1. **splitting**：牌分成左右两半，各自滑开约 55px，带旋转。半内位置越靠边缘旋转越小。有正弦波弯曲效果。
2. **riffling**：交替下落，使用 `easeOutBack` 缓动（过冲回弹）。带随机 X 偏移和旋转抖动，随进度衰减。
3. **settling**：小幅垂直振荡收尾，旋转归零。
4. **settled**：所有牌归位，叠加成堆。

### 纹理缓存与 DPR

机制同 CanvasShuffle。牌背渲染同样遵循 `drawBack > cardBackImage > 默认` 优先级。

### 用法

```tsx
<CanvasRiffleShuffle
  cards={cards}
  trigger={trigger}
  faceUp={false}
  staggerMs={30}
  flightDurationMs={200}
/>
```

---

## 平台检测

UI 包基于 Taro，需要在不同平台上正确处理 CSS 能力差异（特别是 3D 翻转）。

```ts
import { getPlatform, usePlatform } from '@card-engine/ui';

type Platform = 'h5' | 'weapp' | 'rn' | 'unknown';

// 命令式检测
const platform = getPlatform();  // 读取 process.env.TARO_ENV

// React Hook（稳定引用，不会变化）
const platform = usePlatform();
```

- H5（浏览器）、微信小程序：完整支持 CSS 3D 翻转
- React Native：3D 不支持，回退为 opacity 渐变

---

## 牌背图案配置

牌背图案通过 `CardEngineConfig` 统一配置，支持三种层级。详见 **[牌背图案配置文档](./card-back.md)**。

优先级速查（高→低）：

| 优先级 | 配置 | 生效范围 |
|--------|------|----------|
| 1 | `renderBack()` | React 组件（Card） |
| 2 | `drawBack(ctx, w, h)` | Canvas 动画（洗牌组件） |
| 3 | `cardBackImage` | React + Canvas 共同生效 |
| 4 | 默认菱形图案 | 回退 |
