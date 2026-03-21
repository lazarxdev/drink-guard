import { BarrierSlam } from './animations/BarrierSlam';

interface CountdownAnimationProps {
  countdown: number;
  color: string;
}

export function CountdownAnimation({ countdown, color }: CountdownAnimationProps) {
  return <BarrierSlam countdown={countdown} color={color} />;
}
