import { supabase } from './supabaseClient';

export const getEventos = async (search = '') => {
  try {
    console.log('🔵 [GET EVENTOS] Buscando eventos...');
    
    let query = supabase
      .from('eventos')
      .select(`
        *,
        categoria:categorias(id, nome),
        local:locais(id, nome, latitude, longitude, endereco)
      `)
      .order('data', { ascending: true });

    if (search) {
      console.log('🔍 [GET EVENTOS] Busca:', search);
      query = query.or(`nome.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('🔴 [GET EVENTOS] Erro ao buscar:', error);
      console.error('🔴 [GET EVENTOS] Detalhes:', JSON.stringify(error, null, 2));
      if (error.code === 'PGRST301' || error.message?.includes('row-level security')) {
        console.error('🔴 [GET EVENTOS] ERRO RLS: Execute SUPABASE_RLS_SETUP.sql!');
      }
      return [];
    }

    console.log(`✅ [GET EVENTOS] ${data?.length || 0} eventos encontrados`);
    if (data && data.length > 0) {
      console.log('📋 [GET EVENTOS] Primeiro evento:', {
        id: data[0].id,
        nome: data[0].nome,
        categoria: data[0].categoria?.nome,
        local: data[0].local?.nome
      });
    }
    
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar eventos:', err);
    return [];
  }
};

export const getEventoById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('eventos')
      .select(`
        *,
        categoria:categorias(id, nome),
        local:locais(id, nome, latitude, longitude, endereco)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar evento por ID:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Erro ao buscar evento por ID:', err);
    return null;
  }
};

export const createEvento = async (eventoData, imagensInput = null) => {
  try {
    console.log('🔵 [CREATE EVENTO] Iniciando criação:', eventoData);
    
    let imagens = [];
    if (Array.isArray(imagensInput)) {
      imagens = imagensInput
        .map(u => typeof u === 'string' ? u : (u && u.uri ? u.uri : null))
        .filter(Boolean);
    } else if (typeof imagensInput === 'string') {
      imagens = [imagensInput];
    } else if (Array.isArray(eventoData?.imagens)) {
      imagens = eventoData.imagens.map(u => typeof u === 'string' ? u : (u && u.uri ? u.uri : null)).filter(Boolean);
    } else if (eventoData?.imagem) {
      imagens = [eventoData.imagem];
    }

    const insertData = {
      nome: eventoData.nome,
      descricao: eventoData.descricao,
      data: eventoData.data,
      hora: eventoData.hora,
      hora_fim: eventoData.horaFim || eventoData.hora_fim,
      preco: eventoData.preco,
      categoria_id: eventoData.categoriaId || eventoData.categoria_id,
      local_id: eventoData.localId || eventoData.local_id,
      imagens: imagens
    };
    
    console.log('🔵 [CREATE EVENTO] Dados para inserir:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('eventos')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('🔴 [CREATE EVENTO] Erro ao criar:', error);
      console.error('🔴 [CREATE EVENTO] Detalhes:', JSON.stringify(error, null, 2));
      return null;
    }

    console.log('✅ [CREATE EVENTO] Evento criado com sucesso!');
    console.log('✅ [CREATE EVENTO] ID:', data.id);
    console.log('✅ [CREATE EVENTO] Nome:', data.nome);
    
    return data;
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return null;
  }
};

export const updateEvento = async (id, eventoData, imagensInput = null) => {
  try {
    let imagens = [];
    if (Array.isArray(imagensInput)) {
      imagens = imagensInput
        .map(u => typeof u === 'string' ? u : (u && u.uri ? u.uri : null))
        .filter(Boolean);
    } else if (typeof imagensInput === 'string') {
      imagens = [imagensInput];
    } else if (Array.isArray(eventoData?.imagens)) {
      imagens = eventoData.imagens.map(u => typeof u === 'string' ? u : (u && u.uri ? u.uri : null)).filter(Boolean);
    } else if (eventoData?.imagem) {
      imagens = [eventoData.imagem];
    }

    const updateData = {
      nome: eventoData.nome,
      descricao: eventoData.descricao,
      data: eventoData.data,
      hora: eventoData.hora,
      hora_fim: eventoData.horaFim || eventoData.hora_fim,
      preco: eventoData.preco,
      categoria_id: eventoData.categoriaId || eventoData.categoria_id,
      local_id: eventoData.localId || eventoData.local_id
    };

    if (imagens.length > 0) {
      updateData.imagens = imagens;
    }

    const { data, error } = await supabase
      .from('eventos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar evento:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return null;
  }
};

export const deleteEvento = async (id) => {
  try {
    // Primeiro, deletar favoritos relacionados (fallback caso CASCADE não esteja configurado)
    await supabase
      .from('favoritos')
      .delete()
      .eq('evento_id', id);
    
    // Agora deletar o evento
    const { error } = await supabase
      .from('eventos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar evento:', error);
      console.error('Detalhes:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('✅ Evento deletado com sucesso:', id);
    return true;
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return false;
  }
};
