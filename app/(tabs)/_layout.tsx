import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
        headerStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].background,
        },
        headerTintColor: Colors[colorScheme ?? 'light'].text,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '記錄餐食',
          headerTitle: '記錄餐食',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: '歷史記錄',
          headerTitle: '歷史記錄',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title: '每週總結',
          headerTitle: '每週總結',
          tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="foods"
        options={{
          title: '食物庫',
          headerTitle: '食物資料庫',
          tabBarIcon: ({ color }) => <Ionicons name="book" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
