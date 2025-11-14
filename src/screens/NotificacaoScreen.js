import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

export default function NotificacaoScreen() {
  const { user, updateUser } = useAuth();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Prefer per-user setting if available
        if (user && typeof user.notifications !== 'undefined') {
          if (mounted) setEnabled(!!user.notifications);
          return;
        }
        const val = await AsyncStorage.getItem('notifications');
        if (mounted && val !== null) setEnabled(val === 'true');
      } catch (err) {
        console.error('Erro ao carregar notificação:', err);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const onToggle = async (next) => {
    try {
      setEnabled(next);
      // Persist per-user when logged in, otherwise use AsyncStorage
      if (user && updateUser) {
        await updateUser({ notifications: next });
      } else {
        await AsyncStorage.setItem('notifications', next ? 'true' : 'false');
      }
    } catch (err) {
      console.error('Erro ao salvar preferência de notificação:', err);
      Alert.alert('Erro', 'Não foi possível salvar a preferência de notificação.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificações</Text>
      <View style={styles.row}>
        <Text>Receber notificações</Text>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
});
