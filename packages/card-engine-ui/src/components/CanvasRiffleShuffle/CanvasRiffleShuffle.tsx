import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Card as CardData } from '@card-engine/core';
import {
  drawCardFace,
  drawCardBack,
  roundedRect,
} from '../../animations/canvas/card-renderer';
import { useCardEngine } from '../CardEngine/CardEngine';

// ── Easing ──

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// ── Types ──

export interface CanvasRiffleShuffleProps {
  cards: CardData[];
  /** Increment to trigger a shuffle animation */
  trigger: number;
  cardWidth?: number;
  cardHeight?: number;
  faceUp?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  /** Delay between each card's riffle cascade (ms) */
  staggerMs?: number;
  /** Duration of a single card's riffle drop (ms) */
  flightDurationMs?: number;
  /** Height of the arc during riffle drop (px) */
  arcHeightPx?: number;
  onComplete?: () => void;
}

type Phase = 'idle' | 'splitting' | 'riffling' | 'settling' | 'settled';

interface CardState {
  card: CardData;
  originalIndex: number;
  half: 'left' | 'right';
  halfIndex: number;
  cascadeOrder: number;
  baseX: number; baseY: number;
  splitX: number; splitY: number; splitRotate: number;
  riffleX: number; riffleY: number;
  randomOffX: number; randomOffRotate: number;
  curX: number; curY: number; curRotate: number;
}

interface AnimState {
  cards: CardState[];
  phase: Phase;
  startTime: number;
  splitDuration: number;
  cardRiffleDuration: number;
  settleDuration: number;
  arcHeightPx: number;
}

// ── Constants ──

const SPLIT_DURATION = 250;
const SETTLE_DURATION = 120;

// ── Component ──

export const CanvasRiffleShuffle: React.FC<CanvasRiffleShuffleProps> = ({
  cards,
  trigger,
  cardWidth = 70,
  cardHeight = 100,
  faceUp = false,
  canvasWidth = 520,
  canvasHeight = 300,
  staggerMs = 30,
  flightDurationMs = 200,
  arcHeightPx = 35,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const textureCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const animRef = useRef<AnimState | null>(null);
  const triggerRef = useRef(trigger);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const { config } = useCardEngine();
  const backImageRef = useRef<HTMLImageElement | null>(null);
  const drawBackRef = useRef(config.drawBack);
  drawBackRef.current = config.drawBack;
  const [textureVersion, setTextureVersion] = useState(0);

  useEffect(() => {
    if (config.cardBackImage) {
      const img = new Image();
      img.src = config.cardBackImage;
      img.onload = () => {
        backImageRef.current = img;
        textureCacheRef.current.clear();
        setTextureVersion(v => v + 1);
      };
      return () => { img.onload = null; };
    } else {
      backImageRef.current = null;
      textureCacheRef.current.clear();
      setTextureVersion(v => v + 1);
    }
  }, [config.cardBackImage]);

  useEffect(() => {
    textureCacheRef.current.clear();
    setTextureVersion(v => v + 1);
  }, [config.drawBack]);

  // ── Texture cache ──

  const getCardTexture = useCallback(
    (card: CardData, isFaceUp: boolean, cache: Map<string, HTMLCanvasElement>): HTMLCanvasElement => {
      const key = `${card.id}-${isFaceUp ? 'up' : 'down'}-${cardWidth}x${cardHeight}`;
      let entry = cache.get(key);
      if (!entry) {
        entry = document.createElement('canvas');
        entry.width = cardWidth;
        entry.height = cardHeight;
        const ctx = entry.getContext('2d')!;
        if (isFaceUp) {
          drawCardFace(ctx, cardWidth, cardHeight, card);
        } else if (drawBackRef.current) {
          drawBackRef.current(ctx, cardWidth, cardHeight);
        } else if (backImageRef.current) {
          ctx.drawImage(backImageRef.current, 0, 0, cardWidth, cardHeight);
        } else {
          drawCardBack(ctx, cardWidth, cardHeight);
        }
        cache.set(key, entry);
      }
      return entry;
    },
    [cardWidth, cardHeight],
  );

  // Pre-render textures when cards change
  useEffect(() => {
    const cache = textureCacheRef.current;
    for (const card of cards) {
      getCardTexture(card, faceUp, cache);
    }
  }, [cards, faceUp, getCardTexture, textureVersion]);

  // ── DPR setup ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
  }, [canvasWidth, canvasHeight]);

  // ── Build card states for the animation ──

  const buildCardStates = useCallback((): CardState[] => {
    const n = cards.length;
    const centerX = canvasWidth / 2 - cardWidth / 2;
    const centerY = canvasHeight / 2 - cardHeight / 2;
    const splitOffsetX = 55;
    const maxRotate = 12;

    const leftSize = Math.floor(n / 2);
    const rightSize = n - leftSize;

    const cascadeMap = new Map<number, number>();
    let order = 0;
    const maxHalf = Math.max(leftSize, rightSize);
    for (let i = 0; i < maxHalf; i++) {
      if (i < leftSize) cascadeMap.set(i, order++);
      if (i < rightSize) cascadeMap.set(leftSize + i, order++);
    }

    return cards.map((card, index) => {
      const half: 'left' | 'right' = index < leftSize ? 'left' : 'right';
      const halfIndex = half === 'left' ? index : index - leftSize;
      const hs = half === 'left' ? leftSize : rightSize;
      const cOrder = cascadeMap.get(index)!;

      const baseX = centerX + index * 0.5;
      const baseY = centerY - index * 1.5;

      const bendFrac = hs > 1 ? halfIndex / (hs - 1) : 0;
      const bendOffset = Math.sin(bendFrac * Math.PI) * 14;

      const splitX = half === 'left'
        ? centerX - splitOffsetX
        : centerX + splitOffsetX;
      const splitY = centerY - halfIndex * 1.5 - bendOffset;
      const splitRotate = half === 'left'
        ? -(maxRotate - halfIndex * 2)
        : (maxRotate - halfIndex * 2);

      const riffleX = centerX + cOrder * 0.5;
      const riffleY = centerY - cOrder * 1.5;

      const randomOffX = (seededRandom(index * 7 + trigger * 13) - 0.5) * 2.5;
      const randomOffRotate = (seededRandom(index * 11 + trigger * 17) - 0.5) * 4;

      return {
        card,
        originalIndex: index,
        half,
        halfIndex,
        cascadeOrder: cOrder,
        baseX, baseY,
        splitX, splitY, splitRotate,
        riffleX, riffleY,
        randomOffX, randomOffRotate,
        curX: baseX, curY: baseY, curRotate: 0,
      };
    });
  }, [cards, cardWidth, cardHeight, canvasWidth, canvasHeight, trigger]);

  // ── Draw idle pile ──

  const drawIdlePile = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (cards.length === 0) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      const ex = canvasWidth / 2 - cardWidth / 2;
      const ey = canvasHeight / 2 - cardHeight / 2;
      roundedRect(ctx, ex, ey, cardWidth, cardHeight, 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Empty', canvasWidth / 2, canvasHeight / 2);
    } else {
      const cache = textureCacheRef.current;
      const cx = canvasWidth / 2 - cardWidth / 2;
      const cy = canvasHeight / 2 - cardHeight / 2;
      for (let i = 0; i < cards.length; i++) {
        const tex = getCardTexture(cards[i], faceUp, cache);
        ctx.drawImage(tex, cx + i * 0.5, cy - i * 1.5, cardWidth, cardHeight);
      }
    }

    ctx.restore();
  }, [cards, faceUp, cardWidth, cardHeight, canvasWidth, canvasHeight, getCardTexture]);

  // Draw idle pile when not animating
  useEffect(() => {
    if (trigger === 0 || animRef.current?.phase === 'settled') {
      drawIdlePile();
    }
  });

  // ── Animation loop ──

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = animRef.current;
      if (!state || state.phase === 'idle' || state.phase === 'settled') return;

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const elapsed = timestamp - state.startTime;
      const cache = textureCacheRef.current;

      // Determine current phase
      const maxCascade = state.cards.reduce((m, cs) => Math.max(m, cs.cascadeOrder), 0);
      const totalRiffleMs = maxCascade * staggerMs + state.cardRiffleDuration;
      const totalAnimMs = state.splitDuration + totalRiffleMs + state.settleDuration;

      let currentPhase: Phase;
      if (elapsed < state.splitDuration) {
        currentPhase = 'splitting';
      } else if (elapsed < state.splitDuration + totalRiffleMs) {
        currentPhase = 'riffling';
      } else if (elapsed < totalAnimMs) {
        currentPhase = 'settling';
      } else {
        currentPhase = 'settled';
      }

      // Update and draw each card
      for (const cs of state.cards) {
        if (currentPhase === 'splitting') {
          const progress = Math.min(elapsed / state.splitDuration, 1);
          const eased = easeInOutQuad(progress);
          cs.curX = cs.baseX + (cs.splitX - cs.baseX) * eased;
          cs.curY = cs.baseY + (cs.splitY - cs.baseY) * eased;
          cs.curRotate = cs.splitRotate * eased;
        } else if (currentPhase === 'riffling' || currentPhase === 'settling' || currentPhase === 'settled') {
          const riffleElapsed = elapsed - state.splitDuration;
          const cardStart = cs.cascadeOrder * staggerMs;
          const cardEnd = cardStart + state.cardRiffleDuration;

          if (riffleElapsed < cardStart) {
            cs.curX = cs.splitX;
            cs.curY = cs.splitY;
            cs.curRotate = cs.splitRotate;
          } else if (riffleElapsed < cardEnd) {
            const progress = (riffleElapsed - cardStart) / state.cardRiffleDuration;
            const eased = easeOutBack(progress);
            cs.curX = cs.splitX + (cs.riffleX - cs.splitX) * eased
              + cs.randomOffX * (1 - progress);
            cs.curY = cs.splitY + (cs.riffleY - cs.splitY) * eased
              - state.arcHeightPx * Math.sin(progress * Math.PI);
            cs.curRotate = cs.splitRotate * (1 - easeOutCubic(progress))
              + cs.randomOffRotate * Math.sin(progress * Math.PI);
          } else if (currentPhase === 'settling') {
            const settleElapsed = riffleElapsed - cardEnd;
            const settleProgress = Math.min(settleElapsed / state.settleDuration, 1);
            const eased = easeOutCubic(settleProgress);
            const overshoot = Math.sin(settleProgress * Math.PI) * 2 * (1 - settleProgress);
            cs.curX = cs.riffleX;
            cs.curY = cs.riffleY - overshoot;
            cs.curRotate = cs.randomOffRotate * 0.2 * (1 - eased);
          } else {
            cs.curX = cs.riffleX;
            cs.curY = cs.riffleY;
            cs.curRotate = 0;
          }
        }
      }

      // Draw cards sorted by cascade order (bottom-to-top in final pile)
      const sorted = [...state.cards].sort((a, b) => a.cascadeOrder - b.cascadeOrder);

      for (const cs of sorted) {
        const texture = getCardTexture(cs.card, faceUp, cache);

        if (cs.curRotate !== 0) {
          ctx.save();
          const cx = cs.curX + cardWidth / 2;
          const cy = cs.curY + cardHeight / 2;
          ctx.translate(cx, cy);
          ctx.rotate((cs.curRotate * Math.PI) / 180);
          ctx.translate(-cx, -cy);
          ctx.drawImage(texture, cs.curX, cs.curY, cardWidth, cardHeight);
          ctx.restore();
        } else {
          ctx.drawImage(texture, cs.curX, cs.curY, cardWidth, cardHeight);
        }
      }

      ctx.restore();

      if (currentPhase === 'settled') {
        state.phase = 'settled';
        drawIdlePile();
        onCompleteRef.current?.();
        return;
      }

      state.phase = currentPhase;
      rafRef.current = requestAnimationFrame(animate);
    },
    [cardWidth, cardHeight, faceUp, canvasWidth, canvasHeight, getCardTexture, drawIdlePile, staggerMs],
  );

  // ── Trigger effect ──

  useEffect(() => {
    if (trigger === 0) {
      triggerRef.current = 0;
      animRef.current = null;
      drawIdlePile();
      return;
    }

    if (trigger === triggerRef.current) return;
    triggerRef.current = trigger;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    const n = cards.length;
    if (n === 0) {
      animRef.current = null;
      drawIdlePile();
      return;
    }

    const cardStates = buildCardStates();

    animRef.current = {
      cards: cardStates,
      phase: 'splitting',
      startTime: performance.now(),
      splitDuration: SPLIT_DURATION,
      cardRiffleDuration: flightDurationMs,
      settleDuration: SETTLE_DURATION,
      arcHeightPx,
    };

    rafRef.current = requestAnimationFrame(animate);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        borderRadius: '8px',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}
    />
  );
};

CanvasRiffleShuffle.displayName = 'CanvasRiffleShuffle';
