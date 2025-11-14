import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, Image, TouchableOpacity } from 'react-native';
import { colors } from '../theme/theme';
import MapView, { Marker, Callout } from 'react-native-maps';
import { getEventos } from '../services/eventosService';
import { getLocais, getLocalizacaoAtual } from '../services/locaisService';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import ErrorBoundary from '../components/ErrorBoundary';

function MapScreenContent({ navigation, route }) {
  const [eventos, setEventos] = useState([]);
  const [locais, setLocais] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [pendingUserRegion, setPendingUserRegion] = useState(null);
  const isFocused = useIsFocused();
  const lastPressTime = useRef(0);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadData();
    
    return () => {
      isMounted.current = false;
      setIsMapReady(false);
    };
  }, []);

  // Recarregar quando a tela de mapa ganha foco (ex.: após editar local)
  useEffect(() => {
    if (isFocused && isMounted.current) {
      loadData();
    }
  }, [isFocused]);

  // Animar para o local passado como parâmetro ou para a localização do usuário
  useEffect(() => {
    if (!isMounted.current || !isMapReady || !mapRef.current) return;
    
    try {
      const localId = route?.params?.localId;
      if (localId && locais.length > 0) {
        // Se recebeu localId, centraliza no local específico
        const local = locais.find(l => l.id === localId);
        if (local && local.latitude && local.longitude) {
          const lat = parseFloat(local.latitude);
          const lng = parseFloat(local.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            const targetRegion = {
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            };
            setTimeout(() => {
              if (isMounted.current && mapRef.current) {
                mapRef.current.animateToRegion(targetRegion, 800);
              }
            }, 100);
          }
        }
      } else if (pendingUserRegion) {
        // Senão, usa a localização do usuário
        setTimeout(() => {
          if (isMounted.current && mapRef.current) {
            mapRef.current.animateToRegion(pendingUserRegion, 600);
          }
        }, 100);
      }
    } catch (err) {
      console.warn('[MapaScreen] Falha ao animar mapa:', err);
    }
  }, [isMapReady, pendingUserRegion, route?.params?.localId, locais]);

  const loadData = async () => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      
      // Carregar eventos e locais primeiro (rápido)
      const [allEventos, allLocais] = await Promise.all([
        getEventos(),
        getLocais()
      ]);
      
      if (!isMounted.current) return;
      
      console.log('[MapaScreen] Eventos recebidos:', allEventos?.length || 0);
      console.log('[MapaScreen] Locais recebidos:', allLocais?.length || 0);
      
      // Filtro rigoroso para coords válidas
      const eventosValidos = (Array.isArray(allEventos) ? allEventos : []).filter(e => {
        try {
          return e && e.local && e.local.latitude && e.local.longitude && 
            !isNaN(parseFloat(e.local.latitude)) && !isNaN(parseFloat(e.local.longitude));
        } catch { return false; }
      });
      const locaisValidos = (Array.isArray(allLocais) ? allLocais : []).filter(l => {
        try {
          return l && l.latitude && l.longitude && 
            !isNaN(parseFloat(l.latitude)) && !isNaN(parseFloat(l.longitude));
        } catch { return false; }
      });
      
      console.log('[MapaScreen] Eventos válidos:', eventosValidos.length);
      console.log('[MapaScreen] Locais válidos:', locaisValidos.length);
      
      if (!isMounted.current) return;
      setEventos(eventosValidos);
      setLocais(locaisValidos);
      setLoading(false);
      
      // Tentar pegar localização do usuário em background (não bloqueia)
      if (!pendingUserRegion) {
        getLocalizacaoAtual().then(pos => {
          if (!isMounted.current) return;
          if (pos && pos.latitude && pos.longitude) {
            const userRegion = {
              latitude: Number(pos.latitude),
              longitude: Number(pos.longitude),
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            };
            setPendingUserRegion(userRegion);
          }
        }).catch(e => {
          if (isMounted.current) {
            console.warn('[MapaScreen] Localização indisponível:', e);
          }
        });
      }
    } catch (error) {
      console.error('[MapaScreen] Erro ao carregar dados do mapa:', error);
      if (isMounted.current) {
        setEventos([]);
        setLocais([]);
        setLoading(false);
      }
    }
  };

  const initialRegion = {
    latitude: -8.76183, // Porto Velho
    longitude: -63.902,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  // Memoizar marcadores para evitar re-renders
  const markers = useMemo(() => {
    if (!Array.isArray(eventos) || eventos.length === 0) return [];
    
    return eventos.filter(evento => {
      try {
        return evento && evento.local && evento.local.latitude && evento.local.longitude;
      } catch {
        return false;
      }
    });
  }, [eventos]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Carregando mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={false}
        onMapReady={() => {
          if (isMounted.current) {
            setIsMapReady(true);
          }
        }}
        onError={(err) => console.warn('[MapaScreen] MapView error:', err)}
        maxZoomLevel={20}
        minZoomLevel={3}
      >
        {markers.map((evento) => {
          try {
            console.log('[MapaScreen] Renderizando marcador para evento:', evento.nome, evento.id);
            const lat = parseFloat(evento.local.latitude);
            const lng = parseFloat(evento.local.longitude);
            if (isNaN(lat) || isNaN(lng)) {
              console.warn('[MapaScreen] Coordenadas inválidas:', lat, lng);
              return null;
            }
            
            // Validar URI da imagem
            let primeiraImagem = null;
            if (Array.isArray(evento.imagens) && evento.imagens.length > 0) {
              const uri = evento.imagens[0];
              if (uri && typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('file://'))) {
                primeiraImagem = uri;
              }
            } else if (evento.imagem && typeof evento.imagem === 'string' && (evento.imagem.startsWith('http://') || evento.imagem.startsWith('https://') || evento.imagem.startsWith('file://'))) {
              primeiraImagem = evento.imagem;
            }
            
            return (
              <Marker
                key={evento.id}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor="red"
                onCalloutPress={() => {
                  try {
                    if (!isMounted.current) return;
                    const now = Date.now();
                    // Prevenir duplo clique (debounce de 1 segundo)
                    if (now - lastPressTime.current < 1000) {
                      console.log('[MapaScreen] Duplo clique ignorado');
                      return;
                    }
                    lastPressTime.current = now;
                    
                    console.log('[MapaScreen] Navegando para evento:', evento.id);
                    navigation.navigate('EventoDetail', { id: evento.id });
                  } catch (navErr) {
                    console.error('[MapaScreen] Navigation error:', navErr);
                  }
                }}
              >
                <Callout>
                  <View style={styles.calloutContainer}>
                    {primeiraImagem ? (
                      <Image 
                        source={{ uri: primeiraImagem }} 
                        style={styles.calloutImage}
                        resizeMode="cover"
                        onError={(e) => console.warn('[MapaScreen] Erro ao carregar imagem:', e.nativeEvent.error)}
                      />
                    ) : (
                      <View style={[styles.calloutImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#999', fontSize: 14 }}>Sem imagem</Text>
                      </View>
                    )}
                    <Text style={styles.calloutTitle} numberOfLines={2}>
                      {String(evento.nome || 'Evento sem nome')}
                    </Text>
                    {evento.descricao && (
                      <Text style={styles.calloutDescription} numberOfLines={3}>
                        {String(evento.descricao)}
                      </Text>
                    )}
                    {evento.preco != null && evento.preco !== '' && evento.preco !== '0' && evento.preco !== 0 && (
                      <Text style={styles.calloutPrice}>
                        R$ {typeof evento.preco === 'number' ? evento.preco.toFixed(2) : String(evento.preco)}
                      </Text>
                    )}
                    <Text style={styles.calloutTap}>📍 Toque para ver detalhes</Text>
                  </View>
                </Callout>
              </Marker>
            );
          } catch (err) {
            console.warn('[MapaScreen] Marker render error:', err, evento?.id);
            return null;
          }
        })}
      </MapView>
    </View>
  );
}

// Memo para evitar re-renders desnecessários
const MapScreenContentMemo = React.memo(MapScreenContent, (prevProps, nextProps) => {
  return prevProps.route?.params?.localId === nextProps.route?.params?.localId;
});

export default function MapScreen(props) {
  return (
    <ErrorBoundary>
      <MapScreenContentMemo {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  calloutContainer: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 0,
    overflow: 'hidden',
  },
  calloutImage: {
    width: 240,
    height: 140,
    marginBottom: 0,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 12,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  calloutDescription: {
    fontSize: 13,
    color: '#666',
    marginHorizontal: 12,
    marginBottom: 8,
    lineHeight: 18,
  },
  calloutPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  calloutTap: {
    fontSize: 11,
    color: '#999',
    marginHorizontal: 12,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});