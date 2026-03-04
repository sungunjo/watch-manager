import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors } from '../../constants';

interface ThemedViewProps extends ViewProps {
  variant?: 'background' | 'surface' | 'surfaceLight';
}

export function ThemedView({ variant = 'background', style, ...props }: ThemedViewProps) {
  const backgroundColor = {
    background: Colors.background,
    surface: Colors.surface,
    surfaceLight: Colors.surfaceLight,
  }[variant];

  return <View style={[{ backgroundColor }, style]} {...props} />;
}

export function ScreenContainer({ children, style, ...props }: ViewProps) {
  return (
    <View style={[styles.screen, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
