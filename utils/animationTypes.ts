export type AnimationStyle =
  | 'descending-guardian'
  | 'barrier-slam'
  | 'shield-pulse-wave'
  | 'shield-assembly';

export interface AnimationConfig {
  id: AnimationStyle;
  name: string;
  description: string;
  icon: string;
}

export const ANIMATION_CONFIGS: AnimationConfig[] = [
  {
    id: 'descending-guardian',
    name: 'Descending Guardian',
    description: 'Shield descends from above with smooth rotation',
    icon: 'shield-check',
  },
  {
    id: 'barrier-slam',
    name: 'Barrier Slam',
    description: 'Heavy shield drops with ground impact',
    icon: 'shield',
  },
  {
    id: 'shield-pulse-wave',
    name: 'Shield Pulse Wave',
    description: 'Massive shield with expanding energy waves',
    icon: 'shield-alert',
  },
  {
    id: 'shield-assembly',
    name: 'Shield Assembly',
    description: 'Shield pieces fly in and elegantly assemble',
    icon: 'shield-plus',
  },
];
