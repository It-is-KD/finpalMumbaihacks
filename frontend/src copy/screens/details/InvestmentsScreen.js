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
  IconButton,
  Button,
  Chip,
  ActivityIndicator,
  ProgressBar,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const riskProfiles = {
  conservative: {
    label: 'Conservative',
    color: '#3498DB',
    icon: 'shield-check',
    description: 'Low risk, stable returns. Suitable for risk-averse investors.',
    allocation: [
      { name: 'Fixed Deposits', percentage: 40, color: '#3498DB' },
      { name: 'Government Bonds', percentage: 30, color: '#2ECC71' },
      { name: 'Debt Funds', percentage: 20, color: '#9B59B6' },
      { name: 'Large Cap Stocks', percentage: 10, color: '#E74C3C' },
    ],
  },
  moderate: {
    label: 'Moderate',
    color: '#F39C12',
    icon: 'scale-balance',
    description: 'Balanced risk-reward. Good for medium-term goals.',
    allocation: [
      { name: 'Index Funds', percentage: 35, color: '#3498DB' },
      { name: 'Debt Funds', percentage: 25, color: '#2ECC71' },
      { name: 'Large Cap Stocks', percentage: 25, color: '#9B59B6' },
      { name: 'Mid Cap Stocks', percentage: 15, color: '#E74C3C' },
    ],
  },
  aggressive: {
    label: 'Aggressive',
    color: '#E74C3C',
    icon: 'trending-up',
    description: 'High risk, potentially high returns. For long-term investors.',
    allocation: [
      { name: 'Small Cap Stocks', percentage: 30, color: '#E74C3C' },
      { name: 'Mid Cap Stocks', percentage: 25, color: '#9B59B6' },
      { name: 'Large Cap Stocks', percentage: 25, color: '#3498DB' },
      { name: 'International Funds', percentage: 20, color: '#2ECC71' },
    ],
  },
};

const InvestmentsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [investmentAdvice, setInvestmentAdvice] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState('moderate');
  const [monthlyInvestment, setMonthlyInvestment] = useState(0);

  useEffect(() => {
    fetchInvestmentAdvice();
  }, []);

  const fetchInvestmentAdvice = async () => {
    try {
      const response = await api.agent.getInvestmentAdvice();
      setInvestmentAdvice(response.advice);
      if (response.advice?.riskProfile) {
        setSelectedProfile(response.advice.riskProfile);
      }
      if (response.advice?.suggestedMonthly) {
        setMonthlyInvestment(response.advice.suggestedMonthly);
      }
    } catch (error) {
      console.error('Fetch investment advice error:', error);
      // Set default values
      setMonthlyInvestment(5000);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvestmentAdvice();
  };

  const currentProfile = riskProfiles[selectedProfile];

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
        {/* Premium Feature Banner */}
        {user?.subscription_plan !== 'paid' && (
          <Card style={styles.premiumBanner}>
            <Card.Content style={styles.premiumContent}>
              <IconButton
                icon="crown"
                iconColor="#FFD700"
                size={24}
                style={styles.premiumIcon}
              />
              <View style={styles.premiumText}>
                <Text style={styles.premiumTitle}>Premium Feature</Text>
                <Text style={styles.premiumDesc}>
                  Upgrade to get personalized investment recommendations
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* AI Recommendation */}
        <Card style={styles.aiCard}>
          <Card.Content>
            <View style={styles.aiHeader}>
              <IconButton
                icon="robot"
                iconColor={colors.primary}
                size={24}
                style={styles.aiIcon}
              />
              <View>
                <Text style={styles.aiTitle}>AI Investment Advisor</Text>
                <Text style={styles.aiSubtitle}>Based on your financial profile</Text>
              </View>
            </View>

            <View style={styles.recommendation}>
              <Text style={styles.recommendLabel}>Recommended Monthly Investment</Text>
              <Text style={styles.recommendAmount}>
                ₹{monthlyInvestment.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.recommendNote}>
                Based on your income and expenses, this amount is optimal for building wealth
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Risk Profile Selection */}
        <Text style={styles.sectionTitle}>Risk Profile</Text>
        <View style={styles.profileButtons}>
          {Object.entries(riskProfiles).map(([key, profile]) => (
            <Chip
              key={key}
              selected={selectedProfile === key}
              onPress={() => setSelectedProfile(key)}
              style={[
                styles.profileChip,
                selectedProfile === key && { backgroundColor: profile.color + '30' },
              ]}
              textStyle={[
                styles.profileChipText,
                selectedProfile === key && { color: profile.color },
              ]}
              icon={profile.icon}
            >
              {profile.label}
            </Chip>
          ))}
        </View>

        {/* Selected Profile Details */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <IconButton
                icon={currentProfile.icon}
                iconColor={currentProfile.color}
                size={28}
                style={[styles.profileIcon, { backgroundColor: currentProfile.color + '20' }]}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: currentProfile.color }]}>
                  {currentProfile.label} Investor
                </Text>
                <Text style={styles.profileDesc}>{currentProfile.description}</Text>
              </View>
            </View>

            <Text style={styles.allocationTitle}>Suggested Asset Allocation</Text>
            
            {currentProfile.allocation.map((asset, index) => (
              <View key={index} style={styles.allocationItem}>
                <View style={styles.allocationHeader}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={[styles.assetPercentage, { color: asset.color }]}>
                    {asset.percentage}%
                  </Text>
                </View>
                <ProgressBar
                  progress={asset.percentage / 100}
                  color={asset.color}
                  style={styles.allocationBar}
                />
                <Text style={styles.assetAmount}>
                  ₹{((monthlyInvestment * asset.percentage) / 100).toLocaleString('en-IN')}/month
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Investment Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Investment Tips</Text>
            
            {[
              {
                icon: 'calendar-clock',
                title: 'Start Early',
                desc: 'The power of compounding works best with time. Start investing now.',
              },
              {
                icon: 'chart-timeline-variant',
                title: 'Stay Consistent',
                desc: 'Regular investments through SIP help average out market volatility.',
              },
              {
                icon: 'bank',
                title: 'Emergency Fund First',
                desc: 'Keep 6 months of expenses as emergency fund before aggressive investing.',
              },
              {
                icon: 'scale-balance',
                title: 'Diversify',
                desc: "Don't put all eggs in one basket. Spread across asset classes.",
              },
            ].map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <IconButton
                  icon={tip.icon}
                  iconColor={colors.primary}
                  size={20}
                  style={styles.tipIcon}
                />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <Text style={styles.tipDesc}>{tip.desc}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Action Button */}
        <Button
          mode="contained"
          icon="calculator"
          onPress={() => {
            // Could navigate to a SIP calculator or detailed planner
          }}
          style={styles.actionButton}
        >
          Calculate SIP Returns
        </Button>
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
    backgroundColor: '#FFF8E1',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIcon: {
    backgroundColor: '#FFD70020',
    margin: 0,
    marginRight: spacing.sm,
  },
  premiumText: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F39C12',
  },
  premiumDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  aiCard: {
    backgroundColor: colors.primary + '10',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  aiIcon: {
    backgroundColor: colors.primary + '20',
    margin: 0,
    marginRight: spacing.sm,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  aiSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recommendation: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
  },
  recommendLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recommendAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginVertical: spacing.xs,
  },
  recommendNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  profileButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  profileChip: {
    backgroundColor: colors.lightGray,
  },
  profileChipText: {
    fontSize: 13,
  },
  profileCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  profileIcon: {
    margin: 0,
    marginRight: spacing.md,
    borderRadius: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  allocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  allocationItem: {
    marginBottom: spacing.md,
  },
  allocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  assetName: {
    fontSize: 14,
    color: colors.text,
  },
  assetPercentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  allocationBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.lightGray,
  },
  assetAmount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  tipsCard: {
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  tipIcon: {
    backgroundColor: colors.lightGray,
    margin: 0,
    marginRight: spacing.sm,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  tipDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },
  actionButton: {
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
  },
});

export default InvestmentsScreen;
