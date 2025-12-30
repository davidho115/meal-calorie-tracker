import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FoodStorage, MealStorage } from '../services/storage';
import { FoodItem } from '../types/meal';

export default function AddMealScreen({ onMealAdded }: { onMealAdded?: () => void }) {
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealType, setMealType] = useState<'早餐' | '午餐' | '晚餐' | '小食'>('午餐');
  const [selectedFoods, setSelectedFoods] = useState<FoodItem[]>([]);
  const [notes, setNotes] = useState('');
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [allFoods, setAllFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddMode, setQuickAddMode] = useState(false);
  const [quickFood, setQuickFood] = useState({ name: '', calories: '' });

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    const foods = await FoodStorage.getAll();
    setAllFoods(foods);
  };

  const filteredFoods = allFoods
    .filter(food =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // 常用食物優先
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      // 其次按名稱排序
      return a.name.localeCompare(b.name, 'zh-HK');
    });

  const totalCalories = selectedFoods.reduce((sum, food) => sum + food.calories, 0);

  const handleAddFood = (food: FoodItem) => {
    setSelectedFoods([...selectedFoods, food]);
    setSearchQuery('');
  };

  const handleRemoveFood = (index: number) => {
    const newFoods = [...selectedFoods];
    newFoods.splice(index, 1);
    setSelectedFoods(newFoods);
  };

  const handleQuickAdd = () => {
    if (!quickFood.name.trim() || !quickFood.calories) {
      Alert.alert('錯誤', '請填寫食物名稱和卡路里');
      return;
    }

    const calories = parseInt(quickFood.calories);
    if (isNaN(calories) || calories < 0) {
      Alert.alert('錯誤', '請輸入有效的卡路里數值');
      return;
    }

    const tempFood: FoodItem = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name: quickFood.name.trim(),
      calories,
      createdAt: new Date().toISOString(),
    };

    setSelectedFoods([...selectedFoods, tempFood]);
    setQuickFood({ name: '', calories: '' });
    setQuickAddMode(false);
  };

  const handleSaveMeal = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert('錯誤', '請至少添加一項食物');
      return;
    }

    try {
      await MealStorage.add({
        date: date.toISOString(),
        mealType,
        foods: selectedFoods,
        totalCalories,
        notes: notes.trim(),
      });

      Alert.alert('成功', '餐食記錄已保存', [
        {
          text: '確定',
          onPress: () => {
            setSelectedFoods([]);
            setNotes('');
            onMealAdded?.();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('錯誤', '保存失敗');
    }
  };

  const renderSelectedFood = ({ item, index }: { item: FoodItem; index: number }) => (
    <View style={styles.selectedFoodItem}>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodCalories}>{item.calories} 卡路里</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFood(index)}
      >
        <Text style={styles.removeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFoodOption = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodOption}
      onPress={() => {
        handleAddFood(item);
        setFoodModalVisible(false);
      }}
    >
      <View style={styles.foodOptionContent}>
        {item.isCommon && (
          <Text style={styles.commonStar}>★</Text>
        )}
        <View style={styles.foodOptionText}>
          <Text style={styles.foodOptionName}>{item.name}</Text>
          <Text style={styles.foodOptionCalories}>{item.calories} 卡路里</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const mealTypes: Array<'早餐' | '午餐' | '晚餐' | '小食'> = ['早餐', '午餐', '晚餐', '小食'];

  const isToday = () => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const setToday = () => {
    setDate(new Date());
  };

  const formatDate = () => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return { year, month, day, weekday };
  };

  const dateInfo = formatDate();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <View style={styles.dateHeader}>
          <Text style={styles.sectionTitle}>日期</Text>
          {!isToday() && (
            <TouchableOpacity style={styles.todayButton} onPress={setToday}>
              <Text style={styles.todayButtonText}>今天</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.datePickerContainer}>
          <TouchableOpacity
            style={styles.dateDisplayCard}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.dateDisplayLeft}>
              <Text style={styles.dateDayNumber}>{dateInfo.day}</Text>
              <Text style={styles.dateMonth}>{dateInfo.month}月</Text>
            </View>
            <View style={styles.dateDisplayRight}>
              <Text style={styles.dateYear}>{dateInfo.year}年</Text>
              <Text style={styles.dateWeekday}>週{dateInfo.weekday}</Text>
              {isToday() && <Text style={styles.todayBadge}>今天</Text>}
            </View>
            <Text style={styles.changeIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>餐別</Text>
        <View style={styles.mealTypeContainer}>
          {mealTypes.map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.mealTypeButton,
                mealType === type && styles.mealTypeButtonActive,
              ]}
              onPress={() => setMealType(type)}
            >
              <Text
                style={[
                  styles.mealTypeText,
                  mealType === type && styles.mealTypeTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>食物清單</Text>
          <View style={styles.caloriesBadge}>
            <Text style={styles.caloriesText}>總計：{totalCalories} 卡</Text>
          </View>
        </View>

        {selectedFoods.length > 0 ? (
          <FlatList
            data={selectedFoods}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={renderSelectedFood}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyText}>尚未添加食物</Text>
        )}

        <View style={styles.addFoodButtons}>
          <TouchableOpacity
            style={styles.addFoodButton}
            onPress={() => {
              loadFoods();
              setFoodModalVisible(true);
            }}
          >
            <Text style={styles.addFoodButtonText}>+ 從資料庫選擇</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAddButton}
            onPress={() => setQuickAddMode(true)}
          >
            <Text style={styles.quickAddButtonText}>快速添加</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>備註（選填）</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="例如：在家煮的、外賣..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveMeal}>
        <Text style={styles.saveButtonText}>保存記錄</Text>
      </TouchableOpacity>

      {/* 食物選擇 Modal */}
      <Modal
        visible={foodModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFoodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>選擇食物</Text>
              <TouchableOpacity onPress={() => setFoodModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="搜尋食物..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={filteredFoods}
              keyExtractor={item => item.id}
              renderItem={renderFoodOption}
              ListEmptyComponent={
                <Text style={styles.emptyText}>找不到食物</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* 快速添加 Modal */}
      <Modal
        visible={quickAddMode}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQuickAddMode(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.quickAddModal}>
            <Text style={styles.modalTitle}>快速添加食物</Text>

            <Text style={styles.label}>食物名稱</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：漢堡包"
              value={quickFood.name}
              onChangeText={text => setQuickFood({ ...quickFood, name: text })}
            />

            <Text style={styles.label}>卡路里</Text>
            <TextInput
              style={styles.input}
              placeholder="例如：300"
              keyboardType="numeric"
              value={quickFood.calories}
              onChangeText={text => setQuickFood({ ...quickFood, calories: text })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setQuickAddMode(false);
                  setQuickFood({ name: '', calories: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleQuickAdd}
              >
                <Text style={styles.confirmButtonText}>添加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  todayButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  datePickerContainer: {
    marginBottom: 8,
  },
  dateDisplayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dateDisplayLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 16,
  },
  dateDayNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 4,
  },
  dateMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  dateDisplayRight: {
    flex: 1,
    justifyContent: 'center',
  },
  dateYear: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  dateWeekday: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  todayBadge: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
    marginTop: 4,
  },
  changeIcon: {
    fontSize: 24,
    marginLeft: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mealTypeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  mealTypeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mealTypeText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  mealTypeTextActive: {
    color: '#fff',
  },
  caloriesBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  caloriesText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  selectedFoodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  foodCalories: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
  addFoodButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addFoodButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addFoodButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickAddButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF5722',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
  },
  foodOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commonStar: {
    fontSize: 20,
    color: '#FFC107',
    marginRight: 8,
  },
  foodOptionText: {
    flex: 1,
  },
  foodOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commonBadge: {
    color: '#FFC107',
    fontSize: 18,
  },
  foodOptionCalories: {
    fontSize: 14,
    color: '#666',
  },
  quickAddModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

