<<<<<<< HEAD
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, shadows, spacing } from '../theme';

export const BalanceCard = ({ totalBalance, income, expenses, savingsRate }) => {
  return (
    <Card style={styles.balanceCard}>
      <View style={styles.balanceContent}>
        <View style={styles.balanceHeader}>
          <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
          <Text style={styles.balanceLabel}>Total Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          ₹{(totalBalance || 0).toLocaleString('en-IN')}
        </Text>
        
        <View style={styles.balanceStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="arrow-down" size={16} color="#4CAF50" />
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>₹{(income || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="arrow-up" size={16} color="#F44336" />
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>₹{(expenses || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="piggy-bank" size={16} color="#FF9800" />
            <Text style={styles.statLabel}>Savings</Text>
            <Text style={styles.statValue}>{savingsRate || 0}%</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

export const GoalCard = ({ goal, onPress }) => {
  const progress = goal.current_amount / goal.target_amount;
  const remaining = goal.target_amount - goal.current_amount;
  
  return (
    <Card style={styles.goalCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.goalHeader}>
          <MaterialCommunityIcons name="target" size={20} color={theme.colors.primary} />
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalPriority}>{goal.priority}</Text>
        </View>
        
        <View style={styles.goalProgress}>
          <ProgressBar 
            progress={progress} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>{(progress * 100).toFixed(1)}%</Text>
        </View>
        
        <View style={styles.goalFooter}>
          <Text style={styles.goalAmount}>
            ₹{goal.current_amount.toLocaleString('en-IN')} / ₹{goal.target_amount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.goalRemaining}>
            ₹{remaining.toLocaleString('en-IN')} to go
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export const TransactionItem = ({ transaction, onPress }) => {
  const isCredit = transaction.type === 'credit';
  
  const getCategoryIcon = (category) => {
    const icons = {
      'Groceries': 'cart',
      'Shopping': 'shopping',
      'Food & Dining': 'food',
      'Transportation': 'car',
      'Entertainment': 'movie',
      'Bills & Utilities': 'file-document',
      'Subscriptions': 'refresh',
      'EMI': 'bank',
      'Healthcare': 'hospital',
      'Education': 'school',
      'Investments': 'trending-up',
      'Income': 'cash-plus',
      'Salary': 'briefcase',
      'Other': 'dots-horizontal',
    };
    return icons[category] || 'cash';
  };
  
  return (
    <Card style={styles.transactionCard} onPress={onPress}>
      <View style={styles.transactionContent}>
        <View style={[styles.transactionIcon, { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' }]}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(transaction.category)}
            size={20}
            color={isCredit ? '#4CAF50' : '#F44336'}
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {transaction.merchant_name || transaction.description || 'Transaction'}
          </Text>
          <Text style={styles.transactionCategory}>{transaction.category || 'Other'}</Text>
        </View>
        
        <Text style={[styles.transactionAmount, { color: isCredit ? '#4CAF50' : '#F44336' }]}>
          {isCredit ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
        </Text>
      </View>
    </Card>
  );
};

export const InsightCard = ({ insight, onPress }) => {
  const getPriorityColor = (priority) => {
    const colors = { high: '#F44336', medium: '#FF9800', low: '#4CAF50' };
    return colors[priority] || colors.medium;
  };
  
  const getInsightIcon = (type) => {
    const icons = {
      'overspending': 'alert-circle',
      'savings_alert': 'piggy-bank',
      'savings_positive': 'check-circle',
      'top_spending': 'chart-pie',
      'goal': 'target',
      'investment': 'trending-up',
    };
    return icons[type] || 'lightbulb';
  };
  
  return (
    <Card style={styles.insightCard} onPress={onPress}>
      <View style={styles.insightContent}>
        <View style={[styles.insightIconContainer, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
          <MaterialCommunityIcons 
            name={getInsightIcon(insight.insight_type || insight.type)}
            size={24}
            color={getPriorityColor(insight.priority)}
          />
        </View>
        <View style={styles.insightText}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightDescription} numberOfLines={2}>
            {insight.description}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.gray400} />
      </View>
    </Card>
  );
};

export const BudgetCard = ({ budget }) => {
  const usage = budget.current_spent / budget.monthly_limit;
  const isOverBudget = usage >= 1;
  const isWarning = usage >= 0.8 && usage < 1;
  
  return (
    <Card style={styles.budgetCard}>
      <Card.Content>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetCategory}>{budget.category}</Text>
          <Text style={[
            styles.budgetUsage,
            isOverBudget && styles.overBudget,
            isWarning && styles.warningBudget,
          ]}>
            {(usage * 100).toFixed(0)}%
          </Text>
        </View>
        
        <ProgressBar 
          progress={Math.min(usage, 1)} 
          color={isOverBudget ? '#F44336' : isWarning ? '#FF9800' : theme.colors.primary}
          style={styles.budgetProgress}
        />
        
        <View style={styles.budgetFooter}>
          <Text style={styles.budgetSpent}>
            ₹{budget.current_spent.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.budgetLimit}>
            of ₹{budget.monthly_limit.toLocaleString('en-IN')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export const QuickActionButton = ({ icon, label, onPress, color }) => (
  <Card style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionContent}>
      <View style={[styles.quickActionIcon, { backgroundColor: (color || theme.colors.primary) + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color || theme.colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  // Balance Card
  balanceCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.large,
  },
  balanceContent: {
    padding: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  // Goal Card
  goalCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
    color: theme.colors.text,
  },
  goalPriority: {
    fontSize: 12,
    color: theme.colors.gray500,
    textTransform: 'capitalize',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalAmount: {
    fontSize: 14,
    color: theme.colors.text,
  },
  goalRemaining: {
    fontSize: 12,
    color: theme.colors.gray500,
  },

  // Transaction Item
  transactionCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  transactionCategory: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Insight Card
  insightCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  insightDescription: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },

  // Budget Card
  budgetCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  budgetUsage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  overBudget: {
    color: '#F44336',
  },
  warningBudget: {
    color: '#FF9800',
  },
  budgetProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  budgetLimit: {
    fontSize: 12,
    color: theme.colors.gray500,
  },

  // Quick Action
  quickAction: {
    borderRadius: 12,
    width: 80,
    marginRight: spacing.md,
    ...shadows.small,
  },
  quickActionContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: 11,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
=======
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme, shadows, spacing } from '../theme';

export const BalanceCard = ({ totalBalance, income, expenses, savingsRate }) => {
  return (
    <Card style={styles.balanceCard}>
      <View style={styles.balanceContent}>
        <View style={styles.balanceHeader}>
          <MaterialCommunityIcons name="wallet" size={24} color="#fff" />
          <Text style={styles.balanceLabel}>Total Balance</Text>
        </View>
        <Text style={styles.balanceAmount}>
          ₹{(totalBalance || 0).toLocaleString('en-IN')}
        </Text>
        
        <View style={styles.balanceStats}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="arrow-down" size={16} color="#4CAF50" />
            <Text style={styles.statLabel}>Income</Text>
            <Text style={styles.statValue}>₹{(income || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="arrow-up" size={16} color="#F44336" />
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={styles.statValue}>₹{(expenses || 0).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="piggy-bank" size={16} color="#FF9800" />
            <Text style={styles.statLabel}>Savings</Text>
            <Text style={styles.statValue}>{savingsRate || 0}%</Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

export const GoalCard = ({ goal, onPress }) => {
  const progress = goal.current_amount / goal.target_amount;
  const remaining = goal.target_amount - goal.current_amount;
  
  return (
    <Card style={styles.goalCard} onPress={onPress}>
      <Card.Content>
        <View style={styles.goalHeader}>
          <MaterialCommunityIcons name="target" size={20} color={theme.colors.primary} />
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalPriority}>{goal.priority}</Text>
        </View>
        
        <View style={styles.goalProgress}>
          <ProgressBar 
            progress={progress} 
            color={theme.colors.primary}
            style={styles.progressBar}
          />
          <Text style={styles.progressText}>{(progress * 100).toFixed(1)}%</Text>
        </View>
        
        <View style={styles.goalFooter}>
          <Text style={styles.goalAmount}>
            ₹{goal.current_amount.toLocaleString('en-IN')} / ₹{goal.target_amount.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.goalRemaining}>
            ₹{remaining.toLocaleString('en-IN')} to go
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export const TransactionItem = ({ transaction, onPress }) => {
  const isCredit = transaction.type === 'credit';
  
  const getCategoryIcon = (category) => {
    const icons = {
      'Groceries': 'cart',
      'Shopping': 'shopping',
      'Food & Dining': 'food',
      'Transportation': 'car',
      'Entertainment': 'movie',
      'Bills & Utilities': 'file-document',
      'Subscriptions': 'refresh',
      'EMI': 'bank',
      'Healthcare': 'hospital',
      'Education': 'school',
      'Investments': 'trending-up',
      'Income': 'cash-plus',
      'Salary': 'briefcase',
      'Other': 'dots-horizontal',
    };
    return icons[category] || 'cash';
  };
  
  return (
    <Card style={styles.transactionCard} onPress={onPress}>
      <View style={styles.transactionContent}>
        <View style={[styles.transactionIcon, { backgroundColor: isCredit ? '#E8F5E9' : '#FFEBEE' }]}>
          <MaterialCommunityIcons 
            name={getCategoryIcon(transaction.category)}
            size={20}
            color={isCredit ? '#4CAF50' : '#F44336'}
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionTitle}>
            {transaction.merchant_name || transaction.description || 'Transaction'}
          </Text>
          <Text style={styles.transactionCategory}>{transaction.category || 'Other'}</Text>
        </View>
        
        <Text style={[styles.transactionAmount, { color: isCredit ? '#4CAF50' : '#F44336' }]}>
          {isCredit ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
        </Text>
      </View>
    </Card>
  );
};

export const InsightCard = ({ insight, onPress }) => {
  const getPriorityColor = (priority) => {
    const colors = { high: '#F44336', medium: '#FF9800', low: '#4CAF50' };
    return colors[priority] || colors.medium;
  };
  
  const getInsightIcon = (type) => {
    const icons = {
      'overspending': 'alert-circle',
      'savings_alert': 'piggy-bank',
      'savings_positive': 'check-circle',
      'top_spending': 'chart-pie',
      'goal': 'target',
      'investment': 'trending-up',
    };
    return icons[type] || 'lightbulb';
  };
  
  return (
    <Card style={styles.insightCard} onPress={onPress}>
      <View style={styles.insightContent}>
        <View style={[styles.insightIconContainer, { backgroundColor: getPriorityColor(insight.priority) + '20' }]}>
          <MaterialCommunityIcons 
            name={getInsightIcon(insight.insight_type || insight.type)}
            size={24}
            color={getPriorityColor(insight.priority)}
          />
        </View>
        <View style={styles.insightText}>
          <Text style={styles.insightTitle}>{insight.title}</Text>
          <Text style={styles.insightDescription} numberOfLines={2}>
            {insight.description}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.gray400} />
      </View>
    </Card>
  );
};

export const BudgetCard = ({ budget }) => {
  const usage = budget.current_spent / budget.monthly_limit;
  const isOverBudget = usage >= 1;
  const isWarning = usage >= 0.8 && usage < 1;
  
  return (
    <Card style={styles.budgetCard}>
      <Card.Content>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetCategory}>{budget.category}</Text>
          <Text style={[
            styles.budgetUsage,
            isOverBudget && styles.overBudget,
            isWarning && styles.warningBudget,
          ]}>
            {(usage * 100).toFixed(0)}%
          </Text>
        </View>
        
        <ProgressBar 
          progress={Math.min(usage, 1)} 
          color={isOverBudget ? '#F44336' : isWarning ? '#FF9800' : theme.colors.primary}
          style={styles.budgetProgress}
        />
        
        <View style={styles.budgetFooter}>
          <Text style={styles.budgetSpent}>
            ₹{budget.current_spent.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.budgetLimit}>
            of ₹{budget.monthly_limit.toLocaleString('en-IN')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export const QuickActionButton = ({ icon, label, onPress, color }) => (
  <Card style={styles.quickAction} onPress={onPress}>
    <View style={styles.quickActionContent}>
      <View style={[styles.quickActionIcon, { backgroundColor: (color || theme.colors.primary) + '20' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color || theme.colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  // Balance Card
  balanceCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    ...shadows.large,
  },
  balanceContent: {
    padding: spacing.lg,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  balanceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },

  // Goal Card
  goalCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
    color: theme.colors.text,
  },
  goalPriority: {
    fontSize: 12,
    color: theme.colors.gray500,
    textTransform: 'capitalize',
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalAmount: {
    fontSize: 14,
    color: theme.colors.text,
  },
  goalRemaining: {
    fontSize: 12,
    color: theme.colors.gray500,
  },

  // Transaction Item
  transactionCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionDetails: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  transactionCategory: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Insight Card
  insightCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  insightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  insightDescription: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },

  // Budget Card
  budgetCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  budgetUsage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  overBudget: {
    color: '#F44336',
  },
  warningBudget: {
    color: '#FF9800',
  },
  budgetProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  budgetLimit: {
    fontSize: 12,
    color: theme.colors.gray500,
  },

  // Quick Action
  quickAction: {
    borderRadius: 12,
    width: 80,
    marginRight: spacing.md,
    ...shadows.small,
  },
  quickActionContent: {
    alignItems: 'center',
    padding: spacing.md,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  quickActionLabel: {
    fontSize: 11,
    color: theme.colors.text,
    textAlign: 'center',
  },
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
