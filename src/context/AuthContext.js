import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginService, logout as logoutService, register as registerService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, senha) => {
    try {
      const userData = await loginService(email, senha);
      if (userData) {
        await AsyncStorage.setItem('token', 'mock-token-' + Date.now());
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (email, senha, nome) => {
    try {
      console.log('🔵 [AuthContext] Chamando registerService...');
      const userData = await registerService(email, senha, nome);
      if (userData) {
        console.log('✅ [AuthContext] Usuário registrado, salvando localmente...');
        await AsyncStorage.setItem('token', 'mock-token-' + Date.now());
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('✅ [AuthContext] Usuário salvo no AsyncStorage e estado atualizado');
        return true;
      }
      console.log('🔴 [AuthContext] registerService retornou null');
      return false;
    } catch (error) {
      console.error('🔴 [AuthContext] Erro no registro:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch {}
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (patch) => {
    try {
      const newUser = { ...(typeof user === 'object' ? user : {}), ...patch };
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return null;
    }
  };

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userStr = await AsyncStorage.getItem('user');
      if (token && userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Erro ao fazer parse do usuário:', parseError);
          // Limpar dados corrompidos
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};