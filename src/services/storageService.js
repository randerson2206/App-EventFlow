import { supabase } from './supabaseClient';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'eventos-imagens';

/**
 * Faz upload de uma imagem para o Supabase Storage
 * @param {string} uri - URI local da imagem (file://)
 * @param {string} folder - Pasta no bucket (ex: 'eventos', 'perfis')
 * @returns {Promise<string>} - URL pública da imagem
 */
export async function uploadImage(uri, folder = 'eventos') {
  try {
    console.log('📤 [UPLOAD] Iniciando upload da imagem:', uri);

    // Se já for uma URL HTTP, retorna direto
    if (uri.startsWith('http')) {
      console.log('✅ [UPLOAD] Imagem já é URL pública:', uri);
      return uri;
    }

    // Gerar nome único para a imagem
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

    // Ler o arquivo como base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Converter base64 para Uint8Array
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Upload para o Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, byteArray, {
        contentType: `image/${fileExtension}`,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('🔴 [UPLOAD] Erro ao fazer upload:', error);
      throw error;
    }

    // Obter URL pública da imagem
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log('✅ [UPLOAD] Imagem enviada com sucesso:', publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('🔴 [UPLOAD] Falha no upload:', error);
    // Retorna a URI local como fallback
    return uri;
  }
}

/**
 * Faz upload de múltiplas imagens
 * @param {string[]} uris - Array de URIs locais
 * @param {string} folder - Pasta no bucket
 * @returns {Promise<string[]>} - Array de URLs públicas
 */
export async function uploadMultipleImages(uris, folder = 'eventos') {
  try {
    console.log(`📤 [UPLOAD] Iniciando upload de ${uris.length} imagens`);
    
    const uploadPromises = uris.map(uri => uploadImage(uri, folder));
    const urls = await Promise.all(uploadPromises);
    
    console.log(`✅ [UPLOAD] ${urls.length} imagens processadas`);
    return urls;
  } catch (error) {
    console.error('🔴 [UPLOAD] Erro ao fazer upload múltiplo:', error);
    return uris; // Fallback para URIs locais
  }
}

/**
 * Deleta uma imagem do Supabase Storage
 * @param {string} imageUrl - URL pública da imagem
 */
export async function removeImageByPath(imageUrl) {
  try {
    // Se não for URL do Supabase, ignora
    if (!imageUrl || !imageUrl.includes(BUCKET_NAME)) {
      return;
    }

    // Extrair o caminho do arquivo da URL
    const urlParts = imageUrl.split(`${BUCKET_NAME}/`);
    if (urlParts.length < 2) {
      console.warn('⚠️ [DELETE] URL inválida:', imageUrl);
      return;
    }

    const filePath = urlParts[1];
    console.log('🗑️ [DELETE] Deletando imagem:', filePath);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('🔴 [DELETE] Erro ao deletar:', error);
    } else {
      console.log('✅ [DELETE] Imagem deletada com sucesso');
    }
  } catch (error) {
    console.error('🔴 [DELETE] Falha ao deletar imagem:', error);
  }
}

/**
 * Deleta múltiplas imagens
 * @param {string[]} imageUrls - Array de URLs públicas
 */
export async function deleteMultipleImages(imageUrls) {
  try {
    const deletePromises = imageUrls.filter(url => url && url.includes(BUCKET_NAME))
      .map(url => removeImageByPath(url));
    await Promise.all(deletePromises);
    console.log(`✅ [DELETE] Imagens deletadas`);
  } catch (error) {
    console.error('🔴 [DELETE] Erro ao deletar múltiplas imagens:', error);
  }
}
