<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, FAB, ProgressBar, IconButton, Portal, Modal, Button, TextInput, Chip, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { BarChart } from '../components/Charts';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

const BUDGET_CATEGORIES = [
  { key: 'groceries', label: 'Groceries', icon: 'cart' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping' },
  { key: 'food', label: 'Food & Dining', icon: 'food' },
  { key: 'transport', label: 'Transport', icon: 'car' },
  { key: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { key: 'utilities', label: 'Utilities', icon: 'flash' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'repeat' },
  { key: 'healthcare', label: 'Healthcare', icon: 'hospital' },
];

export default function BudgetScreen({ navigation }) {
  const { budgets, transactions, fetchBudgets, addBudget, updateBudget, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit_amount: '',
    period: 'monthly',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchBudgets();
    try {
      const budgetSuggestions = await api.getBudgetSuggestions();
      setSuggestions(budgetSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateBudget = async () => {
    if (!newBudget.category || !newBudget.limit_amount) return;

    try {
      await addBudget({
        ...newBudget,
        limit_amount: parseFloat(newBudget.limit_amount),
      });
      setShowAddModal(false);
      setNewBudget({ category: '', limit_amount: '', period: 'monthly' });
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleUpdateBudget = async () => {
    if (!selectedBudget) return;

    try {
      await updateBudget(selectedBudget.id, {
        limit_amount: parseFloat(selectedBudget.limit_amount),
      });
      setShowEditModal(false);
      setSelectedBudget(null);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const calculateSpent = (category) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.category === category && 
               t.type === 'debit' &&
               tDate.getMonth() === currentMonth &&
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const budgetData = budgets.map(b => ({
    ...b,
    spent: calculateSpent(b.category),
    percentage: Math.min((calculateSpent(b.category) / b.limit_amount) * 100, 100),
  }));

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);

  const chartData = {
    labels: budgetData.slice(0, 5).map(b => b.category.substring(0, 6)),
    datasets: [{
      data: budgetData.slice(0, 5).map(b => b.spent),
    }],
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    return theme.colors.primary;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.overviewTitle}>Monthly Budget</Text>
            <View style={styles.overviewAmount}>
              <Text style={styles.spentAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
              <Text style={styles.totalAmount}> / ₹{totalBudget.toLocaleString('en-IN')}</Text>
            </View>
            <ProgressBar 
              progress={totalBudget > 0 ? totalSpent / totalBudget : 0} 
              color={getStatusColor((totalSpent / totalBudget) * 100)}
              style={styles.overviewProgress}
            />
            <Text style={styles.overviewStatus}>
              {totalBudget > totalSpent 
                ? `₹${(totalBudget - totalSpent).toLocaleString('en-IN')} remaining`
                : `₹${(totalSpent - totalBudget).toLocaleString('en-IN')} over budget`
              }
            </Text>
          </Card.Content>
        </Card>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            buttons={[
              { value: 'list', label: 'List', icon: 'format-list-bulleted' },
              { value: 'chart', label: 'Chart', icon: 'chart-bar' },
            ]}
          />
        </View>

        {/* Chart View */}
        {viewMode === 'chart' && budgetData.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text style={styles.chartTitle}>Spending by Category</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
              />
            </Card.Content>
          </Card>
        )}

        {/* Budget List */}
        {viewMode === 'list' && (
          <View style={styles.budgetList}>
            {budgetData.map(budget => (
              <Card 
                key={budget.id} 
                style={styles.budgetCard}
                onPress={() => {
                  setSelectedBudget(budget);
                  setShowEditModal(true);
                }}
              >
                <Card.Content>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <View style={styles.categoryRow}>
                        <MaterialCommunityIcons 
                          name={BUDGET_CATEGORIES.find(c => c.key === budget.category)?.icon || 'cash'}
                          size={20}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.budgetCategory}>{budget.category}</Text>
                      </View>
                      <Text style={styles.budgetPeriod}>{budget.period}</Text>
                    </View>
                    {budget.percentage >= 80 && (
                      <MaterialCommunityIcons 
                        name="alert" 
                        size={24} 
                        color={budget.percentage >= 100 ? '#F44336' : '#FF9800'} 
                      />
                    )}
                  </View>

                  <View style={styles.budgetProgress}>
                    <ProgressBar 
                      progress={budget.percentage / 100} 
                      color={getStatusColor(budget.percentage)}
                      style={styles.progressBar}
                    />
                  </View>

                  <View style={styles.budgetFooter}>
                    <Text style={styles.budgetSpent}>
                      ₹{budget.spent.toLocaleString('en-IN')} spent
                    </Text>
                    <Text style={styles.budgetLimit}>
                      ₹{budget.limit_amount.toLocaleString('en-IN')} limit
                    </Text>
                  </View>

                  {budget.percentage >= 100 && (
                    <View style={styles.overBudgetWarning}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color="#F44336" />
                      <Text style={styles.overBudgetText}>
                        Over budget by ₹{(budget.spent - budget.limit_amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}

            {budgetData.length === 0 && (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons 
                    name="piggy-bank-outline" 
                    size={48} 
                    color={theme.colors.gray400} 
                  />
                  <Text style={styles.emptyText}>No budgets set up yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create budgets to track your spending by category
                  </Text>
                  <Button 
                    mode="contained" 
                    onPress={() => setShowAddModal(true)}
                    style={styles.emptyButton}
                  >
                    Create Your First Budget
                  </Button>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {/* AI Suggestions */}
        {suggestions && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>AI Budget Recommendations</Text>
            <Card style={styles.suggestionCard}>
              <Card.Content>
                <View style={styles.suggestionHeader}>
                  <MaterialCommunityIcons name="robot" size={24} color={theme.colors.secondary} />
                  <Text style={styles.suggestionTitle}>Smart Budget Plan</Text>
                </View>
                
                <Text style={styles.suggestionDesc}>{suggestions.summary}</Text>
                
                {suggestions.recommendations?.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationRow}>
                      <Text style={styles.recommendationCategory}>{rec.category}</Text>
                      <Text style={styles.recommendationAmount}>
                        ₹{rec.suggestedLimit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.recommendationReason}>{rec.reason}</Text>
                  </View>
                ))}
                
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    // Apply all suggestions
                    suggestions.recommendations?.forEach(rec => {
                      addBudget({
                        category: rec.category,
                        limit_amount: rec.suggestedLimit,
                        period: 'monthly',
                      });
                    });
                  }}
                  style={styles.applySuggestionsButton}
                  icon="check-all"
                >
                  Apply All Recommendations
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Budget FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add Budget Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Create Budget</Text>
          
          <Text style={styles.inputLabel}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {BUDGET_CATEGORIES.map(cat => (
              <Chip
                key={cat.key}
                selected={newBudget.category === cat.key}
                onPress={() => setNewBudget(prev => ({ ...prev, category: cat.key }))}
                style={styles.categoryChip}
                icon={cat.icon}
              >
                {cat.label}
              </Chip>
            ))}
          </View>

          <TextInput
            label="Monthly Limit (₹)"
            value={newBudget.limit_amount}
            onChangeText={(v) => setNewBudget(prev => ({ ...prev, limit_amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateBudget}>
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit Budget Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Edit Budget</Text>
          <Text style={styles.modalSubtitle}>{selectedBudget?.category}</Text>

          <TextInput
            label="Monthly Limit (₹)"
            value={selectedBudget?.limit_amount?.toString() || ''}
            onChangeText={(v) => setSelectedBudget(prev => ({ ...prev, limit_amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleUpdateBudget}>
              Save Changes
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overviewCard: {
    margin: spacing.md,
    borderRadius: 16,
    backgroundColor: '#fff',
    ...shadows.medium,
  },
  overviewTitle: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  overviewAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: 18,
    color: theme.colors.gray500,
  },
  overviewProgress: {
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.sm,
  },
  overviewStatus: {
    fontSize: 14,
    color: theme.colors.gray600,
  },
  viewToggle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  chartCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  budgetList: {
    paddingHorizontal: spacing.md,
  },
  budgetCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...shadows.small,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
    textTransform: 'capitalize',
  },
  budgetPeriod: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginLeft: 28,
    textTransform: 'capitalize',
  },
  budgetProgress: {
    marginVertical: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  budgetLimit: {
    fontSize: 14,
    color: theme.colors.gray500,
  },
  overBudgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  overBudgetText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: spacing.xs,
  },
  emptyCard: {
    marginVertical: spacing.lg,
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray500,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyButton: {
    marginTop: spacing.lg,
  },
  suggestionsSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  suggestionCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  suggestionDesc: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.md,
  },
  recommendationItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  recommendationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  recommendationAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  recommendationReason: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  applySuggestionsButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: theme.colors.primary,
  },
  modal: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginBottom: spacing.xs,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
=======
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Card, FAB, ProgressBar, IconButton, Portal, Modal, Button, TextInput, Chip, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { BarChart } from '../components/Charts';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

const BUDGET_CATEGORIES = [
  { key: 'groceries', label: 'Groceries', icon: 'cart' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping' },
  { key: 'food', label: 'Food & Dining', icon: 'food' },
  { key: 'transport', label: 'Transport', icon: 'car' },
  { key: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { key: 'utilities', label: 'Utilities', icon: 'flash' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'repeat' },
  { key: 'healthcare', label: 'Healthcare', icon: 'hospital' },
];

export default function BudgetScreen({ navigation }) {
  const { budgets, transactions, fetchBudgets, addBudget, updateBudget, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [newBudget, setNewBudget] = useState({
    category: '',
    limit_amount: '',
    period: 'monthly',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchBudgets();
    try {
      const budgetSuggestions = await api.getBudgetSuggestions();
      setSuggestions(budgetSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateBudget = async () => {
    if (!newBudget.category || !newBudget.limit_amount) return;

    try {
      await addBudget({
        ...newBudget,
        limit_amount: parseFloat(newBudget.limit_amount),
      });
      setShowAddModal(false);
      setNewBudget({ category: '', limit_amount: '', period: 'monthly' });
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleUpdateBudget = async () => {
    if (!selectedBudget) return;

    try {
      await updateBudget(selectedBudget.id, {
        limit_amount: parseFloat(selectedBudget.limit_amount),
      });
      setShowEditModal(false);
      setSelectedBudget(null);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const calculateSpent = (category) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.category === category && 
               t.type === 'debit' &&
               tDate.getMonth() === currentMonth &&
               tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const budgetData = budgets.map(b => ({
    ...b,
    spent: calculateSpent(b.category),
    percentage: Math.min((calculateSpent(b.category) / b.limit_amount) * 100, 100),
  }));

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit_amount, 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0);

  const chartData = {
    labels: budgetData.slice(0, 5).map(b => b.category.substring(0, 6)),
    datasets: [{
      data: budgetData.slice(0, 5).map(b => b.spent),
    }],
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    return theme.colors.primary;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Overview */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.overviewTitle}>Monthly Budget</Text>
            <View style={styles.overviewAmount}>
              <Text style={styles.spentAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
              <Text style={styles.totalAmount}> / ₹{totalBudget.toLocaleString('en-IN')}</Text>
            </View>
            <ProgressBar 
              progress={totalBudget > 0 ? totalSpent / totalBudget : 0} 
              color={getStatusColor((totalSpent / totalBudget) * 100)}
              style={styles.overviewProgress}
            />
            <Text style={styles.overviewStatus}>
              {totalBudget > totalSpent 
                ? `₹${(totalBudget - totalSpent).toLocaleString('en-IN')} remaining`
                : `₹${(totalSpent - totalBudget).toLocaleString('en-IN')} over budget`
              }
            </Text>
          </Card.Content>
        </Card>

        {/* View Toggle */}
        <View style={styles.viewToggle}>
          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            buttons={[
              { value: 'list', label: 'List', icon: 'format-list-bulleted' },
              { value: 'chart', label: 'Chart', icon: 'chart-bar' },
            ]}
          />
        </View>

        {/* Chart View */}
        {viewMode === 'chart' && budgetData.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Text style={styles.chartTitle}>Spending by Category</Text>
              <BarChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
              />
            </Card.Content>
          </Card>
        )}

        {/* Budget List */}
        {viewMode === 'list' && (
          <View style={styles.budgetList}>
            {budgetData.map(budget => (
              <Card 
                key={budget.id} 
                style={styles.budgetCard}
                onPress={() => {
                  setSelectedBudget(budget);
                  setShowEditModal(true);
                }}
              >
                <Card.Content>
                  <View style={styles.budgetHeader}>
                    <View style={styles.budgetInfo}>
                      <View style={styles.categoryRow}>
                        <MaterialCommunityIcons 
                          name={BUDGET_CATEGORIES.find(c => c.key === budget.category)?.icon || 'cash'}
                          size={20}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.budgetCategory}>{budget.category}</Text>
                      </View>
                      <Text style={styles.budgetPeriod}>{budget.period}</Text>
                    </View>
                    {budget.percentage >= 80 && (
                      <MaterialCommunityIcons 
                        name="alert" 
                        size={24} 
                        color={budget.percentage >= 100 ? '#F44336' : '#FF9800'} 
                      />
                    )}
                  </View>

                  <View style={styles.budgetProgress}>
                    <ProgressBar 
                      progress={budget.percentage / 100} 
                      color={getStatusColor(budget.percentage)}
                      style={styles.progressBar}
                    />
                  </View>

                  <View style={styles.budgetFooter}>
                    <Text style={styles.budgetSpent}>
                      ₹{budget.spent.toLocaleString('en-IN')} spent
                    </Text>
                    <Text style={styles.budgetLimit}>
                      ₹{budget.limit_amount.toLocaleString('en-IN')} limit
                    </Text>
                  </View>

                  {budget.percentage >= 100 && (
                    <View style={styles.overBudgetWarning}>
                      <MaterialCommunityIcons name="alert-circle" size={14} color="#F44336" />
                      <Text style={styles.overBudgetText}>
                        Over budget by ₹{(budget.spent - budget.limit_amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}

            {budgetData.length === 0 && (
              <Card style={styles.emptyCard}>
                <Card.Content style={styles.emptyContent}>
                  <MaterialCommunityIcons 
                    name="piggy-bank-outline" 
                    size={48} 
                    color={theme.colors.gray400} 
                  />
                  <Text style={styles.emptyText}>No budgets set up yet</Text>
                  <Text style={styles.emptySubtext}>
                    Create budgets to track your spending by category
                  </Text>
                  <Button 
                    mode="contained" 
                    onPress={() => setShowAddModal(true)}
                    style={styles.emptyButton}
                  >
                    Create Your First Budget
                  </Button>
                </Card.Content>
              </Card>
            )}
          </View>
        )}

        {/* AI Suggestions */}
        {suggestions && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.sectionTitle}>AI Budget Recommendations</Text>
            <Card style={styles.suggestionCard}>
              <Card.Content>
                <View style={styles.suggestionHeader}>
                  <MaterialCommunityIcons name="robot" size={24} color={theme.colors.secondary} />
                  <Text style={styles.suggestionTitle}>Smart Budget Plan</Text>
                </View>
                
                <Text style={styles.suggestionDesc}>{suggestions.summary}</Text>
                
                {suggestions.recommendations?.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={styles.recommendationRow}>
                      <Text style={styles.recommendationCategory}>{rec.category}</Text>
                      <Text style={styles.recommendationAmount}>
                        ₹{rec.suggestedLimit.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.recommendationReason}>{rec.reason}</Text>
                  </View>
                ))}
                
                <Button 
                  mode="outlined" 
                  onPress={() => {
                    // Apply all suggestions
                    suggestions.recommendations?.forEach(rec => {
                      addBudget({
                        category: rec.category,
                        limit_amount: rec.suggestedLimit,
                        period: 'monthly',
                      });
                    });
                  }}
                  style={styles.applySuggestionsButton}
                  icon="check-all"
                >
                  Apply All Recommendations
                </Button>
              </Card.Content>
            </Card>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Budget FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add Budget Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Create Budget</Text>
          
          <Text style={styles.inputLabel}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {BUDGET_CATEGORIES.map(cat => (
              <Chip
                key={cat.key}
                selected={newBudget.category === cat.key}
                onPress={() => setNewBudget(prev => ({ ...prev, category: cat.key }))}
                style={styles.categoryChip}
                icon={cat.icon}
              >
                {cat.label}
              </Chip>
            ))}
          </View>

          <TextInput
            label="Monthly Limit (₹)"
            value={newBudget.limit_amount}
            onChangeText={(v) => setNewBudget(prev => ({ ...prev, limit_amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateBudget}>
              Create
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Edit Budget Modal */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Edit Budget</Text>
          <Text style={styles.modalSubtitle}>{selectedBudget?.category}</Text>

          <TextInput
            label="Monthly Limit (₹)"
            value={selectedBudget?.limit_amount?.toString() || ''}
            onChangeText={(v) => setSelectedBudget(prev => ({ ...prev, limit_amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleUpdateBudget}>
              Save Changes
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overviewCard: {
    margin: spacing.md,
    borderRadius: 16,
    backgroundColor: '#fff',
    ...shadows.medium,
  },
  overviewTitle: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  overviewAmount: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  spentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: 18,
    color: theme.colors.gray500,
  },
  overviewProgress: {
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.sm,
  },
  overviewStatus: {
    fontSize: 14,
    color: theme.colors.gray600,
  },
  viewToggle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  chartCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  budgetList: {
    paddingHorizontal: spacing.md,
  },
  budgetCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...shadows.small,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetInfo: {
    flex: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
    textTransform: 'capitalize',
  },
  budgetPeriod: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginLeft: 28,
    textTransform: 'capitalize',
  },
  budgetProgress: {
    marginVertical: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  budgetLimit: {
    fontSize: 14,
    color: theme.colors.gray500,
  },
  overBudgetWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  overBudgetText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: spacing.xs,
  },
  emptyCard: {
    marginVertical: spacing.lg,
    borderRadius: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray500,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  emptyButton: {
    marginTop: spacing.lg,
  },
  suggestionsSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  suggestionCard: {
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  suggestionDesc: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.md,
  },
  recommendationItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  recommendationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    textTransform: 'capitalize',
  },
  recommendationAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  recommendationReason: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  applySuggestionsButton: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: theme.colors.primary,
  },
  modal: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.md,
    textTransform: 'capitalize',
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginBottom: spacing.xs,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
