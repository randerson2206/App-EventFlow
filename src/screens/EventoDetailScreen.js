import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, Dimensions, Modal, TouchableOpacity, Linking, Platform } from 'react-native';
import { colors } from '../theme/theme';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getEventoById } from '../services/eventosService';
import { getFavoritos, toggleFavorito } from '../services/favoritosService';

export default function EventoDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [evento, setEvento] = useState(null);
  const [active, setActive] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const { width: screenW } = Dimensions.get('window');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [isFavorito, setIsFavorito] = useState(false);

  useEffect(() => {
    loadEvento();
    checkFavorito();
  }, []);

  const checkFavorito = async () => {
    try {
      const favs = await getFavoritos();
      setIsFavorito(Array.isArray(favs) && favs.includes(id));
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      setIsFavorito(false);
    }
  };

  const handleToggleFavorito = async () => {
    try {
      const isFav = await toggleFavorito(id);
      setIsFavorito(isFav);
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  };

  const handleComoChegar = () => {
    if (!hasCoords || !region) {
      Alert.alert('Atenção', 'Localização não disponível para este evento');
      return;
    }

    const lat = region.latitude;
    const lng = region.longitude;
    const label = encodeURIComponent(evento.nome || 'Evento');

    Alert.alert(
      'Como Chegar',
      'Escolha o aplicativo de navegação:',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=15&views=traffic`,
              android: `google.navigation:q=${lat},${lng}`,
            });
            const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
            
            Linking.canOpenURL(url || fallbackUrl).then(supported => {
              if (supported) {
                Linking.openURL(url || fallbackUrl);
              } else {
                Linking.openURL(fallbackUrl);
              }
            });
          },
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://?ll=${lat},${lng}&navigate=yes`;
            const fallbackUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
            
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Linking.openURL(fallbackUrl);
              }
            });
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const loadEvento = async () => {
    try {
      const data = await getEventoById(id);
      if (!data) {
        Alert.alert('Erro', 'Evento não encontrado');
        navigation.goBack();
        return;
      }
      setEvento(data);
      // Try to resolve address if missing and coords available
      try {
        const lat = Number(data?.local?.latitude);
        const lng = Number(data?.local?.longitude);
        const hasCoords = !isNaN(lat) && !isNaN(lng);
        if (hasCoords) {
          if (data?.local?.endereco) {
            setResolvedAddress(String(data.local.endereco));
          } else {
            const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (Array.isArray(results) && results.length > 0) {
              const a = results[0];
              const parts = [a.street || a.name, a.district, a.city || a.subregion, a.region].filter(Boolean);
              const text = parts.join(', ');
              if (text) setResolvedAddress(text);
            }
          }
        }
      } catch (_) {
        // ignore reverse geocode errors
      }
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      Alert.alert('Erro', 'Evento não encontrado');
      navigation.goBack();
    }
  };

  if (!evento) return <Text style={{ padding: 20 }}>Carregando...</Text>;

  // Normalize images: support imagens[] or imagem
  const rawImages = Array.isArray(evento.imagens) && evento.imagens.length > 0 ? evento.imagens : (evento.imagem ? [evento.imagem] : []);
  const images = rawImages
    .map(img => (typeof img === 'string' ? img : (img && img.uri ? img.uri : null)))
    .filter(Boolean)
    .filter(uri => {
      // Apenas aceitar URLs HTTP/HTTPS em produção
      try {
        return uri && uri.startsWith('http');
      } catch (e) {
        return false;
      }
    });

  const hasCoords = !!(evento?.local?.latitude && evento?.local?.longitude);
  const region = hasCoords
    ? {
        latitude: Number(evento.local.latitude),
        longitude: Number(evento.local.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  const openViewer = (index) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const parts = iso.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return iso;
  };

  return (
  <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {images.length > 0 && (
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / screenW);
              setActive(index);
            }}
          >
              {images.map((uri, idx) => (
                <TouchableOpacity key={idx} onPress={() => openViewer(idx)} activeOpacity={0.9}>
                  <Image 
                    source={{ uri }} 
                    style={{ width: screenW - 32, height: 220, borderRadius: 12 }} 
                    resizeMode="cover"
                    defaultSource={require('../../assets/logo.png')}
                    onError={(e) => {
                      console.warn('⚠️ Imagem não carregada:', uri);
                    }}
                  />
                </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, active === i ? styles.dotActive : null]} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{evento.nome}</Text>
          {!!evento.categoria?.nome && <Text style={styles.subtitle}>{evento.categoria.nome}</Text>}
        </View>
        {!!evento.data && <Text style={styles.dateBadge}>{formatDate(evento.data)}</Text>}
      </View>

      {!!evento.descricao && <Text style={styles.description}>{evento.descricao}</Text>}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Informações do Evento</Text>
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Data</Text>
          <Text style={styles.infoValue}>{formatDate(evento.data)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Horário</Text>
          <Text style={styles.infoValue}>
            {evento.hora ? `${evento.hora}h` : '-'}
            {evento.horaFim ? ` — ${evento.horaFim}h` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Valor Ingresso</Text>
        <Text style={styles.priceValue}>R$ {evento.preco ?? '0'}</Text>
      </View>

      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.favoriteActionButton]}
          onPress={handleToggleFavorito}
        >
          <Ionicons name={isFavorito ? "heart" : "heart-outline"} size={24} color={isFavorito ? "#FF3B30" : "#666"} />
          <Text style={[styles.actionButtonText, isFavorito && styles.favoriteText]}>
            {isFavorito ? 'Favoritado' : 'Favoritar'}
          </Text>
        </TouchableOpacity>

        {hasCoords && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.directionsButton]}
            onPress={handleComoChegar}
          >
            <Ionicons name="navigate" size={24} color="#fff" />
            <Text style={styles.directionsButtonText}>Como Chegar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>Localização</Text>
        {hasCoords && (
          <View style={styles.mapContainer}>
            <MapView style={StyleSheet.absoluteFill} initialRegion={region}>
              <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title={evento.local?.nome} />
            </MapView>
          </View>
        )}

        {!!evento.local?.nome && (
          <View style={styles.locationInfoBlock}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={20} color="#2D2CA8" />
              <Text style={styles.locationName}>{evento.local.nome}</Text>
            </View>
            {(resolvedAddress || evento.local?.endereco) && (
              <Text style={styles.locationAddress}>{resolvedAddress || evento.local?.endereco}</Text>
            )}
          </View>
        )}
      </View>
  </ScrollView>

    <Modal visible={viewerVisible} transparent={true} onRequestClose={() => setViewerVisible(false)}>
      <View style={styles.viewerContainer}>
        <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerVisible(false)}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: viewerIndex * screenW, y: 0 }}
        >
          {images.map((uri, idx) => (
            <View key={idx} style={{ width: screenW, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
              <Image 
                source={{ uri, cache: 'force-cache' }} 
                style={{ width: '100%', height: '80%' }} 
                resizeMode="contain"
                defaultSource={require('../../assets/logo.png')}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  carouselContainer: { height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2340' },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  dateBadge: { fontSize: 12, color: colors.textMuted },
  description: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginTop: 8 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1F2340', marginBottom: 8 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoItem: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#1F2340' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 14 },
  priceLabel: { color: '#E5E7EB', fontWeight: '700' },
  priceValue: { color: '#FFFFFF', fontWeight: '800' },
  actionButtonsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  favoriteActionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  favoriteText: {
    color: '#FF3B30',
  },
  directionsButton: {
    backgroundColor: '#34C759',
  },
  directionsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  locationSection: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 2, borderColor: colors.primary },
  mapContainer: { height: 180, borderRadius: 12, overflow: 'hidden', marginTop: 8, marginBottom: 12, backgroundColor: '#E5E7EB' },
  locationInfoBlock: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 10, 
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  locationName: { 
    flex: 1, 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#1F2340', 
    lineHeight: 22 
  },
  locationAddress: { 
    fontSize: 14, 
    color: '#6B7280', 
    lineHeight: 20,
    marginLeft: 28,
    fontStyle: 'italic',
  },
  locationText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  dots: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)', marginHorizontal: 4 },
  dotActive: { backgroundColor: '#fff' },
  viewerContainer: { flex: 1, backgroundColor: '#000' },
  viewerClose: { position: 'absolute', top: 40, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 20 },
});