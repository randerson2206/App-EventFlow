import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { getEventos } from '../services/eventosService';
import { getFavoritos, removeFavorito } from '../services/favoritosService';
import { useIsFocused } from '@react-navigation/native';

export default function FavoritosScreen({ navigation }) {
  const [eventosFavoritos, setEventosFavoritos] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadFavoritos();
    }
  }, [isFocused]);

  const loadFavoritos = async () => {
    setLoading(true);
    try {
      const favIds = await getFavoritos();
      const todosEventos = await getEventos();
      const validIds = Array.isArray(favIds) ? favIds : [];
      const validEventos = Array.isArray(todosEventos) ? todosEventos : [];
      const eventosFavs = validEventos.filter(e => e && e.id && validIds.includes(e.id));
      setEventosFavoritos(eventosFavs);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setEventosFavoritos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorito = async (eventoId) => {
    try {
      await removeFavorito(eventoId);
      await loadFavoritos();
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  };

  const renderItem = ({ item }) => {
    const rawImages = item.imagens && Array.isArray(item.imagens) && item.imagens.length ? item.imagens : (item.imagem ? [item.imagem] : []);
    const images = rawImages.map(img => (typeof img === 'string' ? img : (img && img.uri ? img.uri : null))).filter(Boolean);
    const firstImage = images.length > 0 ? images[0] : null;

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('EventoDetail', { id: item.id })}
      >
        <View style={styles.imageContainer}>
          {firstImage ? (
            <Image 
              source={{ uri: firstImage }} 
              style={styles.image}
              defaultSource={require('../../assets/logo.png')}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color="#999" />
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={14} color={colors.primary} />
            <Text style={styles.categoria}>{item.categoria?.nome || 'Sem categoria'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={14} color="#666" />
            <Text style={styles.data}>{formatDate(item.data)}</Text>
          </View>
          <Text style={styles.preco}>R$ {(item.preco || 0).toFixed(2).replace('.', ',')}</Text>
        </View>

        <TouchableOpacity 
          style={styles.removeButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFavorito(item.id);
          }}
        >
          <Ionicons name="heart" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Favoritos</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      ) : (
        <FlatList
          data={eventosFavoritos}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum evento favoritado</Text>
              <Text style={styles.emptyHint}>
                Toque no ♥ nos eventos para salvá-los aqui
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: colors.text,
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  imageContainer: {
    width: 100,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  categoria: {
    fontSize: 13,
    color: colors.textMuted,
  },
  data: {
    fontSize: 13,
    color: colors.textMuted,
  },
  preco: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 20,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
});
