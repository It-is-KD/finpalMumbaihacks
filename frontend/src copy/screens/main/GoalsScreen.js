import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  FAB,
  ProgressBar,
  IconButton,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import api from '../../api';

const GoalsScreen = ({ navigation }) => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('active');

  const fetchGoals = async () => {
    try {
      const response = await api.goals.getAll();
      setGoals(response.goals || []);
    } catch (error) {
      console.error('Fetch goals error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchGoals();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, []);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const getDaysLeft = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const renderGoal = ({ item }) => {
    const progress = parseFloat(item.current_amount) / parseFloat(item.target_amount);
    const daysLeft = getDaysLeft(item.target_date);
    const progressPercent = (progress * 100).toFixed(0);

    return (
      <Card
        style={styles.goalCard}
        mode="elevated"
        onPress={() => navigation.navigate('GoalDetail', { goalId: item.id })}
      >
        <Card.Content>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <MaterialCommunityIcons
                name="flag"
                size={24}
                color={item.status === 'completed' ? colors.success : colors.primary}
              />
              <Text style={styles.goalTitle}>{item.name}</Text>
            </View>
            <Chip
              style={[
                styles.statusChip,
                item.status === 'completed' && styles.completedChip,
                item.status === 'cancelled' && styles.cancelledChip,
              ]}
              textStyle={styles.statusChipText}
            >
              {item.status}
            </Chip>
          </View>

          {item.description && (
            <Text style={styles.goalDescription}>{item.description}</Text>
          )}

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>{progressPercent}% Complete</Text>
              <Text style={styles.amountText}>
                {formatCurrency(item.current_amount)} / {formatCurrency(item.target_amount)}
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(progress, 1)}
              color={item.status === 'completed' ? colors.success : colors.primary}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.goalFooter}>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="calendar" size={16} color={colors.gray} />
              <Text style={styles.footerText}>
                {daysLeft > 0 ? `${daysLeft} days left` : 'Past due'}
              </Text>
            </View>
            <View style={styles.footerItem}>
              <MaterialCommunityIcons name="piggy-bank" size={16} color={colors.gray} />
              <Text style={styles.footerText}>
                {formatCurrency(item.monthly_saving_needed)}/mo needed
              </Text>
            </View>
          </View>

          <View style={styles.priorityBadge}>
            <Text style={[
              styles.priorityText,
              item.priority === 'high' && styles.highPriority,
              item.priority === 'medium' && styles.mediumPriority,
              item.priority === 'low' && styles.lowPriority,
            ]}>
              {item.priority} priority
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
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
      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        {['active', 'completed', 'all'].map((f) => (
          <Chip
            key={f}
            selected={filter === f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f && styles.filterChipSelected,
            ]}
            textStyle={[
              styles.filterChipText,
              filter === f && styles.filterChipTextSelected,
            ]}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Chip>
        ))}
      </View>

      {/* Goals List */}
      <FlatList
        data={filteredGoals}
        keyExtractor={(item) => item.id}
        renderItem={renderGoal}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="flag-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>Set a goal to start saving!</Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddGoal')}
        color={colors.white}
      />
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
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.white,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: colors.text,
  },
  filterChipTextSelected: {
    color: colors.white,
  },
  listContent: {
    padding: spacing.md,
    paddingTop: 0,
    paddingBottom: 100,
  },
  goalCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  statusChip: {
    backgroundColor: colors.primaryLight + '30',
  },
  completedChip: {
    backgroundColor: colors.success + '30',
  },
  cancelledChip: {
    backgroundColor: colors.error + '30',
  },
  statusChipText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  goalDescription: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  amountText: {
    fontSize: 14,
    color: colors.gray,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.gray,
    marginLeft: spacing.xs,
  },
  priorityBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  priorityText: {
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  highPriority: {
    color: colors.error,
  },
  mediumPriority: {
    color: colors.warning,
  },
  lowPriority: {
    color: colors.success,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});

export default GoalsScreen;
