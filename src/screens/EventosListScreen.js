import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getEventos, deleteEvento } from '../services/eventosService';
import { useFocusEffect } from '@react-navigation/native';

export default function EventosListScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [filteredEventos, setFilteredEventos] = useState([]);
  const [searchText, setSearchText] = useState('');

  const formatDatePt = (iso) => {
    if (!iso) return 'DD/MM/AAAA';
    const parts = String(iso).split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(iso);
  };

  const formatPricePt = (v) => {
    const n = Number(v || 0);
    return `R$ ${n.toFixed(2).replace('.', ',')}`;
  };

  useFocusEffect(
    React.useCallback(() => {
      loadEventos();
    }, [])
  );

  const loadEventos = async () => {
    try {
      const data = await getEventos();
      const validData = Array.isArray(data) ? data : [];
      setEventos(validData);
      setFilteredEventos(validData);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setEventos([]);
      setFilteredEventos([]);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    try {
      if (text.trim() === '') {
        setFilteredEventos(eventos);
      } else {
        const filtered = (Array.isArray(eventos) ? eventos : []).filter(evento => {
          try {
            return evento && evento.nome && (
              evento.nome.toLowerCase().includes(text.toLowerCase()) ||
              (evento.categoria && evento.categoria.nome && evento.categoria.nome.toLowerCase().includes(text.toLowerCase()))
            );
          } catch {
            return false;
          }
        });
        setFilteredEventos(filtered);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setFilteredEventos([]);
    }
  };

  const handleDelete = (id, nome) => {
    Alert.alert(
      'Excluir Evento',
      `Deseja realmente excluir "${nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvento(id);
              Alert.alert('Sucesso', 'Evento excluído com sucesso');
              loadEventos();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o evento');
            }
          }
        }
      ]
    );
  };

  const renderEventCard = ({ item }) => {
    const coverImage = Array.isArray(item.imagens) && item.imagens.length > 0 
      ? item.imagens[0] 
      : item.imagem;
    
    const imageSource = coverImage
      ? (typeof coverImage === 'string' ? { uri: coverImage } : coverImage?.uri ? { uri: coverImage.uri } : null)
      : null;

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.deleteIcon}
          onPress={() => handleDelete(item.id, item.nome)}
        >
          <Ionicons name="close-circle" size={28} color="#FF3B30" />
        </TouchableOpacity>

        {imageSource && (
          <Image source={imageSource} style={styles.cardImage} />
        )}

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.nome}</Text>
              <Text style={styles.cardSubtitle}>{item.categoria?.nome || 'Sem categoria'}</Text>
            </View>
            <Text style={styles.cardDate}>{formatDatePt(item.data)}</Text>
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.priceLabel}>Ingresso</Text>
              <Text style={styles.priceValue}>{formatPricePt(item.preco)}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity 
                style={styles.btnEdit}
                onPress={() => navigation.navigate('EventoForm', { id: item.id })}
              >
                <Ionicons name="pencil" size={18} color="#FFF" />
                <Text style={styles.btnEditText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.btnView}
                onPress={() => navigation.navigate('EventoDetail', { id: item.id })}
              >
                <Text style={styles.btnViewText}>Ver</Text>
                <Ionicons name="eye" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Listagem de Eventos</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquise Eventos"
          placeholderTextColor="#9CA3AF"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => navigation.navigate('EventoForm')}
      >
        <Text style={styles.createButtonText}>Criar Evento +</Text>
      </TouchableOpacity>

      <Text style={styles.eventCounter}>
        Mostrando <Text style={styles.eventCounterBold}>{filteredEventos.length}</Text> de{' '}
        <Text style={styles.eventCounterBold}>{eventos.length}</Text> Eventos
      </Text>

      <FlatList
        data={filteredEventos}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>Nenhum evento encontrado</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2340',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2340',
  },
  createButton: {
    backgroundColor: '#2D2CA8',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  eventCounter: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  eventCounterBold: {
    fontWeight: '700',
    color: '#1F2340',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    backgroundColor: '#FFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2340',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2340',
  },
  cardActions: {
    flexDirection: 'row',
  },
  btnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginRight: 8,
  },
  btnEditText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  btnView: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D2CA8',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnViewText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});
