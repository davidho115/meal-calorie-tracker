import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MealRecord, WeeklySummary } from '../types/meal';
import { MealStorage } from '../services/storage';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function WeeklySummaryScreen() {
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [dailyData, setDailyData] = useState<{ date: Date; calories: number; meals: number }[]>([]);

  useEffect(() => {
    loadWeeklySummary();
  }, [currentWeekStart]);

  const loadWeeklySummary = async () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const meals = await MealStorage.getByDateRange(currentWeekStart, weekEnd);

    // 計算每日數據
    const daily: { [key: string]: { calories: number; meals: number } } = {};
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      daily[dateKey] = { calories: 0, meals: 0 };
    }

    meals.forEach(meal => {
      const dateKey = new Date(meal.date).toISOString().split('T')[0];
      if (daily[dateKey]) {
        daily[dateKey].calories += meal.totalCalories;
        daily[dateKey].meals += 1;
      }
    });

    const dailyArray = Object.keys(daily).map(dateKey => ({
      date: new Date(dateKey),
      calories: daily[dateKey].calories,
      meals: daily[dateKey].meals,
    }));

    setDailyData(dailyArray);

    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
    const daysWithMeals = Object.values(daily).filter(d => d.meals > 0).length;
    const avgCalories = daysWithMeals > 0 ? Math.round(totalCalories / daysWithMeals) : 0;

    setWeeklySummary({
      weekStart: currentWeekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalCalories,
      dailyAverage: avgCalories,
      mealCount: meals.length,
    });
  };

  const previousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const isCurrentWeek = () => {
    const thisWeekStart = getWeekStart(new Date());
    return currentWeekStart.toISOString().split('T')[0] === thisWeekStart.toISOString().split('T')[0];
  };

  const getWeekDateRange = () => {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${currentWeekStart.getMonth() + 1}月${currentWeekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
  };

  const maxCalories = Math.max(...dailyData.map(d => d.calories), 1);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={previousWeek}>
          <Text style={styles.navButtonText}>◀ 上週</Text>
        </TouchableOpacity>
        <View style={styles.weekInfo}>
          <Text style={styles.weekText}>{getWeekDateRange()}</Text>
          {isCurrentWeek() && <Text style={styles.currentWeekBadge}>本週</Text>}
        </View>
        <TouchableOpacity
          style={[styles.navButton, isCurrentWeek() && styles.navButtonDisabled]}
          onPress={nextWeek}
          disabled={isCurrentWeek()}
        >
          <Text style={[styles.navButtonText, isCurrentWeek() && styles.navButtonTextDisabled]}>
            下週 ▶
          </Text>
        </TouchableOpacity>
      </View>

      {weeklySummary && (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weeklySummary.totalCalories.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>本週總卡路里</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weeklySummary.dailyAverage.toLocaleString()}</Text>
              <Text style={styles.summaryLabel}>日均卡路里</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{weeklySummary.mealCount}</Text>
              <Text style={styles.summaryLabel}>總餐數</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>每日卡路里攝入</Text>
            <View style={styles.chart}>
              {dailyData.map((day, index) => {
                const barHeight = maxCalories > 0 ? (day.calories / maxCalories) * 150 : 0;
                const dayName = ['日', '一', '二', '三', '四', '五', '六'][day.date.getDay()];
                
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      {day.calories > 0 && (
                        <Text style={styles.barLabel}>{day.calories}</Text>
                      )}
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barHeight, day.calories > 0 ? 20 : 0),
                            backgroundColor: day.calories > 0 ? '#4CAF50' : '#e0e0e0',
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.dayLabel}>
                      週{dayName}
                    </Text>
                    <Text style={styles.dateLabel}>
                      {day.date.getMonth() + 1}/{day.date.getDate()}
                    </Text>
                    {day.meals > 0 && (
                      <Text style={styles.mealLabel}>{day.meals}餐</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>每週洞察</Text>
            {weeklySummary.mealCount === 0 ? (
              <Text style={styles.insightText}>本週還未有記錄</Text>
            ) : (
              <>
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>📊</Text>
                  <Text style={styles.insightText}>
                    本週共記錄了 <Text style={styles.bold}>{weeklySummary.mealCount}</Text> 餐
                  </Text>
                </View>
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>🔥</Text>
                  <Text style={styles.insightText}>
                    平均每日攝入 <Text style={styles.bold}>{weeklySummary.dailyAverage}</Text> 卡路里
                  </Text>
                </View>
                {weeklySummary.dailyAverage > 2000 && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>⚠️</Text>
                    <Text style={styles.insightText}>
                      日均攝入較高，注意控制飲食
                    </Text>
                  </View>
                )}
                {weeklySummary.dailyAverage < 1500 && weeklySummary.mealCount >= 7 && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>💡</Text>
                    <Text style={styles.insightText}>
                      日均攝入較低，確保營養均衡
                    </Text>
                  </View>
                )}
                {weeklySummary.dailyAverage >= 1800 && weeklySummary.dailyAverage <= 2200 && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>✅</Text>
                    <Text style={styles.insightText}>
                      卡路里攝入在健康範圍內
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#999',
  },
  weekInfo: {
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentWeekBadge: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 220,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 170,
  },
  bar: {
    width: 30,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    fontWeight: '600',
  },
  dayLabel: {
    fontSize: 12,
    color: '#333',
    marginTop: 8,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  mealLabel: {
    fontSize: 10,
    color: '#4CAF50',
    marginTop: 2,
  },
  insightsCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
});

