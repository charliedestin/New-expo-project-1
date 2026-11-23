# Autogenic

A guided autogenic training app built with Expo (SDK 58) and Expo Router.

Autogenic training is a relaxation method: you repeat short phrases silently ("My arms and legs are heavy") and let your body follow them. It's learned one exercise at a time, and every session runs through all the exercises learned so far.

## What's in the app

- **Practice**: today's phrase and session length, today's sessions against the 2–3 a day the method recommends, and the session as a list. When the current sensation has come clearly in most recent sessions over at least five days, it suggests adding the next exercise.
- **Session** (full screen, always dim): a calm check-in, then the phrases. It's built for eyes-closed practice:
  - a singing-bowl bell opens the session and marks each new phrase, and a lower bell ends it;
  - the voice reads each phrase once (or every repetition, or not at all);
  - the controls fade away after a few seconds, and a tap brings them back.
  - **Before sleep** leaves out the coming-back steps, ends silently, saves on its own and lets the phone sleep.
  - The check-out asks how calm you feel and whether the sensation came. That's the practice diary that drives progression.
- **Exercises**: the six standard exercises with what to notice, how to practice, and cautions.
- **Progress**: the week as sessions per day, how the current exercise is coming along, and a history of every session.
- **Settings**: a native form (SwiftUI `Form` on iOS) for voice, bell, haptics, stage, repetitions, pace and reset.

Everything is stored on the device. There's no account and no network use.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Everything used is included in Expo Go.

## Design notes

- Neutrals are the platform's own (UIKit semantic colors on iOS), with one sage accent. No shadows; grouping comes from inset-grouped sections and hairlines.
- Motion is limited to state changes with a purpose: press feedback (Reanimated CSS transitions), the phrase cross-fade and the controls fading. Tabs and screens use native transitions.
- The bell sounds in `assets/sounds` are synthesized for this app (no third-party audio).

## Structure

```
src/app/                 routes (Expo Router)
  (tabs)/(practice)/     Practice tab
  (tabs)/(exercises)/    Exercises tab and exercise detail
  (tabs)/(progress)/     Progress tab
  session.tsx            guided session (full-screen modal)
  settings.tsx           settings (form sheet, @expo/ui FieldGroup)
src/components/          shared UI (Group/Row, Button, CalmScale, DayPips, tab bars)
src/constants/theme.ts   design tokens
src/data/exercises.ts    exercise content
src/lib/                 session plan, progression and stats, bells, confirm, haptics
src/store/app-store.ts   on-device state (AsyncStorage), with migration of older saves
```

Autogenic training isn't a substitute for medical care. The app tells users to check with a clinician first if they have a heart condition, epilepsy or a serious mental health condition, and never to practice while driving.
