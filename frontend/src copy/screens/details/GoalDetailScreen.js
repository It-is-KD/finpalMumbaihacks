import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  ProgressBar,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const GoalDetailScreen = ({ route, navigation }) => {
  const { goalId } = route.params;
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositDialogVisible, setDepositDialogVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  const fetchGoal = async () => {
    try {
      const response = await api.goals.getById(goalId);
      setGoal(response.goal);
    } catch (error) {
      console.error('Fetch goal error:', error);
      Alert.alert('Error', 'Failed to load goal details');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGoal();
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setDepositing(true);
    try {
      await api.goals.addProgress(goalId, parseFloat(depositAmount));
      setDepositDialogVisible(false);
      setDepositAmount('');
      fetchGoal();
    } catch (error) {
      console.error('Deposit error:', error);
      Alert.alert('Error', 'Failed to add progress');
    } finally {
      setDepositing(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.goals.delete(goalId);
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete goal');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.errorContainer}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  const progress = goal.target_amount > 0 
    ? Math.min(goal.current_amount / goal.target_amount, 1) 
    : 0;
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);
  const daysRemaining = Math.max(
    Math.ceil((new Date(goal.target_date) - new Date()) / (1000 * 60 * 60 * 24)),
    0
  );
  const monthlyRequired = daysRemaining > 0 
    ? (remaining / (daysRemaining / 30)).toFixed(0) 
    : 0;
  const dailyRequired = daysRemaining > 0 
    ? (remaining / daysRemaining).toFixed(0) 
    : 0;

  const isCompleted = progress >= 1;
  const isOverdue = daysRemaining === 0 && !isCompleted;

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
        {/* Progress Card */}
        <Card style={[styles.progressCard, isCompleted && styles.completedCard]}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.goalName}>{goal.name}</Text>
                <Text style={styles.goalCategory}>{goal.category}</Text>
              </View>
              {isCompleted && (
                <IconButton
                  icon="check-circle"
                  iconColor={colors.success}
                  size={32}
                />
              )}
            </View>

            <View style={styles.amountRow}>
              <Text style={styles.currentAmount}>
                ₹{parseFloat(goal.current_amount).toLocaleString('en-IN')}
              </Text>
              <Text style={styles.targetAmount}>
                / ₹{parseFloat(goal.target_amount).toLocaleString('en-IN')}
              </Text>
            </View>

            <ProgressBar
              progress={progress}
              color={isCompleted ? colors.success : colors.primary}
              style={styles.progressBar}
            />

            <Text style={styles.progressText}>
              {(progress * 100).toFixed(0)}% complete
            </Text>
          </Card.Content>
        </Card>

        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Goal Statistics</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ₹{remaining.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, isOverdue && styles.overdueText]}>
                  {daysRemaining}
                </Text>
                <Text style={styles.statLabel}>Days Left</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ₹{monthlyRequired}
                </Text>
                <Text style={styles.statLabel}>Per Month</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  ₹{dailyRequired}
                </Text>
                <Text style={styles.statLabel}>Per Day</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Timeline Card */}
        <Card style={styles.timelineCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Timeline</Text>
            
            <View style={styles.timelineRow}>
              <View style={styles.timelineItem}>
                <IconButton
                  icon="calendar-start"
                  size={20}
                  iconColor={colors.primary}
                  style={styles.timelineIcon}
                />
                <View>
                  <Text style={styles.timelineLabel}>Created</Text>
                  <Text style={styles.timelineDate}>
                    {formatDate(goal.created_at)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineItem}>
                <IconButton
                  icon="flag-checkered"
                  size={20}
                  iconColor={isOverdue ? colors.error : colors.primary}
                  style={styles.timelineIcon}
                />
                <View>
                  <Text style={styles.timelineLabel}>Target Date</Text>
                  <Text style={[styles.timelineDate, isOverdue && styles.overdueText]}>
                    {formatDate(goal.target_date)}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* AI Suggestion Card */}
        {goal.ai_suggestion && (
          <Card style={styles.aiCard}>
            <Card.Content>
              <View style={styles.aiHeader}>
                <IconButton
                  icon="robot"
                  size={20}
                  iconColor={colors.primary}
                  style={styles.aiIcon}
                />
                <Text style={styles.sectionTitle}>AI Recommendation</Text>
              </View>
              <Text style={styles.aiText}>{goal.ai_suggestion}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        {!isCompleted && (
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setDepositDialogVisible(true)}
            style={styles.depositButton}
          >
            Add Progress
          </Button>
        )}

        <Button
          mode="outlined"
          icon="delete"
          onPress={() => setDeleteDialogVisible(true)}
          style={styles.deleteButton}
          textColor={colors.error}
        >
          Delete Goal
        </Button>
      </ScrollView>

      {/* Deposit Dialog */}
      <Portal>
        <Dialog
          visible={depositDialogVisible}
          onDismiss={() => setDepositDialogVisible(false)}
        >
          <Dialog.Title>Add Progress</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              How much have you saved towards this goal?
            </Text>
            <TextInput
              label="Amount (₹)"
              value={depositAmount}
              onChangeText={setDepositAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDepositDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDeposit}
              loading={depositing}
              disabled={depositing}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Goal</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{goal.name}"? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDelete}
              loading={deleting}
              textColor={colors.error}
            >
              Delete
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  progressCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  completedCard: {
    borderWidth: 2,
    borderColor: colors.success,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  goalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  goalCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  currentAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  targetAmount: {
    fontSize: 16,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.lightGray,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  statsCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  overdueText: {
    color: colors.error,
  },
  timelineCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineIcon: {
    backgroundColor: colors.lightGray,
    margin: 0,
    marginRight: spacing.sm,
  },
  timelineLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 2,
  },
  aiCard: {
    backgroundColor: colors.primary + '10',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiIcon: {
    backgroundColor: colors.primary + '20',
    margin: 0,
    marginRight: spacing.sm,
  },
  aiText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text,
  },
  depositButton: {
    marginBottom: spacing.md,
    backgroundColor: colors.primary,
  },
  deleteButton: {
    borderColor: colors.error,
  },
  dialogText: {
    marginBottom: spacing.md,
  },
  dialogInput: {
    marginTop: spacing.sm,
  },
});

export default GoalDetailScreen;
