import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants';

export default function MeasurementModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Timegrapher 측정 (PR #5에서 구현)</Text>
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
