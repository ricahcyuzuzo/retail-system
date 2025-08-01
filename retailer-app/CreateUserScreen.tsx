import React, { useState } from 'react';
import { createUser } from './api';
import { View, Text, TextInput, Button, StyleSheet, Alert, Switch } from 'react-native';

const CreateUserScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    setLoading(true);
    try {
      // Use the separated API function
      await createUser(email, password, isAdmin);
      Alert.alert('Success', 'User created successfully!');
      setEmail('');
      setPassword('');
      setIsAdmin(false);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create User</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Admin:</Text>
        <Switch value={isAdmin} onValueChange={setIsAdmin} />
      </View>
      <Button title={loading ? 'Creating...' : 'Create User'} onPress={handleCreateUser} disabled={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
    marginRight: 10,
  },
});

export default CreateUserScreen;
