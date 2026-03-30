import type { Action } from '@/types/game';
import { actionLabel } from '@/utils/cardDisplay';
import { POSITION_LABELS } from '@/types/player';

interface ActionHistoryProps {
  actions: Action[];
  maxVisible?: number;
}

const STREET_LABELS: Record<string, string> = {
  preflop: 'Pre-Flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
};

export function ActionHistory({ actions, maxVisible = 20 }: ActionHistoryProps) {
  // Filter out blind posts for cleaner display
  const displayActions = actions
    .filter((a) => a.actionType !== 'POST_SB' && a.actionType !== 'POST_BB')
    .slice(-maxVisible);

  if (displayActions.length === 0) {
    return (
      <div className="text-gray-500 text-xs text-center py-2">No actions yet</div>
    );
  }

  // Group by street
  const grouped: Record<string, Action[]> = {};
  for (const action of displayActions) {
    if (!grouped[action.street]) grouped[action.street] = [];
    grouped[action.street].push(action);
  }

  const streets = ['preflop', 'flop', 'turn', 'river'];

  return (
    <div className="flex flex-col gap-2 text-xs">
      {streets
        .filter((s) => grouped[s])
        .map((street) => (
          <div key={street}>
            <div className="text-gray-500 uppercase tracking-wider text-[10px] mb-1">
              {STREET_LABELS[street]}
            </div>
            <div className="flex flex-col gap-0.5">
              {grouped[street].map((action, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-gray-400 text-[10px] w-8 text-right flex-shrink-0">
                    {POSITION_LABELS[action.position]}
                  </span>
                  <span
                    className={`font-medium ${
                      action.actionType === 'FOLD'
                        ? 'text-red-400'
                        : action.actionType === 'RAISE' || action.actionType === 'BET'
                        ? 'text-yellow-300'
                        : action.actionType === 'CHECK'
                        ? 'text-gray-400'
                        : 'text-blue-300'
                    }`}
                  >
                    {actionLabel(action.actionType, action.amount > 0 ? action.amount : undefined)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
