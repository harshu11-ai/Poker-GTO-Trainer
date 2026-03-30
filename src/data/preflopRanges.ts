import type { Archetype, Position } from '@/types/player';
import { expandRangeShorthand } from '@/utils/rangeParser';

// Raw range strings per archetype x position
// Using shorthand notation: "TT+" = TT,JJ,QQ,KK,AA; "ATs+" = ATs,AJs,AQs,AKs; etc.

type PositionRanges = {
  RFI: string[];
  vsRFI_call: string[];
  vsRFI_3bet: string[];
  vs3bet_call: string[];
};

type RangeTable = Record<Archetype, Record<Position, PositionRanges>>;

const RAW_RANGES: RangeTable = {
  TAG: {
    UTG: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AJs', 'ATs', 'AKo', 'AQo', 'KQs'],
      vsRFI_call: ['JJ', 'TT', '99', 'AQs', 'AJs', 'ATs', 'AQo', 'KQs', 'KJs'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AQo'],
    },
    UTG1: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'ATs', 'AKo', 'AQo', 'KQs', 'KJs'],
      vsRFI_call: ['TT', '99', '88', 'AJs', 'ATs', 'KQs', 'KJs', 'QJs'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'AKs', 'AKo', 'JJ'],
      vs3bet_call: ['JJ', 'TT', 'AQs'],
    },
    HJ: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'AKo', 'AQo', 'AJo', 'KQs', 'KJs', 'KTs', 'QJs', 'JTs'],
      vsRFI_call: ['99', '88', '77', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'AKs', 'AKo', 'JJ', 'AQs'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AQo', 'KQs'],
    },
    CO: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'T9s', '98s'],
      vsRFI_call: ['88', '77', '66', 'A9s', 'A8s', 'A5s', 'KTs', 'QJs', 'JTs', 'T9s', '98s', '87s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'AQo'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AQo', 'KQs', 'AJs'],
    },
    BTN: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s'],
      vsRFI_call: ['77', '66', '55', '44', 'A5s', 'A4s', 'A3s', 'K9s', 'Q9s', 'J9s', 'T8s', '97s', '86s', '75s', '65s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'AQo', 'TT', 'A5s', 'A4s'],
      vs3bet_call: ['TT', '99', 'AQs', 'AQo', 'KQs', 'AJs', 'JJ'],
    },
    SB: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'A4s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s'],
      vsRFI_call: ['77', '66', '55', 'A8s', 'A7s', 'A6s', 'KTs', 'QTs', 'JTs', 'T9s', '98s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'AKs', 'AKo', 'JJ', 'AQs', 'AQo'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AJs', 'KQs'],
    },
    BB: {
      RFI: [],
      vsRFI_call: ['99', '88', '77', '66', '55', '44', '33', '22', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'ATo', 'A9o', 'KTs', 'KJo', 'QTs', 'QJo', 'JTs', 'JTo', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'AQo', 'TT', 'A5s', 'A4s'],
      vs3bet_call: ['TT', '99', 'AQs', 'AQo', 'KQs', 'JJ'],
    },
  },

  LAG: {
    UTG: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'AKo', 'AQo', 'AJo', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s'],
      vsRFI_call: ['99', '88', '77', 'AJs', 'ATs', 'A9s', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'AQo', 'TT', 'A5s'],
      vs3bet_call: ['JJ', 'TT', '99', 'AQs', 'AQo', 'KQs'],
    },
    UTG1: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'A4s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s'],
      vsRFI_call: ['88', '77', '66', 'A9s', 'A8s', 'A5s', 'KTs', 'QJs', 'JTs', 'T9s', '98s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs', 'TT', 'A5s', 'A4s'],
      vs3bet_call: ['JJ', 'TT', '99', 'AQs', 'AQo', 'KQs', 'AJs'],
    },
    HJ: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s'],
      vsRFI_call: ['77', '66', '55', '44', 'A8s', 'A7s', 'A6s', 'KTs', 'K9s', 'QTs', 'JTs', 'T9s', '98s', '87s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'A5s', 'A4s', 'K9s'],
      vs3bet_call: ['JJ', 'TT', '99', 'AQs', 'AQo', 'KQs', 'AJs', 'AJo'],
    },
    CO: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s'],
      vsRFI_call: ['66', '55', '44', '33', 'A7s', 'A6s', 'A5s', 'K8s', 'Q9s', 'J9s', 'T8s', '97s', '86s', '75s', '65s', '54s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'A5s', 'A4s', 'K9s'],
      vs3bet_call: ['JJ', 'TT', '99', 'AQs', 'AQo', 'KQs', 'AJs', 'AJo'],
    },
    BTN: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '54s'],
      vsRFI_call: ['55', '44', '33', '22', 'A4s', 'A3s', 'A2s', 'K7s', 'Q8s', 'J8s', 'T7s', '96s', '85s', '74s', '64s', '53s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'A5s', 'A4s', 'K9s', 'Q9s'],
      vs3bet_call: ['JJ', 'TT', '99', '88', 'AQs', 'AQo', 'KQs', 'AJs', 'AJo', 'KJs'],
    },
    SB: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '87s', '76s', '65s'],
      vsRFI_call: ['66', '55', '44', '33', 'A7s', 'A6s', 'A5s', 'K8s', 'Q9s', 'J9s', 'T8s', '97s', '87s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs', 'AQo', 'A5s', 'A4s'],
      vs3bet_call: ['JJ', 'TT', '99', 'AQs', 'AQo', 'KQs', 'AJs'],
    },
    BB: {
      RFI: [],
      vsRFI_call: ['99', '88', '77', '66', '55', '44', '33', '22', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'ATo', 'A9o', 'A8o', 'KTs', 'KJo', 'KTo', 'QTs', 'QJo', 'QTo', 'JTs', 'JTo', 'J9o', 'T9s', 'T8s', 'T7s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'A5s', 'A4s'],
      vs3bet_call: ['JJ', 'TT', '99', '88', 'AQs', 'AQo', 'KQs', 'AJs'],
    },
  },

  TIGHT_PASSIVE: {
    UTG: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
      vsRFI_call: ['QQ', 'JJ', 'TT', 'AQs', 'AQo', 'AJs', 'KQs'],
      vsRFI_3bet: ['AA', 'KK'],
      vs3bet_call: ['QQ', 'JJ', 'AKs', 'AKo'],
    },
    UTG1: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AQs', 'AKo'],
      vsRFI_call: ['JJ', 'TT', '99', 'AQs', 'AJs', 'AQo', 'KQs'],
      vsRFI_3bet: ['AA', 'KK', 'QQ'],
      vs3bet_call: ['JJ', 'TT', 'AKs', 'AKo'],
    },
    HJ: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'AKo', 'AQo', 'KQs'],
      vsRFI_call: ['TT', '99', '88', 'AJs', 'ATs', 'AQo', 'KQs', 'KJs'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'AKs'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AKo'],
    },
    CO: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AQs', 'AJs', 'ATs', 'AKo', 'AQo', 'AJo', 'KQs', 'KJs', 'QJs', 'JTs'],
      vsRFI_call: ['99', '88', '77', 'ATs', 'A9s', 'KQs', 'KJs', 'QJs', 'JTs', 'T9s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AQo'],
    },
    BTN: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A5s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s'],
      vsRFI_call: ['77', '66', '55', 'A8s', 'A7s', 'KTs', 'QJs', 'JTs', 'T9s', '98s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo', 'AQs'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'KQs'],
    },
    SB: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AQs', 'AJs', 'ATs', 'AKo', 'AQo', 'AJo', 'KQs', 'QJs', 'JTs'],
      vsRFI_call: ['88', '77', '66', 'ATs', 'KQs', 'KJs', 'QJs', 'JTs'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'AKs', 'AKo'],
      vs3bet_call: ['JJ', 'TT', 'AQs'],
    },
    BB: {
      RFI: [],
      vsRFI_call: ['TT', '99', '88', '77', '66', '55', 'ATs', 'A9s', 'A8s', 'ATo', 'KQo', 'KTs', 'QTs', 'JTs', 'T9s', '98s', '87s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
      vs3bet_call: ['JJ', 'TT', 'AQs', 'AQo'],
    },
  },

  LOOSE_PASSIVE: {
    UTG: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'AKo', 'AQo', 'AJo', 'ATo', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s'],
      vsRFI_call: ['99', '88', '77', '66', '55', '44', '33', 'AJs', 'ATs', 'A9s', 'A8s', 'KQs', 'KJs', 'KTs', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo'],
    },
    UTG1: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQs', 'KJs', 'KTs', 'K9s', 'QJs', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s'],
      vsRFI_call: ['88', '77', '66', '55', '44', '33', '22', 'A8s', 'A7s', 'A6s', 'KTs', 'K9s', 'QTs', 'JTs', 'T9s', '98s', '87s', '76s', '65s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs'],
    },
    HJ: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '87s', '76s', '65s', '54s'],
      vsRFI_call: ['66', '55', '44', '33', '22', 'A7s', 'A6s', 'A5s', 'A4s', 'K8s', 'Q9s', 'J9s', 'T8s', '97s', '86s', '75s', '65s', '54s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo'],
    },
    CO: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'JTs', 'J9s', 'J8s', 'T9s', 'T8s', '98s', '97s', '87s', '86s', '76s', '75s', '65s', '64s', '54s', '53s', '43s'],
      vsRFI_call: ['55', '44', '33', '22', 'A6s', 'A5s', 'A4s', 'A3s', 'K7s', 'Q8s', 'J8s', 'T7s', '96s', '86s', '75s', '64s', '54s', '43s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs'],
    },
    BTN: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'JTs', 'J9s', 'J8s', 'J7s', 'T9s', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '85s', '76s', '75s', '74s', '65s', '64s', '54s', '53s', '43s'],
      vsRFI_call: ['44', '33', '22', 'A5s', 'A4s', 'A3s', 'A2s', 'K6s', 'Q7s', 'J7s', 'T6s', '95s', '85s', '74s', '63s', '53s', '42s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo'],
    },
    SB: {
      RFI: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22', 'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'QJs', 'QTs', 'Q9s', 'JTs', 'J9s', 'T9s', 'T8s', '98s', '97s', '87s', '76s', '65s', '54s'],
      vsRFI_call: ['55', '44', '33', '22', 'A8s', 'A7s', 'A6s', 'K8s', 'Q9s', 'J9s', 'T8s', '97s', '87s', '76s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs'],
    },
    BB: {
      RFI: [],
      vsRFI_call: ['88', '77', '66', '55', '44', '33', '22', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s', 'ATo', 'A9o', 'A8o', 'A7o', 'KQo', 'KJo', 'KTo', 'K9o', 'QJo', 'QTo', 'Q9o', 'JTo', 'J9o', 'T9o', 'T8s', 'T7s', '98s', '97s', '96s', '87s', '86s', '76s', '75s', '65s', '64s', '54s'],
      vsRFI_3bet: ['AA', 'KK', 'QQ', 'JJ'],
      vs3bet_call: ['QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo'],
    },
  },
};

// Pre-expand all ranges at module load time
type ExpandedPositionRanges = {
  RFI: Set<string>;
  vsRFI_call: Set<string>;
  vsRFI_3bet: Set<string>;
  vs3bet_call: Set<string>;
};

type ExpandedRangeTable = Record<Archetype, Record<Position, ExpandedPositionRanges>>;

function expandAll(raw: RangeTable): ExpandedRangeTable {
  const result = {} as ExpandedRangeTable;
  for (const archetype of Object.keys(raw) as Archetype[]) {
    result[archetype] = {} as Record<Position, ExpandedPositionRanges>;
    for (const position of Object.keys(raw[archetype]) as Position[]) {
      const pr = raw[archetype][position];
      result[archetype][position] = {
        RFI: expandRangeShorthand(pr.RFI),
        vsRFI_call: expandRangeShorthand(pr.vsRFI_call),
        vsRFI_3bet: expandRangeShorthand(pr.vsRFI_3bet),
        vs3bet_call: expandRangeShorthand(pr.vs3bet_call),
      };
    }
  }
  return result;
}

export const PREFLOP_RANGES: ExpandedRangeTable = expandAll(RAW_RANGES);
