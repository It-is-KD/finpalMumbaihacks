<<<<<<< HEAD
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, List, Switch, Divider, Button, Portal, Modal, RadioButton, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { theme, spacing, shadows } from '../theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateSubscription } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally cached data. You will need to sync again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'Cache cleared successfully');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        },
      ]
    );
  };

  const handleUpgrade = async () => {
    try {
      await updateSubscription('paid');
      setShowUpgradeModal(false);
      Alert.alert('Success', 'Your account has been upgraded to Premium!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Account Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <List.Item
            title="Profile"
            description={user?.email || 'Not logged in'}
            left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Profile')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Subscription"
            description={user?.subscription === 'paid' ? 'Premium Plan' : 'Free Plan'}
            left={props => <List.Icon {...props} icon="crown" color={user?.subscription === 'paid' ? '#FFD700' : theme.colors.gray500} />}
            right={props => user?.subscription !== 'paid' && (
              <Button mode="contained" compact onPress={() => setShowUpgradeModal(true)}>
                Upgrade
              </Button>
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Linked Accounts"
            description="Manage your bank connections"
            left={props => <List.Icon {...props} icon="bank" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('BankAccounts')}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Notifications Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <List.Item
            title="Push Notifications"
            description="Receive app notifications"
            left={props => <List.Icon {...props} icon="bell" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Budget Alerts"
            description="Get notified when nearing budget limits"
            left={props => <List.Icon {...props} icon="alert-circle" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={budgetAlerts}
                onValueChange={setBudgetAlerts}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Weekly Reports"
            description="Receive weekly spending summaries"
            left={props => <List.Icon {...props} icon="chart-bar" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={weeklyReport}
                onValueChange={setWeeklyReport}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Preferences Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <List.Item
            title="Currency"
            description={currency === 'INR' ? 'Indian Rupee (₹)' : currency}
            left={props => <List.Icon {...props} icon="currency-inr" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowCurrencyModal(true)}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            left={props => <List.Icon {...props} icon="weather-night" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Privacy & Security Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <List.Item
            title="Privacy Settings"
            description="Manage data sharing preferences"
            left={props => <List.Icon {...props} icon="shield-account" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowPrivacyModal(true)}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Blockchain Storage"
            description={user?.subscription === 'paid' ? 'Enabled' : 'Premium feature'}
            left={props => <List.Icon {...props} icon="cube-outline" color={user?.subscription === 'paid' ? '#4CAF50' : theme.colors.gray500} />}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Export Data"
            description="Download your data"
            left={props => <List.Icon {...props} icon="download" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Export', 'Your data export will be sent to your email.')}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Support Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <List.Item
            title="Help Center"
            description="FAQs and guides"
            left={props => <List.Icon {...props} icon="help-circle" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Linking.openURL('https://finpal.app/help')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Contact Support"
            description="Get help from our team"
            left={props => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Linking.openURL('mailto:support@finpal.app')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Rate App"
            description="Share your feedback"
            left={props => <List.Icon {...props} icon="star" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Thanks!', 'Thank you for your support!')}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.section, styles.dangerSection]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: '#F44336' }]}>Danger Zone</Text>
          
          <List.Item
            title="Clear Cache"
            description="Clear locally stored data"
            left={props => <List.Icon {...props} icon="delete-sweep" color="#F44336" />}
            onPress={handleClearCache}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Delete Account"
            description="Permanently delete your account"
            left={props => <List.Icon {...props} icon="account-remove" color="#F44336" />}
            onPress={handleDeleteAccount}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#F44336"
        icon="logout"
      >
        Logout
      </Button>

      {/* App Version */}
      <Text style={styles.version}>FinPal v1.0.0</Text>

      <View style={{ height: 40 }} />

      {/* Currency Modal */}
      <Portal>
        <Modal
          visible={showCurrencyModal}
          onDismiss={() => setShowCurrencyModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Select Currency</Text>
          <RadioButton.Group onValueChange={value => { setCurrency(value); setShowCurrencyModal(false); }} value={currency}>
            <RadioButton.Item label="Indian Rupee (₹)" value="INR" />
            <RadioButton.Item label="US Dollar ($)" value="USD" />
            <RadioButton.Item label="Euro (€)" value="EUR" />
            <RadioButton.Item label="British Pound (£)" value="GBP" />
          </RadioButton.Group>
        </Modal>
      </Portal>

      {/* Privacy Modal */}
      <Portal>
        <Modal
          visible={showPrivacyModal}
          onDismiss={() => setShowPrivacyModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Privacy Settings</Text>
          
          <View style={styles.privacyOption}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyLabel}>AI Learning</Text>
              <Text style={styles.privacyDesc}>
                Allow AI to learn from your transactions to improve recommendations
              </Text>
            </View>
            <Switch 
              value={user?.subscription !== 'paid'} 
              disabled={user?.subscription === 'paid'}
              color={theme.colors.primary}
            />
          </View>
          
          {user?.subscription !== 'paid' && (
            <View style={styles.privacyNote}>
              <MaterialCommunityIcons name="information" size={16} color={theme.colors.secondary} />
              <Text style={styles.privacyNoteText}>
                Upgrade to Premium to disable AI learning and store data on blockchain for complete privacy.
              </Text>
            </View>
          )}
          
          <Button 
            mode="contained" 
            onPress={() => setShowPrivacyModal(false)}
            style={styles.modalButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>

      {/* Upgrade Modal */}
      <Portal>
        <Modal
          visible={showUpgradeModal}
          onDismiss={() => setShowUpgradeModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.upgradeHeader}>
            <MaterialCommunityIcons name="crown" size={48} color="#FFD700" />
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
          </View>
          
          <View style={styles.upgradeFeatures}>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Blockchain-secured data storage</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Complete privacy - no AI learning</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Advanced investment insights</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Priority support</Text>
            </View>
          </View>
          
          <Text style={styles.upgradePrice}>₹199/month</Text>
          
          <Button 
            mode="contained" 
            onPress={handleUpgrade}
            style={styles.upgradeButton}
          >
            Upgrade Now
          </Button>
          
          <Button 
            mode="text" 
            onPress={() => setShowUpgradeModal(false)}
          >
            Maybe Later
          </Button>
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
  section: {
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 16,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  listItem: {
    paddingVertical: spacing.sm,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutButton: {
    margin: spacing.md,
    borderColor: '#F44336',
  },
  version: {
    textAlign: 'center',
    color: theme.colors.gray500,
    fontSize: 12,
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
  modalButton: {
    marginTop: spacing.md,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  privacyInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  privacyDesc: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  privacyNoteText: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  upgradeFeatures: {
    marginBottom: spacing.lg,
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  upgradeFeatureText: {
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  upgradePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  upgradeButton: {
    marginBottom: spacing.sm,
  },
});
=======
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Linking } from 'react-native';
import { Text, Card, List, Switch, Divider, Button, Portal, Modal, RadioButton, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { theme, spacing, shadows } from '../theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateSubscription } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all locally cached data. You will need to sync again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'Cache cleared successfully');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type "DELETE" to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }
        },
      ]
    );
  };

  const handleUpgrade = async () => {
    try {
      await updateSubscription('paid');
      setShowUpgradeModal(false);
      Alert.alert('Success', 'Your account has been upgraded to Premium!');
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Account Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <List.Item
            title="Profile"
            description={user?.email || 'Not logged in'}
            left={props => <List.Icon {...props} icon="account" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('Profile')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Subscription"
            description={user?.subscription === 'paid' ? 'Premium Plan' : 'Free Plan'}
            left={props => <List.Icon {...props} icon="crown" color={user?.subscription === 'paid' ? '#FFD700' : theme.colors.gray500} />}
            right={props => user?.subscription !== 'paid' && (
              <Button mode="contained" compact onPress={() => setShowUpgradeModal(true)}>
                Upgrade
              </Button>
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Linked Accounts"
            description="Manage your bank connections"
            left={props => <List.Icon {...props} icon="bank" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('BankAccounts')}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Notifications Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <List.Item
            title="Push Notifications"
            description="Receive app notifications"
            left={props => <List.Icon {...props} icon="bell" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Budget Alerts"
            description="Get notified when nearing budget limits"
            left={props => <List.Icon {...props} icon="alert-circle" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={budgetAlerts}
                onValueChange={setBudgetAlerts}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Weekly Reports"
            description="Receive weekly spending summaries"
            left={props => <List.Icon {...props} icon="chart-bar" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={weeklyReport}
                onValueChange={setWeeklyReport}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Preferences Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <List.Item
            title="Currency"
            description={currency === 'INR' ? 'Indian Rupee (₹)' : currency}
            left={props => <List.Icon {...props} icon="currency-inr" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowCurrencyModal(true)}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            left={props => <List.Icon {...props} icon="weather-night" color={theme.colors.primary} />}
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                color={theme.colors.primary}
              />
            )}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Privacy & Security Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          
          <List.Item
            title="Privacy Settings"
            description="Manage data sharing preferences"
            left={props => <List.Icon {...props} icon="shield-account" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowPrivacyModal(true)}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Blockchain Storage"
            description={user?.subscription === 'paid' ? 'Enabled' : 'Premium feature'}
            left={props => <List.Icon {...props} icon="cube-outline" color={user?.subscription === 'paid' ? '#4CAF50' : theme.colors.gray500} />}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Export Data"
            description="Download your data"
            left={props => <List.Icon {...props} icon="download" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Export', 'Your data export will be sent to your email.')}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Support Section */}
      <Card style={styles.section}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <List.Item
            title="Help Center"
            description="FAQs and guides"
            left={props => <List.Icon {...props} icon="help-circle" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Linking.openURL('https://finpal.app/help')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Contact Support"
            description="Get help from our team"
            left={props => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Linking.openURL('mailto:support@finpal.app')}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Rate App"
            description="Share your feedback"
            left={props => <List.Icon {...props} icon="star" color={theme.colors.primary} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert('Thanks!', 'Thank you for your support!')}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.section, styles.dangerSection]}>
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: '#F44336' }]}>Danger Zone</Text>
          
          <List.Item
            title="Clear Cache"
            description="Clear locally stored data"
            left={props => <List.Icon {...props} icon="delete-sweep" color="#F44336" />}
            onPress={handleClearCache}
            style={styles.listItem}
          />
          
          <Divider />
          
          <List.Item
            title="Delete Account"
            description="Permanently delete your account"
            left={props => <List.Icon {...props} icon="account-remove" color="#F44336" />}
            onPress={handleDeleteAccount}
            style={styles.listItem}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button 
        mode="outlined" 
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#F44336"
        icon="logout"
      >
        Logout
      </Button>

      {/* App Version */}
      <Text style={styles.version}>FinPal v1.0.0</Text>

      <View style={{ height: 40 }} />

      {/* Currency Modal */}
      <Portal>
        <Modal
          visible={showCurrencyModal}
          onDismiss={() => setShowCurrencyModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Select Currency</Text>
          <RadioButton.Group onValueChange={value => { setCurrency(value); setShowCurrencyModal(false); }} value={currency}>
            <RadioButton.Item label="Indian Rupee (₹)" value="INR" />
            <RadioButton.Item label="US Dollar ($)" value="USD" />
            <RadioButton.Item label="Euro (€)" value="EUR" />
            <RadioButton.Item label="British Pound (£)" value="GBP" />
          </RadioButton.Group>
        </Modal>
      </Portal>

      {/* Privacy Modal */}
      <Portal>
        <Modal
          visible={showPrivacyModal}
          onDismiss={() => setShowPrivacyModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>Privacy Settings</Text>
          
          <View style={styles.privacyOption}>
            <View style={styles.privacyInfo}>
              <Text style={styles.privacyLabel}>AI Learning</Text>
              <Text style={styles.privacyDesc}>
                Allow AI to learn from your transactions to improve recommendations
              </Text>
            </View>
            <Switch 
              value={user?.subscription !== 'paid'} 
              disabled={user?.subscription === 'paid'}
              color={theme.colors.primary}
            />
          </View>
          
          {user?.subscription !== 'paid' && (
            <View style={styles.privacyNote}>
              <MaterialCommunityIcons name="information" size={16} color={theme.colors.secondary} />
              <Text style={styles.privacyNoteText}>
                Upgrade to Premium to disable AI learning and store data on blockchain for complete privacy.
              </Text>
            </View>
          )}
          
          <Button 
            mode="contained" 
            onPress={() => setShowPrivacyModal(false)}
            style={styles.modalButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>

      {/* Upgrade Modal */}
      <Portal>
        <Modal
          visible={showUpgradeModal}
          onDismiss={() => setShowUpgradeModal(false)}
          contentContainerStyle={styles.modal}
        >
          <View style={styles.upgradeHeader}>
            <MaterialCommunityIcons name="crown" size={48} color="#FFD700" />
            <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
          </View>
          
          <View style={styles.upgradeFeatures}>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Blockchain-secured data storage</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Complete privacy - no AI learning</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Advanced investment insights</Text>
            </View>
            <View style={styles.upgradeFeature}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.upgradeFeatureText}>Priority support</Text>
            </View>
          </View>
          
          <Text style={styles.upgradePrice}>₹199/month</Text>
          
          <Button 
            mode="contained" 
            onPress={handleUpgrade}
            style={styles.upgradeButton}
          >
            Upgrade Now
          </Button>
          
          <Button 
            mode="text" 
            onPress={() => setShowUpgradeModal(false)}
          >
            Maybe Later
          </Button>
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
  section: {
    margin: spacing.md,
    marginBottom: 0,
    borderRadius: 16,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gray600,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  listItem: {
    paddingVertical: spacing.sm,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutButton: {
    margin: spacing.md,
    borderColor: '#F44336',
  },
  version: {
    textAlign: 'center',
    color: theme.colors.gray500,
    fontSize: 12,
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
  modalButton: {
    marginTop: spacing.md,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  privacyInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  privacyDesc: {
    fontSize: 13,
    color: theme.colors.gray600,
    marginTop: 4,
  },
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  privacyNoteText: {
    fontSize: 13,
    color: theme.colors.secondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  upgradeFeatures: {
    marginBottom: spacing.lg,
  },
  upgradeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  upgradeFeatureText: {
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  upgradePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  upgradeButton: {
    marginBottom: spacing.sm,
  },
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
