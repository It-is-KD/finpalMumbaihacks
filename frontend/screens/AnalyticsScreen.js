<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, FAB, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { CategoryPieChart, SpendingBarChart, TrendLineChart } from '../components/Charts';
import { BudgetCard } from '../components/Cards';
import api from '../api';
import { theme, spacing } from '../theme';

export default function AnalyticsScreen({ navigation }) {
  const { summary, budgets, fetchSummary, fetchBudgets, loading } = useData();
  const [period, setPeriod] = useState('month');
  const [patterns, setPatterns] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      await fetchSummary(period);
      await fetchBudgets();
      const patternsData = await api.getBehavioralPatterns();
      setPatterns(patternsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading.summary && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Analyzing your finances...</Text>
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
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={period}
            onValueChange={setPeriod}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            style={styles.segmented}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="arrow-down" size={24} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                ₹{(summary?.income || 0).toLocaleString('en-IN')}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="arrow-up" size={24} color="#F44336" />
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                ₹{(summary?.expenses || 0).toLocaleString('en-IN')}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="piggy-bank" size={24} color={theme.colors.primary} />
              <Text style={styles.summaryLabel}>Savings</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {summary?.savingsRate || 0}%
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Category Breakdown */}
        {summary?.categories && summary.categories.length > 0 && (
          <CategoryPieChart 
            data={summary.categories} 
            title="Spending by Category"
          />
        )}

        {/* Bar Chart */}
        {summary?.categories && summary.categories.length > 0 && (
          <SpendingBarChart 
            data={summary.categories} 
            title="Top Spending Categories"
          />
        )}

        {/* Budgets */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calculator" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Budget Status</Text>
            </View>
            {budgets.map((budget, index) => (
              <BudgetCard key={budget.id || index} budget={budget} />
            ))}
          </View>
        )}

        {/* Behavioral Patterns */}
        {patterns?.patterns && patterns.patterns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Spending Patterns</Text>
            </View>
            
            {patterns.patterns.map((pattern, index) => (
              <Card key={index} style={styles.patternCard}>
                <Card.Content>
                  <Text style={styles.patternType}>
                    {pattern.patternType.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  {pattern.patternData?.insight && (
                    <Text style={styles.patternInsight}>
                      {pattern.patternData.insight}
                    </Text>
                  )}
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { width: `${Math.min((pattern.confidenceScore || 0) * 100, 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.confidenceValue}>
                      {Math.min(((pattern.confidenceScore || 0) * 100), 100).toFixed(0)}%
                    </Text>
                  </View>
                  {pattern.patternData?.aiBehavioralInsight && (
                    <View style={styles.aiInsightBox}>
                      <MaterialCommunityIcons name="robot" size={14} color={theme.colors.primary} />
                      <Text style={styles.aiInsightText}>
                        {pattern.patternData.aiBehavioralInsight}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {patterns?.recommendations && patterns.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
              {patterns.recommendations.some(r => r.method === 'ai') && (
                <View style={styles.aiTag}>
                  <MaterialCommunityIcons name="robot" size={12} color="#fff" />
                  <Text style={styles.aiTagText}>AI</Text>
                </View>
              )}
            </View>
            
            {patterns.recommendations.map((rec, index) => (
              <Card key={index} style={styles.recommendationCard}>
                <Card.Content>
                  <View style={styles.recommendationHeader}>
                    <MaterialCommunityIcons 
                      name={rec.method === 'ai' ? 'robot' : 'star'} 
                      size={16} 
                      color={rec.method === 'ai' ? theme.colors.primary : '#FFD700'} 
                    />
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  </View>
                  <Text style={styles.recommendationDesc}>
                    {rec.description || rec.aiRecommendation || rec.recommendation}
                  </Text>
                  {rec.action && (
                    <Text style={styles.recommendationAction}>
                      💡 {rec.action}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB
        icon="file-document"
        label="Full Report"
        style={styles.fab}
        onPress={() => navigation.navigate('FullReport')}
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
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.gray500,
  },
  periodSelector: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  segmented: {
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  summaryContent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
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
  },
  patternCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
  },
  patternType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  patternInsight: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.gray200,
    borderRadius: 2,
    marginHorizontal: spacing.sm,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  recommendationCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.xs,
  },
  recommendationDesc: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  recommendationAction: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  aiTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 2,
  },
  aiInsightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  aiInsightText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: theme.colors.primary,
  },
});
=======
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, FAB, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { CategoryPieChart, SpendingBarChart, TrendLineChart } from '../components/Charts';
import { BudgetCard } from '../components/Cards';
import api from '../api';
import { theme, spacing } from '../theme';

export default function AnalyticsScreen({ navigation }) {
  const { summary, budgets, fetchSummary, fetchBudgets, loading } = useData();
  const [period, setPeriod] = useState('month');
  const [patterns, setPatterns] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      await fetchSummary(period);
      await fetchBudgets();
      const patternsData = await api.getBehavioralPatterns();
      setPatterns(patternsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading.summary && !summary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Analyzing your finances...</Text>
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
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <SegmentedButtons
            value={period}
            onValueChange={setPeriod}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
            ]}
            style={styles.segmented}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="arrow-down" size={24} color="#4CAF50" />
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>
                ₹{(summary?.income || 0).toLocaleString('en-IN')}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="arrow-up" size={24} color="#F44336" />
              <Text style={styles.summaryLabel}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: '#F44336' }]}>
                ₹{(summary?.expenses || 0).toLocaleString('en-IN')}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <MaterialCommunityIcons name="piggy-bank" size={24} color={theme.colors.primary} />
              <Text style={styles.summaryLabel}>Savings</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>
                {summary?.savingsRate || 0}%
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Category Breakdown */}
        {summary?.categories && summary.categories.length > 0 && (
          <CategoryPieChart 
            data={summary.categories} 
            title="Spending by Category"
          />
        )}

        {/* Bar Chart */}
        {summary?.categories && summary.categories.length > 0 && (
          <SpendingBarChart 
            data={summary.categories} 
            title="Top Spending Categories"
          />
        )}

        {/* Budgets */}
        {budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="calculator" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Budget Status</Text>
            </View>
            {budgets.map((budget, index) => (
              <BudgetCard key={budget.id || index} budget={budget} />
            ))}
          </View>
        )}

        {/* Behavioral Patterns */}
        {patterns?.patterns && patterns.patterns.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="brain" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Spending Patterns</Text>
            </View>
            
            {patterns.patterns.map((pattern, index) => (
              <Card key={index} style={styles.patternCard}>
                <Card.Content>
                  <Text style={styles.patternType}>
                    {pattern.patternType.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  {pattern.patternData?.insight && (
                    <Text style={styles.patternInsight}>
                      {pattern.patternData.insight}
                    </Text>
                  )}
                  <View style={styles.confidenceContainer}>
                    <Text style={styles.confidenceLabel}>Confidence:</Text>
                    <View style={styles.confidenceBar}>
                      <View 
                        style={[
                          styles.confidenceFill, 
                          { width: `${Math.min((pattern.confidenceScore || 0) * 100, 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.confidenceValue}>
                      {Math.min(((pattern.confidenceScore || 0) * 100), 100).toFixed(0)}%
                    </Text>
                  </View>
                  {pattern.patternData?.aiBehavioralInsight && (
                    <View style={styles.aiInsightBox}>
                      <MaterialCommunityIcons name="robot" size={14} color={theme.colors.primary} />
                      <Text style={styles.aiInsightText}>
                        {pattern.patternData.aiBehavioralInsight}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {patterns?.recommendations && patterns.recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="lightbulb" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
              {patterns.recommendations.some(r => r.method === 'ai') && (
                <View style={styles.aiTag}>
                  <MaterialCommunityIcons name="robot" size={12} color="#fff" />
                  <Text style={styles.aiTagText}>AI</Text>
                </View>
              )}
            </View>
            
            {patterns.recommendations.map((rec, index) => (
              <Card key={index} style={styles.recommendationCard}>
                <Card.Content>
                  <View style={styles.recommendationHeader}>
                    <MaterialCommunityIcons 
                      name={rec.method === 'ai' ? 'robot' : 'star'} 
                      size={16} 
                      color={rec.method === 'ai' ? theme.colors.primary : '#FFD700'} 
                    />
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                  </View>
                  <Text style={styles.recommendationDesc}>
                    {rec.description || rec.aiRecommendation || rec.recommendation}
                  </Text>
                  {rec.action && (
                    <Text style={styles.recommendationAction}>
                      💡 {rec.action}
                    </Text>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      <FAB
        icon="file-document"
        label="Full Report"
        style={styles.fab}
        onPress={() => navigation.navigate('FullReport')}
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
  },
  loadingText: {
    marginTop: spacing.md,
    color: theme.colors.gray500,
  },
  periodSelector: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  segmented: {
    backgroundColor: '#fff',
  },
  summaryRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
  },
  summaryContent: {
    alignItems: 'center',
    padding: spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
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
  },
  patternCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
  },
  patternType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  patternInsight: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: theme.colors.gray200,
    borderRadius: 2,
    marginHorizontal: spacing.sm,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  recommendationCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.xs,
  },
  recommendationDesc: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  recommendationAction: {
    fontSize: 12,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  aiTagText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 2,
  },
  aiInsightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primary + '10',
    padding: spacing.sm,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  aiInsightText: {
    fontSize: 12,
    color: theme.colors.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: theme.colors.primary,
  },
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
