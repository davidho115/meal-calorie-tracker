import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, MealRecord } from '../types/meal';

const KEYS = {
  FOOD_ITEMS: '@meal_tracker_food_items',
  MEAL_RECORDS: '@meal_tracker_meal_records',
};

// 生成唯一 ID
let idCounter = 0;
const generateUniqueId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  idCounter += 1;
  return `${timestamp}-${random}-${idCounter}`;
};

// 食物資料庫操作
export const FoodStorage = {
  // 獲取所有食物
  async getAll(): Promise<FoodItem[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FOOD_ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting food items:', error);
      return [];
    }
  },

  // 添加食物
  async add(food: Omit<FoodItem, 'id' | 'createdAt'>): Promise<FoodItem> {
    try {
      const foods = await this.getAll();
      const newFood: FoodItem = {
        ...food,
        id: generateUniqueId(),
        createdAt: new Date().toISOString(),
      };
      foods.push(newFood);
      await AsyncStorage.setItem(KEYS.FOOD_ITEMS, JSON.stringify(foods));
      return newFood;
    } catch (error) {
      console.error('Error adding food:', error);
      throw error;
    }
  },

  // 更新食物
  async update(id: string, updates: Partial<FoodItem>): Promise<void> {
    try {
      const foods = await this.getAll();
      const index = foods.findIndex(f => f.id === id);
      if (index !== -1) {
        foods[index] = { ...foods[index], ...updates };
        await AsyncStorage.setItem(KEYS.FOOD_ITEMS, JSON.stringify(foods));
      }
    } catch (error) {
      console.error('Error updating food:', error);
      throw error;
    }
  },

  // 刪除食物
  async delete(id: string): Promise<void> {
    try {
      const foods = await this.getAll();
      const filtered = foods.filter(f => f.id !== id);
      await AsyncStorage.setItem(KEYS.FOOD_ITEMS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting food:', error);
      throw error;
    }
  },

  // 獲取常用食物
  async getCommon(): Promise<FoodItem[]> {
    const foods = await this.getAll();
    return foods.filter(f => f.isCommon);
  },
};

// 餐食記錄操作
export const MealStorage = {
  // 獲取所有記錄
  async getAll(): Promise<MealRecord[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MEAL_RECORDS);
      const records = data ? JSON.parse(data) : [];
      // 按日期降序排列
      return records.sort((a: MealRecord, b: MealRecord) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Error getting meal records:', error);
      return [];
    }
  },

  // 添加記錄
  async add(meal: Omit<MealRecord, 'id' | 'createdAt'>): Promise<MealRecord> {
    try {
      const meals = await this.getAll();
      const newMeal: MealRecord = {
        ...meal,
        id: generateUniqueId(),
        createdAt: new Date().toISOString(),
      };
      meals.push(newMeal);
      await AsyncStorage.setItem(KEYS.MEAL_RECORDS, JSON.stringify(meals));
      return newMeal;
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  },

  // 更新記錄
  async update(id: string, updates: Partial<MealRecord>): Promise<void> {
    try {
      const meals = await this.getAll();
      const index = meals.findIndex(m => m.id === id);
      if (index !== -1) {
        meals[index] = { ...meals[index], ...updates };
        await AsyncStorage.setItem(KEYS.MEAL_RECORDS, JSON.stringify(meals));
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  },

  // 刪除記錄
  async delete(id: string): Promise<void> {
    try {
      const meals = await this.getAll();
      const filtered = meals.filter(m => m.id !== id);
      await AsyncStorage.setItem(KEYS.MEAL_RECORDS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  },

  // 獲取日期範圍內的記錄
  async getByDateRange(startDate: Date, endDate: Date): Promise<MealRecord[]> {
    const meals = await this.getAll();
    return meals.filter(m => {
      const mealDate = new Date(m.date);
      return mealDate >= startDate && mealDate <= endDate;
    });
  },

  // 獲取今天的記錄
  async getToday(): Promise<MealRecord[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getByDateRange(today, tomorrow);
  },
};

// 初始化預設常用食物
export const initializeDefaultFoods = async () => {
  const foods = await FoodStorage.getAll();
  if (foods.length === 0) {
    const defaultFoods = [
      { name: '白飯（1碗）', calories: 200, isCommon: true },
      { name: '雞胸肉（100g）', calories: 165, isCommon: true },
      { name: '雞蛋（1隻）', calories: 70, isCommon: true },
      { name: '麵包（1片）', calories: 80, isCommon: true },
      { name: '牛奶（250ml）', calories: 150, isCommon: true },
      { name: '香蕉（1條）', calories: 90, isCommon: true },
      { name: '蘋果（1個）', calories: 95, isCommon: true },
      { name: '三文治', calories: 300, isCommon: true },
      { name: '沙律', calories: 150, isCommon: true },
      { name: '炒菜（1碟）', calories: 100, isCommon: true },
    ];

    for (const food of defaultFoods) {
      await FoodStorage.add(food);
    }
  }
};

