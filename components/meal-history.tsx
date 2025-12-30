import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FoodStorage, MealStorage } from '../services/storage';
import { FoodItem, MealRecord } from '../types/meal';

export default function MealHistoryScreen() {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    const allMeals = await MealStorage.getAll();
    setMeals(allMeals);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('確認刪除', '確定要刪除此記錄嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          await MealStorage.delete(id);
          await loadMeals();
        },
      },
    ]);
  };

  const handleAddFoodToLibrary = async (food: FoodItem) => {
    try {
      // 檢查食物是否已存在於資料庫
      const allFoods = await FoodStorage.getAll();
      const exists = allFoods.some(
        f => f.name.toLowerCase() === food.name.toLowerCase()
      );

      if (exists) {
        Alert.alert('提示', '此食物已存在於資料庫中');
        return;
      }

      // 詢問是否設為常用
      Alert.alert(
        '添加到食物資料庫',
        `將「${food.name}」（${food.calories} 卡）添加到資料庫？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '添加為常用',
            onPress: async () => {
              await FoodStorage.add({
                name: food.name,
                calories: food.calories,
                isCommon: true,
              });
              Alert.alert('成功', '已添加到常用食物 ★');
            },
          },
          {
            text: '普通添加',
            onPress: async () => {
              await FoodStorage.add({
                name: food.name,
                calories: food.calories,
                isCommon: false,
              });
              Alert.alert('成功', '已添加到食物資料庫');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('錯誤', '添加失敗');
    }
  };

  const groupMealsByDate = () => {
    const grouped: { [date: string]: MealRecord[] } = {};
    meals.forEach(meal => {
      const dateKey = new Date(meal.date).toLocaleDateString('zh-HK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(meal);
    });
    return grouped;
  };

  const groupedMeals = groupMealsByDate();
  const dates = Object.keys(groupedMeals);

  const getDailyTotal = (dateMeals: MealRecord[]) => {
    return dateMeals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  };

  const renderMeal = (meal: MealRecord) => (
    <View key={meal.id} style={styles.mealCard}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTypeContainer}>
          <Text style={styles.mealType}>{meal.mealType}</Text>
          <Text style={styles.mealCalories}>{meal.totalCalories} 卡路里</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(meal.id)}
        >
          <Text style={styles.deleteButtonText}>刪除</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.foodList}>
        {meal.foods.map((food, index) => (
          <TouchableOpacity
            key={`${food.id}_${index}`}
            style={styles.foodItem}
            onLongPress={() => handleAddFoodToLibrary(food)}
          >
            <Text style={styles.foodName}>• {food.name}</Text>
            <View style={styles.foodActions}>
              <Text style={styles.foodCalories}>{food.calories} 卡</Text>
              <TouchableOpacity
                style={styles.addToLibraryButton}
                onPress={() => handleAddFoodToLibrary(food)}
              >
                <Text style={styles.addToLibraryIcon}>+</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {meal.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>備註：</Text>
          <Text style={styles.notesText}>{meal.notes}</Text>
        </View>
      )}
    </View>
  );

  const renderDateSection = ({ item: date }: { item: string }) => {
    const dateMeals = groupedMeals[date];
    const dailyTotal = getDailyTotal(dateMeals);
    const isExpanded = selectedDate === date;

    return (
      <View style={styles.dateSection}>
        <TouchableOpacity
          style={styles.dateHeader}
          onPress={() => setSelectedDate(isExpanded ? null : date)}
        >
          <View>
            <Text style={styles.dateText}>{date}</Text>
            <Text style={styles.mealCount}>{dateMeals.length} 餐</Text>
          </View>
          <View style={styles.dailySummary}>
            <Text style={styles.dailyTotal}>{dailyTotal} 卡</Text>
            <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.mealsContainer}>
            {dateMeals.map(meal => renderMeal(meal))}
          </View>
        )}
      </View>
    );
  };

  const totalMeals = meals.length;
  const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  const averageCalories = totalMeals > 0 ? Math.round(totalCalories / dates.length) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalMeals}</Text>
          <Text style={styles.statLabel}>總記錄數</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCalories.toLocaleString()}</Text>
          <Text style={styles.statLabel}>總卡路里</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{averageCalories.toLocaleString()}</Text>
          <Text style={styles.statLabel}>日均卡路里</Text>
        </View>
      </View>

      <FlatList
        data={dates}
        keyExtractor={item => item}
        renderItem={renderDateSection}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>尚無餐食記錄</Text>
            <Text style={styles.emptyHint}>開始記錄您的每一餐吧！</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statsCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  dateSection: {
    marginBottom: 16,
  },
  dateHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealCount: {
    fontSize: 12,
    color: '#999',
  },
  dailySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dailyTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  expandIcon: {
    fontSize: 14,
    color: '#999',
  },
  mealsContainer: {
    marginTop: 8,
  },
  mealCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    marginLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTypeContainer: {
    flex: 1,
  },
  mealType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 14,
    color: '#FF9800',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  foodList: {
    gap: 6,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  foodName: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  foodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodCalories: {
    fontSize: 13,
    color: '#999',
  },
  addToLibraryButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToLibraryIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#bbb',
  },
});

