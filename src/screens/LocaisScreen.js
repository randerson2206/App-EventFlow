import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, TextInput, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { getLocais, deleteLocal } from '../services/locaisService';
import { useIsFocused } from '@react-navigation/native';

export default function LocaisScreen({ navigation }) {
  const [locais, setLocais] = useState([]);
  const [search, setSearch] = useState('');
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadLocais();
    }
  }, [isFocused]);

  const loadLocais = async () => {
    try {
      const data = await getLocais();
      setLocais(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar locais:', error);
      setLocais([]);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirmar Exclusão', 'Deseja realmente excluir este local?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLocal(id);
            await loadLocais();
          } catch (error) {
            console.error('Erro ao excluir local:', error);
            Alert.alert('Erro', 'Falha ao excluir local');
          }
        }
      },
    ]);
  };

  const filteredLocais = (Array.isArray(locais) ? locais : []).filter(local => {
    try {
      return local && local.nome && local.nome.toLowerCase().includes(search.toLowerCase());
    } catch {
      return false;
    }
  });

  const renderItem = ({ item }) => {
    const hasCoords = !!(item.latitude && item.longitude);

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.localName}>{item.endereco || item.nome}</Text>
              {item.endereco && item.nome && item.endereco !== item.nome ? (
                <Text style={styles.localSubtitle}>{item.nome}</Text>
              ) : null}
              {hasCoords && (
                <View style={styles.coordsRow}>
                  <Ionicons name="location" size={14} color="#666" />
                  <Text style={styles.coordsText}>
                    {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.deleteIconButton} onPress={() => handleDelete(item.id)}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => navigation.navigate('LocalForm', { id: item.id })}
            >
              <Ionicons name="create-outline" size={18} color="#FFB800" />
              <Text style={styles.editButtonText}>Editar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => {
                // Navega para a aba Mapa passando o local selecionado
                navigation.navigate('Home', { 
                  screen: 'Mapa',
                  params: { localId: item.id }
                });
              }}
            >
              <Text style={styles.viewButtonText}>Ver no Mapa</Text>
              <Ionicons name="map" size={18} color="#fff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={() => navigation.openDrawer?.() || navigation.goBack()}
        >
          <Ionicons name="menu" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Logo</Text>
      </View>

      <Text style={styles.pageTitle}>Listagem de Locais</Text>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquise Eventos"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <TouchableOpacity 
        style={styles.createButton} 
        onPress={() => navigation.navigate('LocalForm')}
      >
        <Text style={styles.createButtonText}>Criar Local +</Text>
      </TouchableOpacity>

      <Text style={styles.countText}>
        Mostrando {filteredLocais.length} de {locais.length} Locais Cadastrados
      </Text>

      <FlatList
        data={filteredLocais}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum local encontrado</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
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
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  createButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapPreview: {
    height: 140,
    position: 'relative',
  },
  miniMap: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deleteIconButton: {
    padding: 4,
    marginLeft: 8,
  },
  localName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  localSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  coordsText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  editButtonText: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    padding: 40,
    color: colors.textMuted,
    fontSize: 14,
  },
});