import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants';

export default function WatchFormModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>시계 등록 폼 (PR #2에서 구현)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
