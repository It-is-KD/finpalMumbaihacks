import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Button,
  Chip,
  Divider,
  ActivityIndicator,
  Dialog,
  Portal,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const TransactionDetailScreen = ({ route, navigation }) => {
  const { transactionId } = route.params;
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const fetchTransaction = async () => {
    try {
      const response = await api.transactions.getById(transactionId);
      setTransaction(response.transaction);
    } catch (error) {
      console.error('Fetch transaction error:', error);
      Alert.alert('Error', 'Failed to load transaction details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.transactions.delete(transactionId);
      setDeleteDialogVisible(false);
      navigation.goBack();
    } catch (error) {
      console.error('Delete transaction error:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Food & Dining': 'food',
      'Shopping': 'shopping',
      'Groceries': 'cart',
      'Transportation': 'car',
      'Subscriptions': 'refresh',
      'Entertainment': 'movie',
      'Healthcare': 'hospital',
      'Education': 'school',
      'Bills & Utilities': 'flash',
      'EMI': 'credit-card',
      'Investments': 'trending-up',
      'Insurance': 'shield',
      'Rent': 'home',
      'Travel': 'airplane',
      'Salary': 'cash',
      'Freelance': 'briefcase',
      'Investment Returns': 'chart-line',
      'Interest': 'percent',
      'Other Income': 'plus-circle',
      'Other Expense': 'minus-circle',
    };
    return icons[category] || 'cash';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.errorContainer}>
        <Text>Transaction not found</Text>
      </View>
    );
  }

  const isCredit = transaction.type === 'credit';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Amount Card */}
        <Card style={[styles.amountCard, isCredit ? styles.creditCard : styles.debitCard]}>
          <Card.Content style={styles.amountContent}>
            <View style={styles.amountHeader}>
              <IconButton
                icon={isCredit ? 'arrow-down' : 'arrow-up'}
                size={32}
                iconColor={colors.white}
                style={styles.typeIcon}
              />
              <View style={styles.typeLabel}>
                <Text style={styles.typeText}>
                  {isCredit ? 'Money Received' : 'Money Spent'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.amount}>
              {isCredit ? '+' : '-'}₹{parseFloat(transaction.amount).toLocaleString('en-IN')}
            </Text>
            
            <Text style={styles.dateTime}>
              {formatDate(transaction.transaction_date)} • {formatTime(transaction.transaction_date)}
            </Text>
          </Card.Content>
        </Card>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Transaction Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>
                {transaction.description || 'No description'}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Chip
                icon={getCategoryIcon(transaction.category)}
                style={styles.categoryChip}
                textStyle={styles.categoryChipText}
              >
                {transaction.category || 'Uncategorized'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

            {transaction.merchant_name && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Merchant</Text>
                  <Text style={styles.detailValue}>{transaction.merchant_name}</Text>
                </View>
                <Divider style={styles.divider} />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Bank Account</Text>
              <Text style={styles.detailValue}>
                {transaction.bank_name || 'Unknown'} - ****{transaction.account_number?.slice(-4) || '****'}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={[styles.detailValue, styles.transactionId]}>
                #{transaction.id}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* AI Insights Card */}
        {transaction.ai_confidence && (
          <Card style={styles.insightsCard}>
            <Card.Content>
              <View style={styles.insightsHeader}>
                <IconButton
                  icon="robot"
                  size={20}
                  iconColor={colors.primary}
                  style={styles.insightsIcon}
                />
                <Text style={styles.sectionTitle}>AI Analysis</Text>
              </View>
              
              <View style={styles.confidenceRow}>
                <Text style={styles.detailLabel}>Category Confidence</Text>
                <View style={styles.confidenceBar}>
                  <View
                    style={[
                      styles.confidenceFill,
                      { width: `${transaction.ai_confidence * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {(transaction.ai_confidence * 100).toFixed(0)}%
                </Text>
              </View>

              {transaction.ai_suggestions && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Suggestions</Text>
                  <Text style={styles.suggestionsText}>
                    {transaction.ai_suggestions}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            icon="delete"
            onPress={() => setDeleteDialogVisible(true)}
            style={styles.deleteButton}
            textColor={colors.error}
          >
            Delete Transaction
          </Button>
        </View>
      </ScrollView>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Transaction</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete this transaction? This action cannot be undone.
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
  },
  amountCard: {
    marginBottom: spacing.md,
  },
  creditCard: {
    backgroundColor: colors.success,
  },
  debitCard: {
    backgroundColor: colors.error,
  },
  amountContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  typeIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    margin: 0,
  },
  typeLabel: {
    marginLeft: spacing.sm,
  },
  typeText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  dateTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  detailsCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  transactionId: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: colors.textSecondary,
  },
  divider: {
    backgroundColor: colors.lightGray,
  },
  categoryChip: {
    backgroundColor: colors.primary + '20',
  },
  categoryChipText: {
    color: colors.primary,
    fontSize: 12,
  },
  insightsCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  insightsIcon: {
    backgroundColor: colors.primary + '20',
    margin: 0,
    marginRight: spacing.sm,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  confidenceBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  suggestionsContainer: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: 8,
  },
  suggestionsTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  suggestionsText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  deleteButton: {
    borderColor: colors.error,
  },
});

export default TransactionDetailScreen;
