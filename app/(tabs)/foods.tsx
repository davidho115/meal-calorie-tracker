import React from 'react';
import { View, StyleSheet } from 'react-native';
import FoodLibraryScreen from '@/components/food-library';

export default function FoodsScreen() {
  return (
    <View style={styles.container}>
      <FoodLibraryScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

