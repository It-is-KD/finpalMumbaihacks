<<<<<<< HEAD
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { paperTheme, theme } from './theme';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import GoalsScreen from './screens/GoalsScreen';
import BudgetScreen from './screens/BudgetScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Login/Register)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'credit-card' : 'credit-card-outline';
              break;
            case 'Chat':
              iconName = focused ? 'robot' : 'robot-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'chart-box' : 'chart-box-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray200,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'FinPal',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: theme.colors.text,
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          title: 'Transactions',
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          title: 'AI Assistant',
          tabBarLabel: 'AI Chat',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreStack}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// More Stack (Settings, Profile, Goals, Budget)
function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="MoreMenu" 
        component={MoreMenuScreen}
        options={{
          title: 'More',
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
    </Stack.Navigator>
  );
}

// More Menu Screen
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, List, Divider } from 'react-native-paper';

function MoreMenuScreen({ navigation }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { title: 'Profile', icon: 'account', screen: 'Profile', description: 'View and edit your profile' },
    { title: 'Goals', icon: 'target', screen: 'Goals', description: 'Track your financial goals' },
    { title: 'Budget', icon: 'piggy-bank', screen: 'Budget', description: 'Manage your budgets' },
    { title: 'Settings', icon: 'cog', screen: 'Settings', description: 'App preferences and security' },
  ];

  return (
    <View style={styles.moreContainer}>
      {/* User Card */}
      <Card style={styles.userCard} onPress={() => navigation.navigate('Profile')}>
        <Card.Content style={styles.userCardContent}>
          <View style={styles.userAvatar}>
            <MaterialCommunityIcons name="account" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPlan}>
              {user?.subscription === 'paid' ? '⭐ Premium' : 'Free Plan'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.gray400} />
        </Card.Content>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.screen}>
            {index > 0 && <Divider />}
            <List.Item
              title={item.title}
              description={item.description}
              left={props => (
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
              )}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate(item.screen)}
              style={styles.menuItem}
            />
          </React.Fragment>
        ))}
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>FinPal</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moreContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.gray600,
  },
  userPlan: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  menuCard: {
    borderRadius: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuItem: {
    paddingVertical: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  appVersion: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },
});

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? (
        <DataProvider>
          <MainTabs />
        </DataProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

// Main App Component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
=======
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { paperTheme, theme } from './theme';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import GoalsScreen from './screens/GoalsScreen';
import BudgetScreen from './screens/BudgetScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack (Login/Register)
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Transactions':
              iconName = focused ? 'credit-card' : 'credit-card-outline';
              break;
            case 'Chat':
              iconName = focused ? 'robot' : 'robot-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'chart-box' : 'chart-box-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu';
              break;
            default:
              iconName = 'circle';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray200,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'FinPal',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: theme.colors.text,
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          title: 'Transactions',
        }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          title: 'AI Assistant',
          tabBarLabel: 'AI Chat',
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreStack}
        options={{
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
}

// More Stack (Settings, Profile, Goals, Budget)
function MoreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen 
        name="MoreMenu" 
        component={MoreMenuScreen}
        options={{
          title: 'More',
        }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Goals" component={GoalsScreen} />
      <Stack.Screen name="Budget" component={BudgetScreen} />
    </Stack.Navigator>
  );
}

// More Menu Screen
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, List, Divider } from 'react-native-paper';

function MoreMenuScreen({ navigation }) {
  const { user, logout } = useAuth();

  const menuItems = [
    { title: 'Profile', icon: 'account', screen: 'Profile', description: 'View and edit your profile' },
    { title: 'Goals', icon: 'target', screen: 'Goals', description: 'Track your financial goals' },
    { title: 'Budget', icon: 'piggy-bank', screen: 'Budget', description: 'Manage your budgets' },
    { title: 'Settings', icon: 'cog', screen: 'Settings', description: 'App preferences and security' },
  ];

  return (
    <View style={styles.moreContainer}>
      {/* User Card */}
      <Card style={styles.userCard} onPress={() => navigation.navigate('Profile')}>
        <Card.Content style={styles.userCardContent}>
          <View style={styles.userAvatar}>
            <MaterialCommunityIcons name="account" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userPlan}>
              {user?.subscription === 'paid' ? '⭐ Premium' : 'Free Plan'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.gray400} />
        </Card.Content>
      </Card>

      {/* Menu Items */}
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.screen}>
            {index > 0 && <Divider />}
            <List.Item
              title={item.title}
              description={item.description}
              left={props => (
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
              )}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate(item.screen)}
              style={styles.menuItem}
            />
          </React.Fragment>
        ))}
      </Card>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>FinPal</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  moreContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.gray600,
  },
  userPlan: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  menuCard: {
    borderRadius: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  menuItem: {
    paddingVertical: 8,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingVertical: 24,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  appVersion: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 4,
  },
});

// Main App Navigator
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      {user ? (
        <DataProvider>
          <MainTabs />
        </DataProvider>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

// Main App Component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
