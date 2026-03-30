import type { GameState, Action, ActionType } from '@/types/game';
import type { AnyPlayer } from '@/types/player';
import type { Villain } from '@/types/player';
import { PREFLOP_RANGES } from '@/data/preflopRanges';
import { ARCHETYPE_PROFILES } from '@/data/archetypeProfiles';
import { handMatchesRange } from '@/utils/rangeParser';
import { evaluateHand } from '@/utils/handEvaluator';
import { HAND_RANK_VALUE } from '@/types/cards';

void HAND_RANK_VALUE; // kept for type import

// Maps hand categories to intuitive 0–1 strength values so thresholds are
// meaningful. The old handRank.value / MAX_HAND_VALUE scheme compressed all
// pairs into the 0–0.02 range, causing villains to fold every made hand.
const CATEGORY_STRENGTH: Record<string, number> = {
  HIGH_CARD:       0.06,
  PAIR:            0.22,
  TWO_PAIR:        0.42,
  THREE_OF_A_KIND: 0.58,
  STRAIGHT:        0.68,
  FLUSH:           0.76,
  FULL_HOUSE:      0.85,
  FOUR_OF_A_KIND:  0.93,
  STRAIGHT_FLUSH:  0.97,
  ROYAL_FLUSH:     1.00,
};

function normalizeHandStrength(handRank: ReturnType<typeof evaluateHand>): number {
  return CATEGORY_STRENGTH[handRank.category] ?? 0.05;
}

function isVillain(p: AnyPlayer): p is Villain {
  return !p.isHero;
}

// Noise: add ±factor randomness to a threshold
function withNoise(value: number, factor = 0.1): number {
  return value + (Math.random() * 2 - 1) * factor;
}

// Preflop decision
function getPreflopDecision(state: GameState, villain: Villain): Action {
  const round = state.currentBettingRound!;
  const profile = ARCHETYPE_PROFILES[villain.archetype];
  const ranges = PREFLOP_RANGES[villain.archetype][villain.position];

  const myBet = round.betsThisRound[villain.id] ?? 0;
  const toCall = round.currentBet - myBet;
  const hasFacingRaise = toCall > state.bigBlindAmount || round.currentBet > state.bigBlindAmount;
  const isFacing3bet = round.currentBet >= state.bigBlindAmount * 8; // rough threshold

  const [c1, c2] = villain.holeCards;

  let actionType: ActionType;
  let amount = 0;

  if (!hasFacingRaise) {
    // RFI decision
    const inRange = handMatchesRange(c1, c2, ranges.RFI);
    if (inRange) {
      // Raise
      const raiseSizes: Record<string, number> = {
        UTG: 2.5, UTG1: 2.5, HJ: 2.5, CO: 2.5, BTN: 2.2, SB: 3, BB: 0,
      };
      const sizeMultiplier = raiseSizes[villain.position] ?? 2.5;
      amount = sizeMultiplier * state.bigBlindAmount;
      // LOOSE_PASSIVE sometimes limps instead
      if (villain.archetype === 'LOOSE_PASSIVE' && Math.random() < 0.3) {
        actionType = 'CALL'; // limp
        amount = state.bigBlindAmount;
      } else {
        actionType = 'RAISE';
      }
    } else if (villain.position === 'BB') {
      // BB always gets a free check if no raise
      actionType = 'CHECK';
    } else {
      // Outside RFI range — looser archetypes limp/call speculatively
      const speculativeLimpChance = { TAG: 0.08, LAG: 0.22, TIGHT_PASSIVE: 0.03, LOOSE_PASSIVE: 0.35 }[villain.archetype] ?? 0.08;
      if (Math.random() < speculativeLimpChance) {
        actionType = 'CALL'; // limp
        amount = state.bigBlindAmount;
      } else {
        actionType = 'FOLD';
      }
    }
  } else if (isFacing3bet) {
    // Facing 3-bet
    const in4betRange = handMatchesRange(c1, c2, ranges.vs3bet_call);
    // Very polarized: either 4-bet strong hands or fold
    const strongHands = new Set(['AA', 'KK', 'QQ']);
    const hand = getHandString(c1, c2);
    if (strongHands.has(hand) && Math.random() < 0.7) {
      actionType = 'RAISE';
      amount = round.currentBet * 3;
    } else if (in4betRange && Math.random() < withNoise(0.65, 0.15)) {
      actionType = 'CALL';
      amount = toCall;
    } else {
      actionType = 'FOLD';
    }
  } else {
    // Facing 2-bet
    const in3betRange = handMatchesRange(c1, c2, ranges.vsRFI_3bet);
    const inCallRange = handMatchesRange(c1, c2, ranges.vsRFI_call);

    const threeBetNoise = withNoise(profile.bluffFrequency * 0.5, 0.05);

    if (in3betRange && Math.random() < withNoise(0.75, 0.1)) {
      actionType = 'RAISE';
      amount = round.currentBet * (2.5 + Math.random() * 0.5);
    } else if (inCallRange && Math.random() > threeBetNoise) {
      actionType = 'CALL';
      amount = toCall;
    } else {
      // Not in explicit call range — looser archetypes defend wider
      const wideDefendChance = { TAG: 0.10, LAG: 0.28, TIGHT_PASSIVE: 0.04, LOOSE_PASSIVE: 0.42 }[villain.archetype] ?? 0.10;
      if (Math.random() < wideDefendChance) {
        actionType = 'CALL';
        amount = toCall;
      } else {
        actionType = 'FOLD';
      }
    }
  }

  // Safety: cap all-in
  if (amount > 0 && amount > villain.stack + myBet) {
    amount = villain.stack + myBet;
  }

  return buildAction(villain, actionType, amount, 'preflop', state);
}

// Postflop decision
function getPostflopDecision(state: GameState, villain: Villain): Action {
  const round = state.currentBettingRound!;
  const profile = ARCHETYPE_PROFILES[villain.archetype];

  const myBet = round.betsThisRound[villain.id] ?? 0;
  const toCall = round.currentBet - myBet;
  const isFacingBet = toCall > 0;

  // Compute normalized hand strength using category-based mapping
  const handRank = evaluateHand([...villain.holeCards, ...state.communityCards]);
  const normalizedStrength = normalizeHandStrength(handRank);

  // Adjust for multiway: strength degrades exponentially
  const activePlayers = state.players.filter((p) => !p.isFolded).length;
  const adjustedStrength = Math.pow(normalizedStrength, Math.max(1, activePlayers - 1) * 0.5);

  const street = round.street;
  const pot = state.pot;

  let actionType: ActionType;
  let amount = 0;

  if (!isFacingBet) {
    // Check or bet
    const cBetFreq = isInPosition(state, villain)
      ? profile.cBetFrequencyIP
      : profile.cBetFrequencyOOP;

    const shouldBet = adjustedStrength > withNoise(profile.valueBetThreshold, 0.1);
    const shouldBluff =
      adjustedStrength < 0.2 &&
      activePlayers === 2 && // Only bluff heads-up
      Math.random() < withNoise(profile.bluffFrequency, 0.05);

    if ((shouldBet || shouldBluff) && Math.random() < cBetFreq) {
      actionType = 'BET';
      const sizeFraction = street === 'flop' ? 0.55 : street === 'turn' ? 0.65 : 0.70;
      amount = myBet + Math.round(pot * sizeFraction * profile.betSizingFactor);
      amount = Math.min(amount, myBet + villain.stack);
    } else {
      actionType = 'CHECK';
    }
  } else {
    // Call, raise, or fold
    const potOdds = toCall / (pot + toCall);
    const callThreshold = potOdds - profile.callThresholdAdjustment;

    if (adjustedStrength > withNoise(0.58, 0.06) && Math.random() < profile.checkRaiseFrequency) {
      // Raise for value/protection
      actionType = 'RAISE';
      amount = myBet + round.currentBet + Math.round(pot * 0.6);
      amount = Math.min(amount, myBet + villain.stack);
    } else if (adjustedStrength > withNoise(callThreshold, 0.05)) {
      actionType = 'CALL';
      amount = Math.min(toCall, villain.stack);
    } else {
      actionType = 'FOLD';
    }
  }

  return buildAction(villain, actionType, amount, round.street, state);
}

function isInPosition(state: GameState, player: AnyPlayer): boolean {
  const activePlayers = state.players.filter((p) => !p.isFolded);
  if (activePlayers.length < 2) return true;
  // Last active player in postflop order is IP
  const order = ['BTN', 'CO', 'HJ', 'UTG1', 'UTG', 'BB', 'SB'];
  for (const pos of order) {
    const found = activePlayers.find((p) => p.position === pos);
    if (found) return found.id === player.id;
  }
  return false;
}

function buildAction(
  player: AnyPlayer,
  actionType: ActionType,
  amount: number,
  street: string,
  state: GameState,
): Action {
  return {
    playerId: player.id,
    playerName: player.name,
    position: player.position,
    actionType,
    amount,
    street: street as Action['street'],
    timestamp: Date.now(),
  };
  void state;
}

function getHandString(c1: { rank: string }, c2: { rank: string }): string {
  const ranks = [c1.rank, c2.rank].sort();
  return ranks[1] + ranks[0]; // Higher rank first
}

export function getVillainAction(state: GameState, villain: Villain): Action {
  if (!isVillain(villain)) throw new Error('Not a villain');

  const phase = state.phase;
  if (phase === 'PREFLOP') return getPreflopDecision(state, villain);
  return getPostflopDecision(state, villain);
}
