import React, { useState, useEffect } from 'react';
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
  SegmentedButtons,
  HelperText,
  Menu,
  Divider,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const categories = [
  'Food & Dining', 'Shopping', 'Groceries', 'Transportation',
  'Subscriptions', 'Entertainment', 'Healthcare', 'Education',
  'Bills & Utilities', 'EMI', 'Investments', 'Insurance', 'Rent', 'Travel',
  'Salary', 'Freelance', 'Investment Returns', 'Interest', 'Other Income', 'Other Expense'
];

const AddTransactionScreen = ({ navigation }) => {
  const [type, setType] = useState('debit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [merchantName, setMerchantName] = useState('');
  const [category, setCategory] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await api.bankAccounts.getAll();
      setBankAccounts(response.accounts || []);
      if (response.accounts?.length > 0) {
        const primary = response.accounts.find(a => a.is_primary) || response.accounts[0];
        setBankAccountId(primary.id);
      }
    } catch (error) {
      console.error('Fetch accounts error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!bankAccountId) {
      setError('Please select a bank account');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.transactions.add({
        type,
        amount: parseFloat(amount),
        description,
        merchantName,
        category: category || undefined,
        bankAccountId,
        transactionDate: new Date().toISOString(),
      });

      navigation.goBack();
    } catch (error) {
      setError(error.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = bankAccounts.find(a => a.id === bankAccountId);
  const incomeCategories = categories.filter(c => 
    ['Salary', 'Freelance', 'Investment Returns', 'Interest', 'Other Income'].includes(c)
  );
  const expenseCategories = categories.filter(c => 
    !['Salary', 'Freelance', 'Investment Returns', 'Interest', 'Other Income'].includes(c)
  );
  const filteredCategories = type === 'credit' ? incomeCategories : expenseCategories;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Transaction Type */}
        <Text style={styles.label}>Transaction Type</Text>
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={[
            {
              value: 'debit',
              label: 'Expense',
              icon: 'arrow-up',
            },
            {
              value: 'credit',
              label: 'Income',
              icon: 'arrow-down',
            },
          ]}
          style={styles.segmentedButtons}
        />

        {/* Amount */}
        <TextInput
          label="Amount (₹)"
          value={amount}
          onChangeText={setAmount}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="currency-inr" />}
        />

        {/* Bank Account */}
        <Text style={styles.label}>Bank Account</Text>
        <Menu
          visible={accountMenuVisible}
          onDismiss={() => setAccountMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setAccountMenuVisible(true)}
              style={styles.menuButton}
              contentStyle={styles.menuButtonContent}
            >
              {selectedAccount
                ? `${selectedAccount.bank_name} - ${selectedAccount.account_number?.slice(-4)}`
                : 'Select Account'}
            </Button>
          }
        >
          {bankAccounts.map((account) => (
            <Menu.Item
              key={account.id}
              onPress={() => {
                setBankAccountId(account.id);
                setAccountMenuVisible(false);
              }}
              title={`${account.bank_name} - ${account.account_number?.slice(-4)}`}
            />
          ))}
        </Menu>

        {/* Description */}
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="text" />}
        />

        {/* Merchant Name */}
        <TextInput
          label="Merchant/Payee Name (Optional)"
          value={merchantName}
          onChangeText={setMerchantName}
          mode="outlined"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          left={<TextInput.Icon icon="store" />}
        />

        {/* Category */}
        <Text style={styles.label}>Category (Auto-detected if empty)</Text>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setCategoryMenuVisible(true)}
              style={styles.menuButton}
              contentStyle={styles.menuButtonContent}
            >
              {category || 'Select Category (Optional)'}
            </Button>
          }
        >
          <ScrollView style={{ maxHeight: 300 }}>
            {filteredCategories.map((cat) => (
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
          Add Transaction
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
  segmentedButtons: {
    marginBottom: spacing.md,
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
  submitButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
});

export default AddTransactionScreen;
