import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../src/constants';

export default function CollectionScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>컬렉션</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>컬렉션 (개발 예정)</Text>
        <Text style={styles.placeholderSub}>Phase 1 MVP - PR #2, #3에서 구현</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  placeholderSub: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
