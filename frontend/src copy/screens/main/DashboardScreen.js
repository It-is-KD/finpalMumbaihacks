import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  IconButton,
  Surface,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const screenWidth = Dimensions.get('window').width;

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [nudges, setNudges] = useState([]);

  const fetchDashboard = async () => {
    try {
      const [dashboard, nudgesData] = await Promise.all([
        api.users.getDashboard(),
        api.agent.getNudges().catch(() => ({ nudges: [] })),
      ]);
      setDashboardData(dashboard);
      setNudges(nudgesData.nudges || []);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    color: (opacity = 1) => `rgba(29, 137, 115, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  const pieData = dashboardData?.categorySpending?.slice(0, 5).map((item, index) => ({
    name: item.category?.substring(0, 10) || 'Other',
    amount: parseFloat(item.total) || 0,
    color: [colors.primary, colors.secondary, '#FF6384', '#36A2EB', '#FFCE56'][index],
    legendFontColor: colors.text,
    legendFontSize: 12,
  })) || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
      </View>

      {/* Balance Card */}
      <Card style={styles.balanceCard} mode="elevated">
        <Card.Content>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            {formatCurrency(dashboardData?.totalBalance)}
          </Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.incomeBox}>
              <MaterialCommunityIcons name="arrow-down" size={20} color={colors.success} />
              <Text style={styles.incomeExpenseLabel}>Income</Text>
              <Text style={styles.incomeAmount}>
                {formatCurrency(dashboardData?.monthlyIncome)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.expenseBox}>
              <MaterialCommunityIcons name="arrow-up" size={20} color={colors.error} />
              <Text style={styles.incomeExpenseLabel}>Expenses</Text>
              <Text style={styles.expenseAmount}>
                {formatCurrency(dashboardData?.monthlyExpenses)}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Surface style={styles.actionButton} elevation={2}>
          <IconButton
            icon="plus"
            size={24}
            iconColor={colors.primary}
            onPress={() => navigation.navigate('AddTransaction')}
          />
          <Text style={styles.actionLabel}>Add</Text>
        </Surface>
        <Surface style={styles.actionButton} elevation={2}>
          <IconButton
            icon="robot"
            size={24}
            iconColor={colors.primary}
            onPress={() => navigation.navigate('Chat')}
          />
          <Text style={styles.actionLabel}>Chat</Text>
        </Surface>
        <Surface style={styles.actionButton} elevation={2}>
          <IconButton
            icon="chart-pie"
            size={24}
            iconColor={colors.primary}
            onPress={() => navigation.navigate('Analytics')}
          />
          <Text style={styles.actionLabel}>Analytics</Text>
        </Surface>
        <Surface style={styles.actionButton} elevation={2}>
          <IconButton
            icon="cash-multiple"
            size={24}
            iconColor={colors.primary}
            onPress={() => navigation.navigate('Investments')}
          />
          <Text style={styles.actionLabel}>Invest</Text>
        </Surface>
      </View>

      {/* AI Nudges */}
      {nudges.length > 0 && (
        <Card style={styles.nudgeCard} mode="outlined">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>AI Insights</Text>
            </View>
            {nudges.slice(0, 2).map((nudge, index) => (
              <View key={index} style={styles.nudgeItem}>
                <Text style={styles.nudgeMessage}>{nudge.message}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Spending by Category */}
      {pieData.length > 0 && (
        <Card style={styles.chartCard} mode="elevated">
          <Card.Content>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            <PieChart
              data={pieData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              absolute
            />
          </Card.Content>
        </Card>
      )}

      {/* Active Goals */}
      {dashboardData?.goals?.length > 0 && (
        <Card style={styles.goalsCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Active Goals</Text>
              <Button
                mode="text"
                compact
                onPress={() => navigation.navigate('Goals')}
              >
                See All
              </Button>
            </View>
            {dashboardData.goals.slice(0, 2).map((goal) => {
              const progress = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
              return (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalName}>{goal.name}</Text>
                    <Text style={styles.goalProgress}>{progress.toFixed(0)}%</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
                  </View>
                  <Text style={styles.goalAmount}>
                    {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                  </Text>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card style={styles.transactionsCard} mode="elevated">
        <Card.Content>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Button
              mode="text"
              compact
              onPress={() => navigation.navigate('Transactions')}
            >
              See All
            </Button>
          </View>
          {dashboardData?.recentTransactions?.slice(0, 5).map((tx) => (
            <View key={tx.id} style={styles.transactionItem}>
              <View style={styles.transactionIcon}>
                <MaterialCommunityIcons
                  name={tx.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                  size={20}
                  color={tx.type === 'credit' ? colors.success : colors.error}
                />
              </View>
              <View style={styles.transactionInfo}>
                <Text style={styles.transactionMerchant}>
                  {tx.merchant_name || tx.description || tx.category}
                </Text>
                <Text style={styles.transactionCategory}>{tx.category}</Text>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: tx.type === 'credit' ? colors.success : colors.error },
                ]}
              >
                {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
              </Text>
            </View>
          ))}
          {(!dashboardData?.recentTransactions || dashboardData.recentTransactions.length === 0) && (
            <Text style={styles.emptyText}>No transactions yet</Text>
          )}
        </Card.Content>
      </Card>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  welcomeSection: {
    marginBottom: spacing.md,
  },
  welcomeText: {
    fontSize: 16,
    color: colors.gray,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balanceAmount: {
    color: colors.white,
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: spacing.sm,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  incomeBox: {
    flex: 1,
    alignItems: 'center',
  },
  expenseBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  incomeExpenseLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  incomeAmount: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  expenseAmount: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.white,
    width: (screenWidth - 48) / 4 - 8,
  },
  actionLabel: {
    fontSize: 12,
    color: colors.text,
    marginTop: -spacing.sm,
  },
  nudgeCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  nudgeItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  nudgeMessage: {
    fontSize: 14,
    color: colors.text,
  },
  chartCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  goalsCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalItem: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  goalAmount: {
    fontSize: 12,
    color: colors.gray,
  },
  transactionsCard: {
    backgroundColor: colors.white,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  transactionCategory: {
    fontSize: 12,
    color: colors.gray,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray,
    paddingVertical: spacing.md,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});

export default DashboardScreen;
