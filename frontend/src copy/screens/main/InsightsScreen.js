import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  Chip,
  Surface,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import api from '../../api';

const InsightsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState([]);
  const [savingsTips, setSavingsTips] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);

  const fetchData = async () => {
    try {
      const [insightsRes, alertsRes, analysisRes] = await Promise.all([
        api.insights.getAll({ unreadOnly: 'true' }),
        api.budgets.getAlerts(),
        api.agent.getSpendingInsights().catch(() => ({ insights: {} })),
      ]);

      setInsights(insightsRes.insights || []);
      setBudgetAlerts(alertsRes.alerts || []);
      setSavingsTips(analysisRes.insights?.savingOpportunities || []);
    } catch (error) {
      console.error('Fetch insights error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getInsightIcon = (type) => {
    const icons = {
      saving_tip: 'piggy-bank',
      spending_alert: 'alert-circle',
      investment_suggestion: 'trending-up',
      goal_progress: 'flag-checkered',
      behavioral_nudge: 'brain',
      income_prediction: 'chart-timeline-variant',
    };
    return icons[type] || 'lightbulb';
  };

  const getInsightColor = (type, priority) => {
    if (priority === 'high') return colors.error;
    if (priority === 'low') return colors.success;
    
    const colorMap = {
      saving_tip: colors.success,
      spending_alert: colors.warning,
      investment_suggestion: colors.secondary,
      goal_progress: colors.primary,
      behavioral_nudge: colors.info,
      income_prediction: colors.secondary,
    };
    return colorMap[type] || colors.primary;
  };

  const markAsRead = async (id) => {
    try {
      await api.insights.markRead(id);
      setInsights(insights.filter(i => i.id !== id));
    } catch (error) {
      console.error('Mark read error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
      }
    >
      {/* Quick Actions */}
      <View style={styles.actionsRow}>
        <Surface style={styles.actionCard} elevation={2}>
          <MaterialCommunityIcons name="robot" size={32} color={colors.primary} />
          <Text style={styles.actionTitle}>AI Chat</Text>
          <Button
            mode="contained"
            compact
            onPress={() => navigation.navigate('Chat')}
            style={styles.actionButton}
          >
            Chat
          </Button>
        </Surface>
        <Surface style={styles.actionCard} elevation={2}>
          <MaterialCommunityIcons name="chart-areaspline" size={32} color={colors.secondary} />
          <Text style={styles.actionTitle}>Analytics</Text>
          <Button
            mode="contained"
            compact
            onPress={() => navigation.navigate('Analytics')}
            style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          >
            View
          </Button>
        </Surface>
        <Surface style={styles.actionCard} elevation={2}>
          <MaterialCommunityIcons name="cash-multiple" size={32} color={colors.success} />
          <Text style={styles.actionTitle}>Invest</Text>
          <Button
            mode="contained"
            compact
            onPress={() => navigation.navigate('Investments')}
            style={[styles.actionButton, { backgroundColor: colors.success }]}
          >
            Explore
          </Button>
        </Surface>
      </View>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <Card style={styles.alertCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert" size={24} color={colors.warning} />
              <Text style={styles.sectionTitle}>Budget Alerts</Text>
            </View>
            {budgetAlerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertCategory}>{alert.category}</Text>
                  <Text style={styles.alertMessage}>
                    {formatCurrency(alert.spent)} of {formatCurrency(alert.limit)} ({alert.percentage}%)
                  </Text>
                </View>
                <View style={styles.alertProgress}>
                  <View style={styles.alertProgressBg}>
                    <View
                      style={[
                        styles.alertProgressFill,
                        {
                          width: `${Math.min(parseFloat(alert.percentage), 100)}%`,
                          backgroundColor: alert.exceeded ? colors.error : colors.warning,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
            <Button
              mode="text"
              onPress={() => navigation.navigate('Budget')}
              style={styles.viewAllButton}
            >
              Manage Budgets
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <Card style={styles.insightsCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>AI Insights</Text>
              <Chip style={styles.countChip}>{insights.length}</Chip>
            </View>
            {insights.slice(0, 5).map((insight) => (
              <Surface key={insight.id} style={styles.insightItem} elevation={1}>
                <View style={styles.insightIconContainer}>
                  <MaterialCommunityIcons
                    name={getInsightIcon(insight.type)}
                    size={24}
                    color={getInsightColor(insight.type, insight.priority)}
                  />
                </View>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                </View>
                <Button
                  mode="text"
                  compact
                  onPress={() => markAsRead(insight.id)}
                >
                  Dismiss
                </Button>
              </Surface>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Saving Opportunities */}
      {savingsTips.length > 0 && (
        <Card style={styles.savingsCard} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="piggy-bank" size={24} color={colors.success} />
              <Text style={styles.sectionTitle}>Saving Opportunities</Text>
            </View>
            {savingsTips.map((tip, index) => (
              <View key={index} style={styles.savingItem}>
                <View style={styles.savingHeader}>
                  <Text style={styles.savingCategory}>{tip.category}</Text>
                  <Text style={styles.savingAmount}>
                    Save up to {formatCurrency(tip.potentialSaving)}
                  </Text>
                </View>
                <Text style={styles.savingSuggestion}>{tip.suggestion}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Empty State */}
      {insights.length === 0 && budgetAlerts.length === 0 && savingsTips.length === 0 && (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            Keep tracking your expenses to get personalized insights
          </Text>
        </View>
      )}

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
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    backgroundColor: colors.primary,
  },
  alertCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  countChip: {
    backgroundColor: colors.primary,
  },
  alertItem: {
    marginBottom: spacing.md,
  },
  alertInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  alertCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  alertMessage: {
    fontSize: 12,
    color: colors.gray,
  },
  alertProgress: {
    height: 8,
  },
  alertProgressBg: {
    height: '100%',
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  alertProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  viewAllButton: {
    marginTop: spacing.sm,
  },
  insightsCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  insightMessage: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 2,
  },
  savingsCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  savingItem: {
    padding: spacing.sm,
    backgroundColor: colors.success + '10',
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  savingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  savingCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  savingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  savingSuggestion: {
    fontSize: 12,
    color: colors.gray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});

export default InsightsScreen;
