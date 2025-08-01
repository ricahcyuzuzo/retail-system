import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:4000/api';

export default function UserManagementScreen() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDesktopAccess = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/desktop-access`);
      const data = await res.json();
      setIsOpen(!!data.isOpen);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch desktop access state');
    } finally {
      setLoading(false);
    }
  };

  const setDesktopAccess = async (newState: boolean) => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/admin/desktop-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOpen: newState }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setIsOpen(newState);
    } catch (err) {
      Alert.alert('Error', 'Failed to update desktop access state');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchDesktopAccess();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desktop Access Control</Text>
      {loading ? (
        <Text style={styles.statusText}>Loading...</Text>
      ) : (
        <View style={styles.switchContainer}>
          <Text style={[styles.statusText, { color: isOpen ? '#4caf50' : '#f44336' }]}>Desktop Access is {isOpen ? 'OPEN' : 'CLOSED'}</Text>
          <Switch
            value={isOpen}
            onValueChange={setDesktopAccess}
            disabled={updating}
            style={styles.switch}
          />
          <Text style={styles.helperText}>
            {isOpen ? 'Desktop app can be used.' : 'Desktop app will be disconnected.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#222',
  },
  switchContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
    marginBottom: 20,
  },
  helperText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});
