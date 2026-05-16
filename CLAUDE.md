# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm install          # 安装所有 workspace 依赖
pnpm test             # 运行全部测试（34 个：core 30 + ui 4）
pnpm -r build         # 编译所有包（tsc）

# 单个包测试
cd packages/card-engine-core && npx vitest run
cd packages/card-engine-ui && npx vitest run

# 单个测试文件
cd packages/card-engine-core && npx vitest run __tests__/Deck.test.ts

# 类型检查（不输出文件）
cd packages/card-engine-core && npx tsc --noEmit
cd packages/card-engine-ui && npx tsc --noEmit

# 启动浏览器 demo
cd apps/demo && npx vite
```

## 架构

pnpm monorepo，三个 workspace 包：

**`@card-engine/core`** — 纯 TypeScript，零运行时依赖。只包含数据模型。`Card`、`Deck`、`Hand`、`Pile`、`GameState` 全部通过工厂函数（`createX()`）创建，返回普通对象接口而非 class。`Hand` 和 `Pile` **不可变**（每次修改返回新实例）。`Deck.shuffle()` 是唯一原地修改的方法——Deck 只是临时初始化工具，不承载游戏状态。`reduce(state, action)` 是纯函数 reducer，操作 `GameState.zones: Record<string, Pile | Hand>`，由 `GameAction` 可辨识联合驱动（DRAW/DISCARD/MOVE/FLIP/SHUFFLE/SORT_HAND/RESET）。

**`@card-engine/ui`** — Taro + React 组件。依赖 `@card-engine/core` 和 `@tarojs/components`（peer dependency）。组件使用 Taro 的 `View`/`Text` 而非 HTML 元素。动画以 CSS transition 为主（不是 `Taro.createAnimation()`），`animations/adapters/css.ts` 中的 `animationToStyle()` 将 `AnimationDescriptor` 转换为带 transform/transition/opacity 的 CSS 样式对象。平台检测 `platform/index.ts` 通过 `process.env.TARO_ENV` 判断（由 Taro 编译器在构建时注入）。

**`apps/demo`** — Vite + React 浏览器 demo。通过 `taro-adapter.ts` 将 `@tarojs/components` 的导入映射到 HTML 元素（View→div, Text→span），用 Vite alias 实现，使 UI 包在普通浏览器中运行而不依赖 Taro 构建管线。在真实 Taro 项目中接入 UI 包时，去掉这个 alias，由 Taro 原生解析 `@tarojs/components`。

### 关键设计决策

- **Card 模型灵活**：`rank`/`suit` 是可选的，兼容非标准牌（UNO、塔罗、TCG）
- **v1 不含规则引擎**：`reduce()` 只做通用 zone 操作。具体游戏规则（如"红7只能放在黑8上"）由消费方通过 Pile 的 `canAccept` 回调自行实现
- **UI 包发布 TS 源码**（`"main": "src/index.ts"`），不发布编译后的 JS——由消费方 Taro 项目的构建管线负责转译
- **CSS 3D 翻转**在 H5 和微信小程序正常工作；React Native 回退为 opacity 交叉渐变（已知限制）
