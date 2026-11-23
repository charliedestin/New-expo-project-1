# Autogenic

A guided autogenic training app built with Expo (SDK 58) and Expo Router.

Autogenic training is a relaxation method: you repeat short phrases silently ("My arms and legs are heavy") and let your body follow them. It's learned one exercise at a time, about a week each, and every session runs through all the exercises learned so far.

## What's in the app

- **Practice**: today's session for your current stage, your streak, and the exact sequence you'll go through.
- **Session** (full screen): a calm check-in, the guided phrases with a slow breathing guide (4 s in, 6 s out), optional voice guidance, pause, a closing "come back" sequence, then a second check-in and a summary.
- **Exercises**: the six standard exercises (heaviness, warmth, heartbeat, breathing, abdominal warmth, cool forehead) with what to notice, how to practice, and cautions. Move to any stage from here.
- **Progress**: sessions, minutes, streak, average calm change, a 7-day chart and recent sessions.
- **Settings** (sheet): voice guidance, gentle taps, stage, repetitions, pace, reset.

Everything is stored on the device. There's no account and no network use.

## Run it

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Everything used is included in Expo Go, so no custom build is needed.

## Structure

```
src/app/                 routes (Expo Router)
  (tabs)/(practice)/     Practice tab
  (tabs)/(exercises)/    Exercises tab and exercise detail
  (tabs)/(progress)/     Progress tab
  session.tsx            guided session (full-screen modal)
  settings.tsx           settings (form sheet)
src/components/          shared UI (buttons, cards, breathing orb, tab bars)
src/constants/theme.ts   design tokens: one sage accent, warm greys, light + dark
src/data/exercises.ts    exercise content
src/lib/                 session plan, stats, haptics
src/store/app-store.ts   on-device state (AsyncStorage)
```

Autogenic training isn't a substitute for medical care. The app tells users to check with a clinician first if they have a heart condition, epilepsy or a serious mental health condition, and never to practice while driving.
