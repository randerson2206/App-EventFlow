import Logo from '../../assets/logo.png';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const { login, register } = useAuth();

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }
    const success = await login(email, senha);
    if (success) {
    } else {
      Alert.alert('Erro', 'Usuário ou senha incorretos');
    }
  };

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não conferem');
      return;
    }
    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }
    const success = await register(email, senha, nome);
    if (success) {
      Alert.alert('Sucesso', 'Conta criada com sucesso!');
    } else {
      Alert.alert('Erro', 'Não foi possível criar a conta. Verifique se o email já está cadastrado.');
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmarSenha('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerWrap}>
        <View style={styles.header}>
          <Image source={Logo} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.title}>{isRegistering ? 'Criar Conta' : 'Entrar'}</Text>
        </View>

        <View style={styles.form}>
          {isRegistering && (
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Nome completo"
                placeholderTextColor="#6B7280"
                value={nome}
                onChangeText={setNome}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>
          )}

          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#6B7280"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputRow}>
            <Ionicons name="key-outline" size={20} color="#6B7280" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#6B7280"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              returnKeyType={isRegistering ? "next" : "done"}
              onSubmitEditing={isRegistering ? undefined : handleLogin}
            />
          </View>

          {isRegistering && (
            <View style={styles.inputRow}>
              <Ionicons name="key-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar senha"
                placeholderTextColor="#6B7280"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
              />
            </View>
          )}

          <TouchableOpacity 
            style={styles.button} 
            onPress={isRegistering ? handleRegister : handleLogin}
          >
            <Text style={styles.buttonText}>
              {isRegistering ? 'Criar Conta' : 'Entrar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={toggleMode}
          >
            <Text style={styles.switchButtonText}>
              {isRegistering 
                ? 'Já tem uma conta? Entrar' 
                : 'Não tem conta? Criar agora'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  brandLogo: {
    width: 240,
    height: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    minHeight: 40,
    paddingVertical: 0,
    textAlignVertical: 'center', // Android: centro vertical
    includeFontPadding: false,   // Android: remove padding extra da fonte
  },
  button: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E1EBE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchButtonText: {
    color: '#1E1EBE',
    fontSize: 14,
    fontWeight: '500',
  },
});