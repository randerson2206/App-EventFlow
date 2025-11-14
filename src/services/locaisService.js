import { supabase } from './supabaseClient';
import * as Location from 'expo-location';

export const getLocais = async () => {
  try {
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar locais:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar locais:', err);
    return [];
  }
};

export const createLocal = async (nome, latitude, longitude, endereco = '') => {
  try {
    const { data, error } = await supabase
      .from('locais')
      .insert([{ nome, latitude, longitude, endereco }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar local:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar local:', error);
    return null;
  }
};

export const updateLocal = async (id, nome, latitude, longitude, endereco = '') => {
  try {
    const { data, error } = await supabase
      .from('locais')
      .update({ nome, latitude, longitude, endereco })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar local:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    return null;
  }
};

export const deleteLocal = async (id) => {
  try {
    // Primeiro, tentar deletar eventos associados (fallback se CASCADE não estiver configurado)
    try {
      const { error: deleteEventosError } = await supabase
        .from('eventos')
        .delete()
        .eq('local_id', id);
      
      if (deleteEventosError) {
        console.warn('⚠️ Aviso ao deletar eventos do local:', deleteEventosError);
      } else {
        console.log('✅ Eventos do local deletados');
      }
    } catch (eventosErr) {
      console.warn('⚠️ Erro ao deletar eventos do local (continuando):', eventosErr);
    }
    
    // Agora deletar o local
    const { error } = await supabase
      .from('locais')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('🔴 Erro ao deletar local:', error);
      return false;
    }
    
    console.log('✅ Local deletado com sucesso:', id);
    return true;
  } catch (error) {
    console.error('🔴 Erro ao deletar local:', error);
    return false;
  }
};

export const getLocalizacaoAtual = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Permissão de localização negada');
      return null;
    }
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    if (!location || !location.coords) {
      console.warn('Localização não disponível');
      return null;
    }
    return { latitude: location.coords.latitude, longitude: location.coords.longitude };
  } catch (err) {
    console.warn('Erro ao obter localização:', err);
    return null;
  }
};

// Função para buscar local por ID (usada no LocalFormScreen)
export const getLocalById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Erro ao buscar local por ID:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar local por ID:', error);
    return null;
  }
};