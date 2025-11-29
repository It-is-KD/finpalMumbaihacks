<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Card, Avatar, Button, TextInput, List, Divider, IconButton, Portal, Modal, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { transactions, goals, budgets } = useData();
  const [editing, setEditing] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [editedProfile, setEditedProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [newBank, setNewBank] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings',
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const accounts = await api.getBankAccounts();
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLinkBank = async () => {
    if (!newBank.bank_name || !newBank.account_number) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await api.linkBankAccount(newBank);
      setShowBankModal(false);
      setNewBank({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_type: 'savings',
      });
      loadBankAccounts();
      Alert.alert('Success', 'Bank account linked successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to link bank account');
    }
  };

  const handleUnlinkBank = async (accountId) => {
    Alert.alert(
      'Unlink Account',
      'Are you sure you want to unlink this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlink', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.unlinkBankAccount(accountId);
              loadBankAccounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to unlink account');
            }
          }
        },
      ]
    );
  };

  // Calculate stats
  const totalTransactions = transactions.length;
  const totalSpent = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  
  // Financial health score (simple calculation)
  const healthScore = Math.min(100, Math.max(0, 
    50 + 
    (completedGoals * 10) - 
    (budgets.filter(b => b.spent > b.limit_amount).length * 15) +
    (bankAccounts.length * 5)
  ));

  const getHealthColor = (score) => {
    if (score >= 70) return '#4CAF50';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getHealthLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={80} 
            label={user?.name?.charAt(0)?.toUpperCase() || 'U'} 
            style={styles.avatar}
          />
          <View style={[styles.subscriptionBadge, { 
            backgroundColor: user?.subscription === 'paid' ? '#FFD700' : theme.colors.gray400 
          }]}>
            <MaterialCommunityIcons 
              name={user?.subscription === 'paid' ? 'crown' : 'account'} 
              size={14} 
              color="#fff" 
            />
          </View>
        </View>
        
        {!editing ? (
          <>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.subscriptionText}>
              {user?.subscription === 'paid' ? '⭐ Premium Member' : 'Free Plan'}
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => setEditing(true)}
              style={styles.editButton}
              icon="pencil"
              compact
            >
              Edit Profile
            </Button>
          </>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              label="Name"
              value={editedProfile.name}
              onChangeText={(v) => setEditedProfile(prev => ({ ...prev, name: v }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={editedProfile.phone}
              onChangeText={(v) => setEditedProfile(prev => ({ ...prev, phone: v }))}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={styles.editButtons}>
              <Button mode="outlined" onPress={() => setEditing(false)}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSaveProfile}>
                Save
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* Financial Health Score */}
      <Card style={styles.healthCard}>
        <Card.Content>
          <View style={styles.healthHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color={getHealthColor(healthScore)} />
            <Text style={styles.healthTitle}>Financial Health</Text>
          </View>
          
          <View style={styles.healthScore}>
            <Text style={[styles.scoreNumber, { color: getHealthColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          
          <ProgressBar 
            progress={healthScore / 100} 
            color={getHealthColor(healthScore)}
            style={styles.healthProgress}
          />
          
          <Text style={[styles.healthLabel, { color: getHealthColor(healthScore) }]}>
            {getHealthLabel(healthScore)}
          </Text>
        </Card.Content>
      </Card>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="credit-card" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{totalTransactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cash" size={24} color="#F44336" />
              <Text style={styles.statValue}>₹{(totalSpent / 1000).toFixed(1)}K</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="target" size={24} color={theme.colors.secondary} />
              <Text style={styles.statValue}>{activeGoals}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{completedGoals}</Text>
              <Text style={styles.statLabel}>Goals Done</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Linked Bank Accounts */}
      <Card style={styles.bankCard}>
        <Card.Content>
          <View style={styles.bankHeader}>
            <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
            <IconButton
              icon="plus"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor="#fff"
              size={20}
              onPress={() => setShowBankModal(true)}
            />
          </View>
          
          {bankAccounts.length === 0 ? (
            <View style={styles.emptyBank}>
              <MaterialCommunityIcons name="bank-off" size={48} color={theme.colors.gray400} />
              <Text style={styles.emptyBankText}>No bank accounts linked</Text>
              <Button 
                mode="contained" 
                onPress={() => setShowBankModal(true)}
                style={styles.linkBankButton}
              >
                Link Bank Account
              </Button>
            </View>
          ) : (
            bankAccounts.map((account, index) => (
              <View key={account.id}>
                {index > 0 && <Divider />}
                <List.Item
                  title={account.bank_name}
                  description={`****${account.account_number.slice(-4)} • ${account.account_type}`}
                  left={props => (
                    <View style={styles.bankIcon}>
                      <MaterialCommunityIcons name="bank" size={24} color={theme.colors.primary} />
                    </View>
                  )}
                  right={props => (
                    <IconButton
                      icon="link-off"
                      iconColor="#F44336"
                      size={20}
                      onPress={() => handleUnlinkBank(account.id)}
                    />
                  )}
                  style={styles.bankItem}
                />
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Member Since */}
      <View style={styles.memberInfo}>
        <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.gray500} />
        <Text style={styles.memberText}>
          Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Text>
      </View>

      <View style={{ height: 40 }} />

      {/* Link Bank Modal */}
      <Portal>
        <Modal
          visible={showBankModal}
          onDismiss={() => setShowBankModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Link Bank Account</Text>
          
          <TextInput
            label="Bank Name"
            value={newBank.bank_name}
            onChangeText={(v) => setNewBank(prev => ({ ...prev, bank_name: v }))}
            mode="outlined"
            style={styles.modalInput}
          />
          
          <TextInput
            label="Account Number"
            value={newBank.account_number}
            onChangeText={(v) => setNewBank(prev => ({ ...prev, account_number: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />
          
          <TextInput
            label="IFSC Code"
            value={newBank.ifsc_code}
            onChangeText={(v) => setNewBank(prev => ({ ...prev, ifsc_code: v.toUpperCase() }))}
            mode="outlined"
            autoCapitalize="characters"
            style={styles.modalInput}
          />
          
          <View style={styles.accountTypeRow}>
            <Text style={styles.accountTypeLabel}>Account Type:</Text>
            <View style={styles.accountTypeButtons}>
              <Button
                mode={newBank.account_type === 'savings' ? 'contained' : 'outlined'}
                onPress={() => setNewBank(prev => ({ ...prev, account_type: 'savings' }))}
                compact
                style={styles.accountTypeBtn}
              >
                Savings
              </Button>
              <Button
                mode={newBank.account_type === 'current' ? 'contained' : 'outlined'}
                onPress={() => setNewBank(prev => ({ ...prev, account_type: 'current' }))}
                compact
                style={styles.accountTypeBtn}
              >
                Current
              </Button>
            </View>
          </View>
          
          <View style={styles.securityNote}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
            <Text style={styles.securityNoteText}>
              Your bank details are encrypted and stored securely
              {user?.subscription === 'paid' && ' on blockchain'}
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowBankModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleLinkBank}>
              Link Account
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadows.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  subscriptionBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginTop: 4,
  },
  subscriptionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  editButton: {
    marginTop: spacing.md,
  },
  editForm: {
    width: '100%',
    paddingTop: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  healthCard: {
    margin: spacing.md,
    borderRadius: 16,
    ...shadows.small,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 20,
    color: theme.colors.gray500,
  },
  healthProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  healthLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: 16,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray600,
    marginTop: 2,
  },
  bankCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: 16,
    ...shadows.small,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyBank: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyBankText: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: spacing.md,
  },
  linkBankButton: {
    marginTop: spacing.md,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankItem: {
    paddingVertical: spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  memberText: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginLeft: spacing.xs,
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
  modalInput: {
    marginBottom: spacing.md,
  },
  accountTypeRow: {
    marginBottom: spacing.md,
  },
  accountTypeLabel: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accountTypeBtn: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: spacing.sm,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
});
=======
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { Text, Card, Avatar, Button, TextInput, List, Divider, IconButton, Portal, Modal, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const { transactions, goals, budgets } = useData();
  const [editing, setEditing] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [editedProfile, setEditedProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [newBank, setNewBank] = useState({
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings',
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const accounts = await api.getBankAccounts();
      setBankAccounts(accounts);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(editedProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleLinkBank = async () => {
    if (!newBank.bank_name || !newBank.account_number) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await api.linkBankAccount(newBank);
      setShowBankModal(false);
      setNewBank({
        bank_name: '',
        account_number: '',
        ifsc_code: '',
        account_type: 'savings',
      });
      loadBankAccounts();
      Alert.alert('Success', 'Bank account linked successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to link bank account');
    }
  };

  const handleUnlinkBank = async (accountId) => {
    Alert.alert(
      'Unlink Account',
      'Are you sure you want to unlink this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unlink', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.unlinkBankAccount(accountId);
              loadBankAccounts();
            } catch (error) {
              Alert.alert('Error', 'Failed to unlink account');
            }
          }
        },
      ]
    );
  };

  // Calculate stats
  const totalTransactions = transactions.length;
  const totalSpent = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  
  // Financial health score (simple calculation)
  const healthScore = Math.min(100, Math.max(0, 
    50 + 
    (completedGoals * 10) - 
    (budgets.filter(b => b.spent > b.limit_amount).length * 15) +
    (bankAccounts.length * 5)
  ));

  const getHealthColor = (score) => {
    if (score >= 70) return '#4CAF50';
    if (score >= 40) return '#FF9800';
    return '#F44336';
  };

  const getHealthLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Good';
    return 'Needs Improvement';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={80} 
            label={user?.name?.charAt(0)?.toUpperCase() || 'U'} 
            style={styles.avatar}
          />
          <View style={[styles.subscriptionBadge, { 
            backgroundColor: user?.subscription === 'paid' ? '#FFD700' : theme.colors.gray400 
          }]}>
            <MaterialCommunityIcons 
              name={user?.subscription === 'paid' ? 'crown' : 'account'} 
              size={14} 
              color="#fff" 
            />
          </View>
        </View>
        
        {!editing ? (
          <>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.subscriptionText}>
              {user?.subscription === 'paid' ? '⭐ Premium Member' : 'Free Plan'}
            </Text>
            <Button 
              mode="outlined" 
              onPress={() => setEditing(true)}
              style={styles.editButton}
              icon="pencil"
              compact
            >
              Edit Profile
            </Button>
          </>
        ) : (
          <View style={styles.editForm}>
            <TextInput
              label="Name"
              value={editedProfile.name}
              onChangeText={(v) => setEditedProfile(prev => ({ ...prev, name: v }))}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Phone"
              value={editedProfile.phone}
              onChangeText={(v) => setEditedProfile(prev => ({ ...prev, phone: v }))}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={styles.editButtons}>
              <Button mode="outlined" onPress={() => setEditing(false)}>
                Cancel
              </Button>
              <Button mode="contained" onPress={handleSaveProfile}>
                Save
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* Financial Health Score */}
      <Card style={styles.healthCard}>
        <Card.Content>
          <View style={styles.healthHeader}>
            <MaterialCommunityIcons name="heart-pulse" size={24} color={getHealthColor(healthScore)} />
            <Text style={styles.healthTitle}>Financial Health</Text>
          </View>
          
          <View style={styles.healthScore}>
            <Text style={[styles.scoreNumber, { color: getHealthColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          
          <ProgressBar 
            progress={healthScore / 100} 
            color={getHealthColor(healthScore)}
            style={styles.healthProgress}
          />
          
          <Text style={[styles.healthLabel, { color: getHealthColor(healthScore) }]}>
            {getHealthLabel(healthScore)}
          </Text>
        </Card.Content>
      </Card>

      {/* Stats */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="credit-card" size={24} color={theme.colors.primary} />
              <Text style={styles.statValue}>{totalTransactions}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cash" size={24} color="#F44336" />
              <Text style={styles.statValue}>₹{(totalSpent / 1000).toFixed(1)}K</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="target" size={24} color={theme.colors.secondary} />
              <Text style={styles.statValue}>{activeGoals}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{completedGoals}</Text>
              <Text style={styles.statLabel}>Goals Done</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Linked Bank Accounts */}
      <Card style={styles.bankCard}>
        <Card.Content>
          <View style={styles.bankHeader}>
            <Text style={styles.sectionTitle}>Linked Bank Accounts</Text>
            <IconButton
              icon="plus"
              mode="contained"
              containerColor={theme.colors.primary}
              iconColor="#fff"
              size={20}
              onPress={() => setShowBankModal(true)}
            />
          </View>
          
          {bankAccounts.length === 0 ? (
            <View style={styles.emptyBank}>
              <MaterialCommunityIcons name="bank-off" size={48} color={theme.colors.gray400} />
              <Text style={styles.emptyBankText}>No bank accounts linked</Text>
              <Button 
                mode="contained" 
                onPress={() => setShowBankModal(true)}
                style={styles.linkBankButton}
              >
                Link Bank Account
              </Button>
            </View>
          ) : (
            bankAccounts.map((account, index) => (
              <View key={account.id}>
                {index > 0 && <Divider />}
                <List.Item
                  title={account.bank_name}
                  description={`****${account.account_number.slice(-4)} • ${account.account_type}`}
                  left={props => (
                    <View style={styles.bankIcon}>
                      <MaterialCommunityIcons name="bank" size={24} color={theme.colors.primary} />
                    </View>
                  )}
                  right={props => (
                    <IconButton
                      icon="link-off"
                      iconColor="#F44336"
                      size={20}
                      onPress={() => handleUnlinkBank(account.id)}
                    />
                  )}
                  style={styles.bankItem}
                />
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Member Since */}
      <View style={styles.memberInfo}>
        <MaterialCommunityIcons name="calendar-check" size={16} color={theme.colors.gray500} />
        <Text style={styles.memberText}>
          Member since {new Date(user?.created_at || Date.now()).toLocaleDateString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </Text>
      </View>

      <View style={{ height: 40 }} />

      {/* Link Bank Modal */}
      <Portal>
        <Modal
          visible={showBankModal}
          onDismiss={() => setShowBankModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Link Bank Account</Text>
          
          <TextInput
            label="Bank Name"
            value={newBank.bank_name}
            onChangeText={(v) => setNewBank(prev => ({ ...prev, bank_name: v }))}
            mode="outlined"
            style={styles.modalInput}
          />
          
          <TextInput
            label="Account Number"
            value={newBank.account_number}
            onChangeText={(v) => setNewBank(prev => ({ ...prev, account_number: v }))}
            mode="outlined"
            keyboardType="numeric"
            style={styles.modalInput}
          />
          
          <TextInput
            label="IFSC Code"
            value={newBank.ifsc_code}
            onChangeText={(v) => setNewBank(prev => ({ ...prev, ifsc_code: v.toUpperCase() }))}
            mode="outlined"
            autoCapitalize="characters"
            style={styles.modalInput}
          />
          
          <View style={styles.accountTypeRow}>
            <Text style={styles.accountTypeLabel}>Account Type:</Text>
            <View style={styles.accountTypeButtons}>
              <Button
                mode={newBank.account_type === 'savings' ? 'contained' : 'outlined'}
                onPress={() => setNewBank(prev => ({ ...prev, account_type: 'savings' }))}
                compact
                style={styles.accountTypeBtn}
              >
                Savings
              </Button>
              <Button
                mode={newBank.account_type === 'current' ? 'contained' : 'outlined'}
                onPress={() => setNewBank(prev => ({ ...prev, account_type: 'current' }))}
                compact
                style={styles.accountTypeBtn}
              >
                Current
              </Button>
            </View>
          </View>
          
          <View style={styles.securityNote}>
            <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
            <Text style={styles.securityNoteText}>
              Your bank details are encrypted and stored securely
              {user?.subscription === 'paid' && ' on blockchain'}
            </Text>
          </View>
          
          <View style={styles.modalButtons}>
            <Button mode="outlined" onPress={() => setShowBankModal(false)}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleLinkBank}>
              Link Account
            </Button>
          </View>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...shadows.medium,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  subscriptionBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginTop: 4,
  },
  subscriptionText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: spacing.sm,
  },
  editButton: {
    marginTop: spacing.md,
  },
  editForm: {
    width: '100%',
    paddingTop: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  healthCard: {
    margin: spacing.md,
    borderRadius: 16,
    ...shadows.small,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 20,
    color: theme.colors.gray500,
  },
  healthProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  healthLabel: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: 16,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: theme.colors.gray100,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.gray600,
    marginTop: 2,
  },
  bankCard: {
    margin: spacing.md,
    marginTop: 0,
    borderRadius: 16,
    ...shadows.small,
  },
  bankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyBank: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyBankText: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: spacing.md,
  },
  linkBankButton: {
    marginTop: spacing.md,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankItem: {
    paddingVertical: spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  memberText: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginLeft: spacing.xs,
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
  modalInput: {
    marginBottom: spacing.md,
  },
  accountTypeRow: {
    marginBottom: spacing.md,
  },
  accountTypeLabel: {
    fontSize: 14,
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  accountTypeBtn: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  securityNoteText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: spacing.sm,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
