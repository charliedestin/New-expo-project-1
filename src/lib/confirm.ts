import { Alert } from 'react-native';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * The platform's confirmation alert, for uncommon consequential actions only.
 * React Native Web has no Alert, so the browser's confirm dialog stands in there.
 */
export function confirm({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive,
}: ConfirmOptions): Promise<boolean> {
  if (process.env.EXPO_OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
        {
          text: confirmLabel,
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
