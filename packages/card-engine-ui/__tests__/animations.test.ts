import { describe, it, expect } from 'vitest';
import { animationToStyle } from '../src/animations/adapters/css';
import { createAnimationId } from '../src/animations/types';
import type { AnimationDescriptor } from '../src/animations/types';
import {
  getFlipContainerStyle,
  getFlipInnerStyle,
  getFlipFaceStyle,
  getFlipBackStyle,
  getEntranceStyle,
} from '../src/animations/utils';
import { flipPreset } from '../src/animations/presets/flip';
import { dealPreset } from '../src/animations/presets/deal';
import { shufflePreset } from '../src/animations/presets/shuffle';
import { movePreset } from '../src/animations/presets/move';

describe('Animation utilities', () => {
  it('generates unique animation ids', () => {
    const a = createAnimationId();
    const b = createAnimationId();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^anim-/);
  });

  it('animationToStyle produces transform with translate', () => {
    const desc: AnimationDescriptor = {
      id: 'test-1',
      type: 'move',
      target: { type: 'card', cardId: 'card-1' },
      duration: 300,
      to: { x: 100, y: 50 },
    };
    const style = animationToStyle(desc);
    expect(style.transform).toContain('translate(100px, 50px)');
    expect(style.transition).toContain('300ms');
  });

  it('animationToStyle handles 3D rotation', () => {
    const desc: AnimationDescriptor = {
      id: 'test-2',
      type: 'flip',
      target: { type: 'card', cardId: 'card-1' },
      duration: 400,
      easing: 'ease-in-out',
      to: { rotateY: 180 },
    };
    const style = animationToStyle(desc);
    expect(style.transform).toContain('rotateY(180deg)');
    expect(style.transition).toContain('ease-in-out');
  });

  it('animationToStyle includes opacity when specified', () => {
    const desc: AnimationDescriptor = {
      id: 'test-3',
      type: 'deal',
      target: { type: 'card', cardId: 'card-1' },
      duration: 200,
      to: { opacity: 0.5, scale: 1.2 },
    };
    const style = animationToStyle(desc);
    expect(style.opacity).toBe(0.5);
    expect(style.transform).toContain('scale(1.2)');
  });
});

describe('Platform-aware flip styles', () => {
  describe('getFlipContainerStyle', () => {
    it('sets perspective for all platforms', () => {
      for (const platform of ['h5', 'weapp', 'rn', 'unknown'] as const) {
        const style = getFlipContainerStyle(platform, false);
        expect(style.perspective).toBe('800px');
      }
    });
  });

  describe('getFlipInnerStyle', () => {
    it('uses 3D transform for h5 platform', () => {
      const style = getFlipInnerStyle('h5', false);
      expect(style.transformStyle).toBe('preserve-3d');
      expect(style.transform).toContain('rotateY(0deg)');
    });

    it('uses rotateY(180deg) when flipped on h5', () => {
      const style = getFlipInnerStyle('h5', true);
      expect(style.transform).toContain('rotateY(180deg)');
    });

    it('uses opacity-only for rn platform', () => {
      const style = getFlipInnerStyle('rn', true);
      expect(style.transformStyle).toBeUndefined();
      expect(style.transition).toContain('opacity');
    });

    it('uses 3D transform for weapp platform', () => {
      const style = getFlipInnerStyle('weapp', true);
      expect(style.transform).toContain('rotateY(180deg)');
    });

    it('uses 3D transform for unknown platform', () => {
      const style = getFlipInnerStyle('unknown', true);
      expect(style.transform).toContain('rotateY(180deg)');
    });
  });

  describe('getFlipFaceStyle', () => {
    it('sets backfaceVisibility hidden for h5', () => {
      const style = getFlipFaceStyle('h5');
      expect(style.backfaceVisibility).toBe('hidden');
    });

    it('omits backfaceVisibility for rn', () => {
      const style = getFlipFaceStyle('rn');
      expect(style.backfaceVisibility).toBeUndefined();
    });
  });

  describe('getFlipBackStyle', () => {
    it('pre-rotates 180deg for h5', () => {
      const style = getFlipBackStyle('h5');
      expect(style.transform).toContain('rotateY(180deg)');
      expect(style.backfaceVisibility).toBe('hidden');
    });

    it('omits 3D properties for rn', () => {
      const style = getFlipBackStyle('rn');
      expect(style.transform).toBeUndefined();
    });
  });
});

describe('getEntranceStyle', () => {
  it('returns from style with transition: none', () => {
    const desc = dealPreset('card-1', {
      from: { x: 0, y: -80 },
      to: { x: 0, y: 0 },
    });
    const style = getEntranceStyle(desc, 'from');
    expect(style.transition).toBe('none');
    expect(style.transform).toContain('translate(0px, -80px)');
    expect(style.opacity).toBe(0);
  });

  it('returns to style with transition', () => {
    const desc = dealPreset('card-2', {
      from: { x: 0, y: -80 },
      to: { x: 0, y: 0 },
    });
    const style = getEntranceStyle(desc, 'to');
    expect(style.transition).toContain('300ms');
    expect(style.transform).toContain('translate(0px, 0px)');
    expect(style.opacity).toBe(1);
  });
});

describe('Animation presets', () => {
  it('flipPreset creates correct descriptor', () => {
    const desc = flipPreset('card-1', 'card');
    expect(desc.type).toBe('flip');
    expect(desc.target).toEqual({ type: 'card', cardId: 'card-1' });
    expect(desc.to.rotateY).toBe(180);
  });

  it('flipPreset fromFaceUp reverses rotation', () => {
    const desc = flipPreset('card-1', 'card', { fromFaceDown: false });
    expect(desc.from?.rotateY).toBe(180);
    expect(desc.to.rotateY).toBe(0);
  });

  it('dealPreset creates correct descriptor', () => {
    const desc = dealPreset('card-1', {
      from: { x: 10, y: 20 },
      to: { x: 0, y: 0 },
    });
    expect(desc.type).toBe('deal');
    expect(desc.from?.opacity).toBe(0);
    expect(desc.to.opacity).toBe(1);
  });

  it('shufflePreset creates correct descriptor', () => {
    const desc = shufflePreset('pile-1');
    expect(desc.type).toBe('shuffle');
    expect(desc.target).toEqual({ type: 'pile', pileId: 'pile-1' });
  });

  it('movePreset creates correct descriptor', () => {
    const desc = movePreset('card-1', {
      from: { x: 0, y: 0 },
      to: { x: 200, y: 100 },
      duration: 500,
    });
    expect(desc.type).toBe('move');
    expect(desc.duration).toBe(500);
    expect(desc.to).toEqual({ x: 200, y: 100 });
  });
});
