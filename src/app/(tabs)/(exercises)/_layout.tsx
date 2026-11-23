import { Stack } from 'expo-router';

import { TabStack } from '@/components/tab-stack';

export default function ExercisesLayout() {
  return (
    <TabStack>
      <Stack.Screen name="exercises/index" options={{ title: 'Exercises' }} />
      <Stack.Screen name="exercises/[id]" options={{ title: '', headerLargeTitleEnabled: false }} />
    </TabStack>
  );
}
