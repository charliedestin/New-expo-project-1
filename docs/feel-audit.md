# Feedback audit (game-feel skill)

Method: `.claude/skills/game-feel` (event×channel matrix, three-lens code sweep, rarity gradient, single owner).
In this app the audience during practice has **eyes closed**, so sound is the channel that reaches them. Haptics only reach someone holding the phone, and screen motion only matters once the eyes are open.

## Scorecard

| Dimension | Before | After | Evidence |
|---|---|---|---|
| Feedback coverage | 4 | 8 | Coming back was silent with voice off; now a low bell (`src/app/session.tsx`, cue effect) |
| Rarity gradient | 2 | 8 | Save, stage change and reset all used `notification.success`; now distinct patterns, and the milestone is the only two-note bell and three-pulse haptic |
| Motion craft | 6 | 8 | Hard cuts on stage change, intro and snooze; now cross-fade, fade-out and a section reflow |
| Haptic design | 3 | 7 | Scattered presets, and the toggle gated 1 of 9 call sites; now one semantic vocabulary in `src/lib/feedback.ts`, gated centrally |
| Sound design | 6 | 8 | Preloaded PCM bells, loudness by rarity; the audio policy is now deliberate and documented |
| Accessibility parity | 5 | 8 | VoiceOver announces phrases (voice off); milestone scale is gated by Reduce Motion; Bell = mute, Haptics toggle covers all |

## Event×channel matrix (after)

| Event | Audience | Motion | Haptic | Sound | Verdict |
|---|---|---|---|---|---|
| Session starts (first phrase) | eyes closed | phrase fades in | light | bell 0.7 | ✅ |
| New phrase | eyes closed | 600 ms cross-fade | soft | bell 0.42 | ✅ |
| New repetition | eyes closed | dot fills | – | voice only if "every repetition" | ✅ silent repetition is the method |
| Coming back begins | eyes closed | phrase cross-fade | soft → medium | low bell 0.8 | ✅ (was 🔴 silent with voice off) |
| Session ends (not bedtime) | eyes open | check-out fades in | – | – (low bell already rang) | ✅ (was a bell after the eyes opened) |
| Session ends (before sleep) | asleep | fades to black | – | – | ✅ deliberately silent |
| Pause / resume | holder, looking | icon swap, controls stay | light | – | ✅ |
| Calm rating step / choice | holder, looking | value / check | selection | – | ✅ |
| Session saved | holder, looking | fade | success | – | ✅ |
| Ready for the next exercise (rarest) | holder, looking | card rises from 0.95 + fade | soft → light → medium | low → high bells | ✅ (was 🔴 plain text) |
| Next exercise added | holder, looking | formula cross-fades, list reflows | light → medium | – | ✅ (was 🟠 hard cut, same buzz as save) |
| Progress reset | holder, looking | lists update | warning | – | ✅ |

Single owner: practice cues are fired only by the session's cue effect. `begin()` no longer fires its own haptic (it double-fired with the first phrase), and the milestone replaces the routine "saved" cue rather than stacking on it.

## Decisions (change them in `src/lib/feedback.ts`)

- **Silent switch:** bells play through it during a session the person started. Many people silence their phone before practicing, and a session without bells can't be followed with eyes closed. The in-app Bell toggle is the mute.
- **Other audio:** bells mix with the person's own music instead of ducking it, so it isn't dipped at every phrase. The policy is re-asserted before each strike, because speech synthesis can change the audio session.
- **Silent configuration:** with both Bell and Voice off, the Practice screen says the session is silent and to keep your eyes open.

## Still needs a device pass

A code audit checks wiring, not feel. On a real iPhone and Android phone (release build), check:

- bell loudness against the voice, and against your own music playing;
- that the haptic patterns are distinguishable: phrase vs come back vs stage added vs milestone;
- the bells with the ringer switch off, and when the screen locks mid-session;
- VoiceOver reading each phrase with Voice off;
- that the milestone card's rise feels calm, not celebratory, and with Reduce Motion on.
