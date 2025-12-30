// 食物項目
export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  isCommon?: boolean; // 是否為常用食物
  createdAt: string;
}

// 餐食記錄
export interface MealRecord {
  id: string;
  date: string; // ISO string
  mealType: '早餐' | '午餐' | '晚餐' | '小食';
  foods: FoodItem[];
  totalCalories: number;
  notes?: string;
  createdAt: string;
}

// 每週統計
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalCalories: number;
  dailyAverage: number;
  mealCount: number;
}

