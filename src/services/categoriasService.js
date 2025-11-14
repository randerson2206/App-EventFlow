import { supabase } from './supabaseClient';

export const getCategorias = async () => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) {
      console.error('Erro ao buscar categorias:', error);
      console.error('Detalhes:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
        console.error('ERRO RLS: Configure as políticas de segurança no Supabase!');
      }
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }
};

export const createCategoria = async (nome) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .insert([{ nome }])
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    throw error;
  }
};

export const updateCategoria = async (id, nome) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .update({ nome })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar categoria:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return null;
  }
};

export const deleteCategoria = async (id) => {
  try {
    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao deletar categoria:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    return false;
  }
};