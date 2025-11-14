import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Dimensions, Modal, RefreshControl } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { getEventos } from '../services/eventosService';
import { getFavoritos, toggleFavorito } from '../services/favoritosService';
import { getCategorias } from '../services/categoriasService';
import { useIsFocused } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [search, setSearch] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [favoritos, setFavoritos] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    dateFilter: 'todos', // 'todos', 'hoje', 'semana', 'mes'
    gratuito: false,
    maxPreco: 1000,
    categorias: []
  });
  const [categorias, setCategorias] = useState([]);
  const isFocused = useIsFocused();
  const isMounted = useRef(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    if (isFocused) {
      loadEventos();
      loadFavoritos();
      loadCategorias();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isFocused]);

  const loadFavoritos = async () => {
    try {
      const favs = await getFavoritos();
      setFavoritos(Array.isArray(favs) ? favs : []);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavoritos([]);
    }
  };

  const loadCategorias = async () => {
    try {
      const cats = await getCategorias();
      setCategorias(Array.isArray(cats) ? cats : []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setCategorias([]);
    }
  };

  useEffect(() => {
    if (!isFocused) return;
    const delaySearch = setTimeout(() => {
      loadEventos();
    }, 300); // Debounce de 300ms
    
    return () => clearTimeout(delaySearch);
  }, [search, isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    loadEventos();
  }, [filters, isFocused]);

  const loadEventos = async () => {
    if (loading || loadingRef.current || !isMounted.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    
    try {
      console.log('🏠 [HOME] Carregando eventos...');
      const data = await getEventos(search);
      
      if (!isMounted.current) return;
      
      console.log(`🏠 [HOME] Eventos retornados: ${data?.length || 0}`);
      
      let validData = Array.isArray(data) ? data : [];
      
      // Validar estrutura dos eventos
      const beforeFilter = validData.length;
      validData = validData.filter(evento => {
        const isValid = evento && 
               typeof evento === 'object' && 
               evento.nome && 
               (evento.categoria || evento.categoria_id) &&
               (evento.local || evento.local_id);
        
        if (!isValid) {
          console.warn('⚠️ [HOME] Evento inválido filtrado:', {
            id: evento?.id,
            nome: evento?.nome,
            temCategoria: !!(evento?.categoria || evento?.categoria_id),
            temLocal: !!(evento?.local || evento?.local_id)
          });
        }
        
        return isValid;
      });
      
      console.log(`🏠 [HOME] Eventos válidos: ${validData.length}/${beforeFilter}`);
      
      // Aplicar filtros
      validData = applyFilters(validData);
      console.log(`🏠 [HOME] Após filtros: ${validData.length} eventos`);
      
      if (!isMounted.current) return;
      
      setEventos(validData);
      setMapRegion(getMapRegionForEvents(validData));
    } catch (error) {
      console.error('🔴 [HOME] Erro ao carregar eventos:', error);
      if (isMounted.current) {
        setEventos([]);
        Alert.alert('Erro', 'Falha ao carregar eventos');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      loadingRef.current = false;
    }
  };

  const applyFilters = (data) => {
    if (!Array.isArray(data)) return [];
    
    let filtered = [...data];

    try {
      // Filtro de data
      if (filters.dateFilter !== 'todos') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        filtered = filtered.filter(evento => {
          try {
            if (!evento || !evento.data) return false;
            const eventoDate = new Date(evento.data);
            
            if (filters.dateFilter === 'hoje') {
              return eventoDate.toDateString() === today.toDateString();
            } else if (filters.dateFilter === 'semana') {
              const weekFromNow = new Date(today);
              weekFromNow.setDate(today.getDate() + 7);
              return eventoDate >= today && eventoDate <= weekFromNow;
            } else if (filters.dateFilter === 'mes') {
              const monthFromNow = new Date(today);
              monthFromNow.setMonth(today.getMonth() + 1);
              return eventoDate >= today && eventoDate <= monthFromNow;
            }
            return true;
          } catch {
            return false;
          }
        });
      }

      // Filtro de preço gratuito
      if (filters.gratuito) {
        filtered = filtered.filter(evento => {
          try {
            return evento && (!evento.preco || evento.preco === 0 || evento.preco === '0');
          } catch {
            return false;
          }
        });
      } else if (filters.maxPreco < 1000) {
        // Filtro de preço máximo (só aplica se o usuário mudou o valor padrão)
        filtered = filtered.filter(evento => {
          try {
            if (!evento) return false;
            const preco = parseFloat(evento.preco || 0);
            return !isNaN(preco) && preco <= filters.maxPreco;
          } catch {
            return false;
          }
        });
      }

      // Filtro de categorias
      if (filters.categorias.length > 0) {
        filtered = filtered.filter(evento => {
          try {
            return evento && evento.categoria && evento.categoria.nome && filters.categorias.includes(evento.categoria.nome);
          } catch {
            return false;
          }
        });
      }
    } catch (error) {
      console.error('🔴 [HOME] Erro ao aplicar filtros:', error);
      return data; // Retorna dados originais se houver erro
    }

    return filtered;
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.dateFilter !== 'todos') count++;
    if (filters.gratuito) count++;
    else if (filters.maxPreco < 1000) count++;
    if (filters.categorias.length > 0) count++;
    return count;
  };

  const clearFilters = () => {
    setFilters({
      dateFilter: 'todos',
      gratuito: false,
      maxPreco: 1000,
      categorias: []
    });
    setFilterVisible(false);
  };

  const toggleCategoriaFilter = (categoriaName) => {
    setFilters(prev => {
      const categorias = prev.categorias.includes(categoriaName)
        ? prev.categorias.filter(c => c !== categoriaName)
        : [...prev.categorias, categoriaName];
      return { ...prev, categorias };
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await getEventos(search);
      const validData = Array.isArray(data) ? data : [];
      setEventos(validData);
      setMapRegion(getMapRegionForEvents(validData));
    } catch (error) {
      console.error('Erro ao atualizar eventos:', error);
      setEventos([]);
    } finally {
      setRefreshing(false);
    }
  };

  const getMapRegionForEvents = (items) => {
    try {
      const coords = (Array.isArray(items) ? items : [])
        .map(i => i?.local)
        .filter(l => l && l.latitude && l.longitude && !isNaN(Number(l.latitude)) && !isNaN(Number(l.longitude)))
        .map(l => ({ lat: Number(l.latitude), lng: Number(l.longitude) }));

      if (!coords.length) {
        return {
          latitude: -23.55052,
          longitude: -46.633308,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };
      }

      let minLat = coords[0].lat, maxLat = coords[0].lat, minLng = coords[0].lng, maxLng = coords[0].lng;
      coords.forEach(c => {
        if (c.lat < minLat) minLat = c.lat;
        if (c.lat > maxLat) maxLat = c.lat;
        if (c.lng < minLng) minLng = c.lng;
        if (c.lng > maxLng) maxLng = c.lng;
      });

      const latitude = (minLat + maxLat) / 2;
      const longitude = (minLng + maxLng) / 2;
      const latitudeDelta = Math.max(0.01, (maxLat - minLat) * 1.6);
      const longitudeDelta = Math.max(0.01, (maxLng - minLng) * 1.6);

      return { latitude, longitude, latitudeDelta, longitudeDelta };
    } catch (err) {
      console.warn('Erro ao calcular região do mapa:', err);
      return {
        latitude: -23.55052,
        longitude: -46.633308,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }
  };

  const { width } = Dimensions.get('window');
  const cardWidth = width - 40; // container padding 20 each side

  const openImageViewer = (images, index) => {
    setImageViewerImages(images);
    setImageViewerIndex(index);
    setImageViewerVisible(true);
  };

  const renderItem = ({ item, index }) => {
    try {
      if (!item || !item.id) {
        console.warn('⚠️ Item inválido no índice:', index);
        return null;
      }
      return <EventCard item={item} navigation={navigation} onOpenImageViewer={openImageViewer} />;
    } catch (error) {
      console.error('🔴 Erro ao renderizar item:', error);
      return null;
    }
  };

  const handleToggleFavorito = async (eventoId) => {
    try {
      const isFav = await toggleFavorito(eventoId);
      await loadFavoritos();
      return isFav;
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      return false;
    }
  };

  const EventCard = ({ item, navigation, onOpenImageViewer }) => {
    const [active, setActive] = useState(0);
    const [failedImages, setFailedImages] = useState(new Set());
    const isFav = favoritos.includes(item.id);

    // Normalize images: support item.imagens (array) or single item.imagem
    const rawImages = item.imagens && Array.isArray(item.imagens) && item.imagens.length ? item.imagens : (item.imagem ? [item.imagem] : []);
    const images = rawImages
      .map(img => (typeof img === 'string' ? img : (img && img.uri ? img.uri : null)))
      .filter(Boolean)
      .filter(uri => {
        // Apenas aceitar URLs HTTP/HTTPS em produção, ignorar file:// que não existem
        try {
          return uri && uri.startsWith('http');
        } catch (e) {
          return false;
        }
      });
      
    const formatDate = (iso) => {
      if (!iso) return '';
      try {
        const parts = iso.split('-');
        if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return iso;
      } catch (e) {
        console.warn('Erro ao formatar data:', e);
        return iso || '';
      }
    };

    const formattedPreco = (() => {
      try {
        const p = Number(item.preco || 0);
        if (isNaN(p)) return 'R$ 0,00';
        return `R$ ${p.toFixed(2).replace('.', ',')}`;
      } catch (e) {
        console.warn('Erro ao formatar preço:', e);
        return 'R$ 0,00';
      }
    })();

    return (
      <View style={[styles.card, { width: cardWidth }]}>
        {images.length > 0 ? (
          <View style={styles.carouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
                setActive(index);
              }}
            >
              {images.map((uri, idx) => {
                // Se a imagem falhou anteriormente, mostrar placeholder
                if (failedImages.has(uri)) {
                  return (
                    <View key={idx} style={[styles.banner, { width: cardWidth, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                      <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 12 }}>Imagem não disponível</Text>
                    </View>
                  );
                }
                
                return (
                  <TouchableOpacity key={idx} onPress={() => onOpenImageViewer(images, idx)} activeOpacity={0.9}>
                    <Image 
                      source={{ uri }} 
                      style={[styles.banner, { width: cardWidth }]} 
                      resizeMode="cover"
                      defaultSource={require('../../assets/logo.png')}
                      onError={(e) => {
                        console.warn('⚠️ Imagem não carregada:', uri);
                        setFailedImages(prev => new Set(prev).add(uri));
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.dots}>
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, active === i ? styles.dotActive : null]} />
              ))}
            </View>
            <TouchableOpacity 
              style={styles.favoriteButton} 
              onPress={() => handleToggleFavorito(item.id)}
            >
              <Ionicons 
                name={isFav ? "heart" : "heart-outline"} 
                size={28} 
                color={isFav ? "#FF3B30" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.bannerPlaceholder, { width: cardWidth }]}>
            <Ionicons name="image-outline" size={48} color="#999" />
            <Text style={{ color: '#999', marginTop: 8 }}>Sem imagem</Text>
            <TouchableOpacity 
              style={styles.favoriteButton} 
              onPress={() => handleToggleFavorito(item.id)}
            >
              <Ionicons 
                name={isFav ? "heart" : "heart-outline"} 
                size={28} 
                color={isFav ? "#FF3B30" : "#888"} 
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.nome}>{item.nome}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.categoriaSmall}>{item.categoria?.nome}</Text>
            <Text style={styles.data}>{formatDate(item.data)}</Text>
          </View>

          <Text style={styles.preco}>{formattedPreco}</Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity style={styles.detailsButton} onPress={() => navigation.navigate('EventoDetail', { id: item.id })}>
              <Text style={styles.detailsText}>Mais Detalhes ▸</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hamburger menu button */}
      <TouchableOpacity style={styles.hamburger} onPress={() => setMenuVisible(true)}>
        <Ionicons name="menu" size={26} color="#333" />
      </TouchableOpacity>

      {/* Filter button */}
      <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
        <Ionicons name="filter" size={24} color="#333" />
        {getActiveFiltersCount() > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuBox}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('EventoForm'); }}>
              <Text style={styles.menuText}>Criar Evento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('EventosList'); }}>
              <Text style={styles.menuText}>Listagem de Eventos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Favoritos'); }}>
              <Ionicons name="heart" size={18} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={styles.menuText}>Meus Favoritos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Locais'); }}>
              <Text style={styles.menuText}>Listagem de Locais</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Categorias'); }}>
              <Text style={styles.menuText}>Gerenciar Categorias</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Perfil'); }}>
              <Text style={styles.menuText}>Perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Mapa'); }}>
              <Text style={styles.menuText}>Mapa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); navigation.navigate('Inicio'); }}>
              <Text style={styles.menuText}>Início</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtros</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScrollView}>
              {/* Filtro de Data */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Data do Evento</Text>
                <View style={styles.filterButtonRow}>
                  <TouchableOpacity 
                    style={[styles.filterChip, filters.dateFilter === 'todos' && styles.filterChipActive]}
                    onPress={() => setFilters(prev => ({ ...prev, dateFilter: 'todos' }))}
                  >
                    <Text style={[styles.filterChipText, filters.dateFilter === 'todos' && styles.filterChipTextActive]}>Todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterChip, filters.dateFilter === 'hoje' && styles.filterChipActive]}
                    onPress={() => setFilters(prev => ({ ...prev, dateFilter: 'hoje' }))}
                  >
                    <Text style={[styles.filterChipText, filters.dateFilter === 'hoje' && styles.filterChipTextActive]}>Hoje</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterChip, filters.dateFilter === 'semana' && styles.filterChipActive]}
                    onPress={() => setFilters(prev => ({ ...prev, dateFilter: 'semana' }))}
                  >
                    <Text style={[styles.filterChipText, filters.dateFilter === 'semana' && styles.filterChipTextActive]}>Esta Semana</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.filterChip, filters.dateFilter === 'mes' && styles.filterChipActive]}
                    onPress={() => setFilters(prev => ({ ...prev, dateFilter: 'mes' }))}
                  >
                    <Text style={[styles.filterChipText, filters.dateFilter === 'mes' && styles.filterChipTextActive]}>Este Mês</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filtro de Preço */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Preço</Text>
                <TouchableOpacity 
                  style={styles.filterCheckboxRow}
                  onPress={() => setFilters(prev => ({ ...prev, gratuito: !prev.gratuito }))}
                >
                  <Ionicons 
                    name={filters.gratuito ? 'checkbox' : 'square-outline'} 
                    size={24} 
                    color={filters.gratuito ? '#007AFF' : '#888'} 
                  />
                  <Text style={styles.filterCheckboxText}>Apenas eventos gratuitos</Text>
                </TouchableOpacity>
                {!filters.gratuito && (
                  <View style={styles.filterPriceRange}>
                    <Text style={styles.filterPriceLabel}>Até R$ {filters.maxPreco.toFixed(0)}</Text>
                    <TextInput
                      style={styles.filterPriceInput}
                      keyboardType="numeric"
                      value={String(filters.maxPreco)}
                      onChangeText={(text) => {
                        const value = parseInt(text || '0', 10);
                        setFilters(prev => ({ ...prev, maxPreco: Math.max(0, Math.min(10000, value)) }));
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Filtro de Categorias */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Categorias</Text>
                {categorias.map((cat) => (
                  <TouchableOpacity 
                    key={cat.id}
                    style={styles.filterCheckboxRow}
                    onPress={() => toggleCategoriaFilter(cat.nome)}
                  >
                    <Ionicons 
                      name={filters.categorias.includes(cat.nome) ? 'checkbox' : 'square-outline'} 
                      size={24} 
                      color={filters.categorias.includes(cat.nome) ? '#007AFF' : '#888'} 
                    />
                    <Ionicons name={cat.icone || 'pricetag'} size={20} color="#666" style={{ marginLeft: 8 }} />
                    <Text style={styles.filterCheckboxText}>{cat.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity style={styles.filterClearButton} onPress={clearFilters}>
                <Text style={styles.filterClearButtonText}>Limpar Filtros</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyButton} onPress={() => setFilterVisible(false)}>
                <Text style={styles.filterApplyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TextInput
        style={styles.search}
        placeholder="Buscar por nome ou categoria..."
        value={search}
        onChangeText={setSearch}
      />

      {/* Hero carousel removed per solicitação: mapa vem primeiro */}
      {/* Mini map with event markers */}
      <View style={styles.mapWrapper}>
        {mapRegion && mapRegion.latitude && mapRegion.longitude && !isNaN(mapRegion.latitude) && !isNaN(mapRegion.longitude) ? (
          <MapView
            style={styles.map}
            initialRegion={mapRegion}
            onError={(error) => console.error('MapView error:', error)}
          >
            {Array.isArray(eventos) && eventos.map(ev => {
              try {
                if (ev && ev.local && ev.local.latitude && ev.local.longitude && 
                    !isNaN(Number(ev.local.latitude)) && !isNaN(Number(ev.local.longitude))) {
                  return (
                    <Marker
                      key={ev.id}
                      coordinate={{ latitude: Number(ev.local.latitude), longitude: Number(ev.local.longitude) }}
                      title={ev.nome || 'Evento'}
                      description={ev.local.nome || ''}
                      onPress={() => navigation.navigate('EventoDetail', { id: ev.id })}
                    />
                  );
                }
                return null;
              } catch (err) {
                console.warn('Erro ao renderizar marker:', err);
                return null;
              }
            })}
          </MapView>
        ) : (
          <View style={[styles.map, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="map-outline" size={48} color="#999" />
            <Text style={{ color: '#999', marginTop: 8 }}>Mapa não disponível</Text>
          </View>
        )}
        <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate('Mapa')}>
          <Text style={styles.mapButtonText}>Explore pelo Mapa</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={Array.isArray(eventos) ? eventos : []}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id || `evento-${index}`}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum evento encontrado</Text>}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        onScrollToIndexFailed={(info) => {
          console.warn('Scroll to index failed:', info);
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2D2CA8']}
            tintColor="#2D2CA8"
          />
        }
      />
      {/* add button moved to hamburger menu per UX request */}

      {/* Global Image Viewer Modal */}
      <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setImageViewerVisible(false)}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: imageViewerIndex * width, y: 0 }}
          >
            {imageViewerImages.map((uri, idx) => (
              <View key={idx} style={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                  source={{ uri, cache: 'force-cache' }} 
                  style={{ width: '100%', height: '80%' }} 
                  resizeMode="contain"
                  defaultSource={require('../../assets/logo.png')}
                  onError={(e) => {
                    console.warn('Erro ao carregar imagem no viewer:', uri, e.nativeEvent.error);
                  }}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  hamburger: { position: 'absolute', top: -46, right: 22, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8, elevation: 4, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  search: { borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 8, marginBottom: 20, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 10, elevation: 2 },
  card: { 
    backgroundColor: colors.surface, 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 12, 
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  nome: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  detalhes: { color: 'gray', marginBottom: 3 },
  categoria: { color: colors.primary, marginBottom: 3 },
  local: { color: 'green', marginBottom: 10 },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  imagemPlaceholder: { color: 'gray', fontSize: 12, marginBottom: 5 },
  empty: { textAlign: 'center', padding: 20, color: 'gray' },
  addButton: { flexDirection: 'row', backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  addText: { color: '#fff', marginLeft: 10, fontWeight: 'bold' },
  carouselContainer: { height: 160, borderRadius: 8, overflow: 'hidden', marginBottom: 10 },
  banner: { height: 160 },
  bannerPlaceholder: { height: 160, backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginBottom: 10 },
  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#fff' },
  favoriteButton: { 
    position: 'absolute', 
    top: 8, 
    right: 8, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    padding: 8, 
    borderRadius: 20,
    zIndex: 10,
  },
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerClose: { position: 'absolute', top: 40, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
  
  cardContent: { paddingTop: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoriaSmall: { color: '#888' },
  data: { color: '#888' },
  preco: { marginTop: 8, fontWeight: '700', color: colors.text },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  detailsButton: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  detailsText: { color: '#fff', fontWeight: '700' },
  footerIcons: { flexDirection: 'row', alignItems: 'center' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
  menuBox: { position: 'absolute', top: 60, right: 16, backgroundColor: colors.surface, borderRadius: 12, elevation: 6, paddingVertical: 6, minWidth: 160, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  menuText: { fontSize: 16, color: colors.text },
  mapWrapper: { height: 140, borderRadius: 10, overflow: 'hidden', marginBottom: 12 },
  map: { flex: 1 },
  mapButton: { position: 'absolute', alignSelf: 'center', top: 46, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, elevation: 4 },
  mapButtonText: { color: colors.text, fontWeight: '600' },
  
  // Filter button styles
  filterButton: { position: 'absolute', top: -46, right: 72, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8, elevation: 4, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF3B30', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  filterBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  
  // Filter modal styles
  filterModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  filterModalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 20 },
  filterModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterModalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  filterScrollView: { paddingHorizontal: 20 },
  filterSection: { marginTop: 20, marginBottom: 10 },
  filterSectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
  filterButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterChipText: { fontSize: 14, color: colors.text },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  filterCheckboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  filterCheckboxText: { fontSize: 15, color: colors.text, marginLeft: 8 },
  filterPriceRange: { marginTop: 10, paddingLeft: 32 },
  filterPriceLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  filterPriceInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16, backgroundColor: '#fff' },
  filterModalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  filterClearButton: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  filterClearButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  filterApplyButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#007AFF', alignItems: 'center' },
  filterApplyButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});