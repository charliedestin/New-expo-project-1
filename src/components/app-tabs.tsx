import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();

  return (
    <NativeTabs
      tintColor={theme.accent}
      backgroundColor={theme.background}
      indicatorColor={theme.accentSoft}
      labelStyle={{ selected: { color: theme.accent } }}>
      <NativeTabs.Trigger name="(practice)">
        <NativeTabs.Trigger.Label>Practice</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'leaf', selected: 'leaf.fill' }} md="spa" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(exercises)">
        <NativeTabs.Trigger.Label>Exercises</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.number" md="format_list_numbered" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(progress)">
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
