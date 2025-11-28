import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, FAB, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { BalanceCard, InsightCard, GoalCard } from '../components/Cards';
import { theme, spacing, shadows } from '../theme';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { 
    transactions, 
    bankAccounts, 
    goals, 
    summary, 
    insights,
    loading,
    fetchTransactions,
    fetchBankAccounts,
    fetchGoals,
    fetchSummary,
    fetchInsights,
    refreshAll,
  } = useData();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        fetchTransactions({ limit: 5 }),
        fetchBankAccounts(),
        fetchGoals(),
        fetchSummary('month'),
        fetchInsights(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const totalBalance = bankAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);
  const activeGoals = goals.filter(g => g.status === 'active').slice(0, 2);
  const unreadInsights = insights.filter(i => !i.is_read).slice(0, 3);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading.summary && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your finances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
          </View>
          <View style={styles.headerRight}>
            {user?.subscription_plan === 'paid' && (
              <Chip 
                icon="shield-check" 
                mode="flat"
                style={styles.premiumChip}
                textStyle={styles.premiumChipText}
              >
                Premium
              </Chip>
            )}
            <MaterialCommunityIcons 
              name="bell-outline" 
              size={24} 
              color={theme.colors.text}
              style={styles.notificationIcon}
            />
          </View>
        </View>

        {/* Balance Card */}
        <BalanceCard
          totalBalance={totalBalance}
          income={summary?.income || 0}
          expenses={summary?.expenses || 0}
          savingsRate={summary?.savingsRate || 0}
        />



        {/* AI Insights */}
        {unreadInsights.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>AI Insights</Text>
            </View>
            {unreadInsights.map((insight, index) => (
              <InsightCard 
                key={insight.id || index} 
                insight={insight}
                onPress={() => navigation.navigate('InsightDetail', { insight })}
              />
            ))}
          </View>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="target" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Active Goals</Text>
              <Text 
                style={styles.seeAll}
                onPress={() => navigation.navigate('Goals')}
              >
                See All
              </Text>
            </View>
            {activeGoals.map(goal => (
              <GoalCard 
                key={goal.id} 
                goal={goal}
                onPress={() => navigation.navigate('GoalDetail', { goal })}
              />
            ))}
          </View>
        )}



        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB - Quick access to transactions */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Transactions')}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.gray500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.gray500,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumChip: {
    backgroundColor: '#FFD700',
    marginRight: spacing.sm,
  },
  premiumChipText: {
    color: '#000',
    fontSize: 10,
  },
  notificationIcon: {
    padding: spacing.sm,
  },

  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  seeAll: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  emptyCard: {
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.gray500,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray400,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: theme.colors.primary,
  },
});
