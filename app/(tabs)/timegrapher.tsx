import { StyleSheet, Text, View } from 'react-native';

export default function TimegrapherScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timegrapher</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});
