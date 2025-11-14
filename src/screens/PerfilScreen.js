import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão', 'Permissão de acesso à galeria é necessária para escolher uma foto.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ 
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker?.MediaType?.Images,
      });
      
      if (result.canceled) return;
      
      if (result.assets && result.assets[0] && updateUser) {
        const uri = result.assets[0].uri;
        const filename = uri.split('/').pop() || 'avatar.jpg';
        const dest = `${FileSystem.documentDirectory}avatar_${Date.now()}_${filename}`;
        
        try {
          await FileSystem.copyAsync({ from: uri, to: dest });
          await updateUser({ avatar: dest });
          Alert.alert('Sucesso', 'Foto de perfil atualizada');
        } catch (e) {
          console.warn('Falha ao copiar avatar, usando URI original:', e);
          await updateUser({ avatar: uri });
          Alert.alert('Sucesso', 'Foto de perfil atualizada');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão', 'Permissão de câmera é necessária para tirar uma foto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ 
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
        mediaTypes: ImagePicker?.MediaType?.Images,
      });
      
      if (result.canceled) return;
      
      if (result.assets && result.assets[0] && updateUser) {
        const uri = result.assets[0].uri;
        const dest = `${FileSystem.documentDirectory}avatar_${Date.now()}.jpg`;
        
        try {
          await FileSystem.copyAsync({ from: uri, to: dest });
          await updateUser({ avatar: dest });
          Alert.alert('Sucesso', 'Foto de perfil atualizada');
        } catch (e) {
          console.warn('Falha ao salvar foto da câmera, usando URI original:', e);
          await updateUser({ avatar: uri });
          Alert.alert('Sucesso', 'Foto de perfil atualizada');
        }
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };

  const removeAvatar = async () => {
    try {
      if (updateUser) {
        try {
          const dest = FileSystem.documentDirectory + 'avatar.jpg';
          const info = await FileSystem.getInfoAsync(dest);
          if (info.exists) await FileSystem.deleteAsync(dest, { idempotent: true });
        } catch {}
        await updateUser({ avatar: null });
        Alert.alert('Removido', 'Foto de perfil removida');
      }
    } catch (error) {
      console.error('Erro ao remover avatar:', error);
      Alert.alert('Erro', 'Não foi possível remover a foto');
    }
  };

  const avatarActions = () => {
    Alert.alert('Foto de Perfil', 'Escolha uma opção', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Escolher da Galeria', onPress: pickImage },
      { text: 'Tirar Foto', onPress: takePhoto },
      { text: 'Remover Foto', onPress: removeAvatar, style: 'destructive' },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Confirmar', 'Sair do app?', [
      { text: 'Cancelar' },
      { text: 'Sair', onPress: () => { logout(); } },
    ]);
  };

  const handleAccount = () => navigation.navigate('MinhaConta');
  const handleTerms = () => navigation.navigate('Termos');
  const handleNotification = () => navigation.navigate('Notificacao');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity onPress={avatarActions} style={styles.headerRight}>
          {user && user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={36} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {user ? (
        <>
          <View style={styles.greeting}>
            <Text style={styles.hello}>Ola,</Text>
            <Text style={styles.fullName}>{((user.nome || '') + '').toUpperCase()}</Text>
          </View>

          <View style={styles.list}>
            <TouchableOpacity style={styles.row} onPress={handleAccount}>
              <Text style={styles.rowText}>Minha Conta</Text>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={handleTerms}>
              <Text style={styles.rowText}>Termos de Uso e Política de Privacidade</Text>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={handleNotification}>
              <Text style={styles.rowText}>Notificação</Text>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} onPress={handleLogout}>
              <Text style={styles.rowText}>Sair</Text>
              <Ionicons name="exit-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.empty}>Usuário não logado</Text>
      )}
    </View>
  );

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8 },
  closeBtn: { padding: 6 },
  headerRight: { padding: 8 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.surface },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#eaf8ef', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface },
  greeting: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  hello: { color: colors.textMuted, fontSize: 14 },
  fullName: { fontSize: 16, fontWeight: '700', marginTop: 6 },
  list: { paddingHorizontal: 6, marginTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 16, color: colors.text },
  button: { flexDirection: 'row', backgroundColor: colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  buttonText: { color: '#fff', marginLeft: 10, fontWeight: 'bold' },
  logoutButton: { backgroundColor: colors.danger },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: 16 },
});