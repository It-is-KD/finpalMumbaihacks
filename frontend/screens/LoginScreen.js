import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme, spacing } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(email, password);
    
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
          <MaterialCommunityIcons name="wallet" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>FinPal</Text>
          <Text style={styles.subtitle}>Your AI Financial Coach</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle}>Welcome Back</Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              outlineColor={theme.colors.gray300}
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon="email" />}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={styles.input}
              outlineColor={theme.colors.gray300}
              activeOutlineColor={theme.colors.primary}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon 
                  icon={showPassword ? "eye-off" : "eye"} 
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Login
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
            >
              Don't have an account? Register
            </Button>
          </Card.Content>
        </Card>

        <View style={styles.features}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="brain" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>AI-Powered Insights</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Smart Analytics</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="target" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>Goal Tracking</Text>
          </View>
        </View>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.gray500,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: spacing.md,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  buttonContent: {
    paddingVertical: 8,
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
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: theme.colors.gray600,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
