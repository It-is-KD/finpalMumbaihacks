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
  Chip,
  Searchbar,
  Menu,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import api from '../../api';

const categories = [
  'All', 'Food & Dining', 'Shopping', 'Groceries', 'Transportation',
  'Subscriptions', 'Entertainment', 'Healthcare', 'Education',
  'Bills & Utilities', 'EMI', 'Investments', 'Insurance', 'Rent', 'Travel'
];

const TransactionsScreen = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const fetchTransactions = async () => {
    try {
      const params = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (selectedType !== 'all') {
        params.type = selectedType;
      }
      
      const response = await api.transactions.getAll(params);
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Fetch transactions error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedCategory, selectedType]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [selectedCategory, selectedType]);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      tx.merchant_name?.toLowerCase().includes(searchLower) ||
      tx.description?.toLowerCase().includes(searchLower) ||
      tx.category?.toLowerCase().includes(searchLower)
    );
  });

  const renderTransaction = ({ item }) => (
    <Card style={styles.transactionCard} mode="elevated">
      <Card.Content style={styles.transactionContent}>
        <View style={styles.transactionIcon}>
          <MaterialCommunityIcons
            name={item.type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={32}
            color={item.type === 'credit' ? colors.success : colors.error}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionMerchant}>
            {item.merchant_name || item.description || 'Transaction'}
          </Text>
          <View style={styles.transactionMeta}>
            <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>
              {item.category}
            </Chip>
            <Text style={styles.transactionDate}>{formatDate(item.transaction_date)}</Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.type === 'credit' ? colors.success : colors.error },
          ]}
        >
          {item.type === 'credit' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="Search transactions..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        iconColor={colors.gray}
      />

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['all', 'debit', 'credit']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedType === item}
              onPress={() => setSelectedType(item)}
              style={[
                styles.filterChip,
                selectedType === item && styles.filterChipSelected,
              ]}
              textStyle={[
                styles.filterChipText,
                selectedType === item && styles.filterChipTextSelected,
              ]}
            >
              {item === 'all' ? 'All' : item === 'credit' ? 'Income' : 'Expense'}
            </Chip>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Category Filter */}
      <View style={styles.categoryFilterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Chip
              selected={selectedCategory === item}
              onPress={() => setSelectedCategory(item)}
              style={[
                styles.categoryFilterChip,
                selectedCategory === item && styles.categoryFilterChipSelected,
              ]}
              textStyle={[
                styles.categoryFilterChipText,
                selectedCategory === item && styles.categoryFilterChipTextSelected,
              ]}
            >
              {item}
            </Chip>
          )}
          contentContainerStyle={styles.categoryFilterList}
        />
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
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
            <MaterialCommunityIcons name="receipt" size={64} color={colors.gray} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
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
  searchBar: {
    margin: spacing.md,
    backgroundColor: colors.white,
    elevation: 2,
  },
  filterContainer: {
    marginBottom: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.md,
  },
  filterChip: {
    marginRight: spacing.sm,
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
  categoryFilterContainer: {
    marginBottom: spacing.sm,
  },
  categoryFilterList: {
    paddingHorizontal: spacing.md,
  },
  categoryFilterChip: {
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  categoryFilterChipSelected: {
    backgroundColor: colors.secondary,
  },
  categoryFilterChipText: {
    color: colors.text,
    fontSize: 12,
  },
  categoryFilterChipTextSelected: {
    color: colors.white,
    fontSize: 12,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  transactionCard: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    marginRight: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    height: 24,
    marginRight: spacing.sm,
    backgroundColor: colors.lightGray,
  },
  categoryChipText: {
    fontSize: 10,
    lineHeight: 12,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.gray,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.gray,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
});

export default TransactionsScreen;
