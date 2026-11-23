import type { AndroidSymbol, SFSymbol } from 'expo-symbols';

export type IconName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

export type Exercise = {
  id: string;
  /** 1–6, the order they are learned in. */
  stage: number;
  title: string;
  /** The phrase repeated silently during practice. */
  formula: string;
  summary: string;
  notice: string;
  howTo: string;
  caution?: string;
  icon: IconName;
};

/** The six standard exercises of autogenic training, in the order they are learned. */
export const EXERCISES: Exercise[] = [
  {
    id: 'heaviness',
    stage: 1,
    title: 'Heaviness',
    formula: 'My arms and legs are heavy',
    summary: 'Muscles let go and sink.',
    notice:
      'A pleasant, sinking weight in your limbs, as if they are being drawn into the surface beneath you.',
    howTo:
      'Let your attention rest on your arms, then your legs. Don’t try to make them heavy. Repeat the phrase and let the feeling arrive on its own.',
    icon: { ios: 'scalemass', android: 'weight', web: 'weight' },
  },
  {
    id: 'warmth',
    stage: 2,
    title: 'Warmth',
    formula: 'My arms and legs are warm',
    summary: 'Blood flow opens up.',
    notice: 'A soft warmth in your hands and feet, sometimes with a gentle tingling.',
    howTo:
      'Picture warm sunlight or warm water on your hands. Keep the heaviness phrase first, then add this one.',
    icon: { ios: 'sun.max', android: 'sunny', web: 'sunny' },
  },
  {
    id: 'heartbeat',
    stage: 3,
    title: 'Heartbeat',
    formula: 'My heartbeat is calm and regular',
    summary: 'Your pulse settles.',
    notice: 'Your heartbeat feels steady and unhurried. Many people barely notice it at all.',
    howTo:
      'Rest a hand on your chest if it helps you find the rhythm. Observe it; don’t try to slow it down.',
    caution:
      'If you have a heart condition, talk to your doctor first, and feel free to skip this exercise.',
    icon: { ios: 'heart', android: 'favorite', web: 'favorite' },
  },
  {
    id: 'breathing',
    stage: 4,
    title: 'Breathing',
    formula: 'My breathing is calm and easy',
    summary: 'The breath finds its own pace.',
    notice: 'Breathing that feels effortless, as if it’s happening by itself.',
    howTo:
      'Don’t change how you breathe. Let the body breathe on its own and simply watch it happen.',
    caution:
      'If you have asthma or another breathing condition, go gently and stop if it feels uncomfortable.',
    icon: { ios: 'wind', android: 'air', web: 'air' },
  },
  {
    id: 'abdomen',
    stage: 5,
    title: 'Abdominal warmth',
    formula: 'My stomach is pleasantly warm',
    summary: 'Warmth spreads through your middle.',
    notice: 'A gentle warmth radiating from just above your navel.',
    howTo: 'Place your attention just above your navel, like a warm drink settling there.',
    caution:
      'If you have stomach ulcers or digestive conditions, check with your doctor before practicing this one.',
    icon: { ios: 'flame', android: 'local_fire_department', web: 'local_fire_department' },
  },
  {
    id: 'forehead',
    stage: 6,
    title: 'Cool forehead',
    formula: 'My forehead is pleasantly cool',
    summary: 'A clear, cool head.',
    notice: 'A light coolness across your forehead, like a soft breeze.',
    howTo:
      'Picture a cool breeze across your brow. Keep it pleasant: cool, never cold. Skip this if it brings on a headache.',
    caution: 'If you get migraines or headaches, practice gently and skip it if one starts.',
    icon: { ios: 'snowflake', android: 'ac_unit', web: 'ac_unit' },
  },
];

export const MAX_STAGE = EXERCISES.length;

export const CALM_FORMULA = 'I am completely calm';

/** Said at the end of every session to come back fully alert. */
export const RETURN_STEPS = ['Arms firm', 'Breathe deeply', 'Eyes open'];

export const CALM_ICON: IconName = { ios: 'leaf', android: 'spa', web: 'spa' };

export function exerciseById(id: string) {
  return EXERCISES.find((e) => e.id === id);
}

export function exercisesForStage(stage: number) {
  return EXERCISES.filter((e) => e.stage <= stage);
}
