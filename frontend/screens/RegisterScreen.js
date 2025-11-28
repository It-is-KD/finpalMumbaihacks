import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, SegmentedButtons } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme, spacing } from '../theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    income_type: 'salaried',
    monthly_income: '',
    risk_tolerance: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleRegister = async () => {
    if (!formData.monthly_income) {
      setError('Please enter your monthly income');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register({
      ...formData,
      monthly_income: parseFloat(formData.monthly_income),
    });

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="wallet" size={48} color={theme.colors.primary} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step {step} of 2</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {step === 1 ? (
              <>
                <TextInput
                  label="Full Name *"
                  value={formData.name}
                  onChangeText={(v) => updateForm('name', v)}
                  mode="outlined"
                  style={styles.input}
                  outlineColor={theme.colors.gray300}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Email *"
                  value={formData.email}
                  onChangeText={(v) => updateForm('email', v)}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  outlineColor={theme.colors.gray300}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Icon icon="email" />}
                />

                <TextInput
                  label="Phone Number"
                  value={formData.phone}
                  onChangeText={(v) => updateForm('phone', v)}
                  mode="outlined"
                  keyboardType="phone-pad"
                  style={styles.input}
                  outlineColor={theme.colors.gray300}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Icon icon="phone" />}
                />

                <TextInput
                  label="Password *"
                  value={formData.password}
                  onChangeText={(v) => updateForm('password', v)}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  outlineColor={theme.colors.gray300}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Icon icon="lock" />}
                />

                <TextInput
                  label="Confirm Password *"
                  value={formData.confirmPassword}
                  onChangeText={(v) => updateForm('confirmPassword', v)}
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                  outlineColor={theme.colors.gray300}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Icon icon="lock-check" />}
                />

                <Button
                  mode="contained"
                  onPress={handleNext}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                >
                  Next
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Income Type</Text>
                <SegmentedButtons
                  value={formData.income_type}
                  onValueChange={(v) => updateForm('income_type', v)}
                  buttons={[
                    { value: 'salaried', label: 'Salaried' },
                    { value: 'freelancer', label: 'Freelance' },
                    { value: 'gig', label: 'Gig Work' },
                  ]}
                  style={styles.segmented}
                />

                <TextInput
                  label="Monthly Income (₹) *"
                  value={formData.monthly_income}
                  onChangeText={(v) => updateForm('monthly_income', v)}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  outlineColor={theme.colors.gray300}
                  activeOutlineColor={theme.colors.primary}
                  left={<TextInput.Icon icon="currency-inr" />}
                />

                <Text style={styles.sectionTitle}>Risk Tolerance</Text>
                <SegmentedButtons
                  value={formData.risk_tolerance}
                  onValueChange={(v) => updateForm('risk_tolerance', v)}
                  buttons={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                  ]}
                  style={styles.segmented}
                />

                <View style={styles.riskInfo}>
                  <MaterialCommunityIcons name="information" size={16} color={theme.colors.gray500} />
                  <Text style={styles.riskInfoText}>
                    This helps us personalize investment recommendations
                  </Text>
                </View>

                <View style={styles.buttonRow}>
                  <Button
                    mode="outlined"
                    onPress={() => setStep(1)}
                    style={[styles.button, styles.backButton]}
                    contentStyle={styles.buttonContent}
                  >
                    Back
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={loading}
                    disabled={loading}
                    style={[styles.button, styles.submitButton]}
                    contentStyle={styles.buttonContent}
                  >
                    Register
                  </Button>
                </View>
              </>
            )}

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              style={styles.linkButton}
            >
              Already have an account? Login
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: 16,
    elevation: 4,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  segmented: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  backButton: {
    flex: 1,
    borderColor: theme.colors.primary,
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  linkButton: {
    marginTop: spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#F44336',
    marginLeft: spacing.sm,
    flex: 1,
  },
  riskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  riskInfoText: {
    fontSize: 12,
    color: theme.colors.gray600,
    marginLeft: spacing.sm,
    flex: 1,
  },
});
