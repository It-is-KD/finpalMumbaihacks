import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, FAB, ProgressBar, IconButton, Portal, Modal, Button, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import { GoalCard } from '../components/Cards';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

export default function GoalsScreen({ navigation }) {
  const { goals, fetchGoals, addGoal, updateGoalProgress, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [progressAmount, setProgressAmount] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target_amount: '',
    target_date: '',
    priority: 'medium',
    category: 'savings',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await fetchGoals();
    try {
      const goalSuggestions = await api.getGoalSuggestions();
      setSuggestions(goalSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.name || !newGoal.target_amount || !newGoal.target_date) {
      return;
    }

    try {
      await addGoal({
        ...newGoal,
        target_amount: parseFloat(newGoal.target_amount),
      });
      setShowAddModal(false);
      setNewGoal({
        name: '',
        target_amount: '',
        target_date: '',
        priority: 'medium',
        category: 'savings',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleAddProgress = async () => {
    if (!progressAmount || !selectedGoal) return;

    try {
      await updateGoalProgress(selectedGoal.id, parseFloat(progressAmount));
      setShowProgressModal(false);
      setProgressAmount('');
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const useSuggestion = (suggestion) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + suggestion.suggestedTimeframe);
    
    setNewGoal({
      name: suggestion.name,
      target_amount: suggestion.suggestedAmount.toString(),
      target_date: targetDate.toISOString().split('T')[0],
      priority: suggestion.priority,
      category: suggestion.category,
    });
    setShowAddModal(true);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

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
            <View style={styles.overviewHeader}>
              <MaterialCommunityIcons name="target" size={24} color={theme.colors.primary} />
              <Text style={styles.overviewTitle}>Goals Overview</Text>
            </View>
            <View style={styles.overviewStats}>
              <View style={styles.overviewStat}>
                <Text style={styles.statNumber}>{activeGoals.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.statNumber}>{completedGoals.length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.overviewStat}>
                <Text style={styles.statNumber}>
                  ₹{activeGoals.reduce((sum, g) => sum + (g.current_amount || 0), 0).toLocaleString('en-IN')}
                </Text>
                <Text style={styles.statLabel}>Saved</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Goals</Text>
            {activeGoals.map(goal => (
              <Card 
                key={goal.id} 
                style={styles.goalCard}
                onPress={() => {
                  setSelectedGoal(goal);
                  setShowProgressModal(true);
                }}
              >
                <Card.Content>
                  <View style={styles.goalHeader}>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName}>{goal.name}</Text>
                      <Text style={styles.goalCategory}>{goal.category || 'General'}</Text>
                    </View>
                    <IconButton
                      icon="plus-circle"
                      iconColor={theme.colors.primary}
                      size={24}
                      onPress={() => {
                        setSelectedGoal(goal);
                        setShowProgressModal(true);
                      }}
                    />
                  </View>
                  
                  <View style={styles.goalProgress}>
                    <ProgressBar 
                      progress={(goal.current_amount || 0) / goal.target_amount} 
                      color={theme.colors.primary}
                      style={styles.progressBar}
                    />
                    <Text style={styles.progressPercent}>
                      {(((goal.current_amount || 0) / goal.target_amount) * 100).toFixed(0)}%
                    </Text>
                  </View>
                  
                  <View style={styles.goalFooter}>
                    <Text style={styles.goalAmount}>
                      ₹{(goal.current_amount || 0).toLocaleString('en-IN')} / ₹{goal.target_amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.goalDate}>
                      Due: {new Date(goal.target_date).toLocaleDateString('en-IN')}
                    </Text>
                  </View>
                  
                  {goal.monthly_contribution && (
                    <View style={styles.monthlyTip}>
                      <MaterialCommunityIcons name="information" size={14} color={theme.colors.gray500} />
                      <Text style={styles.monthlyTipText}>
                        Save ₹{goal.monthly_contribution.toLocaleString('en-IN')}/month to reach your goal
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Suggested Goals</Text>
            {suggestions.map((suggestion, index) => (
              <Card key={index} style={styles.suggestionCard}>
                <Card.Content>
                  <View style={styles.suggestionHeader}>
                    <View style={styles.suggestionInfo}>
                      <Text style={styles.suggestionName}>{suggestion.name}</Text>
                      <Text style={styles.suggestionDesc}>{suggestion.description}</Text>
                    </View>
                    <View style={[styles.priorityBadge, { 
                      backgroundColor: suggestion.priority === 'high' ? '#F44336' : 
                        suggestion.priority === 'medium' ? '#FF9800' : '#4CAF50' 
                    }]}>
                      <Text style={styles.priorityText}>{suggestion.priority}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.suggestionDetails}>
                    <View style={styles.suggestionDetail}>
                      <MaterialCommunityIcons name="currency-inr" size={14} color={theme.colors.gray500} />
                      <Text style={styles.suggestionDetailText}>
                        ₹{suggestion.suggestedAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.suggestionDetail}>
                      <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.gray500} />
                      <Text style={styles.suggestionDetailText}>
                        {suggestion.suggestedTimeframe} months
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.suggestionReason}>{suggestion.reasoning}</Text>
                  
                  <Button
                    mode="contained"
                    onPress={() => useSuggestion(suggestion)}
                    style={styles.useSuggestionButton}
                    compact
                  >
                    Use This Goal
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed Goals 🎉</Text>
            {completedGoals.map(goal => (
              <Card key={goal.id} style={[styles.goalCard, styles.completedCard]}>
                <Card.Content>
                  <View style={styles.goalHeader}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                    <Text style={[styles.goalName, { marginLeft: spacing.sm }]}>
                      {goal.name}
                    </Text>
                  </View>
                  <Text style={styles.completedAmount}>
                    ₹{goal.target_amount.toLocaleString('en-IN')} saved
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Goal FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add Goal Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Create New Goal</Text>
          
          <TextInput
            label="Goal Name"
            value={newGoal.name}
            onChangeText={(v) => setNewGoal(prev => ({ ...prev, name: v }))}
            mode="outlined"
            style={styles.modalInput}
          />
          
          <TextInput
            label="Target Amount (₹)"
            value={newGoal.target_amount}
            onChangeText={(v) => setNewGoal(prev => ({ ...prev, target_amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />
          
          <TextInput
            label="Target Date (YYYY-MM-DD)"
            value={newGoal.target_date}
            onChangeText={(v) => setNewGoal(prev => ({ ...prev, target_date: v }))}
            mode="outlined"
            style={styles.modalInput}
          />
          
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleCreateGoal}>
              Create Goal
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add Progress Modal */}
      <Portal>
        <Modal
          visible={showProgressModal}
          onDismiss={() => setShowProgressModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Add Progress</Text>
          <Text style={styles.modalSubtitle}>
            {selectedGoal?.name}
          </Text>
          
          <TextInput
            label="Amount to Add (₹)"
            value={progressAmount}
            onChangeText={setProgressAmount}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />
          
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowProgressModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAddProgress}>
              Add Progress
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
    backgroundColor: theme.colors.primary,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: spacing.sm,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
  },
  goalCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    ...shadows.small,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  goalCategory: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressPercent: {
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
  goalDate: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
  monthlyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: theme.colors.gray100,
    borderRadius: 8,
  },
  monthlyTipText: {
    fontSize: 12,
    color: theme.colors.gray600,
    marginLeft: spacing.xs,
  },
  suggestionCard: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  suggestionDesc: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionDetails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  suggestionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionDetailText: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginLeft: 4,
  },
  suggestionReason: {
    fontSize: 12,
    color: theme.colors.gray500,
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  useSuggestionButton: {
    marginTop: spacing.md,
    backgroundColor: theme.colors.secondary,
  },
  completedCard: {
    backgroundColor: '#E8F5E9',
  },
  completedAmount: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: spacing.sm,
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
    margin: spacing.lg,
    borderRadius: 16,
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
