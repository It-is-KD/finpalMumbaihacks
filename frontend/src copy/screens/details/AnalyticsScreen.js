import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  SegmentedButtons,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('month');
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.insights.getAnalytics(period);
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Fetch analytics error:', error);
      // Set mock data for display
      setAnalytics({
        totalIncome: 50000,
        totalExpenses: 35000,
        savingsRate: 30,
        topCategories: [
          { category: 'Food & Dining', amount: 8000, percentage: 22.9 },
          { category: 'Transportation', amount: 5000, percentage: 14.3 },
          { category: 'Shopping', amount: 4500, percentage: 12.9 },
          { category: 'Bills & Utilities', amount: 4000, percentage: 11.4 },
          { category: 'Entertainment', amount: 3500, percentage: 10 },
        ],
        dailyAverage: 1167,
        weeklyTrend: [
          { week: 'Week 1', amount: 8000 },
          { week: 'Week 2', amount: 9500 },
          { week: 'Week 3', amount: 7500 },
          { week: 'Week 4', amount: 10000 },
        ],
        comparisonLastPeriod: -5,
        unusualSpending: [
          { category: 'Shopping', increase: 45, message: 'Shopping expenses increased by 45% this month' },
        ],
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const getCategoryColor = (category) => {
    const categoryColors = {
      'Food & Dining': '#FF6B6B',
      'Shopping': '#4ECDC4',
      'Groceries': '#45B7D1',
      'Transportation': '#96CEB4',
      'Subscriptions': '#9B59B6',
      'Entertainment': '#F39C12',
      'Healthcare': '#E74C3C',
      'Education': '#3498DB',
      'Bills & Utilities': '#1ABC9C',
      'EMI': '#E67E22',
    };
    return categoryColors[category] || colors.gray;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        {/* Period Selector */}
        <SegmentedButtons
          value={period}
          onValueChange={setPeriod}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'quarter', label: 'Quarter' },
            { value: 'year', label: 'Year' },
          ]}
          style={styles.periodSelector}
        />

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <Card style={[styles.overviewCard, styles.incomeCard]}>
            <Card.Content>
              <IconButton
                icon="arrow-down"
                iconColor={colors.success}
                size={20}
                style={styles.overviewIcon}
              />
              <Text style={styles.overviewLabel}>Income</Text>
              <Text style={styles.overviewAmount}>
                ₹{analytics?.totalIncome?.toLocaleString('en-IN') || 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.overviewCard, styles.expenseCard]}>
            <Card.Content>
              <IconButton
                icon="arrow-up"
                iconColor={colors.error}
                size={20}
                style={styles.overviewIcon}
              />
              <Text style={styles.overviewLabel}>Expenses</Text>
              <Text style={styles.overviewAmount}>
                ₹{analytics?.totalExpenses?.toLocaleString('en-IN') || 0}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Savings Rate */}
        <Card style={styles.savingsCard}>
          <Card.Content>
            <View style={styles.savingsHeader}>
              <View>
                <Text style={styles.savingsLabel}>Savings Rate</Text>
                <Text style={styles.savingsRate}>{analytics?.savingsRate || 0}%</Text>
              </View>
              <View style={styles.comparisonBadge}>
                <IconButton
                  icon={analytics?.comparisonLastPeriod >= 0 ? 'trending-up' : 'trending-down'}
                  iconColor={analytics?.comparisonLastPeriod >= 0 ? colors.success : colors.error}
                  size={16}
                  style={styles.comparisonIcon}
                />
                <Text style={[
                  styles.comparisonText,
                  { color: analytics?.comparisonLastPeriod >= 0 ? colors.success : colors.error }
                ]}>
                  {Math.abs(analytics?.comparisonLastPeriod || 0)}% vs last {period}
                </Text>
              </View>
            </View>

            <View style={styles.savingsBar}>
              <View
                style={[
                  styles.savingsFill,
                  { width: `${Math.min(analytics?.savingsRate || 0, 100)}%` },
                ]}
              />
            </View>
            
            <Text style={styles.savingsNote}>
              {analytics?.savingsRate >= 20 
                ? '✅ Great! You\'re saving above the recommended 20%'
                : '💡 Try to save at least 20% of your income'}
            </Text>
          </Card.Content>
        </Card>

        {/* Top Spending Categories */}
        <Card style={styles.categoriesCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Top Spending Categories</Text>
            
            {analytics?.topCategories?.map((cat, index) => (
              <View key={index} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View
                      style={[
                        styles.categoryDot,
                        { backgroundColor: getCategoryColor(cat.category) },
                      ]}
                    />
                    <Text style={styles.categoryName}>{cat.category}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount}>
                      ₹{cat.amount?.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.categoryPercentage}>{cat.percentage}%</Text>
                  </View>
                </View>
                <View style={styles.categoryBar}>
                  <View
                    style={[
                      styles.categoryFill,
                      {
                        width: `${cat.percentage}%`,
                        backgroundColor: getCategoryColor(cat.category),
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Weekly Trend */}
        <Card style={styles.trendCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Weekly Spending Trend</Text>
            
            <View style={styles.trendChart}>
              {analytics?.weeklyTrend?.map((week, index) => {
                const maxAmount = Math.max(...(analytics?.weeklyTrend?.map(w => w.amount) || [1]));
                const height = (week.amount / maxAmount) * 100;
                
                return (
                  <View key={index} style={styles.trendBarContainer}>
                    <View style={styles.trendBarWrapper}>
                      <View
                        style={[
                          styles.trendBar,
                          { height: `${height}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.trendLabel}>{week.week.replace('Week ', 'W')}</Text>
                    <Text style={styles.trendAmount}>
                      ₹{(week.amount / 1000).toFixed(0)}k
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Unusual Spending Alerts */}
        {analytics?.unusualSpending?.length > 0 && (
          <Card style={styles.alertCard}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <IconButton
                  icon="alert-circle"
                  iconColor={colors.warning}
                  size={24}
                  style={styles.alertIcon}
                />
                <Text style={styles.alertTitle}>Spending Alerts</Text>
              </View>
              
              {analytics.unusualSpending.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Chip
                    icon="trending-up"
                    style={styles.alertChip}
                    textStyle={styles.alertChipText}
                  >
                    {alert.category} +{alert.increase}%
                  </Chip>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Daily Average */}
        <Card style={styles.averageCard}>
          <Card.Content style={styles.averageContent}>
            <View>
              <Text style={styles.averageLabel}>Daily Spending Average</Text>
              <Text style={styles.averageAmount}>
                ₹{analytics?.dailyAverage?.toLocaleString('en-IN') || 0}
              </Text>
            </View>
            <IconButton
              icon="calendar-today"
              iconColor={colors.primary}
              size={32}
              style={styles.averageIcon}
            />
          </Card.Content>
        </Card>
      </ScrollView>
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
    paddingBottom: spacing.xl,
  },
  periodSelector: {
    marginBottom: spacing.lg,
  },
  overviewGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  overviewCard: {
    flex: 1,
  },
  incomeCard: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  expenseCard: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  overviewIcon: {
    margin: 0,
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
  },
  overviewLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  overviewAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  savingsCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  savingsLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  savingsRate: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  comparisonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingRight: spacing.sm,
  },
  comparisonIcon: {
    margin: 0,
  },
  comparisonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  savingsBar: {
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  savingsFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  savingsNote: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  categoriesCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  categoryItem: {
    marginBottom: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: 14,
    color: colors.text,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  categoryPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryBar: {
    height: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  trendChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: spacing.md,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  trendBarWrapper: {
    flex: 1,
    width: '60%',
    justifyContent: 'flex-end',
  },
  trendBar: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  trendAmount: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: colors.warning + '15',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  alertIcon: {
    margin: 0,
    marginRight: spacing.sm,
    backgroundColor: colors.warning + '30',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  alertItem: {
    marginBottom: spacing.sm,
  },
  alertChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning + '30',
    marginBottom: spacing.xs,
  },
  alertChipText: {
    color: colors.warning,
    fontSize: 12,
  },
  alertMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  averageCard: {
    backgroundColor: colors.white,
  },
  averageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  averageLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  averageAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  averageIcon: {
    backgroundColor: colors.primary + '20',
    margin: 0,
  },
});

export default AnalyticsScreen;
