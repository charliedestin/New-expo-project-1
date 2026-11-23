import * as Haptics from 'expo-haptics';

const enabled = process.env.EXPO_OS === 'ios' || process.env.EXPO_OS === 'android';

/** Haptics are punctuation: one per user action, never the only feedback. */
export const haptic = {
  selection() {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
  light() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  soft() {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  },
  success() {
    if (enabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
};
