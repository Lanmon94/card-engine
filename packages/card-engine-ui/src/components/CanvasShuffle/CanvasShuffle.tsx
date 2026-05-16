import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { Card as CardData } from '@card-engine/core';
import {
  drawCardFace,
  drawCardBack,
  roundedRect,
} from '../../animations/canvas/card-renderer';
import { useCardEngine } from '../CardEngine/CardEngine';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

// ── Types ──

export interface CanvasShuffleProps {
  cards: CardData[];
  /** Increment to trigger a shuffle animation */
  trigger: number;
  cardWidth?: number;
  cardHeight?: number;
  faceUp?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  /** Delay between each card's flight start (ms) */
  staggerMs?: number;
  /** Duration of a single card's flight (ms) */
  flightDurationMs?: number;
  /** Height of the parabolic arc (px) */
  arcHeightPx?: number;
  onComplete?: () => void;
}

type AnimPhase = 'idle' | 'flying' | 'settling' | 'settled';

interface FlyingCard {
  card: CardData;
  side: 'left' | 'right';
  startX: number;
  targetX: number;
  centerY: number;
  delayMs: number;
  durationMs: number;
  startWallTime: number;
  finished: boolean;
  currentX: number;
  currentY: number;
}

interface AnimState {
  cards: FlyingCard[];
  arcHeightPx: number;
  phase: AnimPhase;
}

// ── Component ──

export const CanvasShuffle: React.FC<CanvasShuffleProps> = ({
  cards,
  trigger,
  cardWidth = 70,
  cardHeight = 100,
  faceUp = false,
  canvasWidth = 520,
  canvasHeight = 300,
  staggerMs = 130,
  flightDurationMs = 600,
  arcHeightPx = 140,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const animStateRef = useRef<AnimState | null>(null);
  const textureCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const triggerRef = useRef(trigger);
  const settleTimerRef = useRef(0);
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

  // ── Draw settled pile ──

  const drawSettledPile = useCallback(() => {
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

  // Draw settled pile when not animating
  useEffect(() => {
    if (trigger === 0 || (animStateRef.current?.phase === 'settled')) {
      drawSettledPile();
    }
  });

  // ── Animation loop ──

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = animStateRef.current;
      if (!state || state.phase === 'idle' || state.phase === 'settled') return;

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const cache = textureCacheRef.current;

      const sorted = [...state.cards].sort((a, b) => {
        if (a.finished && !b.finished) return -1;
        if (!a.finished && b.finished) return 1;
        return state.cards.indexOf(a) - state.cards.indexOf(b);
      });

      let allSettled = true;

      for (const fc of sorted) {
        if (timestamp < fc.startWallTime) {
          allSettled = false;
          continue;
        }

        let progress: number;
        if (fc.finished) {
          progress = 1;
        } else {
          const elapsed = timestamp - fc.startWallTime;
          progress = Math.min(elapsed / fc.durationMs, 1);
          if (progress < 1) allSettled = false;
        }

        const easedProgress = easeOutCubic(progress);
        fc.currentX = fc.startX + (fc.targetX - fc.startX) * easedProgress;
        fc.currentY =
          fc.centerY - state.arcHeightPx * Math.sin(progress * Math.PI);

        let finalX = fc.currentX;
        let finalY = fc.currentY;

        // Landing shake
        if (progress >= 0.85 && !fc.finished) {
          const settleT = (progress - 0.85) / 0.15;
          const decay = Math.max(0, 1 - settleT);
          finalX +=
            Math.sin(progress * 40) * 3 * decay * decay;
        }

        if (progress >= 1 && !fc.finished) {
          fc.finished = true;
          fc.currentX = fc.targetX;
          fc.currentY = fc.centerY;
          finalX = fc.targetX;
          finalY = fc.centerY;
        }

        const texture = getCardTexture(fc.card, faceUp, cache);
        ctx.drawImage(texture, finalX, finalY, cardWidth, cardHeight);
      }

      ctx.restore();

      if (allSettled && state.phase === 'flying') {
        state.phase = 'settling';
        settleTimerRef.current = window.setTimeout(() => {
          state.phase = 'settled';
          drawSettledPile();
          onCompleteRef.current?.();
        }, 250);
        return;
      }

      rafRef.current = requestAnimationFrame(animate);
    },
    [cardWidth, cardHeight, faceUp, canvasWidth, canvasHeight, getCardTexture, drawSettledPile],
  );

  // ── Trigger effect ──

  useEffect(() => {
    if (trigger === 0) {
      triggerRef.current = 0;
      drawSettledPile();
      return;
    }

    if (trigger === triggerRef.current) return;
    triggerRef.current = trigger;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    if (settleTimerRef.current) {
      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = 0;
    }

    const n = cards.length;
    if (n === 0) {
      animStateRef.current = null;
      drawSettledPile();
      return;
    }

    const centerX = canvasWidth / 2 - cardWidth / 2;
    const centerY = canvasHeight / 2 - cardHeight / 2;
    const sideOffset = cardWidth + 60;

    const flyingCards: FlyingCard[] = cards.map((card, index) => ({
      card,
      side: index % 2 === 0 ? 'left' : 'right',
      startX:
        index % 2 === 0 ? -sideOffset : canvasWidth + sideOffset,
      targetX: centerX + index * 0.5,
      centerY: centerY - index * 1.5,
      delayMs: index * staggerMs,
      durationMs: flightDurationMs,
      startWallTime: 0,
      finished: false,
      currentX: 0,
      currentY: 0,
    }));

    animStateRef.current = {
      cards: flyingCards,
      arcHeightPx: arcHeightPx,
      phase: 'flying',
    };

    const startTime = performance.now();
    for (const fc of flyingCards) {
      fc.startWallTime = startTime + fc.delayMs;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ──

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
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

CanvasShuffle.displayName = 'CanvasShuffle';
