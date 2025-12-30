import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FoodStorage } from '../services/storage';
import { FoodItem } from '../types/meal';

export default function FoodLibraryScreen() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    isCommon: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    const allFoods = await FoodStorage.getAll();
    setFoods(allFoods);
  };

  const filteredFoods = foods
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

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.calories) {
      Alert.alert('錯誤', '請填寫食物名稱和卡路里');
      return;
    }

    const calories = parseInt(formData.calories);
    if (isNaN(calories) || calories < 0) {
      Alert.alert('錯誤', '請輸入有效的卡路里數值');
      return;
    }

    try {
      if (editingFood) {
        await FoodStorage.update(editingFood.id, {
          name: formData.name.trim(),
          calories,
          isCommon: formData.isCommon,
        });
      } else {
        await FoodStorage.add({
          name: formData.name.trim(),
          calories,
          isCommon: formData.isCommon,
        });
      }
      await loadFoods();
      resetForm();
    } catch (error) {
      Alert.alert('錯誤', '保存失敗');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('確認刪除', '確定要刪除此食物嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除',
        style: 'destructive',
        onPress: async () => {
          await FoodStorage.delete(id);
          await loadFoods();
        },
      },
    ]);
  };

  const handleEdit = (food: FoodItem) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      calories: food.calories.toString(),
      isCommon: food.isCommon || false,
    });
    setModalVisible(true);
  };

  const resetForm = () => {
    setFormData({ name: '', calories: '', isCommon: false });
    setEditingFood(null);
    setModalVisible(false);
  };

  const toggleCommon = async (food: FoodItem) => {
    try {
      await FoodStorage.update(food.id, {
        isCommon: !food.isCommon,
      });
      await loadFoods();
    } catch (error) {
      Alert.alert('錯誤', '更新失敗');
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={styles.foodItem}>
      <TouchableOpacity
        style={styles.starButton}
        onPress={() => toggleCommon(item)}
      >
        <Text style={[styles.starIcon, item.isCommon && styles.starIconActive]}>
          ★
        </Text>
      </TouchableOpacity>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodCalories}>{item.calories} 卡路里</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.editButtonText}>編輯</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>刪除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>食物資料庫</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ 新增食物</Text>
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
        renderItem={renderFoodItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>暫無食物記錄</Text>
        }
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={resetForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingFood ? '編輯食物' : '新增食物'}
            </Text>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>食物名稱</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：白飯（1碗）"
                value={formData.name}
                onChangeText={text => setFormData({ ...formData, name: text })}
              />

              <Text style={styles.label}>卡路里</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：200"
                keyboardType="numeric"
                value={formData.calories}
                onChangeText={text =>
                  setFormData({ ...formData, calories: text })
                }
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() =>
                  setFormData({ ...formData, isCommon: !formData.isCommon })
                }
              >
                <View
                  style={[
                    styles.checkbox,
                    formData.isCommon && styles.checkboxChecked,
                  ]}
                >
                  {formData.isCommon && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>設為常用食物 ★</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  foodItem: {
    backgroundColor: '#fff',
    padding: 16,
    paddingLeft: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  starButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  starIcon: {
    fontSize: 28,
    color: '#e0e0e0',
  },
  starIconActive: {
    color: '#FFC107',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  commonBadge: {
    color: '#FFC107',
    fontSize: 18,
  },
  foodCalories: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 32,
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
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    marginBottom: 20,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

