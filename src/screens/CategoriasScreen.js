import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '../services/categoriasService';
import { useIsFocused } from '@react-navigation/native';

export default function CategoriasScreen({ navigation }) {
  const [categorias, setCategorias] = useState([]);
  const [novoNome, setNovoNome] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const isFocused = useIsFocused();
  const flatListRef = React.useRef(null);

  useEffect(() => {
    if (isFocused) {
      loadCategorias();
    }
  }, [isFocused]);

  const loadCategorias = async () => {
    try {
      const data = await getCategorias();
      setCategorias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategorias([]);
    }
  };

  const handleCreate = async () => {
    if (!novoNome.trim()) return;
    try {
      await createCategoria(novoNome.trim());
      setNovoNome('');
      loadCategorias();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar categoria');
    }
  };

  const handleUpdate = async (id) => {
    if (!editNome.trim()) return;
    try {
      await updateCategoria(id, editNome.trim());
      setEditandoId(null);
      setEditNome('');
      loadCategorias();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar categoria');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirmar Exclusão', 'Deseja realmente excluir esta categoria?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategoria(id);
            loadCategorias();
            Alert.alert('Sucesso', 'Categoria excluída!');
          } catch (error) {
            Alert.alert('Erro', 'Falha ao excluir categoria');
          }
        }
      },
    ]);
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      {editandoId === item.id ? (
        <View style={styles.editRow}>
          <TextInput 
            style={styles.editInput} 
            value={editNome} 
            onChangeText={setEditNome} 
            autoFocus
            placeholder="Nome da categoria"
            onFocus={() => {
              setTimeout(() => {
                try {
                  if (flatListRef.current && index !== -1 && index < categorias.length) {
                    flatListRef.current.scrollToIndex({ 
                      index, 
                      animated: true,
                      viewPosition: 0.5
                    });
                  }
                } catch (error) {
                  console.warn('Erro ao fazer scroll:', error);
                }
              }, 300);
            }}
          />
          <TouchableOpacity style={styles.iconButton} onPress={() => handleUpdate(item.id)}>
            <Ionicons name="checkmark-circle" size={28} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => { setEditandoId(null); setEditNome(''); }}>
            <Ionicons name="close-circle" size={28} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.normalRow}>
          <View style={styles.categoryIcon}>
            <Ionicons name="pricetag" size={20} color={colors.primary} />
          </View>
          <Text style={styles.nome}>{item.nome}</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => { setEditandoId(item.id); setEditNome(item.nome); }}>
            <Ionicons name="create-outline" size={24} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleDelete(item.id)}>
            <Ionicons name="trash-outline" size={24} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Categorias</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Criar Nova Categoria</Text>
        <View style={styles.createRow}>
          <TextInput
            style={styles.input}
            placeholder="Nome da categoria..."
            value={novoNome}
            onChangeText={setNovoNome}
            onSubmitEditing={handleCreate}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
            <Ionicons name="add-circle" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.countText}>
          {categorias.length} {categorias.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}
        </Text>

        <FlatList
          ref={flatListRef}
          data={categorias}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          keyboardShouldPersistTaps="handled"
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
            });
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="pricetags-outline" size={64} color="#ccc" />
              <Text style={styles.empty}>Nenhuma categoria cadastrada</Text>
              <Text style={styles.emptyHint}>Crie sua primeira categoria acima</Text>
            </View>
          }
        />
      </View>
    </KeyboardAvoidingView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  createRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: { 
    flex: 1,
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 14, 
    borderRadius: 8, 
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  addButton: { 
    backgroundColor: colors.primary, 
    padding: 10,
    borderRadius: 8, 
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: { 
    backgroundColor: colors.surface, 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  normalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { 
    fontSize: 16,
    flex: 1,
    color: colors.text,
    fontWeight: '500',
  },
  editInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: colors.border, 
    padding: 10, 
    borderRadius: 6,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  iconButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  empty: { 
    textAlign: 'center', 
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyHint: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
});