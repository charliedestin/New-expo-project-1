import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Spacing } from '@/constants/theme';
import type { IconName } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  icon: IconName;
  title: string;
  detail?: string;
  trailing?: React.ReactNode;
  muted?: boolean;
  divider?: boolean;
};

/** A row inside a grouped card: icon badge, title, detail and optional trailing content. */
export function StepRow({ icon, title, detail, trailing, muted, divider }: Props) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.four,
        paddingVertical: Spacing.three,
        paddingHorizontal: Spacing.five,
        minHeight: 60,
        borderTopWidth: divider ? 1 : 0,
        borderTopColor: theme.separator,
      }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: muted ? theme.surfaceMuted : theme.accentSoft,
        }}>
        <Icon name={icon} size={19} color={muted ? theme.textSecondary : theme.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="headline" numberOfLines={1}>
          {title}
        </AppText>
        {detail ? (
          <AppText variant="footnote" tone="secondary" numberOfLines={2}>
            {detail}
          </AppText>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
