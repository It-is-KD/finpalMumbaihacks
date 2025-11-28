import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Searchbar, Chip, FAB, Portal, Modal, Button, TextInput, SegmentedButtons, IconButton, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useData } from '../context/DataContext';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'view-grid' },
  { key: 'income', label: 'Income', icon: 'cash-plus' },
  { key: 'shopping', label: 'Shopping', icon: 'shopping' },
  { key: 'groceries', label: 'Groceries', icon: 'cart' },
  { key: 'food', label: 'Food & Dining', icon: 'food' },
  { key: 'transport', label: 'Transport', icon: 'car' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'repeat' },
  { key: 'utilities', label: 'Bills & Utilities', icon: 'flash' },
  { key: 'entertainment', label: 'Entertainment', icon: 'movie' },
  { key: 'healthcare', label: 'Healthcare', icon: 'hospital' },
  { key: 'investments', label: 'Investments', icon: 'chart-line' },
  { key: 'emi', label: 'EMI', icon: 'bank-transfer' },
  { key: 'travel', label: 'Travel', icon: 'airplane' },
  { key: 'personal', label: 'Personal Care', icon: 'account-heart' },
];

const CATEGORY_ICONS = {
  income: 'cash-plus',
  shopping: 'shopping',
  groceries: 'cart',
  food: 'food',
  'food & dining': 'food',
  transport: 'car',
  transportation: 'car',
  subscriptions: 'repeat',
  utilities: 'flash',
  'bills & utilities': 'flash',
  entertainment: 'movie',
  healthcare: 'hospital',
  investments: 'chart-line',
  emi: 'bank-transfer',
  interest: 'percent',
  salary: 'briefcase',
  travel: 'airplane',
  personal: 'account-heart',
  'personal care': 'account-heart',
  default: 'cash',
};

const CATEGORY_COLORS = {
  income: '#4CAF50',
  shopping: '#E91E63',
  groceries: '#8BC34A',
  food: '#FF9800',
  'food & dining': '#FF9800',
  transport: '#2196F3',
  transportation: '#2196F3',
  subscriptions: '#9C27B0',
  utilities: '#607D8B',
  'bills & utilities': '#607D8B',
  entertainment: '#F44336',
  healthcare: '#00BCD4',
  investments: '#3F51B5',
  emi: '#795548',
  travel: '#009688',
  personal: '#FF5722',
  'personal care': '#FF5722',
  default: '#9E9E9E',
};

export default function TransactionsScreen({ navigation }) {
  const { transactions, bankAccounts, fetchTransactions, addTransaction, loading } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'list'
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isCategorizingTxn, setIsCategorizingTxn] = useState(false);
  const [categorizationResult, setCategorizationResult] = useState(null);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'debit',
    category: '',
    bank_account_id: '',
  });
  const [upiPayment, setUpiPayment] = useState({
    upiId: '',
    amount: '',
    note: '',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  // Group transactions by category
  const getCategorizedTransactions = () => {
    const categorized = {};
    
    transactions.forEach(t => {
      const category = (t.category || 'uncategorized').toLowerCase();
      if (!categorized[category]) {
        categorized[category] = {
          transactions: [],
          total: 0,
          count: 0,
        };
      }
      categorized[category].transactions.push(t);
      categorized[category].total += parseFloat(t.amount);
      categorized[category].count++;
    });

    return Object.entries(categorized)
      .map(([category, data]) => ({
        category,
        ...data,
        icon: CATEGORY_ICONS[category] || CATEGORY_ICONS.default,
        color: CATEGORY_COLORS[category] || CATEGORY_COLORS.default,
      }))
      .sort((a, b) => b.total - a.total);
  };

  const filteredTransactions = transactions
    .filter(t => {
      if (searchQuery && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.transaction_date);
      const dateB = new Date(b.date || b.transaction_date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    try {
      await addTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        date: new Date().toISOString(),
      });
      setShowAddModal(false);
      setNewTransaction({
        description: '',
        amount: '',
        type: 'debit',
        category: '',
        bank_account_id: '',
      });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  // UPI Payment Handler - Shows AI categorization in real-time
  const handleUpiPayment = async () => {
    if (!upiPayment.upiId || !upiPayment.amount) {
      Alert.alert('Error', 'Please enter UPI ID and amount');
      return;
    }

    setIsCategorizingTxn(true);
    setCategorizationResult(null);

    try {
      // Extract merchant name from UPI ID
      const merchantName = upiPayment.upiId.split('@')[0];
      const description = upiPayment.note || `UPI Payment to ${merchantName}`;
      
      // Add transaction - this will trigger AI categorization on the backend
      const result = await addTransaction({
        description,
        merchant_name: merchantName,
        amount: parseFloat(upiPayment.amount),
        type: 'debit',
        date: new Date().toISOString(),
        payment_mode: 'upi',
      });

      // Show categorization result
      setCategorizationResult({
        success: true,
        transaction: result.transaction || result,
        category: result.transaction?.category || result.category,
        method: result.method || 'ai',
        confidence: result.confidence,
      });

      // Clear form after short delay
      setTimeout(() => {
        setShowUpiModal(false);
        setUpiPayment({ upiId: '', amount: '', note: '' });
        setCategorizationResult(null);
        fetchTransactions();
      }, 3000);

    } catch (error) {
      console.error('UPI Payment error:', error);
      setCategorizationResult({
        success: false,
        error: error.message,
      });
    } finally {
      setIsCategorizingTxn(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  const renderCategoryCard = ({ item }) => {
    const isExpanded = expandedCategory === item.category;
    
    return (
      <Card style={styles.categoryCard}>
        <TouchableOpacity 
          onPress={() => setExpandedCategory(isExpanded ? null : item.category)}
          activeOpacity={0.7}
        >
          <Card.Content style={styles.categoryCardContent}>
            <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
              <MaterialCommunityIcons 
                name={item.icon}
                size={28}
                color={item.color}
              />
            </View>
            
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('_', ' ')}
              </Text>
              <Text style={styles.categoryCount}>
                {item.count} transaction{item.count !== 1 ? 's' : ''}
              </Text>
            </View>

            <View style={styles.categoryTotal}>
              <Text style={[styles.categoryAmount, { color: item.color }]}>
                ₹{item.total.toLocaleString('en-IN')}
              </Text>
              <MaterialCommunityIcons 
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={theme.colors.gray500}
              />
            </View>
          </Card.Content>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedTransactions}>
            <Divider />
            {item.transactions.slice(0, 10).map((transaction, index) => (
              <View key={transaction.id || index} style={styles.expandedTransaction}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionDesc} numberOfLines={1}>
                    {transaction.description}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatDate(transaction.date || transaction.transaction_date)}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmountSmall, { 
                    color: transaction.type === 'credit' ? '#4CAF50' : '#F44336' 
                  }]}>
                    {transaction.type === 'credit' ? '+' : '-'}₹{Math.abs(parseFloat(transaction.amount)).toLocaleString('en-IN')}
                  </Text>
                  {transaction.method === 'ai' && (
                    <View style={styles.aiTagTiny}>
                      <MaterialCommunityIcons name="robot" size={10} color="#fff" />
                    </View>
                  )}
                </View>
              </View>
            ))}
            {item.transactions.length > 10 && (
              <Text style={styles.moreTransactions}>
                +{item.transactions.length - 10} more transactions
              </Text>
            )}
          </View>
        )}
      </Card>
    );
  };

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard}>
      <Card.Content style={styles.transactionContent}>
        <View style={[styles.iconContainer, { 
          backgroundColor: item.type === 'credit' ? '#E8F5E9' : '#FFEBEE' 
        }]}>
          <MaterialCommunityIcons 
            name={CATEGORY_ICONS[(item.category || '').toLowerCase()] || CATEGORY_ICONS.default}
            size={24}
            color={item.type === 'credit' ? '#4CAF50' : '#F44336'}
          />
        </View>
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescMain} numberOfLines={1}>
            {item.description}
          </Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionCategory}>
              {item.category || 'Uncategorized'}
            </Text>
            {item.method === 'ai' && (
              <>
                <Text style={styles.metaSeparator}>•</Text>
                <View style={styles.aiTagSmall}>
                  <MaterialCommunityIcons name="robot" size={10} color={theme.colors.primary} />
                  <Text style={styles.aiTagSmallText}>AI</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.transactionAmountContainer}>
          <Text style={[styles.amount, { 
            color: item.type === 'credit' ? '#4CAF50' : '#F44336' 
          }]}>
            {item.type === 'credit' ? '+' : '-'}₹{Math.abs(parseFloat(item.amount)).toLocaleString('en-IN')}
          </Text>
          <Text style={styles.transactionTime}>
            {new Date(item.date || item.transaction_date).toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const categorizedData = getCategorizedTransactions();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterRow}>
          {/* View Mode Toggle */}
          <SegmentedButtons
            value={viewMode}
            onValueChange={setViewMode}
            buttons={[
              { value: 'categories', label: 'Categories', icon: 'view-grid' },
              { value: 'list', label: 'List', icon: 'format-list-bulleted' },
            ]}
            style={styles.viewToggle}
          />
          
          <Menu
            visible={showFilterMenu}
            onDismiss={() => setShowFilterMenu(false)}
            anchor={
              <IconButton
                icon="filter-variant"
                onPress={() => setShowFilterMenu(true)}
                mode="contained"
                containerColor={theme.colors.gray100}
              />
            }
          >
            <Menu.Item 
              title="Newest First" 
              onPress={() => { setSortOrder('newest'); setShowFilterMenu(false); }}
              leadingIcon={sortOrder === 'newest' ? 'check' : undefined}
            />
            <Menu.Item 
              title="Oldest First" 
              onPress={() => { setSortOrder('oldest'); setShowFilterMenu(false); }}
              leadingIcon={sortOrder === 'oldest' ? 'check' : undefined}
            />
            <Divider />
            <Menu.Item 
              title="All Types" 
              onPress={() => { setTypeFilter('all'); setShowFilterMenu(false); }}
              leadingIcon={typeFilter === 'all' ? 'check' : undefined}
            />
            <Menu.Item 
              title="Income Only" 
              onPress={() => { setTypeFilter('credit'); setShowFilterMenu(false); }}
              leadingIcon={typeFilter === 'credit' ? 'check' : undefined}
            />
            <Menu.Item 
              title="Expenses Only" 
              onPress={() => { setTypeFilter('debit'); setShowFilterMenu(false); }}
              leadingIcon={typeFilter === 'debit' ? 'check' : undefined}
            />
          </Menu>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
          <MaterialCommunityIcons name="arrow-down" size={16} color="#4CAF50" />
          <Text style={[styles.summaryLabel, { color: '#4CAF50' }]}>Income</Text>
          <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
            ₹{totalIncome.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <MaterialCommunityIcons name="arrow-up" size={16} color="#F44336" />
          <Text style={[styles.summaryLabel, { color: '#F44336' }]}>Expense</Text>
          <Text style={[styles.summaryAmount, { color: '#F44336' }]}>
            ₹{totalExpense.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      {/* Content based on view mode */}
      {viewMode === 'categories' ? (
        <FlatList
          data={categorizedData}
          keyExtractor={(item) => item.category}
          renderItem={renderCategoryCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="folder-open" 
                size={64} 
                color={theme.colors.gray400} 
              />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Add transactions to see them organized by category
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderTransaction}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="credit-card-search" 
                size={64} 
                color={theme.colors.gray400} 
              />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try adjusting your search' : 'Your transactions will appear here'}
              </Text>
            </View>
          }
        />
      )}

      {/* FAB Group */}
      <View style={styles.fabContainer}>
        <FAB
          icon="send"
          label="Pay"
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => setShowUpiModal(true)}
          color="#fff"
        />
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setShowAddModal(true)}
          color="#fff"
        />
      </View>

      {/* UPI Payment Modal */}
      <Portal>
        <Modal
          visible={showUpiModal}
          onDismiss={() => {
            if (!isCategorizingTxn) {
              setShowUpiModal(false);
              setCategorizationResult(null);
            }
          }}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.upiModalHeader}>
            <MaterialCommunityIcons name="send" size={32} color={theme.colors.primary} />
            <Text style={styles.modalTitle}>UPI Payment</Text>
          </View>

          <Text style={styles.upiSubtitle}>
            Make a payment and watch AI categorize it in real-time
          </Text>

          <TextInput
            label="UPI ID (e.g., swiggy@upi)"
            value={upiPayment.upiId}
            onChangeText={(v) => setUpiPayment(prev => ({ ...prev, upiId: v }))}
            mode="outlined"
            style={styles.modalInput}
            left={<TextInput.Icon icon="at" />}
            disabled={isCategorizingTxn}
          />

          <TextInput
            label="Amount (₹)"
            value={upiPayment.amount}
            onChangeText={(v) => setUpiPayment(prev => ({ ...prev, amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
            left={<TextInput.Icon icon="currency-inr" />}
            disabled={isCategorizingTxn}
          />

          <TextInput
            label="Note (optional)"
            value={upiPayment.note}
            onChangeText={(v) => setUpiPayment(prev => ({ ...prev, note: v }))}
            mode="outlined"
            style={styles.modalInput}
            left={<TextInput.Icon icon="note-text" />}
            disabled={isCategorizingTxn}
          />

          {/* AI Categorization Status */}
          {isCategorizingTxn && (
            <View style={styles.categorizingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.categorizingText}>
                🤖 AI is categorizing your transaction...
              </Text>
            </View>
          )}

          {categorizationResult && (
            <View style={[
              styles.resultContainer, 
              { backgroundColor: categorizationResult.success ? '#E8F5E9' : '#FFEBEE' }
            ]}>
              {categorizationResult.success ? (
                <>
                  <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
                  <Text style={styles.resultTitle}>Payment Successful!</Text>
                  <View style={styles.resultCategory}>
                    <MaterialCommunityIcons 
                      name={CATEGORY_ICONS[(categorizationResult.category || '').toLowerCase()] || 'tag'}
                      size={24}
                      color={CATEGORY_COLORS[(categorizationResult.category || '').toLowerCase()] || theme.colors.primary}
                    />
                    <Text style={styles.resultCategoryText}>
                      Categorized as: {categorizationResult.category}
                    </Text>
                  </View>
                  <View style={styles.aiMethodBadge}>
                    <MaterialCommunityIcons name="robot" size={14} color="#fff" />
                    <Text style={styles.aiMethodText}>
                      {categorizationResult.method === 'ai' ? 'AI Categorized' : 'Auto Categorized'}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="alert-circle" size={32} color="#F44336" />
                  <Text style={styles.resultTitle}>Payment Failed</Text>
                  <Text style={styles.resultError}>{categorizationResult.error}</Text>
                </>
              )}
            </View>
          )}

          {!categorizationResult && (
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={() => setShowUpiModal(false)}
                disabled={isCategorizingTxn}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleUpiPayment}
                loading={isCategorizingTxn}
                disabled={isCategorizingTxn}
                icon="send"
              >
                Pay Now
              </Button>
            </View>
          )}
        </Modal>
      </Portal>

      {/* Add Transaction Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitleStandalone}>Add Transaction</Text>

          <SegmentedButtons
            value={newTransaction.type}
            onValueChange={(v) => setNewTransaction(prev => ({ ...prev, type: v }))}
            buttons={[
              { value: 'debit', label: 'Expense', icon: 'arrow-up' },
              { value: 'credit', label: 'Income', icon: 'arrow-down' },
            ]}
            style={styles.typeButtons}
          />

          <TextInput
            label="Description"
            value={newTransaction.description}
            onChangeText={(v) => setNewTransaction(prev => ({ ...prev, description: v }))}
            mode="outlined"
            style={styles.modalInput}
          />

          <TextInput
            label="Amount (₹)"
            value={newTransaction.amount}
            onChangeText={(v) => setNewTransaction(prev => ({ ...prev, amount: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />

          <Text style={styles.inputLabel}>Category (AI will auto-categorize if empty)</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.filter(c => c.key !== 'all').slice(0, 8).map(cat => (
              <Chip
                key={cat.key}
                selected={newTransaction.category === cat.key}
                onPress={() => setNewTransaction(prev => ({ ...prev, category: cat.key }))}
                style={styles.modalChip}
                compact
              >
                {cat.label}
              </Chip>
            ))}
          </View>

          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleAddTransaction}>
              Add Transaction
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
  header: {
    padding: spacing.md,
    backgroundColor: '#fff',
    ...shadows.small,
  },
  searchBar: {
    elevation: 0,
    backgroundColor: theme.colors.gray100,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  viewToggle: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    gap: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  listContent: {
    paddingBottom: 100,
  },
  // Category Card Styles
  categoryCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  categoryCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  categoryCount: {
    fontSize: 13,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  categoryTotal: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  expandedTransactions: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  expandedTransaction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  transactionLeft: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    color: theme.colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  transactionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  transactionAmountSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  aiTagTiny: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 2,
  },
  moreTransactions: {
    fontSize: 12,
    color: theme.colors.primary,
    textAlign: 'center',
    paddingTop: spacing.sm,
    fontWeight: '500',
  },
  // Transaction List Styles
  transactionCard: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 12,
    ...shadows.small,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescMain: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: theme.colors.gray500,
    textTransform: 'capitalize',
  },
  metaSeparator: {
    marginHorizontal: 4,
    color: theme.colors.gray400,
  },
  aiTagSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  aiTagSmallText: {
    fontSize: 9,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 2,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionTime: {
    fontSize: 11,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: spacing.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    gap: spacing.sm,
  },
  fab: {
    backgroundColor: theme.colors.primary,
  },
  fabSecondary: {
    backgroundColor: '#4CAF50',
  },
  modal: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: 16,
    maxHeight: '85%',
  },
  upiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  modalTitleStandalone: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  upiSubtitle: {
    fontSize: 13,
    color: theme.colors.gray500,
    marginBottom: spacing.lg,
  },
  typeButtons: {
    marginBottom: spacing.md,
  },
  modalInput: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalChip: {
    marginBottom: spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  categorizingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  categorizingText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: spacing.md,
    fontWeight: '500',
  },
  resultContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    marginTop: spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: spacing.sm,
  },
  resultCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  resultCategoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  aiMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginTop: spacing.md,
  },
  aiMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: spacing.xs,
  },
  resultError: {
    fontSize: 13,
    color: '#F44336',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
