import React from 'react';
import { View, StyleSheet } from 'react-native';
import WeeklySummaryScreen from '@/components/weekly-summary';

export default function WeeklyScreen() {
  return (
    <View style={styles.container}>
      <WeeklySummaryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

