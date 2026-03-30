import type { GameState, Action, ActionType, BettingRound, Street, HandResult } from '@/types/game';
import type { AnyPlayer, Position, Villain, Hero } from '@/types/player';
import type { Archetype } from '@/types/player';
import { PREFLOP_ACTION_ORDER, POSTFLOP_ACTION_ORDER } from '@/types/player';
import { createDeck, shuffleDeck, dealCards } from '@/utils/deck';
import { evaluateHand, compareHands } from '@/utils/handEvaluator';
import { ARCHETYPE_PROFILES, VILLAIN_NAMES } from '@/data/archetypeProfiles';

const ARCHETYPES: Archetype[] = ['TAG', 'LAG', 'TIGHT_PASSIVE', 'LOOSE_PASSIVE'];

function randomArchetype(): Archetype {
  return ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
}

function randomName(archetype: Archetype, existingNames: string[]): string {
  const pool = VILLAIN_NAMES[archetype];
  const available = pool.filter((n) => !existingNames.includes(n));
  if (available.length === 0) return `Villain${existingNames.length + 1}`;
  return available[Math.floor(Math.random() * available.length)];
}

// Positions in seat order for a 6-max table (seat 0 = BTN by convention rotated)
const SEAT_POSITIONS: Position[] = ['BTN', 'SB', 'BB', 'UTG', 'UTG1', 'HJ'];
// For more than 6 players we'd add CO, but we're fixed 6-max

// Build 6 players: 1 hero + 5 villains
export function createInitialGameState(): GameState {
  const heroSeat = Math.floor(Math.random() * 6);
  const dealerSeat = Math.floor(Math.random() * 6);

  const names: string[] = [];
  const players: AnyPlayer[] = [];

  for (let seat = 0; seat < 6; seat++) {
    const position = getPositionForSeat(seat, dealerSeat);
    if (seat === heroSeat) {
      const hero: Hero = {
        id: 'hero',
        name: 'You',
        stack: 100,
        holeCards: [],
        isActive: true,
        isFolded: false,
        isAllIn: false,
        currentStreetBet: 0,
        totalInvestedThisHand: 0,
        position,
        seatIndex: seat,
        isHero: true,
      };
      players.push(hero);
      names.push('You');
    } else {
      const archetype = randomArchetype();
      const name = randomName(archetype, names);
      names.push(name);
      const villain: Villain = {
        id: `villain_${seat}`,
        name,
        stack: 100,
        holeCards: [],
        isActive: true,
        isFolded: false,
        isAllIn: false,
        currentStreetBet: 0,
        totalInvestedThisHand: 0,
        position,
        seatIndex: seat,
        isHero: false,
        archetype,
      };
      players.push(villain);
    }
  }
  void ARCHETYPE_PROFILES; // used in villain engine

  return {
    phase: 'WAITING',
    handNumber: 0,
    deck: [],
    players,
    heroId: 'hero',
    communityCards: [],
    pot: 0,
    sidePots: [],
    currentBettingRound: null,
    actionHistory: [],
    dealerSeatIndex: dealerSeat,
    smallBlindAmount: 0.5,
    bigBlindAmount: 1,
    activePlayerIndex: 0,
    preflopAggressorId: null,
    lastHandResult: null,
    isHeroTurn: false,
    showVillainCards: false,
  };
}

// Reset for a new hand (keep players, rotate dealer)
export function startNewHand(prev: GameState): GameState {
  const newDealerSeat = (prev.dealerSeatIndex + 1) % 6;

  const deck = shuffleDeck(createDeck());
  let remaining = deck;

  // Reassign positions based on new dealer seat, carry stacks over between hands
  const players: AnyPlayer[] = prev.players.map((p) => {
    const position = getPositionForSeat(p.seatIndex, newDealerSeat);
    // Top up any busted or very short-stacked player to 100bb
    const carryStack = p.stack < 10 ? 100 : p.stack;
    return {
      ...p,
      position,
      holeCards: [],
      isActive: true,
      isFolded: false,
      isAllIn: false,
      currentStreetBet: 0,
      totalInvestedThisHand: 0,
      stack: carryStack,
    };
  });

  // Deal hole cards in position order
  const dealtPlayers = [...players];
  for (let i = 0; i < dealtPlayers.length; i++) {
    const { cards, remaining: rem } = dealCards(remaining, 2);
    dealtPlayers[i] = { ...dealtPlayers[i], holeCards: cards };
    remaining = rem;
  }

  // Post blinds
  const sbPlayer = dealtPlayers.find((p) => p.position === 'SB')!;
  const bbPlayer = dealtPlayers.find((p) => p.position === 'BB')!;

  const sbAmount = 0.5;
  const bbAmount = 1;

  const postBlindsPlayers = dealtPlayers.map((p) => {
    if (p.id === sbPlayer.id) {
      return {
        ...p,
        stack: p.stack - sbAmount,
        currentStreetBet: sbAmount,
        totalInvestedThisHand: sbAmount,
      };
    }
    if (p.id === bbPlayer.id) {
      return {
        ...p,
        stack: p.stack - bbAmount,
        currentStreetBet: bbAmount,
        totalInvestedThisHand: bbAmount,
      };
    }
    return p;
  });

  const pot = sbAmount + bbAmount;

  const sbAction: Action = {
    playerId: sbPlayer.id,
    playerName: sbPlayer.name,
    position: 'SB',
    actionType: 'POST_SB',
    amount: sbAmount,
    street: 'preflop',
    timestamp: Date.now(),
  };
  const bbAction: Action = {
    playerId: bbPlayer.id,
    playerName: bbPlayer.name,
    position: 'BB',
    actionType: 'POST_BB',
    amount: bbAmount,
    street: 'preflop',
    timestamp: Date.now(),
  };

  const bettingRound: BettingRound = {
    street: 'preflop',
    actions: [],
    potAtStart: pot,
    betsThisRound: {
      [sbPlayer.id]: sbAmount,
      [bbPlayer.id]: bbAmount,
    },
    currentBet: bbAmount,
    minRaise: bbAmount, // Min raise = 1bb preflop
    lastAggressorId: null,
    actionsCount: 0,
  };

  // Find first UTG player
  const firstToAct = getFirstToActPreflop(postBlindsPlayers);

  return {
    ...prev,
    phase: 'PREFLOP',
    handNumber: prev.handNumber + 1,
    deck: remaining,
    players: postBlindsPlayers,
    communityCards: [],
    pot,
    sidePots: [],
    currentBettingRound: bettingRound,
    actionHistory: [sbAction, bbAction],
    dealerSeatIndex: newDealerSeat,
    activePlayerIndex: firstToAct,
    preflopAggressorId: null,
    lastHandResult: null,
    isHeroTurn: postBlindsPlayers[firstToAct]?.id === 'hero',
    showVillainCards: false,
  };
}

export function applyAction(state: GameState, action: Action): GameState {
  const round = state.currentBettingRound;
  if (!round) return state;

  let players = [...state.players];
  const playerIdx = players.findIndex((p) => p.id === action.playerId);
  if (playerIdx === -1) return state;

  let player = { ...players[playerIdx] };
  let pot = state.pot;
  let preflopAggressorId = state.preflopAggressorId;

  const myCurrentBet = round.betsThisRound[player.id] ?? 0;
  const toCall = round.currentBet - myCurrentBet;

  let newCurrentBet = round.currentBet;
  let newMinRaise = round.minRaise;
  let newLastAggressorId = round.lastAggressorId;
  const newBetsThisRound = { ...round.betsThisRound };

  switch (action.actionType) {
    case 'FOLD':
      player = { ...player, isFolded: true, isActive: false };
      break;

    case 'CHECK':
      // No change to pot or bets
      break;

    case 'CALL': {
      const callAmt = Math.min(toCall, player.stack);
      player = {
        ...player,
        stack: player.stack - callAmt,
        currentStreetBet: myCurrentBet + callAmt,
        totalInvestedThisHand: player.totalInvestedThisHand + callAmt,
        isAllIn: player.stack - callAmt === 0,
      };
      pot += callAmt;
      newBetsThisRound[player.id] = myCurrentBet + callAmt;
      break;
    }

    case 'BET':
    case 'RAISE': {
      // action.amount = total amount on the street (not just the increase)
      const betTotal = Math.min(action.amount, myCurrentBet + player.stack);
      const increase = betTotal - myCurrentBet;
      const raiseSize = betTotal - round.currentBet;

      player = {
        ...player,
        stack: player.stack - increase,
        currentStreetBet: betTotal,
        totalInvestedThisHand: player.totalInvestedThisHand + increase,
        isAllIn: player.stack - increase === 0,
      };
      pot += increase;
      newBetsThisRound[player.id] = betTotal;
      newCurrentBet = betTotal;
      newMinRaise = Math.max(newMinRaise, raiseSize);
      newLastAggressorId = player.id;

      if (round.street === 'preflop') {
        preflopAggressorId = player.id;
      }
      break;
    }

    case 'ALL_IN': {
      const allInAmt = player.stack;
      const totalBet = myCurrentBet + allInAmt;
      player = {
        ...player,
        stack: 0,
        currentStreetBet: totalBet,
        totalInvestedThisHand: player.totalInvestedThisHand + allInAmt,
        isAllIn: true,
      };
      pot += allInAmt;
      newBetsThisRound[player.id] = totalBet;
      if (totalBet > newCurrentBet) {
        newCurrentBet = totalBet;
        newLastAggressorId = player.id;
      }
      break;
    }
  }

  players[playerIdx] = player;

  const newRound: BettingRound = {
    ...round,
    actions: [...round.actions, action],
    betsThisRound: newBetsThisRound,
    currentBet: newCurrentBet,
    minRaise: newMinRaise,
    lastAggressorId: newLastAggressorId,
    actionsCount: round.actionsCount + 1,
  };

  const newActionHistory = [...state.actionHistory, action];

  const newState: GameState = {
    ...state,
    players,
    pot,
    currentBettingRound: newRound,
    actionHistory: newActionHistory,
    preflopAggressorId,
  };

  // Check if round is complete
  if (isBettingRoundComplete(newState)) {
    return advanceAfterRound(newState);
  }

  // Advance to next player
  const nextIdx = getNextActivePlayerIndex(newState, playerIdx);
  const nextPlayer = players[nextIdx];

  return {
    ...newState,
    activePlayerIndex: nextIdx,
    isHeroTurn: nextPlayer?.id === 'hero',
  };
}

function isBettingRoundComplete(state: GameState): boolean {
  const round = state.currentBettingRound;
  if (!round) return true;

  const activePlayers = state.players.filter((p) => !p.isFolded && !p.isAllIn);

  if (activePlayers.length <= 1) return true;

  // All active players must have matched the current bet
  for (const p of activePlayers) {
    const myBet = round.betsThisRound[p.id] ?? 0;
    if (myBet < round.currentBet) return false;
  }

  // And at least one action must have been taken (after blinds for preflop)
  // Every active player must have acted at least once since last aggression
  if (round.actionsCount === 0) return false;

  // On preflop, BB gets to act even if everyone just calls
  if (round.street === 'preflop' && round.lastAggressorId === null) {
    // No raises — check if BB has acted
    const bbPlayer = state.players.find((p) => p.position === 'BB');
    if (bbPlayer && !bbPlayer.isFolded && !bbPlayer.isAllIn) {
      const bbActed = round.actions.some(
        (a) => a.playerId === bbPlayer.id && a.actionType !== 'POST_BB'
      );
      if (!bbActed) return false;
    }
  }

  return true;
}

function advanceAfterRound(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isFolded);

  // Only one player left
  if (activePlayers.length === 1) {
    return resolveWalkover(state);
  }

  const phase = state.phase;

  if (phase === 'PREFLOP') return dealFlop(state);
  if (phase === 'FLOP') return dealTurn(state);
  if (phase === 'TURN') return dealRiver(state);
  if (phase === 'RIVER') return resolveShowdown(state);

  return state;
}

function dealCommunityCards(state: GameState, count: number, phase: GameState['phase'], street: Street): GameState {
  const { cards, remaining } = dealCards(state.deck, count);
  const communityCards = [...state.communityCards, ...cards];

  // Reset street bets
  const players = state.players.map((p) => ({
    ...p,
    currentStreetBet: 0,
  }));

  const firstToAct = getFirstToActPostflop(players, state.dealerSeatIndex);

  const newRound: BettingRound = {
    street,
    actions: [],
    potAtStart: state.pot,
    betsThisRound: {},
    currentBet: 0,
    minRaise: state.bigBlindAmount,
    lastAggressorId: null,
    actionsCount: 0,
  };

  return {
    ...state,
    phase,
    deck: remaining,
    players,
    communityCards,
    currentBettingRound: newRound,
    activePlayerIndex: firstToAct,
    isHeroTurn: players[firstToAct]?.id === 'hero',
  };
}

function dealFlop(state: GameState): GameState {
  return dealCommunityCards(state, 3, 'FLOP', 'flop');
}

function dealTurn(state: GameState): GameState {
  return dealCommunityCards(state, 1, 'TURN', 'turn');
}

function dealRiver(state: GameState): GameState {
  return dealCommunityCards(state, 1, 'RIVER', 'river');
}

function resolveWalkover(state: GameState): GameState {
  const winner = state.players.find((p) => !p.isFolded)!;
  const isHeroWinner = winner.id === state.heroId;
  const heroPot = state.players.find((p) => p.id === state.heroId)?.totalInvestedThisHand ?? 0;

  const result: HandResult = {
    winners: [{ playerId: winner.id, playerName: winner.name, amount: state.pot, handDescription: 'Last player standing' }],
    showdownHands: [],
    wasShowdown: false,
    heroNetBBs: isHeroWinner ? state.pot - heroPot : -heroPot,
  };

  const players = state.players.map((p) => {
    if (p.id === winner.id) {
      return { ...p, stack: p.stack + state.pot };
    }
    return p;
  });

  return {
    ...state,
    phase: 'HAND_COMPLETE',
    players,
    lastHandResult: result,
    isHeroTurn: false,
  };
}

export function resolveShowdown(state: GameState): GameState {
  const activePlayers = state.players.filter((p) => !p.isFolded);

  // Evaluate each player's hand
  const evaluated = activePlayers.map((p) => ({
    player: p,
    handRank: evaluateHand([...p.holeCards, ...state.communityCards]),
  }));

  // Sort by hand rank descending
  evaluated.sort((a, b) => compareHands(b.handRank, a.handRank));

  const best = evaluated[0].handRank;
  const winners = evaluated.filter((e) => compareHands(e.handRank, best) === 0);
  const splitPot = state.pot / winners.length;

  const winnerIds = new Set(winners.map((w) => w.player.id));
  const heroPot = state.players.find((p) => p.id === state.heroId)?.totalInvestedThisHand ?? 0;
  const heroWins = winnerIds.has(state.heroId);

  const result: HandResult = {
    winners: winners.map((w) => ({
      playerId: w.player.id,
      playerName: w.player.name,
      amount: splitPot,
      handDescription: w.handRank.description,
    })),
    showdownHands: evaluated.map((e) => ({
      playerId: e.player.id,
      playerName: e.player.name,
      holeCards: e.player.holeCards,
      handDescription: e.handRank.description,
    })),
    wasShowdown: true,
    heroNetBBs: heroWins ? splitPot - heroPot : -heroPot,
  };

  const players = state.players.map((p) => {
    if (winnerIds.has(p.id)) {
      return { ...p, stack: p.stack + splitPot };
    }
    return p;
  });

  return {
    ...state,
    phase: 'HAND_COMPLETE',
    players,
    lastHandResult: result,
    isHeroTurn: false,
    showVillainCards: true,
  };
}

// Helpers

function getPositionForSeat(seatIndex: number, dealerSeat: number): Position {
  // seats relative to dealer
  const offset = (seatIndex - dealerSeat + 6) % 6;
  return SEAT_POSITIONS[offset];
}

function getFirstToActPreflop(players: AnyPlayer[]): number {
  // UTG acts first preflop
  const order: Position[] = PREFLOP_ACTION_ORDER;
  for (const pos of order) {
    const idx = players.findIndex((p) => p.position === pos && !p.isFolded && !p.isAllIn);
    if (idx !== -1) return idx;
  }
  return 0;
}

function getFirstToActPostflop(players: AnyPlayer[], dealerSeat: number): number {
  // SB acts first postflop (or first active player left of dealer)
  const order: Position[] = POSTFLOP_ACTION_ORDER;
  for (const pos of order) {
    const idx = players.findIndex((p) => p.position === pos && !p.isFolded && !p.isAllIn);
    if (idx !== -1) return idx;
  }
  void dealerSeat;
  return 0;
}

export function getNextActivePlayerIndex(state: GameState, currentIdx: number): number {
  const n = state.players.length;
  for (let i = 1; i < n; i++) {
    const next = (currentIdx + i) % n;
    const p = state.players[next];
    if (!p.isFolded && !p.isAllIn) return next;
  }
  return currentIdx;
}

export function getHeroPlayer(state: GameState): AnyPlayer | undefined {
  return state.players.find((p) => p.id === state.heroId);
}

export function getActivePlayerCount(state: GameState): number {
  return state.players.filter((p) => !p.isFolded).length;
}

export function isHeroInPosition(state: GameState): boolean {
  const activePlayers = state.players.filter((p) => !p.isFolded);
  if (activePlayers.length < 2) return false;

  // "In position" = hero acts last postflop
  const lastActive = activePlayers[activePlayers.length - 1];
  // Actually use postflop order — last in postflop order is most IP
  const order: Position[] = POSTFLOP_ACTION_ORDER.slice().reverse();
  for (const pos of order) {
    const player = activePlayers.find((p) => p.position === pos);
    if (player) return player.id === state.heroId;
  }
  return lastActive.id === state.heroId;
}
