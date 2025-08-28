import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import UserManagementScreen from './UserManagementScreen';
import InventoryScreen from './InventoryScreen';
import SalesScreen from './SalesScreen';
import CreditSalesScreen from './CreditSalesScreen';
import SuppliersScreen from './SuppliersScreen';
import CreditPurchasesScreen from './CreditPurchasesScreen';
import ReportsScreen from './ReportsScreen';
import ExpensesScreen from './ExpensesScreen';
import SummaryScreen from './SummaryScreen';
import ProformasScreen from './ProformasScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

function AccessDenied({ onLogout }: { onLogout: () => void }) {
  return (
    <>
      <Text style={{ color: 'red', fontSize: 20, margin: 40 }}>Access Denied: You are not an admin.</Text>
      <Button title="Logout" onPress={onLogout} />
    </>
  );
}


const Drawer = createDrawerNavigator();

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      const token = await AsyncStorage.getItem('token');
      setToken(token);
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      setLoading(true);
      setError(null);
      // Fetch user info
      fetch(API_BASE_URL + '/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch user info');
          return res.json();
        })
        .then(data => {
          console.log('User info from /api/auth/me:', data);
          if (data && data.email) {
            setUser(data);
            setError(null);
          } else {
            setUser(null);
            setError('Invalid user data received.');
          }
        })
        .catch((err) => {
          setUser(null);
          setError('Failed to fetch user info.');
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
    }
  }, [token]);

  if (!token) {
    return <LoginScreen />;
  }
  if (loading) {
    return (
      <>
        <StatusBar style="auto" />
        <Text style={{ marginTop: 40, fontSize: 18 }}>Loading user info...</Text>
      </>
    );
  }
  if (error) {
    return (
      <>
        <StatusBar style="auto" />
        <Text style={{ color: 'red', marginTop: 40, fontSize: 18 }}>{error}</Text>
        <Button title="Retry" onPress={() => setToken(token)} />
        <Button title="Logout" onPress={() => setToken(null)} />
      </>
    );
  }
  if (!user) {
    return null; // Should not happen, but fallback
  }

  return (
    <NavigationContainer>
      <Drawer.Navigator initialRouteName="Home">
        <Drawer.Screen name="Home" component={HomeScreen} />
        <Drawer.Screen name="Inventory" component={InventoryScreen} />
        <Drawer.Screen name="Sales" component={SalesScreen} />
        <Drawer.Screen name="Credit Sales" component={CreditSalesScreen} />
        <Drawer.Screen name="Suppliers" component={SuppliersScreen} />
        <Drawer.Screen name="Credit Purchases" component={CreditPurchasesScreen} />
        <Drawer.Screen name="Summary" component={SummaryScreen} />
        <Drawer.Screen name="Reports" component={ReportsScreen} />
        <Drawer.Screen name="Expenses" component={ExpensesScreen} />
        <Drawer.Screen name="Proformas" component={ProformasScreen} />
        {user.isAdmin && (
  <Drawer.Screen name="User Management" component={UserManagementScreen} />
)}
        <Drawer.Screen name="Logout">
          {() => <Button title="Logout" onPress={() => setToken(null)} />}
        </Drawer.Screen>
      </Drawer.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

export default App;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
