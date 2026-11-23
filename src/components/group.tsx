import { Children, Fragment, isValidElement } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { Radius, ScreenInset, Spacing } from '@/constants/theme';
import type { IconName } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';

type GroupProps = ViewProps & {
  title?: string;
  /** Right side of the section header, e.g. a count. */
  detail?: string;
  footer?: string;
};

/**
 * An inset-grouped section: the platform's container for related rows. No shadow, no border;
 * separators between rows are inset to the text, like Settings and Health.
 */
export function Group({ title, detail, footer, children, style, ...rest }: GroupProps) {
  const theme = useTheme();
  const items = Children.toArray(children).filter(isValidElement);

  return (
    <View style={{ gap: Spacing.sm }} {...rest}>
      {title ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.xs,
          }}>
          <AppText variant="section" accessibilityRole="header">
            {title}
          </AppText>
          {detail ? (
            <AppText variant="subhead" tone="secondary" numeric>
              {detail}
            </AppText>
          ) : null}
        </View>
      ) : null}
      <View
        style={[
          {
            backgroundColor: theme.surface,
            borderRadius: Radius.group,
            borderCurve: 'continuous',
            overflow: 'hidden',
          },
          style,
        ]}>
        {items.map((child, i) => (
          <Fragment key={child.key ?? i}>
            {i > 0 ? (
              <View
                style={{
                  height: 0.5,
                  marginLeft:
                    (child.props as { separatorInset?: number }).separatorInset ?? ScreenInset,
                  backgroundColor: theme.separator,
                }}
              />
            ) : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="footnote" tone="secondary" style={{ paddingHorizontal: Spacing.lg }}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

type RowProps = {
  title: string;
  detail?: string;
  icon?: IconName;
  /** Neutral icon tile instead of the accent one. */
  iconMuted?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  accessibilityHint?: string;
  /** Where the separator above this row starts. Rows with an icon align it to the text. */
  separatorInset?: number;
};

const ICON_TILE = 30;

/** A row in a Group. Pressable rows highlight their background; they never scale. */
export function Row({
  title,
  detail,
  icon,
  iconMuted,
  trailing,
  onPress,
  chevron,
  accessibilityHint,
}: RowProps) {
  const theme = useTheme();

  const content = (pressed: boolean) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: ScreenInset,
        paddingVertical: Spacing.md - 1,
        minHeight: 48,
        backgroundColor: pressed ? theme.fill : 'transparent',
      }}>
      {icon ? (
        <View
          style={{
            width: ICON_TILE,
            height: ICON_TILE,
            borderRadius: Radius.tile - 2,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: iconMuted ? theme.fill : theme.accentSoft,
          }}>
          <Icon name={icon} size={17} color={iconMuted ? theme.textSecondary : theme.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 1 }}>
        <AppText variant="body">{title}</AppText>
        {detail ? (
          <AppText variant="footnote" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {chevron ? (
        <Icon
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={13}
          weight="semibold"
          color={theme.textTertiary}
        />
      ) : null}
    </View>
  );

  if (!onPress) return content(false);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${title}, ${detail}` : title}
      accessibilityHint={accessibilityHint}
      unstable_pressDelay={40}>
      {({ pressed }) => content(pressed)}
    </Pressable>
  );
}

/** Separator inset for rows that have an icon tile, so the hairline lines up with the text. */
export const ICON_ROW_INSET = ScreenInset + ICON_TILE + Spacing.md;
