import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  ActivityIndicator,
  Switch,
  Divider,
  List,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const BlockchainScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [blockchainEnabled, setBlockchainEnabled] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchBlockchainStatus();
  }, []);

  const fetchBlockchainStatus = async () => {
    try {
      const response = await api.blockchain.getStatus();
      setBlockchainEnabled(response.enabled);
      setWalletConnected(response.walletConnected);
      setWalletAddress(response.walletAddress || '');
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Fetch blockchain status error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlockchainStatus();
  };

  const handleConnectWallet = async () => {
    if (user?.subscription_plan !== 'paid') {
      Alert.alert(
        'Premium Feature',
        'Blockchain security is only available for premium subscribers. Upgrade to access this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }

    setConnecting(true);
    try {
      const response = await api.blockchain.connectWallet();
      setWalletConnected(true);
      setWalletAddress(response.walletAddress);
      Alert.alert('Success', 'Wallet connected successfully!');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectWallet = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your blockchain wallet? Your encrypted data will remain secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.blockchain.disconnectWallet();
              setWalletConnected(false);
              setWalletAddress('');
              setBlockchainEnabled(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect wallet');
            }
          },
        },
      ]
    );
  };

  const handleToggleBlockchain = async (value) => {
    if (!walletConnected) {
      Alert.alert('Connect Wallet', 'Please connect a wallet first to enable blockchain security.');
      return;
    }

    try {
      await api.blockchain.setEnabled(value);
      setBlockchainEnabled(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update blockchain settings');
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isPremium = user?.subscription_plan === 'paid';

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
        {/* Premium Banner */}
        {!isPremium && (
          <Card style={styles.premiumBanner}>
            <Card.Content style={styles.premiumContent}>
              <IconButton
                icon="lock"
                iconColor={colors.secondary}
                size={32}
                style={styles.premiumIcon}
              />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Premium Feature</Text>
                <Text style={styles.premiumDesc}>
                  Blockchain security ensures your financial data is encrypted and stored on a decentralized network, giving you complete ownership and privacy.
                </Text>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('Profile')}
                  style={styles.upgradeButton}
                  compact
                >
                  Upgrade to Premium
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* How It Works */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>How Blockchain Security Works</Text>
            
            {[
              {
                icon: 'shield-lock',
                title: 'End-to-End Encryption',
                desc: 'Your financial data is encrypted before leaving your device',
              },
              {
                icon: 'server-network',
                title: 'Decentralized Storage',
                desc: 'Data is stored across multiple nodes, not on a single server',
              },
              {
                icon: 'key',
                title: 'You Own Your Keys',
                desc: 'Only you can decrypt and access your financial information',
              },
              {
                icon: 'eye-off',
                title: 'Zero Knowledge',
                desc: 'Even we cannot see your transaction details when enabled',
              },
            ].map((item, index) => (
              <View key={index} style={styles.infoItem}>
                <IconButton
                  icon={item.icon}
                  iconColor={colors.primary}
                  size={24}
                  style={styles.infoIcon}
                />
                <View style={styles.infoText}>
                  <Text style={styles.infoTitle}>{item.title}</Text>
                  <Text style={styles.infoDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Wallet Connection */}
        <Card style={styles.walletCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Wallet Connection</Text>
            
            {walletConnected ? (
              <View>
                <View style={styles.walletConnected}>
                  <View style={styles.walletInfo}>
                    <IconButton
                      icon="wallet"
                      iconColor={colors.success}
                      size={24}
                      style={styles.walletIcon}
                    />
                    <View>
                      <Text style={styles.walletLabel}>Connected Wallet</Text>
                      <Text style={styles.walletAddress}>{formatAddress(walletAddress)}</Text>
                    </View>
                  </View>
                  <IconButton
                    icon="check-circle"
                    iconColor={colors.success}
                    size={24}
                  />
                </View>

                <Divider style={styles.divider} />

                <View style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingLabel}>Blockchain Encryption</Text>
                    <Text style={styles.settingDesc}>
                      Store transactions on blockchain
                    </Text>
                  </View>
                  <Switch
                    value={blockchainEnabled}
                    onValueChange={handleToggleBlockchain}
                    color={colors.primary}
                  />
                </View>

                <Button
                  mode="outlined"
                  icon="link-off"
                  onPress={handleDisconnectWallet}
                  style={styles.disconnectButton}
                  textColor={colors.error}
                >
                  Disconnect Wallet
                </Button>
              </View>
            ) : (
              <View style={styles.notConnected}>
                <IconButton
                  icon="wallet-outline"
                  iconColor={colors.gray}
                  size={48}
                  style={styles.notConnectedIcon}
                />
                <Text style={styles.notConnectedTitle}>No Wallet Connected</Text>
                <Text style={styles.notConnectedDesc}>
                  Connect a blockchain wallet to enable encrypted transaction storage
                </Text>
                <Button
                  mode="contained"
                  icon="wallet-plus"
                  onPress={handleConnectWallet}
                  loading={connecting}
                  disabled={connecting || !isPremium}
                  style={styles.connectButton}
                >
                  Connect Wallet
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Recent Blockchain Transactions */}
        {walletConnected && transactions.length > 0 && (
          <Card style={styles.transactionsCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Blockchain Transactions</Text>
              
              {transactions.map((tx, index) => (
                <View key={index}>
                  <List.Item
                    title={tx.hash ? formatAddress(tx.hash) : 'Pending...'}
                    description={formatDate(tx.timestamp)}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={tx.status === 'confirmed' ? 'check-circle' : 'clock-outline'}
                        color={tx.status === 'confirmed' ? colors.success : colors.warning}
                      />
                    )}
                    right={(props) => (
                      <Text style={styles.txStatus}>
                        {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Text>
                    )}
                    style={styles.txItem}
                  />
                  {index < transactions.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Security Notice */}
        <Card style={styles.noticeCard}>
          <Card.Content style={styles.noticeContent}>
            <IconButton
              icon="information"
              iconColor={colors.secondary}
              size={20}
              style={styles.noticeIcon}
            />
            <Text style={styles.noticeText}>
              FinPal uses Ganache for development. In production, this would connect to Ethereum mainnet or a Layer 2 solution for real blockchain security.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
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
    paddingBottom: spacing.xl,
  },
  premiumBanner: {
    backgroundColor: colors.secondary + '15',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary + '30',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  premiumIcon: {
    backgroundColor: colors.secondary + '20',
    margin: 0,
    marginRight: spacing.md,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  premiumDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  upgradeButton: {
    backgroundColor: colors.secondary,
    alignSelf: 'flex-start',
  },
  infoCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  infoIcon: {
    backgroundColor: colors.primary + '20',
    margin: 0,
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  infoDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  walletCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  walletConnected: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletIcon: {
    backgroundColor: colors.success + '20',
    margin: 0,
    marginRight: spacing.sm,
  },
  walletLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  walletAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'monospace',
  },
  divider: {
    marginVertical: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  disconnectButton: {
    borderColor: colors.error,
    marginTop: spacing.sm,
  },
  notConnected: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  notConnectedIcon: {
    backgroundColor: colors.lightGray,
    marginBottom: spacing.md,
  },
  notConnectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  notConnectedDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  connectButton: {
    backgroundColor: colors.primary,
  },
  transactionsCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  txItem: {
    paddingHorizontal: 0,
  },
  txStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  noticeCard: {
    backgroundColor: colors.lightGray,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIcon: {
    margin: 0,
    marginRight: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default BlockchainScreen;
