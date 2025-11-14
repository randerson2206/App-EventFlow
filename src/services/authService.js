import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (email, senha) => {
  try {
    console.log('🔵 [LOGIN] Tentando login:', email);
    
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('senha', senha)
      .single();
    
    if (error || !data) {
      console.log('🔴 [LOGIN] Login falhou:', error?.message || 'Usuário não encontrado');
      if (error?.code === 'PGRST301' || error?.message?.includes('row-level security')) {
        console.error('🔴 [LOGIN] ERRO RLS: Execute SUPABASE_RLS_SETUP.sql!');
      }
      return null;
    }
    
    console.log('✅ [LOGIN] Login bem-sucedido!');
    console.log('✅ [LOGIN] ID:', data.id);
    console.log('✅ [LOGIN] Nome:', data.nome);
    
    return { id: data.id, email: data.email, nome: data.nome, avatar: data.avatar };
  } catch (error) {
    console.error('🔴 [LOGIN] Erro inesperado:', error);
    return null;
  }
};

export const register = async (email, senha, nome = '') => {
  try {
    console.log('🔵 [REGISTER] Iniciando cadastro de usuário:', email);
    
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ email, senha, nome: nome || email.split('@')[0] }])
      .select()
      .single();
    
    if (error) {
      console.error('🔴 [REGISTER] Erro no registro:', error);
      console.error('🔴 [REGISTER] Detalhes:', JSON.stringify(error, null, 2));
      if (error.code === '23505') {
        console.error('🔴 [REGISTER] Email já cadastrado!');
      }
      if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
        console.error('🔴 [REGISTER] ERRO RLS: Execute SUPABASE_RLS_SETUP.sql!');
      }
      return null;
    }
    
    console.log('✅ [REGISTER] Usuário criado com sucesso!');
    console.log('✅ [REGISTER] ID:', data.id);
    console.log('✅ [REGISTER] Nome:', data.nome);
    console.log('✅ [REGISTER] Email:', data.email);
    
    return { id: data.id, email: data.email, nome: data.nome };
  } catch (error) {
    console.error('🔴 [REGISTER] Erro inesperado:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
};

export const logout = async () => {
  // Sem ação necessária
};