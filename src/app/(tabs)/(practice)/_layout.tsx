import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function PracticeLayout() {
  return (
    <TabStack>
      <Stack.Screen name="index" options={{ title: 'Practice' }} />
    </TabStack>
  );
}
