import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Button } from './Button';
import { Colors } from '../../constants';

interface EmptyStateProps {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'watch-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.textMuted} />
      <ThemedText variant="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {description && (
        <ThemedText variant="caption" style={styles.description}>
          {description}
        </ThemedText>
      )}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  title: {
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    minWidth: 160,
  },
});
