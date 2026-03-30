import type { GameState, Action, ActionType } from '@/types/game';
import type { FeedbackResult, ActionRating, MistakeCategory, BoardTexture, HandCategory } from '@/types/feedback';
import type { HandRank } from '@/types/cards';
import { classifyBoardTexture } from './boardTextureEngine';
import { classifyHeroHand } from './handClassifier';
import { isHeroInPosition, getActivePlayerCount } from './gameEngine';
import { PREFLOP_RANGES } from '@/data/preflopRanges';
import { handMatchesRange } from '@/utils/rangeParser';
import type { AnyPlayer } from '@/types/player';

function getHero(state: GameState): AnyPlayer {
  return state.players.find((p) => p.id === state.heroId)!;
}

export function evaluateHeroAction(
  state: GameState,
  action: Action,
  handRank: HandRank,
): FeedbackResult {
  const hero = getHero(state);
  const communityCards = state.communityCards;
  const pot = state.pot;
  const round = state.currentBettingRound!;

  const boardTexture = communityCards.length > 0 ? classifyBoardTexture(communityCards) : null;
  const handCategory = classifyHeroHand(hero.holeCards, communityCards, handRank);
  const activeCount = getActivePlayerCount(state);
  const wasInPosition = isHeroInPosition(state);
  const hadInitiative = state.preflopAggressorId === hero.id;

  const spr = communityCards.length > 0 && pot > 0 ? hero.stack / pot : null;

  const toCall = round.currentBet - (round.betsThisRound[hero.id] ?? 0);

  if (state.phase === 'PREFLOP') {
    return evaluatePreflopAction(state, action, handCategory, wasInPosition, activeCount);
  }

  return evaluatePostflopAction(
    state, action, handCategory, boardTexture!, wasInPosition, hadInitiative,
    activeCount, spr!, toCall, pot, hero.stack,
  );
}

function evaluatePreflopAction(
  state: GameState,
  action: Action,
  handCategory: HandCategory,
  wasInPosition: boolean,
  activeCount: number,
): FeedbackResult {
  const hero = getHero(state);
  const [c1, c2] = hero.holeCards;
  const round = state.currentBettingRound!;
  const toCall = round.currentBet - (round.betsThisRound[hero.id] ?? 0);
  const hasFacingRaise = round.currentBet > state.bigBlindAmount;
  const isFacing3bet = round.currentBet >= state.bigBlindAmount * 8;
  const heroPosition = hero.position;

  const heroArchetypeRanges = PREFLOP_RANGES['TAG'][heroPosition];
  const inRFIRange = handMatchesRange(c1, c2, heroArchetypeRanges.RFI);
  const in3betRange = handMatchesRange(c1, c2, heroArchetypeRanges.vsRFI_3bet);
  const inCallRange = handMatchesRange(c1, c2, heroArchetypeRanges.vsRFI_call);

  const base = {
    boardTexture: null as null,
    handCategory,
    spr: null as null,
    wasInPosition,
    hadInitiative: false,
    activePlayerCount: activeCount,
  };

  // No raise before hero
  if (!hasFacingRaise) {
    if (action.actionType === 'RAISE' || action.actionType === 'BET') {
      if (inRFIRange) {
        return { ...base, rating: 'BEST', actionTaken: action.actionType, recommendedAction: 'RAISE', mistakeCategory: 'CORRECT_PLAY', reasoning: `Raising from ${heroPosition} with this hand is a strong play. You have a hand that is well within a solid opening range for this position.`, keyLesson: 'Opening the right hands from the right positions is the foundation of good preflop play.' };
      }
      if (handCategory === 'PREFLOP_SPECULATIVE' && ['UTG', 'UTG1', 'HJ'].includes(heroPosition)) {
        return { ...base, rating: 'OKAY', actionTaken: action.actionType, recommendedAction: 'FOLD', mistakeCategory: 'IGNORED_POSITION', reasoning: `Opening this hand from ${heroPosition} (early position) is a bit loose. Speculative hands like suited connectors play better from later positions where you have more information.`, keyLesson: 'Tighten your opening range from early position. Position is power in poker.' };
      }
      if (handCategory === 'PREFLOP_WEAK') {
        return { ...base, rating: 'MISTAKE', actionTaken: action.actionType, recommendedAction: 'FOLD', mistakeCategory: 'IGNORED_POSITION', reasoning: `This hand is too weak to open profitably from ${heroPosition}. Opening weak hands generates difficult spots postflop and bleeds chips over time.`, keyLesson: 'Fold weak hands preflop, especially from early and middle position.' };
      }
      return { ...base, rating: 'GOOD', actionTaken: action.actionType, recommendedAction: 'RAISE', mistakeCategory: 'CORRECT_PLAY', reasoning: `Raising here is reasonable. This hand has enough value to open from ${heroPosition}.`, keyLesson: 'Open raising builds the pot with good hands and puts pressure on the blinds.' };
    }

    if (action.actionType === 'FOLD') {
      if (inRFIRange) {
        return { ...base, rating: 'MISTAKE', actionTaken: 'FOLD', recommendedAction: 'RAISE', mistakeCategory: 'FOLD_TOO_MUCH', reasoning: `This hand is strong enough to open raise from ${heroPosition}. Folding it gives up significant expected value. A solid opening range includes this hand.`, keyLesson: 'Don\'t fold hands that are in your opening range. Raising builds the pot and puts pressure on opponents.' };
      }
      if (handCategory === 'PREFLOP_WEAK') {
        return { ...base, rating: 'BEST', actionTaken: 'FOLD', recommendedAction: 'FOLD', mistakeCategory: 'CORRECT_PLAY', reasoning: `Folding is the right play here. This hand doesn't have the strength or playability to profitably open from ${heroPosition}.`, keyLesson: 'Disciplined folding of weak hands is just as important as aggressive play with strong ones.' };
      }
      return { ...base, rating: 'OKAY', actionTaken: 'FOLD', recommendedAction: 'RAISE', mistakeCategory: 'FOLD_TOO_MUCH', reasoning: `This fold is a bit tight. This hand has enough potential to consider opening from ${heroPosition}, though it depends on the exact dynamics.`, keyLesson: 'Consider expanding your opening range from later positions.' };
    }

    if (action.actionType === 'CALL') {
      return { ...base, rating: 'OKAY', actionTaken: 'CALL', recommendedAction: 'RAISE', mistakeCategory: 'INITIATIVE_MISTAKE', reasoning: `Limping (calling the big blind) is generally not recommended in modern poker. It lets in hands cheaply and surrenders the initiative. A raise or fold is usually better.`, keyLesson: 'Avoid limping. Either raise to take control or fold. Limping puts you in a tough spot postflop.' };
    }
  }

  // Facing a raise (RFI)
  if (hasFacingRaise && !isFacing3bet) {
    if (action.actionType === 'RAISE') {
      if (in3betRange) {
        return { ...base, rating: 'BEST', actionTaken: 'RAISE', recommendedAction: 'RAISE', mistakeCategory: 'CORRECT_PLAY', reasoning: `3-betting here is excellent. This hand is strong enough to build a big pot and put pressure on the original raiser. 3-bets win the pot immediately a good portion of the time.`, keyLesson: '3-betting strong hands builds pots and creates profitable pressure.' };
      }
      if (handCategory === 'PREFLOP_WEAK') {
        return { ...base, rating: 'MISTAKE', actionTaken: 'RAISE', recommendedAction: 'FOLD', mistakeCategory: 'BLUFF_TOO_MUCH', reasoning: `3-betting with this weak hand as a bluff is too risky here. Profitable bluff 3-bets require blockers and good fold equity. This hand doesn't give you enough.`, keyLesson: 'Only bluff 3-bet with hands that have blockers or some equity when called.' };
      }
    }

    if (action.actionType === 'CALL') {
      if (in3betRange && wasInPosition) {
        return { ...base, rating: 'OKAY', actionTaken: 'CALL', recommendedAction: 'RAISE', mistakeCategory: 'INITIATIVE_MISTAKE', reasoning: `This hand is often strong enough to 3-bet in position. While calling is fine, 3-betting adds value by building the pot and denying your opponent easy decisions.`, keyLesson: 'Consider 3-betting strong hands in position rather than just calling.' };
      }
      if (inCallRange) {
        return { ...base, rating: 'GOOD', actionTaken: 'CALL', recommendedAction: 'CALL', mistakeCategory: 'CORRECT_PLAY', reasoning: `Calling here is solid. This hand has the right combination of value and playability to see a flop profitably.`, keyLesson: 'Calling with hands that have good playability and value is a standard play.' };
      }
      if (handCategory === 'PREFLOP_WEAK') {
        return { ...base, rating: 'MISTAKE', actionTaken: 'CALL', recommendedAction: 'FOLD', mistakeCategory: 'CALL_TOO_WIDE', reasoning: `This hand is too weak to call a raise profitably. You'll often miss the board and face difficult decisions postflop with little equity.`, keyLesson: 'Fold weak hands facing a raise. Calling too wide leads to tough postflop spots with bad hands.' };
      }
    }

    if (action.actionType === 'FOLD') {
      if (in3betRange || inCallRange) {
        return { ...base, rating: 'MISTAKE', actionTaken: 'FOLD', recommendedAction: in3betRange ? 'RAISE' : 'CALL', mistakeCategory: 'FOLD_TOO_MUCH', reasoning: `This hand is strong enough to continue facing a raise. Folding gives up too much equity and lets your opponent steal too often.`, keyLesson: 'Defend your range. Don\'t fold hands with enough equity to call or 3-bet.' };
      }
      return { ...base, rating: 'GOOD', actionTaken: 'FOLD', recommendedAction: 'FOLD', mistakeCategory: 'CORRECT_PLAY', reasoning: `Folding here is reasonable. This hand doesn't have the strength or position to profitably continue against a raise.`, keyLesson: 'Folding marginal hands to raises saves chips and avoids difficult postflop spots.' };
    }
  }

  // Facing 3-bet
  if (isFacing3bet) {
    if (action.actionType === 'FOLD') {
      if (handCategory === 'PREMIUM') {
        return { ...base, rating: 'MISTAKE', actionTaken: 'FOLD', recommendedAction: 'RAISE', mistakeCategory: 'FOLD_TOO_MUCH', reasoning: `Folding a premium hand to a 3-bet is a major mistake. You should be 4-betting for value or at minimum calling.`, keyLesson: 'Never fold premium hands to 3-bets. 4-bet or call.' };
      }
      if (handCategory === 'PREFLOP_WEAK' || handCategory === 'PREFLOP_SPECULATIVE') {
        return { ...base, rating: 'GOOD', actionTaken: 'FOLD', recommendedAction: 'FOLD', mistakeCategory: 'CORRECT_PLAY', reasoning: `Folding to the 3-bet with this hand is correct. 3-bet pots are large and you'd be playing postflop with a weak hand in a bloated pot.`, keyLesson: 'Fold marginal hands to 3-bets. 3-bet pots require stronger holdings to continue.' };
      }
    }
    if (action.actionType === 'CALL') {
      if (!wasInPosition) {
        return { ...base, rating: 'OKAY', actionTaken: 'CALL', recommendedAction: 'FOLD', mistakeCategory: 'IGNORED_POSITION', reasoning: `Calling a 3-bet out of position is tricky. You'll be playing a big pot without positional advantage. Consider if this hand is worth that challenge.`, keyLesson: 'Be more cautious calling 3-bets out of position. Position matters even more in 3-bet pots.' };
      }
    }
  }

  // Default
  return {
    ...base,
    rating: 'GOOD',
    actionTaken: action.actionType,
    recommendedAction: action.actionType,
    mistakeCategory: 'CORRECT_PLAY',
    reasoning: 'This is a reasonable play given the preflop dynamics.',
    keyLesson: 'Continue to think about your range and position when making preflop decisions.',
  };
}

function evaluatePostflopAction(
  state: GameState,
  action: Action,
  handCategory: HandCategory,
  boardTexture: BoardTexture,
  wasInPosition: boolean,
  hadInitiative: boolean,
  activeCount: number,
  spr: number,
  toCall: number,
  pot: number,
  heroStack: number,
): FeedbackResult {
  const base = {
    boardTexture,
    handCategory,
    spr,
    wasInPosition,
    hadInitiative,
    activePlayerCount: activeCount,
  };

  const betAmount = action.amount;
  const betToPotRatio = pot > 0 ? betAmount / pot : 0;
  const isMultiway = activeCount >= 3;
  const isFacingBet = toCall > 0;
  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;

  // ---- FOLD analysis ----
  if (action.actionType === 'FOLD') {
    if (handCategory === 'STRONG_MADE' || handCategory === 'PREMIUM') {
      return mkResult(base, 'MISTAKE', 'FOLD', 'CALL', 'FOLD_TOO_MUCH',
        `Folding a strong made hand is almost never correct. Your hand has too much value to give up here, even facing aggression.`,
        'Never fold strong hands. Strong made hands should at minimum call, and often raise.');
    }
    if (handCategory === 'MEDIUM_MADE' && !isMultiway) {
      if (betToPotRatio < 0.4) {
        return mkResult(base, 'MISTAKE', 'FOLD', 'CALL', 'FOLD_TOO_MUCH',
          `Folding a medium-strength hand to a small bet is too tight. The pot odds here justify a call, and you have enough showdown value.`,
          'Don\'t fold medium-strength hands to small bets. Pot odds matter.');
      }
      return mkResult(base, 'OKAY', 'FOLD', 'CALL', 'FOLD_TOO_MUCH',
        `Folding here is defensible, but your hand has some showdown value. A call might be better depending on villain tendencies.`,
        'Medium hands often have enough showdown value to call small bets.');
    }
    if (handCategory === 'STRONG_DRAW') {
      if (potOdds < 0.35) {
        return mkResult(base, 'MISTAKE', 'FOLD', 'CALL', 'FOLD_TOO_MUCH',
          `Folding a strong draw is a mistake here. Your draw has significant equity — roughly 30-45% against most made hands — and the pot odds justify continuing.`,
          'Strong draws (flush draws, OESDs) have too much equity to fold cheaply.');
      }
    }
    if (handCategory === 'AIR') {
      return mkResult(base, 'BEST', 'FOLD', 'FOLD', 'CORRECT_PLAY',
        `Folding with no hand and no draw is the right play here. You have no equity to justify calling and no realistic bluff-catching value.`,
        'Folding air is correct. Don\'t call without equity or a plan.');
    }
    if (handCategory === 'WEAK_MADE' || handCategory === 'WEAK_DRAW') {
      return mkResult(base, 'GOOD', 'FOLD', 'FOLD', 'CORRECT_PLAY',
        `Folding a weak hand facing aggression is usually correct. Weak made hands and gutshots often don't have enough equity to justify continuing.`,
        'Fold weak hands to significant pressure. Save your chips for better spots.');
    }
    return mkResult(base, 'GOOD', 'FOLD', 'FOLD', 'CORRECT_PLAY',
      `Folding here is reasonable given your hand strength and the action.`,
      'Disciplined folds preserve your chip stack for better spots.');
  }

  // ---- CHECK analysis ----
  if (action.actionType === 'CHECK') {
    if (!isFacingBet) {
      if (handCategory === 'STRONG_MADE' && wasInPosition && boardTexture === 'DRY') {
        return mkResult(base, 'OKAY', 'CHECK', 'BET', 'MISSED_VALUE',
          `Checking back with a strong hand on a dry board in position leaves money on the table. Villain's range is capped here and will call with many worse hands.`,
          'Bet strong hands on dry boards in position. Dry boards favor the preflop aggressor.');
      }
      if (handCategory === 'STRONG_MADE' && isMultiway) {
        return mkResult(base, 'GOOD', 'CHECK', 'CHECK', 'CORRECT_PLAY',
          `Checking here is thoughtful. In a multiway pot, even strong hands benefit from pot control. The risk of getting check-raised or facing a tough river spot is real.`,
          'Even strong hands can benefit from checking in multiway pots to control pot size.');
      }
      if (handCategory === 'MEDIUM_MADE' && wasInPosition && !isMultiway) {
        return mkResult(base, 'OKAY', 'CHECK', 'BET', 'MISSED_VALUE',
          `Checking back a medium-strength hand in position is okay for pot control, but you're also leaving value on the table against worse hands that would call. A small bet is often better.`,
          'Consider betting medium-strength hands in position to build the pot and get value from weaker holdings.');
      }
      if (hadInitiative && !isFacingBet && (boardTexture === 'WET' || boardTexture === 'MONOTONE') && handCategory === 'AIR') {
        return mkResult(base, 'BEST', 'CHECK', 'CHECK', 'CORRECT_PLAY',
          `Checking with air on a wet/monotone board is correct. Bluffing on boards that connect well with calling ranges has low fold equity and burns chips.`,
          'Avoid bluffing on boards that connect well with your opponent\'s range.');
      }
      if (handCategory === 'AIR' || handCategory === 'WEAK_MADE') {
        return mkResult(base, 'BEST', 'CHECK', 'CHECK', 'CORRECT_PLAY',
          `Checking with a weak hand is the right play here. You don't have enough strength to value bet and bluffing without a strong read is risky.`,
          'Check weak hands and realize equity at showdown or fold to aggression.');
      }
      return mkResult(base, 'GOOD', 'CHECK', 'CHECK', 'CORRECT_PLAY',
        `Checking here is reasonable. Pot control is valuable and you can reassess on the next street.`,
        'Checking to control pot size is a valid strategy with medium hands.');
    }
    // Shouldn't reach here (check when facing a bet)
    return mkResult(base, 'MISTAKE', 'CHECK', 'CALL', 'INITIATIVE_MISTAKE',
      `You checked when facing a bet, which isn't a legal action. You need to call, raise, or fold.`,
      'Always respond properly to bets — you can\'t check when facing a bet.');
  }

  // ---- CALL analysis ----
  if (action.actionType === 'CALL') {
    if (handCategory === 'STRONG_MADE' && !isMultiway) {
      return mkResult(base, 'OKAY', 'CALL', 'RAISE', 'MISSED_VALUE',
        `Calling with a strong made hand is a bit passive. Raising here would build the pot with your best hand and charge draws more to continue.`,
        'Consider raising strong hands to build the pot and protect against draws.');
    }
    if (handCategory === 'STRONG_DRAW' && wasInPosition) {
      return mkResult(base, 'GOOD', 'CALL', 'CALL', 'CORRECT_PLAY',
        `Calling with a strong draw in position is solid. You're getting good odds and have significant equity. You could also semi-bluff raise, but calling keeps the pot manageable.`,
        'Calling or semi-bluff raising with strong draws are both valid. Position and pot odds guide the choice.');
    }
    if (handCategory === 'STRONG_DRAW' && !wasInPosition) {
      return mkResult(base, 'OKAY', 'CALL', 'RAISE', 'BLUFF_TOO_LITTLE',
        `Calling a draw out of position is okay, but semi-bluffing (raising) can be more powerful. It gives you two ways to win: making your hand or folding out your opponent.`,
        'Semi-bluff raising draws OOP gives you fold equity as an additional way to win.');
    }
    if (handCategory === 'AIR' && !isMultiway) {
      return mkResult(base, 'MISTAKE', 'CALL', 'FOLD', 'CALL_TOO_WIDE',
        `Calling with no hand and no draw is burning chips. You have no equity and no clear path to winning this pot at showdown.`,
        'Don\'t call with air. Without equity or a strong read, fold and wait for better spots.');
    }
    if (handCategory === 'MEDIUM_MADE' && isMultiway) {
      return mkResult(base, 'GOOD', 'CALL', 'CALL', 'CORRECT_PLAY',
        `Calling with a medium hand in a multiway pot is reasonable. You have showdown value but not enough strength to profitably raise.`,
        'Medium hands in multiway pots are good for calling but not raising.');
    }
    if (handCategory === 'WEAK_MADE') {
      const potOddsOk = potOdds < 0.25;
      if (potOddsOk) {
        return mkResult(base, 'GOOD', 'CALL', 'CALL', 'CORRECT_PLAY',
          `Calling with a weak hand is justified here because the pot odds are favorable. You're getting a good price to see if you can improve or catch a bluff.`,
          'Good pot odds can justify calling with weak hands.');
      }
      return mkResult(base, 'OKAY', 'CALL', 'FOLD', 'CALL_TOO_WIDE',
        `Calling with a weak hand here is marginal. The pot odds may not justify it and you'll often be dominated.`,
        'Be selective calling with weak hands. Poor pot odds make these calls -EV.');
    }
    // Generic positive call
    return mkResult(base, 'GOOD', 'CALL', 'CALL', 'CORRECT_PLAY',
      `Calling here is a reasonable play. Your hand has enough value to continue in this spot.`,
      'Calling is correct when you have sufficient equity and pot odds.');
  }

  // ---- BET/RAISE analysis ----
  if (action.actionType === 'BET' || action.actionType === 'RAISE') {
    // Multiway betting with weak hand
    if (isMultiway && (handCategory === 'AIR' || handCategory === 'WEAK_DRAW' || handCategory === 'BLUFF_CATCHER')) {
      return mkResult(base, 'MISTAKE', isFacingBet ? 'RAISE' : 'BET', 'CHECK', 'MULTIWAY_ERROR',
        `Bluffing or thin betting into multiple players is rarely profitable. Each opponent has their own chance of having a strong hand, and your fold equity drops sharply in multiway pots.`,
        'Tighten your betting range in multiway pots. Bluffs need strong fold equity to work.');
    }

    // Low SPR commit (check early before other cases narrow handCategory)
    const isMadeHand = (handCategory as string) === 'STRONG_MADE' || (handCategory as string) === 'MEDIUM_MADE' || (handCategory as string) === 'PREMIUM';
    if (spr !== null && spr < 3 && isMadeHand) {
      return mkResult(base, 'BEST', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
        `With a low SPR, committing your stack is correct. When the pot is large relative to remaining stacks, strong hands should be willing to get it all in.`,
        'Low SPR = commit with strong hands. Stack-to-pot ratio determines how strong your hand needs to be to go all-in.');
    }

    // Overbetting
    if (betToPotRatio > 1.2 && handCategory !== 'STRONG_MADE' && handCategory !== 'PREMIUM') {
      return mkResult(base, 'MISTAKE', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'CALL' : 'BET', 'OVERBET',
        `Overbetting (betting more than pot) with a medium-strength hand is a mistake. It risks too many chips and your hand isn't strong enough to justify putting in this much.`,
        'Save overbets for your strongest hands on favorable boards. Medium hands should use smaller sizes.');
    }

    // Underbetting strong hand
    if (betToPotRatio < 0.2 && (handCategory === 'STRONG_MADE' || handCategory === 'PREMIUM')) {
      return mkResult(base, 'MISTAKE', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'UNDERBET',
        `Betting too small with a strong hand lets your opponents see the next card very cheaply and allows draws to continue profitably. Bet bigger to charge them more.`,
        'Value bet strong hands with meaningful sizing. Tiny bets let draws continue too cheaply.');
    }

    // Betting strong hand
    if (handCategory === 'STRONG_MADE' || handCategory === 'PREMIUM') {
      if (betToPotRatio >= 0.5 && betToPotRatio <= 0.85) {
        return mkResult(base, 'BEST', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
          `Betting a strong hand with a well-sized bet is exactly right. You're building the pot, charging draws to continue, and extracting value from weaker made hands.`,
          'Value bet strong hands with good sizing — you want to get paid.');
      }
      return mkResult(base, 'GOOD', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
        `Betting a strong hand here is correct. The sizing is slightly off but the action is right.`,
        'Betting strong hands for value is the foundation of profitable poker.');
    }

    // Betting medium hand
    if (handCategory === 'MEDIUM_MADE') {
      if (isMultiway) {
        return mkResult(base, 'OKAY', isFacingBet ? 'RAISE' : 'BET', 'CHECK', 'MULTIWAY_ERROR',
          `Betting a medium hand in a multiway pot is risky. You'll often get called or raised by stronger hands. Consider checking to pot control.`,
          'Be selective betting medium hands multiway. The risk-reward is worse with multiple opponents.');
      }
      if (wasInPosition && boardTexture === 'DRY') {
        return mkResult(base, 'GOOD', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
          `Betting a medium hand in position on a dry board is solid. Your opponent is unlikely to have connected well with this board, and a bet protects your hand and builds value.`,
          'Betting in position on dry boards with medium hands applies pressure and builds value.');
      }
      return mkResult(base, 'OKAY', isFacingBet ? 'RAISE' : 'BET', 'CHECK', 'MISSED_VALUE',
        `Betting a medium hand here is okay but a bit risky. Consider checking to control the pot size and see the next card for free.`,
        'Medium hands often play better as pot-control hands. Check-call can be more effective.');
    }

    // Semi-bluffing with strong draw
    if (handCategory === 'STRONG_DRAW') {
      if (!isMultiway && !wasInPosition) {
        return mkResult(base, 'BEST', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
          `Semi-bluffing with a strong draw out of position is excellent. You give yourself two ways to win: fold equity now or making your hand later. This is a high-equity play.`,
          'Semi-bluffing strong draws adds fold equity as a second path to winning the pot.');
      }
      if (!isMultiway) {
        return mkResult(base, 'BEST', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
          `Semi-bluffing with a strong draw is a great play. You have significant equity if called, and your bet may win the pot immediately.`,
          'Strong draws are excellent semi-bluffing candidates with good equity when called.');
      }
      return mkResult(base, 'OKAY', isFacingBet ? 'RAISE' : 'BET', 'CALL', 'MULTIWAY_ERROR',
        `Semi-bluffing in a multiway pot is risky. At least one opponent is likely to call or have a strong hand. Calling or checking is safer here.`,
        'Reduce semi-bluff frequency in multiway pots. Fold equity decreases with more opponents.');
    }

    // Bluffing with air
    if (handCategory === 'AIR') {
      if (isMultiway) {
        return mkResult(base, 'MISTAKE', isFacingBet ? 'RAISE' : 'BET', 'CHECK', 'MULTIWAY_ERROR',
          `Bluffing into multiple players with no hand is a significant mistake. You need someone to fold for a bluff to work, and that becomes much harder with 3+ players.`,
          'Bluffing multiway is rarely profitable. Wait for better spots.');
      }
      if (boardTexture === 'DRY' && hadInitiative && !wasInPosition) {
        return mkResult(base, 'OKAY', isFacingBet ? 'RAISE' : 'BET', isFacingBet ? 'RAISE' : 'BET', 'CORRECT_PLAY',
          `Bluffing as the preflop aggressor on a dry board is a reasonable approach. Your range advantage here gives credibility to your story.`,
          'C-bets on dry boards have more fold equity when you have range/nut advantage.');
      }
      if (betToPotRatio > 0.6) {
        return mkResult(base, 'OKAY', isFacingBet ? 'RAISE' : 'BET', 'CHECK', 'BLUFF_TOO_MUCH',
          `Bluffing with a large size here is ambitious. Make sure your bluffs are credible and that you have enough fold equity to make this profitable.`,
          'Bluffs need fold equity. Make sure your story is believable and you\'re bluffing at the right frequency.');
      }
      return mkResult(base, 'OKAY', isFacingBet ? 'RAISE' : 'BET', 'CHECK', 'BLUFF_TOO_MUCH',
        `Bluffing here is debatable. Without a draw or equity, you're purely relying on fold equity. Make sure the board texture and your range support this bet.`,
        'Bluff selectively with hands that have blockers, draws, or strong fold equity.');
    }
  }

  return mkResult(base, 'GOOD', action.actionType, action.actionType, 'CORRECT_PLAY',
    `This is a reasonable play given the situation.`,
    'Keep thinking about position, hand strength, and the texture of the board.');
}

function mkResult(
  base: {
    boardTexture: BoardTexture | null;
    handCategory: HandCategory;
    spr: number | null;
    wasInPosition: boolean;
    hadInitiative: boolean;
    activePlayerCount: number;
  },
  rating: ActionRating,
  actionTaken: ActionType,
  recommendedAction: ActionType,
  mistakeCategory: MistakeCategory,
  reasoning: string,
  keyLesson: string,
): FeedbackResult {
  return {
    rating,
    actionTaken,
    recommendedAction,
    mistakeCategory,
    reasoning,
    keyLesson,
    ...base,
  };
}
