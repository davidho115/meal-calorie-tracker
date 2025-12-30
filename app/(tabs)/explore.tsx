import React from 'react';
import { View, StyleSheet } from 'react-native';
import MealHistoryScreen from '@/components/meal-history';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <MealHistoryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
