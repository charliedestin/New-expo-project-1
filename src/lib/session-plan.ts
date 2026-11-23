import {
  CALM_FORMULA,
  CALM_ICON,
  RETURN_STEPS,
  exercisesForStage,
  type IconName,
} from '@/data/exercises';
import type { Pace, Settings } from '@/store/app-store';

export type SessionStep = {
  key: string;
  title: string;
  phrase: string;
  repetitions: number;
  /** Seconds per repetition: say the phrase, then rest in the feeling. */
  secondsPerRep: number;
  icon: IconName;
  kind: 'calm' | 'exercise' | 'return';
};

const SECONDS_PER_REP: Record<Pace, number> = { steady: 12, slow: 16 };

export function buildSessionPlan(stage: number, settings: Pick<Settings, 'repetitions' | 'pace'>) {
  const secondsPerRep = SECONDS_PER_REP[settings.pace];
  const calm = (key: string): SessionStep => ({
    key,
    title: 'Calm',
    phrase: CALM_FORMULA,
    repetitions: Math.max(2, Math.round(settings.repetitions / 2)),
    secondsPerRep,
    icon: CALM_ICON,
    kind: 'calm',
  });

  const steps: SessionStep[] = [calm('calm-open')];
  for (const exercise of exercisesForStage(stage)) {
    steps.push({
      key: exercise.id,
      title: exercise.title,
      phrase: exercise.formula,
      repetitions: settings.repetitions,
      secondsPerRep,
      icon: exercise.icon,
      kind: 'exercise',
    });
  }
  steps.push(calm('calm-close'));
  RETURN_STEPS.forEach((phrase, i) =>
    steps.push({
      key: `return-${i}`,
      title: 'Coming back',
      phrase,
      repetitions: 1,
      secondsPerRep: 5,
      icon: { ios: 'sunrise', android: 'partly_cloudy_day', web: 'partly_cloudy_day' },
      kind: 'return',
    }),
  );
  return steps;
}

export function planDurationSec(steps: SessionStep[]) {
  return steps.reduce((sum, s) => sum + s.repetitions * s.secondsPerRep, 0);
}

export function formatMinutes(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}
