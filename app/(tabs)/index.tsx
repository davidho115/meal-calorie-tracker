import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import AddMealScreen from '@/components/add-meal';
import { initializeDefaultFoods } from '@/services/storage';

export default function HomeScreen() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDefaultFoods();
        setInitialized(true);
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('錯誤', '初始化失敗');
      }
    };
    init();
  }, []);

  if (!initialized) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <AddMealScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
