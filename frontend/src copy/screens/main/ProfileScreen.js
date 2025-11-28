import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  Text,
  Button,
  List,
  Switch,
  Divider,
  Avatar,
  ActivityIndicator,
  Portal,
  Dialog,
  SegmentedButtons,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState(user?.risk_tolerance || 'medium');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.users.getProfile();
      setProfile(response.user);
      setRiskTolerance(response.user.risk_tolerance || 'medium');
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRiskToleranceChange = async (value) => {
    setRiskTolerance(value);
    try {
      await api.users.updateProfile({ riskTolerance: value });
      updateUser({ risk_tolerance: value });
    } catch (error) {
      console.error('Update risk tolerance error:', error);
    }
  };

  const handleLogout = () => {
    setLogoutDialogVisible(false);
    logout();
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <Card style={styles.profileCard} mode="elevated">
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={(user?.name || 'U').substring(0, 2).toUpperCase()}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.planBadge}>
            <MaterialCommunityIcons
              name={profile?.subscription_plan === 'paid' ? 'crown' : 'account'}
              size={16}
              color={profile?.subscription_plan === 'paid' ? colors.warning : colors.gray}
            />
            <Text style={styles.planText}>
              {profile?.subscription_plan === 'paid' ? 'Premium Plan' : 'Free Plan'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Income */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.cardTitle}>Financial Profile</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monthly Income</Text>
            <Text style={styles.infoValue}>
              {formatCurrency(profile?.monthly_income)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Income Type</Text>
            <Text style={styles.infoValue}>
              {profile?.income_type?.charAt(0).toUpperCase() + profile?.income_type?.slice(1) || 'Regular'}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Risk Tolerance */}
      <Card style={styles.card} mode="elevated">
        <Card.Content>
          <Text style={styles.cardTitle}>Investment Risk Tolerance</Text>
          <Text style={styles.cardDescription}>
            This helps us provide better investment recommendations
          </Text>
          <SegmentedButtons
            value={riskTolerance}
            onValueChange={handleRiskToleranceChange}
            buttons={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Menu Items */}
      <Card style={styles.card} mode="elevated">
        <List.Item
          title="Bank Accounts"
          description="Manage linked accounts"
          left={(props) => <List.Icon {...props} icon="bank" color={colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('BankAccounts')}
        />
        <Divider />
        <List.Item
          title="Budget Settings"
          description="Set category budgets"
          left={(props) => <List.Icon {...props} icon="calculator" color={colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Budget')}
        />
        <Divider />
        <List.Item
          title="Blockchain Security"
          description={profile?.subscription_plan === 'paid' ? 'View blockchain data' : 'Upgrade for blockchain storage'}
          left={(props) => <List.Icon {...props} icon="shield-lock" color={colors.primary} />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Blockchain')}
        />
      </Card>

      {/* Upgrade Card (for free users) */}
      {profile?.subscription_plan !== 'paid' && (
        <Card style={styles.upgradeCard} mode="elevated">
          <Card.Content>
            <View style={styles.upgradeHeader}>
              <MaterialCommunityIcons name="crown" size={32} color={colors.warning} />
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
            </View>
            <Text style={styles.upgradeDescription}>
              • Blockchain-secured transaction storage{'\n'}
              • Private & encrypted data{'\n'}
              • Priority AI insights{'\n'}
              • Advanced analytics
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate('Blockchain')}
              style={styles.upgradeButton}
            >
              Learn More
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Logout */}
      <Button
        mode="outlined"
        onPress={() => setLogoutDialogVisible(true)}
        style={styles.logoutButton}
        textColor={colors.error}
      >
        Logout
      </Button>

      {/* Logout Dialog */}
      <Portal>
        <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to logout?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleLogout} textColor={colors.error}>Logout</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>FinPal v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  email: {
    fontSize: 14,
    color: colors.gray,
    marginTop: spacing.xs,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
  },
  planText: {
    fontSize: 12,
    marginLeft: spacing.xs,
    color: colors.text,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardDescription: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.gray,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  segmentedButtons: {
    marginTop: spacing.sm,
  },
  upgradeCard: {
    marginBottom: spacing.md,
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning,
    borderWidth: 1,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: spacing.sm,
  },
  upgradeDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.warning,
  },
  logoutButton: {
    marginBottom: spacing.md,
    borderColor: colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: 12,
    color: colors.gray,
  },
});

export default ProfileScreen;
