import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [incomeType, setIncomeType] = useState('regular');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    const result = await register({
      name,
      email,
      phone,
      password,
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      incomeType,
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your journey to smarter finances</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            label="Full Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.gray}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Email *"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            outlineColor={colors.gray}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="email" />}
          />

          <TextInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            style={styles.input}
            outlineColor={colors.gray}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="phone" />}
          />

          <TextInput
            label="Monthly Income (₹)"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
            outlineColor={colors.gray}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="currency-inr" />}
          />

          <Text style={styles.label}>Income Type</Text>
          <SegmentedButtons
            value={incomeType}
            onValueChange={setIncomeType}
            buttons={[
              { value: 'regular', label: 'Regular' },
              { value: 'freelance', label: 'Freelance' },
              { value: 'gig', label: 'Gig' },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Password *"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            outlineColor={colors.gray}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <TextInput
            label="Confirm Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            style={styles.input}
            outlineColor={colors.gray}
            activeOutlineColor={colors.primary}
            left={<TextInput.Icon icon="lock-check" />}
          />

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Register
          </Button>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
              compact
            >
              Login
            </Button>
          </View>
        </View>
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
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray,
  },
  formContainer: {
    width: '100%',
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  segmentedButtons: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
  },
  buttonContent: {
    paddingVertical: spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  loginText: {
    color: colors.text,
  },
});

export default RegisterScreen;
