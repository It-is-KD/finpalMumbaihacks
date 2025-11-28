import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  Menu,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing } from '../../theme';
import api from '../../api';

const goalCategories = [
  'Emergency Fund',
  'Vacation',
  'Electronics',
  'Vehicle',
  'Home',
  'Education',
  'Wedding',
  'Investment',
  'Retirement',
  'Healthcare',
  'Debt Repayment',
  'Other',
];

const AddGoalScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)); // 90 days from now
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a goal name');
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Please enter a valid target amount');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.goals.create({
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount) || 0,
        category,
        targetDate: targetDate.toISOString().split('T')[0],
      });

      navigation.goBack();
    } catch (error) {
      setError(error.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTargetDate(selectedDate);
    }
  };

  const daysRemaining = Math.ceil((targetDate - new Date()) / (1000 * 60 * 60 * 24));
  const monthlyRequired = targetAmount && daysRemaining > 0
    ? ((parseFloat(targetAmount) - (parseFloat(currentAmount) || 0)) / (daysRemaining / 30)).toFixed(0)
    : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Goal Name */}
        <TextInput
          label="Goal Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="target" />}
          placeholder="e.g., New Laptop, Emergency Fund"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setCategoryMenuVisible(true)}
              style={styles.menuButton}
              contentStyle={styles.menuButtonContent}
              icon="shape"
            >
              {category || 'Select Category'}
            </Button>
          }
        >
          <ScrollView style={{ maxHeight: 300 }}>
            {goalCategories.map((cat) => (
              <Menu.Item
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setCategoryMenuVisible(false);
                }}
                title={cat}
              />
            ))}
          </ScrollView>
        </Menu>

        {/* Target Amount */}
        <TextInput
          label="Target Amount (₹)"
          value={targetAmount}
          onChangeText={setTargetAmount}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="currency-inr" />}
        />

        {/* Current Savings */}
        <TextInput
          label="Current Savings (₹) - Optional"
          value={currentAmount}
          onChangeText={setCurrentAmount}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="wallet" />}
          placeholder="Amount you've already saved"
        />

        {/* Target Date */}
        <Text style={styles.label}>Target Date</Text>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.menuButton}
          contentStyle={styles.menuButtonContent}
          icon="calendar"
        >
          {formatDate(targetDate)}
        </Button>

        {showDatePicker && (
          <DateTimePicker
            value={targetDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Summary Card */}
        {targetAmount && parseFloat(targetAmount) > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Goal Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Days Remaining:</Text>
              <Text style={styles.summaryValue}>{daysRemaining} days</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount to Save:</Text>
              <Text style={styles.summaryValue}>
                ₹{(parseFloat(targetAmount) - (parseFloat(currentAmount) || 0)).toLocaleString('en-IN')}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly Savings Needed:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ₹{parseFloat(monthlyRequired).toLocaleString('en-IN')}/month
              </Text>
            </View>
          </View>
        )}

        {error ? (
          <HelperText type="error" visible={true}>
            {error}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Create Goal
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  menuButton: {
    marginBottom: spacing.md,
    borderColor: colors.gray,
  },
  menuButtonContent: {
    justifyContent: 'flex-start',
    paddingVertical: spacing.sm,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGray,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  submitButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default AddGoalScreen;
