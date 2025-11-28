import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  ProgressBar,
  FAB,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  Menu,
  Divider,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const categories = [
  { name: 'Food & Dining', icon: 'food', color: '#FF6B6B' },
  { name: 'Shopping', icon: 'shopping', color: '#4ECDC4' },
  { name: 'Groceries', icon: 'cart', color: '#45B7D1' },
  { name: 'Transportation', icon: 'car', color: '#96CEB4' },
  { name: 'Subscriptions', icon: 'refresh', color: '#9B59B6' },
  { name: 'Entertainment', icon: 'movie', color: '#F39C12' },
  { name: 'Healthcare', icon: 'hospital', color: '#E74C3C' },
  { name: 'Education', icon: 'school', color: '#3498DB' },
  { name: 'Bills & Utilities', icon: 'flash', color: '#1ABC9C' },
  { name: 'EMI', icon: 'credit-card', color: '#E67E22' },
  { name: 'Other', icon: 'dots-horizontal', color: '#95A5A6' },
];

const BudgetScreen = ({ navigation }) => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  // Form state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await api.budgets.getAll();
      setBudgets(response.budgets || []);
    } catch (error) {
      console.error('Fetch budgets error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgets();
  };

  const handleAddBudget = async () => {
    if (!selectedCategory) {
      setFormError('Please select a category');
      return;
    }
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      setFormError('Please enter a valid amount');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.budgets.create({
        category: selectedCategory,
        amount: parseFloat(budgetAmount),
        period: 'monthly',
      });

      setSelectedCategory('');
      setBudgetAmount('');
      setAddDialogVisible(false);
      fetchBudgets();
    } catch (error) {
      setFormError(error.message || 'Failed to create budget');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      await api.budgets.delete(budgetId);
      fetchBudgets();
    } catch (error) {
      console.error('Delete budget error:', error);
    }
  };

  const getCategoryInfo = (categoryName) => {
    return categories.find(c => c.name === categoryName) || {
      name: categoryName,
      icon: 'tag',
      color: colors.gray,
    };
  };

  const getTotalBudget = () => {
    return budgets.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  };

  const getTotalSpent = () => {
    return budgets.reduce((sum, b) => sum + parseFloat(b.spent || 0), 0);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const totalBudget = getTotalBudget();
  const totalSpent = getTotalSpent();
  const overallProgress = totalBudget > 0 ? Math.min(totalSpent / totalBudget, 1) : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Overall Budget Card */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.overviewTitle}>Monthly Budget Overview</Text>
            
            <View style={styles.overviewAmounts}>
              <View>
                <Text style={styles.amountLabel}>Spent</Text>
                <Text style={styles.spentAmount}>
                  ₹{totalSpent.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.overviewDivider} />
              <View>
                <Text style={styles.amountLabel}>Budget</Text>
                <Text style={styles.budgetAmount}>
                  ₹{totalBudget.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            <ProgressBar
              progress={overallProgress}
              color={overallProgress > 0.9 ? colors.error : overallProgress > 0.75 ? colors.warning : colors.primary}
              style={styles.overallProgress}
            />
            
            <Text style={styles.remainingText}>
              ₹{Math.max(totalBudget - totalSpent, 0).toLocaleString('en-IN')} remaining
            </Text>
          </Card.Content>
        </Card>

        {/* Category Budgets */}
        <Text style={styles.sectionTitle}>Category Budgets</Text>

        {budgets.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <IconButton
                icon="wallet-outline"
                size={48}
                iconColor={colors.gray}
              />
              <Text style={styles.emptyTitle}>No Budgets Set</Text>
              <Text style={styles.emptyText}>
                Set budgets for different categories to track your spending
              </Text>
              <Button
                mode="contained"
                onPress={() => setAddDialogVisible(true)}
                style={styles.emptyButton}
              >
                Create Budget
              </Button>
            </Card.Content>
          </Card>
        ) : (
          budgets.map((budget) => {
            const categoryInfo = getCategoryInfo(budget.category);
            const progress = budget.amount > 0 
              ? Math.min(parseFloat(budget.spent || 0) / parseFloat(budget.amount), 1) 
              : 0;
            const isOverBudget = progress >= 1;
            const isWarning = progress >= 0.75 && progress < 1;

            return (
              <Card key={budget.id} style={styles.budgetCard}>
                <Card.Content>
                  <View style={styles.budgetHeader}>
                    <View style={styles.categoryRow}>
                      <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                        <IconButton
                          icon={categoryInfo.icon}
                          iconColor={categoryInfo.color}
                          size={20}
                          style={styles.iconButton}
                        />
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{budget.category}</Text>
                        <Text style={styles.budgetPeriod}>Monthly</Text>
                      </View>
                    </View>
                    
                    <IconButton
                      icon="delete-outline"
                      iconColor={colors.error}
                      size={20}
                      onPress={() => handleDeleteBudget(budget.id)}
                    />
                  </View>

                  <View style={styles.budgetAmounts}>
                    <Text style={[
                      styles.spentText,
                      isOverBudget && styles.overBudgetText,
                      isWarning && styles.warningText,
                    ]}>
                      ₹{parseFloat(budget.spent || 0).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.budgetText}>
                      / ₹{parseFloat(budget.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <ProgressBar
                    progress={progress}
                    color={isOverBudget ? colors.error : isWarning ? colors.warning : categoryInfo.color}
                    style={styles.budgetProgress}
                  />

                  {isOverBudget && (
                    <Text style={styles.alertText}>
                      ⚠️ Over budget by ₹{(parseFloat(budget.spent) - parseFloat(budget.amount)).toLocaleString('en-IN')}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Add Budget FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddDialogVisible(true)}
        color={colors.white}
      />

      {/* Add Budget Dialog */}
      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
        >
          <Dialog.Title>Create Budget</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogLabel}>Category</Text>
            <Menu
              visible={categoryMenuVisible}
              onDismiss={() => setCategoryMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setCategoryMenuVisible(true)}
                  style={styles.categoryButton}
                >
                  {selectedCategory || 'Select Category'}
                </Button>
              }
            >
              <ScrollView style={{ maxHeight: 300 }}>
                {categories.map((cat) => (
                  <Menu.Item
                    key={cat.name}
                    leadingIcon={cat.icon}
                    onPress={() => {
                      setSelectedCategory(cat.name);
                      setCategoryMenuVisible(false);
                    }}
                    title={cat.name}
                  />
                ))}
              </ScrollView>
            </Menu>

            <TextInput
              label="Monthly Budget (₹)"
              value={budgetAmount}
              onChangeText={setBudgetAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddBudget}
              loading={formLoading}
              disabled={formLoading}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  overviewCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  overviewTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.md,
  },
  overviewAmounts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overviewDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.lg,
  },
  amountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  spentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  budgetAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 4,
  },
  overallProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  remainingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  emptyCard: {
    backgroundColor: colors.white,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
  },
  budgetCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  iconButton: {
    margin: 0,
  },
  categoryInfo: {
    marginLeft: spacing.xs,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  budgetPeriod: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  budgetAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  spentText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  overBudgetText: {
    color: colors.error,
  },
  warningText: {
    color: colors.warning,
  },
  budgetText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  budgetProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
  },
  alertText: {
    fontSize: 13,
    color: colors.error,
    marginTop: spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  dialogLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  categoryButton: {
    marginBottom: spacing.md,
  },
  dialogInput: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});

export default BudgetScreen;
