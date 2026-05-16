import { describe, it, expect } from 'vitest';
import { createStandardDeck, createDeck } from '../src/models/Deck';
import { createCard, Rank, Suit } from '../src/models/Card';

describe('Deck', () => {
  it('creates a standard 52-card deck', () => {
    const deck = createStandardDeck();
    expect(deck.remaining).toBe(52);
  });

  it('creates a standard deck with jokers', () => {
    const deck = createStandardDeck({ jokers: 2 });
    expect(deck.remaining).toBe(54);
  });

  it('shuffle keeps same card count', () => {
    const deck = createStandardDeck();
    deck.shuffle();
    expect(deck.remaining).toBe(52);
  });

  it('draw removes cards', () => {
    const deck = createStandardDeck();
    const drawn = deck.draw(5);
    expect(drawn.length).toBe(5);
    expect(deck.remaining).toBe(47);
  });

  it('drawOne returns a card or undefined', () => {
    const deck = createStandardDeck();
    const card = deck.drawOne();
    expect(card).toBeDefined();
    expect(deck.remaining).toBe(51);
  });

  it('drawOne returns undefined when empty', () => {
    const deck = createDeck([]);
    expect(deck.drawOne()).toBeUndefined();
  });

  it('addToTop and addToBottom', () => {
    const deck = createDeck([]);
    const a = createCard(Rank.Ace, Suit.Spades);
    const b = createCard(Rank.King, Suit.Hearts);
    deck.addToBottom([a]);
    deck.addToTop([b]);
    const drawn = deck.draw(2);
    expect(drawn[0].id).toBe(b.id);
    expect(drawn[1].id).toBe(a.id);
  });

  it('peek does not remove cards', () => {
    const deck = createStandardDeck();
    const before = deck.remaining;
    const peeked = deck.peek(3);
    expect(peeked.length).toBe(3);
    expect(deck.remaining).toBe(before);
  });

  it('reset restores original cards', () => {
    const deck = createStandardDeck();
    deck.draw(10);
    expect(deck.remaining).toBe(42);
    deck.reset();
    expect(deck.remaining).toBe(52);
  });
});
