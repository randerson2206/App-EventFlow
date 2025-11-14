import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getLocais, createLocal, updateLocal, getLocalizacaoAtual, getLocalById } from '../services/locaisService';

export default function LocalFormScreen({ route, navigation }) {
  const { id } = route.params || {};
  const isEdit = !!id;

  const [form, setForm] = useState({
    nome: '',
    latitude: '',
    longitude: '',
    endereco: '',
  });
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (isEdit) {
      loadLocal();
    }
  }, []);

  const loadLocal = async () => {
    try {
      const local = await getLocalById(id);
      if (local) {
        setForm({
          nome: local.nome || '',
          latitude: String(local.latitude || ''),
          longitude: String(local.longitude || ''),
          endereco: local.endereco || '',
        });
      } else {
        Alert.alert('Erro', 'Local não encontrado');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Erro ao carregar local:', error);
      Alert.alert('Erro', 'Falha ao carregar local');
      navigation.goBack();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await getLocalizacaoAtual();
      if (location && location.latitude && location.longitude) {
        setForm({ ...form, latitude: location.latitude.toString(), longitude: location.longitude.toString() });
        Alert.alert('Sucesso', 'Localização atual capturada!');
      } else {
        Alert.alert('Erro', 'Não foi possível obter sua localização. Verifique as permissões.');
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('Erro', 'Falha ao obter localização atual');
    }
  };

  const openMapPicker = async () => {
    try {
      // Tenta obter localização atual primeiro
      let initialLocation = { latitude: -8.7619, longitude: -63.9039 }; // Porto Velho como fallback
      
      // Se já tem coordenadas no formulário, usa elas
      if (form.latitude && form.longitude) {
        const lat = parseFloat(form.latitude);
        const lng = parseFloat(form.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          initialLocation = { latitude: lat, longitude: lng };
          setSelectedLocation(initialLocation);
          setMapVisible(true);
          return;
        }
      }
      
      // Caso contrário, tenta pegar localização atual
      try {
        const currentLocation = await getLocalizacaoAtual();
        if (currentLocation && currentLocation.latitude && currentLocation.longitude) {
          initialLocation = {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude
          };
          console.log('📍 [LocalForm] Usando localização atual:', initialLocation);
        } else {
          console.log('⚠️ [LocalForm] Localização atual indisponível, usando Porto Velho');
        }
      } catch (locErr) {
        console.warn('⚠️ [LocalForm] Erro ao obter localização, usando fallback:', locErr);
      }
      
      setSelectedLocation(initialLocation);
      setMapVisible(true);
    } catch (error) {
      console.error('Erro ao abrir mapa:', error);
      Alert.alert('Erro', 'Falha ao abrir mapa');
    }
  };

  const handleMapPress = async (e) => {
    const newLocation = e.nativeEvent.coordinate;
    setSelectedLocation(newLocation);
  };

  const handleMarkerDragEnd = async (e) => {
    const newLocation = e.nativeEvent.coordinate;
    setSelectedLocation(newLocation);
  };

  const confirmMapLocation = async () => {
    if (selectedLocation) {
      try {
        // Buscar endereço a partir das coordenadas
        const { latitude, longitude } = selectedLocation;
        
        console.log('🔍 [LocalForm] Buscando endereço para:', latitude, longitude);
        
        // Geocodificação reversa
        const addresses = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        
        let endereco = '';
        if (addresses && addresses.length > 0) {
          const addr = addresses[0];
          // Montar endereço completo
          const parts = [];
          if (addr.street) parts.push(addr.street);
          if (addr.name && addr.name !== addr.street) parts.push(addr.name);
          if (addr.district) parts.push(addr.district);
          if (addr.city) parts.push(addr.city);
          if (addr.region) parts.push(addr.region);
          
          endereco = parts.join(', ');
          console.log('✅ [LocalForm] Endereço encontrado:', endereco);
        } else {
          console.log('⚠️ [LocalForm] Nenhum endereço encontrado para estas coordenadas');
          endereco = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
        }
        
        setForm({
          ...form,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          endereco: endereco,
        });
        setMapVisible(false);
        Alert.alert('Sucesso', 'Localização e endereço capturados!');
      } catch (error) {
        console.warn('⚠️ [LocalForm] Erro ao buscar endereço:', error);
        // Mesmo com erro na geocodificação, salva as coordenadas
        setForm({
          ...form,
          latitude: selectedLocation.latitude.toString(),
          longitude: selectedLocation.longitude.toString(),
        });
        setMapVisible(false);
        Alert.alert('Atenção', 'Localização selecionada! Não foi possível buscar o endereço automaticamente, você pode digitá-lo manualmente.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (!form.nome || !form.latitude || !form.longitude) {
        Alert.alert('Erro', 'Preencha nome, latitude e longitude');
        return;
      }
      
      const lat = parseFloat(form.latitude);
      const lng = parseFloat(form.longitude);
      
      if (isNaN(lat) || isNaN(lng)) {
        Alert.alert('Erro', 'Latitude e longitude devem ser números válidos');
        return;
      }
      
      const data = {
        ...form,
        latitude: lat,
        longitude: lng,
      };
      
      if (isEdit) {
        await updateLocal(id, data.nome, data.latitude, data.longitude, data.endereco);
      } else {
        await createLocal(data.nome, data.latitude, data.longitude, data.endereco);
      }
      Alert.alert('Sucesso', isEdit ? 'Local atualizado!' : 'Local criado!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar local:', error);
      Alert.alert('Erro', 'Falha ao salvar local');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Nome do Local *</Text>
      <TextInput
        style={styles.input}
        value={form.nome}
        onChangeText={(text) => setForm({ ...form, nome: text })}
        placeholder="Ex: Prefeitura de Porto Velho"
        textAlignVertical="center"
      />

      <Text style={styles.label}>Latitude *</Text>
      <TextInput
        style={styles.input}
        value={form.latitude}
        onChangeText={(text) => setForm({ ...form, latitude: text })}
        placeholder="Ex: -23.587"
        keyboardType="numeric"
        textAlignVertical="center"
      />

      <Text style={styles.label}>Longitude *</Text>
      <TextInput
        style={styles.input}
        value={form.longitude}
        onChangeText={(text) => setForm({ ...form, longitude: text })}
        placeholder="Ex: -46.657"
        keyboardType="numeric"
        textAlignVertical="center"
      />

      <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
        <Text style={styles.locationText}>📍 Usar Localização Atual (GPS)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.mapButton} onPress={openMapPicker}>
        <Text style={styles.mapButtonText}>🗺️ Escolher no Mapa</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Endereço (opcional)</Text>
      <TextInput
        style={styles.input}
        value={form.endereco}
        onChangeText={(text) => setForm({ ...form, endereco: text })}
        placeholder="Ex: Porto Velho, RO"
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>{isEdit ? 'Atualizar' : 'Criar'} Local</Text>
      </TouchableOpacity>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapHeaderTitle}>Escolha a Localização</Text>
            <TouchableOpacity onPress={() => setMapVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedLocation && (
            <MapView
              style={styles.mapView}
              initialRegion={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={handleMapPress}
            >
              <Marker
                coordinate={selectedLocation}
                draggable
                onDragEnd={handleMarkerDragEnd}
              />
            </MapView>
          )}

          <View style={styles.mapFooter}>
            <Text style={styles.coordinatesText}>
              Lat: {selectedLocation?.latitude.toFixed(6)} | Lng: {selectedLocation?.longitude.toFixed(6)}
            </Text>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmMapLocation}>
              <Text style={styles.confirmButtonText}>✓ Confirmar Localização</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8f8f8' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    paddingHorizontal: 12, 
    paddingVertical: 14,
    borderRadius: 8, 
    backgroundColor: '#fff', 
    fontSize: 16, 
    minHeight: 50 
  },
  locationButton: { backgroundColor: '#28a745', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10, marginTop: 10 },
  locationText: { color: '#fff', fontWeight: 'bold' },
  mapButton: { backgroundColor: '#2D2CA8', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  mapButtonText: { color: '#fff', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  mapModalContainer: { flex: 1, backgroundColor: '#fff' },
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#f8f8f8', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  mapHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 4 },
  mapView: { flex: 1 },
  mapFooter: { padding: 16, backgroundColor: '#f8f8f8', borderTopWidth: 1, borderTopColor: '#ddd' },
  coordinatesText: { fontSize: 14, color: '#666', marginBottom: 12, textAlign: 'center' },
  confirmButton: { backgroundColor: '#28a745', padding: 14, borderRadius: 8, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});