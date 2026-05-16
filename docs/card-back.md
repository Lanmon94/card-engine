# 牌背图案配置

## 目录

- [概览](#概览)
- [快速开始：使用图片 URL](#快速开始使用图片-url)
- [进阶：React 自定义绘制](#进阶react-自定义绘制)
- [进阶：Canvas 自定义绘制](#进阶canvas-自定义绘制)
- [优先级规则](#优先级规则)
- [在新组件中支持牌背配置](#在新组件中支持牌背配置)
- [注意事项](#注意事项)

## 概览

牌背图案通过 `CardEngineConfig` 统一配置，所有子组件自动生效。提供三种配置方式，从简单到灵活：

| 方式 | 配置字段 | 适用场景 | 生效范围 |
|------|----------|----------|----------|
| 图片 URL | `cardBackImage` | 一张固定的牌背图片 | React 组件 + Canvas 动画 |
| React 自定义绘制 | `renderBack` | 动态 React 节点（渐变色、叠加文字等） | React 组件（`Card`） |
| Canvas 自定义绘制 | `drawBack` | 程序化生成 Canvas 纹理 | Canvas 动画（洗牌等） |

## 快速开始：使用图片 URL

最常见的方式。你只需要一张图片，在 `CardEngine` 上配置一次即可。

```tsx
import { CardEngine, Card, CanvasShuffle } from '@card-engine/ui';

function App() {
  return (
    <CardEngine
      config={{
        cardBackImage: '/assets/card-back.png',
      }}
    >
      <Card card={card} />               {/* 自动使用你的图片 */}
      <CanvasShuffle cards={cards} />    {/* 自动使用你的图片 */}
      <CanvasRiffleShuffle cards={cards} /> {/* 自动使用你的图片 */}
    </CardEngine>
  );
}
```

**`cardBackImage` 的值就是图片 URL 字符串**，可以是：

- 相对路径：`'/assets/back.png'`
- 绝对路径：`'https://cdn.example.com/back.png'`
- 静态 import（Vite/Webpack）：`import backImg from './back.png'` → `cardBackImage: backImg`

**前置条件**：使用此配置的组件必须处于 `<CardEngine>` 子树内。

## 进阶：React 自定义绘制

当你需要在牌背上显示动态内容（渐变、文字、根据游戏状态变化的图案），用 `renderBack` 返回任意 React 节点。

```tsx
<CardEngine
  config={{
    // 返回一个 React 节点
    renderBack: () => (
      <View style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Text style={{ color: '#fff', fontSize: 24 }}>🃏</Text>
      </View>
    ),
  }}
>
  <Card card={card} />
</CardEngine>
```

**注意**：`renderBack` 仅在 React 渲染路径生效（`Card` 组件），对 Canvas 动画（洗牌组件）无效。如果同时使用 Canvas 动画，需配合 `drawBack` 保持视觉一致。

## 进阶：Canvas 自定义绘制

与 `renderBack` 对应，但作用于 Canvas 渲染路径。接收 Canvas 2D 上下文和卡牌尺寸，你可以在上面自由绘制。

```tsx
<CardEngine
  config={{
    drawBack: (ctx, width, height) => {
      // 纯色背景
      ctx.fillStyle = '#667eea';
      ctx.fillRect(0, 0, width, height);

      // 边框
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, width - 4, height - 4);

      // 中心文字
      ctx.fillStyle = '#fff';
      ctx.font = `${width * 0.3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🃏', width / 2, height / 2);
    },
  }}
>
  <CanvasShuffle cards={cards} />
</CanvasShuffle>
```

**函数签名**：`(ctx: CanvasRenderingContext2D, width: number, height: number) => void`

- `ctx` — 标准 Canvas 2D 渲染上下文，已设置好设备像素比，直接绘制即可
- `width` — 卡牌宽度（逻辑像素）
- `height` — 卡牌高度（逻辑像素）

**不需要**手动处理圆角或 DPR 缩放，调用方已在外部处理。

## 优先级规则

如果你同时配置了多个字段，优先级如下（从高到低）：

```
renderBack  (React)
    │
    ▼
drawBack   (Canvas)
    │
    ▼
cardBackImage  (图片 URL，两种路径均使用)
    │
    ▼
默认菱形图案（#2c3e50 底色 + 旋转方块）
```

具体逻辑：

- **`Card` 组件**：如果 `renderBack` 有值就用它；否则看 `cardBackImage`，有值就用图片，没值就用默认图案。
- **`CanvasShuffle` / `CanvasRiffleShuffle`**：如果 `drawBack` 有值就用它；否则看 `cardBackImage`，图片加载完成就用图片，没加载完成/没配置就用默认图案。

## 在新组件中支持牌背配置

新增组件如需渲染牌背，**没有全局自动注入机制**。必须主动从 context 读取配置并按优先级实现：

```tsx
import { useCardEngine } from '../CardEngine/CardEngine';
import { drawCardBack } from '../../animations/canvas/card-renderer';
import { CardBack as DefaultCardBack } from '../Card/CardBack';

// React 组件中：
function MyNewComponent() {
  const { config } = useCardEngine();

  // 优先级：renderBack > cardBackImage > 默认
  if (config.renderBack) {
    return config.renderBack();
  }
  return <DefaultCardBack imageSrc={config.cardBackImage} />;
}

// Canvas 组件中：
function MyCanvasComponent() {
  const { config } = useCardEngine();
  const drawBackRef = useRef(config.drawBack);
  drawBackRef.current = config.drawBack;
  // ... 图片加载逻辑同 CanvasShuffle

  function getCardTexture(card, faceUp, cache) {
    // ...
    if (!faceUp) {
      if (drawBackRef.current) {
        drawBackRef.current(ctx, w, h);
      } else if (backImageRef.current) {
        ctx.drawImage(backImageRef.current, 0, 0, w, h);
      } else {
        drawCardBack(ctx, w, h);
      }
    }
  }
}
```

关键规则：
1. 从 `useCardEngine()` 读取配置
2. 按优先级依次检查 `renderBack` / `drawBack` > `cardBackImage` > 默认
3. Canvas 组件需自行处理图片异步加载和纹理缓存失效

## 注意事项

### 通用

- 所有配置项均为**可选**，不传则回退到默认菱形图案
- 配置必须在 `<CardEngine>` 子树内才生效（组件通过 `useCardEngine()` 读取 context）
- `Card` 组件自身的 `renderBack` prop 优先级高于 `CardEngineConfig.renderBack`——组件的直接 prop 会覆盖全局配置

### cardBackImage

- Canvas 组件中图片是**异步加载**的。图片加载完成前会短暂显示默认菱形图案，加载完成后自动切换
- 如果图片加载失败（404 等），会**静默回退**到默认菱形图案，不会报错
- 建议使用与卡牌尺寸相近的图片，避免过度拉伸或模糊
- Taro 环境下，图片的 `mode="aspectFill"` 会自动裁切填充，确保不变形

### renderBack

- 返回的 React 节点会渲染在一个 `width:100%; height:100%` 的容器内，无需自行设置容器尺寸
- 此配置**仅对 React 渲染路径生效**（`Card` 组件），不影响 Canvas 动画组件
- 如果项目同时使用 Canvas 洗牌动画，需配合 `drawBack` 保持图案一致

### drawBack

- 每次生成纹理缓存时调用（每张牌一次），如果你的绘制逻辑很重，应考虑性能
- 不要在函数内保存状态或发起异步操作——它会在 requestAnimationFrame 期间被调用
- 如果同时配置了 `cardBackImage`，`drawBack` 的优先级更高——图片不会被使用
