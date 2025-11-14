import { supabase } from './supabaseClient';
import { getCurrentUser } from './authService';

// Retorna array de IDs dos eventos favoritados pelo usuário atual
export const getFavoritos = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('favoritos')
      .select('evento_id')
      .eq('usuario_id', user.id);

    if (error) {
      console.error('Erro ao carregar favoritos:', error);
      console.error('Detalhes:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
        console.error('ERRO RLS: Configure as políticas de segurança no Supabase!');
      }
      return [];
    }

    return Array.isArray(data) ? data.map(f => f.evento_id) : [];
  } catch (e) {
    console.error('Erro ao carregar favoritos:', e);
    return [];
  }
};

// Verifica se um evento está favoritado
export const isFavorito = async (eventoId) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('favoritos')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('evento_id', eventoId)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }

    return !!data;
  } catch (e) {
    console.error('Erro ao verificar favorito:', e);
    return false;
  }
};

// Adiciona aos favoritos
export const addFavorito = async (eventoId) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const jaExiste = await isFavorito(eventoId);
    if (jaExiste) return true;

    const { error } = await supabase
      .from('favoritos')
      .insert([{
        usuario_id: user.id,
        evento_id: eventoId
      }]);

    if (error) {
      console.error('Erro ao adicionar favorito:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Erro ao adicionar favorito:', e);
    return false;
  }
};

// Remove dos favoritos
export const removeFavorito = async (eventoId) => {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('usuario_id', user.id)
      .eq('evento_id', eventoId);

    if (error) {
      console.error('Erro ao remover favorito:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Erro ao remover favorito:', e);
    return false;
  }
};

// Toggle favorito (add se não existe, remove se existe)
export const toggleFavorito = async (eventoId) => {
  const jaFavorito = await isFavorito(eventoId);
  if (jaFavorito) {
    await removeFavorito(eventoId);
    return false; // removido
  } else {
    await addFavorito(eventoId);
    return true; // adicionado
  }
};
