import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  FAB,
  IconButton,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  Menu,
  Divider,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const BankAccountsScreen = ({ navigation }) => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState({});

  // Form state
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState('savings');
  const [balance, setBalance] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.bankAccounts.getAll();
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error('Fetch accounts error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const handleAddAccount = async () => {
    if (!bankName.trim()) {
      setFormError('Please enter bank name');
      return;
    }
    if (!accountNumber.trim() || accountNumber.length < 4) {
      setFormError('Please enter valid account number');
      return;
    }
    if (!balance || parseFloat(balance) < 0) {
      setFormError('Please enter valid balance');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.bankAccounts.add({
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        balance: parseFloat(balance),
      });

      // Reset form
      setBankName('');
      setAccountNumber('');
      setAccountType('savings');
      setBalance('');
      setAddDialogVisible(false);

      fetchAccounts();
    } catch (error) {
      setFormError(error.message || 'Failed to add account');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetPrimary = async (accountId) => {
    try {
      await api.bankAccounts.setPrimary(accountId);
      fetchAccounts();
    } catch (error) {
      console.error('Set primary error:', error);
    }
    setMenuVisible({});
  };

  const handleDeleteAccount = async (accountId) => {
    try {
      await api.bankAccounts.delete(accountId);
      fetchAccounts();
    } catch (error) {
      console.error('Delete account error:', error);
    }
    setMenuVisible({});
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'savings':
        return 'piggy-bank';
      case 'current':
        return 'briefcase';
      case 'salary':
        return 'cash';
      case 'credit':
        return 'credit-card';
      default:
        return 'bank';
    }
  };

  const formatAccountNumber = (number) => {
    if (!number) return '';
    return `XXXX XXXX ${number.slice(-4)}`;
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
        {/* Total Balance Card */}
        <Card style={styles.totalCard}>
          <Card.Content>
            <Text style={styles.totalLabel}>Total Balance</Text>
            <Text style={styles.totalAmount}>
              ₹{accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.accountCount}>
              Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </Text>
          </Card.Content>
        </Card>

        {/* Bank Accounts List */}
        {accounts.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No Bank Accounts</Text>
              <Text style={styles.emptyText}>
                Add your bank accounts to track your finances better
              </Text>
              <Button
                mode="contained"
                onPress={() => setAddDialogVisible(true)}
                style={styles.addButton}
              >
                Add Account
              </Button>
            </Card.Content>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} style={styles.accountCard}>
              <Card.Content>
                <View style={styles.accountHeader}>
                  <View style={styles.accountInfo}>
                    <View style={styles.bankNameRow}>
                      <IconButton
                        icon={getAccountIcon(account.account_type)}
                        size={24}
                        style={styles.accountIcon}
                        iconColor={colors.primary}
                      />
                      <View>
                        <Text style={styles.bankName}>{account.bank_name}</Text>
                        <Text style={styles.accountNumber}>
                          {formatAccountNumber(account.account_number)}
                        </Text>
                      </View>
                    </View>
                    {account.is_primary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  
                  <Menu
                    visible={menuVisible[account.id]}
                    onDismiss={() => setMenuVisible({})}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        onPress={() => setMenuVisible({ [account.id]: true })}
                      />
                    }
                  >
                    {!account.is_primary && (
                      <Menu.Item
                        onPress={() => handleSetPrimary(account.id)}
                        title="Set as Primary"
                        leadingIcon="star"
                      />
                    )}
                    <Divider />
                    <Menu.Item
                      onPress={() => handleDeleteAccount(account.id)}
                      title="Delete"
                      leadingIcon="delete"
                      titleStyle={{ color: colors.error }}
                    />
                  </Menu>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.balanceRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Current Balance</Text>
                    <Text style={styles.balanceAmount}>
                      ₹{parseFloat(account.balance || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.accountTypeBadge}>
                    <Text style={styles.accountTypeText}>
                      {account.account_type?.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Account FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setAddDialogVisible(true)}
        color={colors.white}
      />

      {/* Add Account Dialog */}
      <Portal>
        <Dialog
          visible={addDialogVisible}
          onDismiss={() => setAddDialogVisible(false)}
        >
          <Dialog.Title>Add Bank Account</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Bank Name"
              value={bankName}
              onChangeText={setBankName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Account Number"
              value={accountNumber}
              onChangeText={setAccountNumber}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <TextInput
              label="Current Balance (₹)"
              value={balance}
              onChangeText={setBalance}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            
            <Text style={styles.typeLabel}>Account Type</Text>
            <View style={styles.typeButtons}>
              {['savings', 'current', 'salary', 'credit'].map((type) => (
                <Button
                  key={type}
                  mode={accountType === type ? 'contained' : 'outlined'}
                  onPress={() => setAccountType(type)}
                  style={styles.typeButton}
                  compact
                >
                  {type}
                </Button>
              ))}
            </View>

            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddAccount}
              loading={formLoading}
              disabled={formLoading}
            >
              Add
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  totalCard: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginVertical: spacing.sm,
  },
  accountCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyCard: {
    backgroundColor: colors.white,
  },
  emptyContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  accountCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  accountInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIcon: {
    backgroundColor: colors.lightGray,
    margin: 0,
    marginRight: spacing.sm,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  accountNumber: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  divider: {
    marginVertical: spacing.md,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  accountTypeBadge: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  accountTypeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
  typeLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeButton: {
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: spacing.sm,
  },
});

export default BankAccountsScreen;
