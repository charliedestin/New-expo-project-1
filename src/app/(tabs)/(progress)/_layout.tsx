import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function ProgressLayout() {
  return (
    <TabStack>
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
    </TabStack>
  );
}
