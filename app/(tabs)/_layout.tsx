import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: '대시보드' }} />
      <Tabs.Screen name="collection" options={{ title: '컬렉션' }} />
      <Tabs.Screen name="wotd" options={{ title: '오착' }} />
      <Tabs.Screen name="timegrapher" options={{ title: 'Timegrapher' }} />
      <Tabs.Screen name="more" options={{ title: '더보기' }} />
    </Tabs>
  );
}
