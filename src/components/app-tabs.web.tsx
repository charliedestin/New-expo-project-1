import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, type PressableProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import type { IconName } from '@/data/exercises';
import { useTheme } from '@/hooks/use-theme';

const TABS: {
  name: string;
  href: '/' | '/exercises' | '/progress';
  label: string;
  icon: IconName;
}[] = [
  {
    name: '(practice)',
    href: '/',
    label: 'Practice',
    icon: { ios: 'leaf', android: 'spa', web: 'spa' },
  },
  {
    name: '(exercises)',
    href: '/exercises',
    label: 'Exercises',
    icon: { ios: 'list.number', android: 'format_list_numbered', web: 'format_list_numbered' },
  },
  {
    name: '(progress)',
    href: '/progress',
    label: 'Progress',
    icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  },
];

/** Web: a bottom tab bar that mirrors the native one. */
export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs style={{ flex: 1, backgroundColor: theme.background }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <TabBar bottomInset={insets.bottom}>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
              <TabButton label={tab.label} icon={tab.icon} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

/** Triggers must be direct children of the tab list, so the layout lives in this wrapper. */
function TabBar({ bottomInset, children, ...props }: TabListProps & { bottomInset: number }) {
  const theme = useTheme();
  return (
    <View
      {...props}
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.separator,
        backgroundColor: theme.background,
        paddingBottom: Math.max(bottomInset, Spacing.two),
        paddingTop: Spacing.two,
        alignItems: 'center',
      }}>
      <View style={{ flexDirection: 'row', width: '100%', maxWidth: MaxContentWidth }}>
        {children}
      </View>
    </View>
  );
}

function TabButton({
  isFocused,
  label,
  icon,
  ...props
}: TabTriggerSlotProps & { label: string; icon: IconName }) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textTertiary;

  return (
    <Pressable
      {...(props as PressableProps)}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={{ flex: 1, alignItems: 'center', gap: 2, paddingVertical: Spacing.one }}>
      <View
        style={{
          paddingHorizontal: Spacing.four,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: isFocused ? theme.accentSoft : 'transparent',
        }}>
        <Icon name={icon} size={22} color={color} weight={isFocused ? 'semibold' : 'regular'} />
      </View>
      <AppText variant="footnote" style={{ color, fontWeight: isFocused ? '600' : '500' }}>
        {label}
      </AppText>
    </Pressable>
  );
}
