import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { DatabaseProvider } from '../src/hooks/useDatabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // 기본 시스템 폰트 사용 (별도 폰트 불필요)
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <DatabaseProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modals/watch-form"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '시계 등록',
              headerStyle: { backgroundColor: '#1a1a2e' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="modals/measurement"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Timegrapher 측정',
              headerStyle: { backgroundColor: '#1a1a2e' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="modals/wear-log-form"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '오착 기록',
              headerStyle: { backgroundColor: '#1a1a2e' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="modals/service-form"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: '서비스 이력 등록',
              headerStyle: { backgroundColor: '#1a1a2e' },
              headerTintColor: '#ffffff',
            }}
          />
        </Stack>
        <StatusBar style="light" />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
