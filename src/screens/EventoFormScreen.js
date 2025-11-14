import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Modal, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { getEventoById, createEvento, updateEvento } from '../services/eventosService';
import { getCategorias, createCategoria } from '../services/categoriasService';
import { getLocais, createLocal, getLocalizacaoAtual } from '../services/locaisService';
import MapView, { Marker } from 'react-native-maps';
import ErrorBoundary from '../components/ErrorBoundary';

function EventoFormScreenContent({ route, navigation }) {
  console.log('[EventoFormScreen] Iniciando componente...');
  const { id } = route.params || {};
  const isEdit = !!id;
  console.log('[EventoFormScreen] isEdit:', isEdit, 'id:', id);

  const [form, setForm] = useState(() => ({
    nome: '',
    descricao: '',
    data: new Date(),
    hora: new Date(),
    horaFim: new Date(),
    preco: '',
    categoriaId: '',
    localId: '',
  }));
  const [imagens, setImagens] = useState([]); // array de URIs
  const [categorias, setCategorias] = useState([]);
  const [locais, setLocais] = useState([]);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [showTimeEnd, setShowTimeEnd] = useState(false);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCoord, setMapCoord] = useState(null);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catName, setCatName] = useState('');
  const [mapInitialRegion, setMapInitialRegion] = useState(null);
  const [showUserDot, setShowUserDot] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Helpers de formatação em pt-BR com fallback simples
  const formatDatePt = (d) => {
    try {
      return d?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch (e) {
      if (!d) return '';
      const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const [y, m, day] = iso.split('-');
      return `${day}/${m}/${y}`;
    }
  };

  const formatTimePt = (d) => {
    try {
      return d?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      if (!d) return '';
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) {
      console.log('[EventoFormScreen] Ignorando re-render - dados já carregados');
      return;
    }
    
    let mounted = true;
    hasLoadedRef.current = true;
    
    const loadData = async () => {
      console.log('[EventoFormScreen] loadData iniciando...');
      if (mounted) setIsLoading(true);
      try {
        console.log('[EventoFormScreen] Buscando categorias...');
        const cats = await getCategorias();
        console.log('[EventoFormScreen] Categorias recebidas:', cats?.length || 0);
        if (mounted) setCategorias(Array.isArray(cats) ? cats : []);
        
        console.log('[EventoFormScreen] Buscando locais...');
        const allLocais = await getLocais();
        console.log('[EventoFormScreen] Locais recebidos:', allLocais?.length || 0);
        const validLocais = Array.isArray(allLocais) ? allLocais : [];
        const locaisValidos = validLocais.filter(l => l && l.latitude && l.longitude && !isNaN(l.latitude) && !isNaN(l.longitude));
        console.log('[EventoFormScreen] Locais válidos:', locaisValidos.length);
        if (mounted) setLocais(locaisValidos);
        
        if (isEdit) {
          console.log('[EventoFormScreen] Modo edição - buscando evento id:', id);
          const evento = await getEventoById(id);
          console.log('[EventoFormScreen] Evento carregado:', evento ? 'sim' : 'não');
          if (evento && mounted) {
          // Helpers para tolerar formatos variados de data/hora
          const parseDate = (d) => {
            if (!d) return new Date();
            if (d instanceof Date) return d;
            if (typeof d === 'string') {
              if (d.includes('-')) {
                // YYYY-MM-DD
                const [y, m, day] = d.split('-');
                const dt = new Date(Number(y), Number(m) - 1, Number(day));
                return isNaN(dt.getTime()) ? new Date() : dt;
              }
              if (d.includes('/')) {
                // DD/MM/YYYY
                const [day, m, y] = d.split('/');
                const dt = new Date(Number(y), Number(m) - 1, Number(day));
                return isNaN(dt.getTime()) ? new Date() : dt;
              }
            }
            return new Date();
          };

          const parseTime = (t) => {
            // Anchor time to today's date to avoid Android picker issues with epoch dates
            const now = new Date();
            const fallback = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
            if (!t || typeof t !== 'string') return fallback;
            const parts = t.split(':');
            const h = Number(parts[0]);
            const m = Number(parts[1] || 0);
            const dt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
            return isNaN(dt.getTime()) ? fallback : dt;
          };

          setForm({
            nome: evento.nome || '',
            descricao: evento.descricao || '',
            data: parseDate(evento.data),
            hora: parseTime(evento.hora),
            horaFim: parseTime(evento.horaFim || evento.hora),
            preco: `${evento?.preco ?? ''}`,
            categoriaId: evento.categoriaId || evento.categoria?.id || '',
            localId: evento.localId || evento.local?.id || '',
          });
          const rawImages = Array.isArray(evento.imagens) && evento.imagens.length
            ? evento.imagens
            : (evento.imagem ? [evento.imagem] : []);
          const uris = rawImages.map(img => typeof img === 'string' ? img : (img && img.uri ? img.uri : null)).filter(Boolean);
          console.log('[EventoFormScreen] Imagens do evento:', uris.length);
          setImagens(uris);
          if (evento.local && evento.local.latitude && evento.local.longitude) {
            setLat(String(evento.local.latitude));
            setLng(String(evento.local.longitude));
            console.log('[EventoFormScreen] Coordenadas do local:', evento.local.latitude, evento.local.longitude);
          }
        } else if (mounted) {
          console.warn('[EventoFormScreen] Evento não encontrado para id:', id);
          Alert.alert('Erro', 'Evento não encontrado');
          navigation.goBack();
        }
      } else {
        console.log('[EventoFormScreen] Modo criação - dados carregados');
      }
    } catch (error) {
      console.error('[EventoFormScreen] Erro ao carregar dados do formulário:', error);
      if (mounted) Alert.alert('Erro', 'Falha ao carregar dados');
    } finally {
      if (mounted) {
        setIsLoading(false);
        console.log('[EventoFormScreen] Loading concluído');
      }
    }
  };
  
  loadData();
  
  return () => {
    mounted = false;
  };
}, [isEdit, id]);

  const pickFromLibrary = async () => {
    try {
      const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        if (canAskAgain) {
          Alert.alert('Permissão', 'Permissão para acessar a galeria é necessária. Tente novamente e permita o acesso.');
        } else {
          Alert.alert(
            'Permissão necessária',
            'Você negou o acesso à galeria. Abra as configurações para permitir.',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Abrir configurações', onPress: () => Linking.openSettings && Linking.openSettings() }
            ]
          );
        }
        return;
      }
    } catch (permError) {
      console.error('Erro ao solicitar permissão:', permError);
      Alert.alert('Erro', 'Não foi possível acessar a galeria');
      return;
    }

    // Monta opções com múltipla seleção apenas no iOS (Android pode ignorar ou falhar em alguns dispositivos)
    const baseOptions = {
      quality: 0.7,
      mediaTypes: 'images',
    };
    // Tenta sempre múltipla seleção; alguns Androids podem ignorar, teremos fallback
    const options = { ...baseOptions, allowsMultipleSelection: true, selectionLimit: 10 };

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync(options);
    } catch (err) {
      console.warn('Falha ao abrir galeria:', err);
      result = { canceled: true };
    }
    // Fallback: em alguns Androids a múltipla seleção pode falhar silenciosamente; tenta novamente com seleção simples
    if (result.canceled) {
      // Fallback extra: usar DocumentPicker quando a galeria falhar
      try {
        const doc = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true, copyToCacheDirectory: false });
        let pickedUris = [];
        if (doc && Array.isArray(doc.assets) && doc.assets.length) {
          pickedUris = doc.assets.map(a => a?.uri).filter(Boolean);
        } else if (doc && doc.type === 'success' && doc.uri) {
          pickedUris = [doc.uri];
        }
        if (pickedUris.length) {
          const outputUris = [];
          for (const uri of pickedUris) {
            try {
              const filename = (uri.split('/').pop() || 'image').replace(/\?.*$/, '');
              const newPath = `${FileSystem.documentDirectory}${Date.now()}_${filename}`;
              await FileSystem.copyAsync({ from: uri, to: newPath });
              outputUris.push(newPath);
            } catch (copyErr) {
              console.warn('Falha ao copiar imagem (DocumentPicker), usando URI original:', copyErr);
              outputUris.push(uri);
            }
          }
          const merged = [...imagens, ...outputUris];
          const unique = Array.from(new Set(merged));
          setImagens(unique);
        }
      } catch (fallbackErr) {
        console.warn('Fallback com DocumentPicker falhou:', fallbackErr);
        Alert.alert(
          'Não foi possível abrir a galeria',
          'Verifique as permissões em Configurações e se você tem um app de galeria instalado (ex.: Google Fotos).',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings && Linking.openSettings() }
          ]
        );
      }
      return;
    }
    
    try {
      // Suportar múltiplos formatos de retorno
      const assets = result.assets || result.selected || [];
      const tempUris = (Array.isArray(assets) ? assets : [assets])
        .map(a => a?.uri)
        .filter(Boolean);

      if (!tempUris.length && result.uri) {
        tempUris.push(result.uri);
      }

      // Tentar copiar para diretório permanente; se falhar, usar a URI original
      const outputUris = [];
      for (const uri of tempUris) {
        try {
          const filename = (uri.split('/').pop() || 'image').replace(/\?.*$/, '');
          const newPath = `${FileSystem.documentDirectory}${Date.now()}_${filename}`;
          await FileSystem.copyAsync({ from: uri, to: newPath });
          outputUris.push(newPath);
        } catch (copyErr) {
          console.warn('Falha ao copiar imagem, usando URI original:', copyErr);
          outputUris.push(uri);
        }
      }

      // concatena e remove duplicados
      const merged = [...imagens, ...outputUris];
      const unique = Array.from(new Set(merged));
      setImagens(unique);
    } catch (error) {
      console.error('Erro ao processar seleção de imagens:', error);
      Alert.alert('Erro', 'Falha ao processar imagens');
    }
  };

  const takePhoto = async () => {
    const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      if (canAskAgain) {
        Alert.alert('Permissão', 'Permissão de câmera é necessária para tirar fotos. Tente novamente e permita o acesso.');
      } else {
        Alert.alert(
          'Permissão necessária',
          'Você negou o acesso à câmera. Abra as configurações para permitir.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings && Linking.openSettings() }
          ]
        );
      }
      return;
    }

    let result;
    try {
      const options = { quality: 0.8, mediaTypes: 'images' };
      result = await ImagePicker.launchCameraAsync(options);
    } catch (err) {
      console.warn('Falha ao abrir câmera:', err);
      Alert.alert(
        'Não foi possível abrir a câmera',
        'Verifique as permissões em Configurações e se o app de câmera está disponível no dispositivo.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings && Linking.openSettings() }
        ]
      );
      return;
    }
    if (result.canceled) return;

    try {
      const assets = result.assets || [];
      const tempUris = (Array.isArray(assets) ? assets : [assets])
        .map(a => a?.uri)
        .filter(Boolean);
      if (!tempUris.length && result.uri) tempUris.push(result.uri);

      const outputUris = [];
      for (const uri of tempUris) {
        try {
          const filename = (uri.split('/').pop() || 'image').replace(/\?.*$/, '');
          const newPath = `${FileSystem.documentDirectory}${Date.now()}_${filename}`;
          await FileSystem.copyAsync({ from: uri, to: newPath });
          outputUris.push(newPath);
        } catch (copyErr) {
          console.warn('Falha ao copiar foto, usando URI original:', copyErr);
          outputUris.push(uri);
        }
      }
      const merged = [...imagens, ...outputUris];
      const unique = Array.from(new Set(merged));
      setImagens(unique);
    } catch (error) {
      console.error('Erro ao processar foto tirada:', error);
      Alert.alert('Erro', 'Falha ao processar foto');
    }
  };

  const openUploadChooser = () => {
    Alert.alert(
      'Adicionar imagens',
      'Escolha a origem da imagem',
      [
        { text: 'Galeria', onPress: pickFromLibrary },
        { text: 'Câmera', onPress: takePhoto },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const removeImage = (index) => {
    try {
      setImagens((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.filter((_, i) => i !== index);
      });
    } catch (e) {
      console.error('Erro ao remover imagem:', e);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!form.nome || !form.descricao || !form.preco || !form.categoriaId) {
        Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
        return;
      }
      
      if (!form.data || !(form.data instanceof Date) || isNaN(form.data.getTime())) {
        Alert.alert('Erro', 'Data inválida');
        return;
      }
      
      if (!form.hora || !(form.hora instanceof Date) || isNaN(form.hora.getTime())) {
        Alert.alert('Erro', 'Hora inválida');
        return;
      }
      
      const data = {
        ...form,
        data: form.data.toISOString().split('T')[0],
        hora: form.hora.toTimeString().split(' ')[0].substring(0, 5),
        horaFim: form.horaFim.toTimeString().split(' ')[0].substring(0, 5),
        preco: parseFloat(form.preco),
      };
      // Resolver local: se não selecionou local existente, mas informou lat/lng válidos, cria novo Local
      let localId = data.localId;
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      const coordsValidas = !isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0;
      if (!localId && coordsValidas) {
        try {
          // Resolver endereço via reverse geocode e usar como nome/endereço do local
          let resolved = '';
          try {
            const results = await Location.reverseGeocodeAsync({ latitude: latNum, longitude: lngNum });
            if (Array.isArray(results) && results.length) {
              const a = results[0];
              const parts = [a.street || a.name, a.district, a.city || a.subregion, a.region].filter(Boolean);
              resolved = parts.join(', ');
            }
          } catch (rgErr) {
            console.warn('Reverse geocode falhou:', rgErr);
          }
          const nomeLocal = resolved || 'Local marcado';
          const enderecoLocal = resolved || 'Marcado no mapa';
          const novoLocal = await createLocal(nomeLocal, latNum, lngNum, enderecoLocal);
          localId = novoLocal.id;
        } catch (createErr) {
          console.warn('Falha ao criar local:', createErr);
        }
      }
      if (!localId) {
        Alert.alert('Atenção', 'Selecione um local cadastrado ou informe latitude e longitude.');
        return;
      }
      data.localId = localId;

      if (isEdit) {
        await updateEvento(id, data, imagens);
      } else {
        await createEvento(data, imagens);
      }
      Alert.alert('Sucesso', isEdit ? 'Evento atualizado!' : 'Evento criado!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      Alert.alert('Erro', 'Falha ao salvar evento');
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDate(false);
    if (selectedDate && selectedDate instanceof Date && !isNaN(selectedDate.getTime())) {
      updateFormField('data', selectedDate);
    }
  };

  const onChangeTime = (event, selectedTime) => {
    setShowTime(false);
    if (selectedTime && selectedTime instanceof Date && !isNaN(selectedTime.getTime())) {
      updateFormField('hora', selectedTime);
    }
  };

  const onChangeTimeEnd = (event, selectedTime) => {
    setShowTimeEnd(false);
    if (selectedTime && selectedTime instanceof Date && !isNaN(selectedTime.getTime())) {
      updateFormField('horaFim', selectedTime);
    }
  };

  const hasCategorias = useMemo(() => Array.isArray(categorias) && categorias.length > 0, [categorias]);
  const hasLocais = useMemo(() => Array.isArray(locais) && locais.length > 0, [locais]);

  const updateFormField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateCategoria = async () => {
    try {
      const name = (catName || '').trim();
      if (!name) {
        Alert.alert('Atenção', 'Informe o nome da categoria.');
        return;
      }
      const nova = await createCategoria(name);
      const cats = await getCategorias();
      setCategorias(Array.isArray(cats) ? cats : []);
      updateFormField('categoriaId', nova.id);
      setCatName('');
      setCatModalVisible(false);
    } catch (e) {
      console.error('Erro ao criar categoria:', e);
      Alert.alert('Erro', 'Não foi possível criar a categoria.');
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: '#666' }}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
      {/* Título e Upload de fotos no topo */}
      <Text style={styles.pageTitle}>Cadastrar Evento</Text>
      <View style={styles.sectionDivider} />
      <View style={styles.uploadRowFixed}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.uploadThumbsScrollRight}
          contentContainerStyle={styles.uploadThumbsContent}
        >
          {Array.isArray(imagens) && imagens.length > 0 && imagens.map((uri, idx) => {
            try {
              return uri ? (
                <View key={idx} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeBadge} onPress={() => removeImage(idx)}>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null;
            } catch (e) {
              console.error('Erro ao renderizar imagem:', e);
              return null;
            }
          })}
        </ScrollView>
        <TouchableOpacity style={styles.uploadTile} onPress={pickFromLibrary}>
          <Text style={{ fontSize: 22, color: '#888' }}>+</Text>
          <Text style={{ color: '#888', marginTop: 4 }}>Upload</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Nome do Evento *</Text>
      <TextInput style={styles.input} value={form.nome} onChangeText={(text) => updateFormField('nome', text)} />

      <Text style={styles.label}>Descrição *</Text>
      <TextInput style={[styles.input, styles.textArea]} value={form.descricao} onChangeText={(text) => updateFormField('descricao', text)} multiline />

      <Text style={styles.label}>Data *</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDate(true)}>
        <Text style={{ textTransform: 'capitalize' }}>{formatDatePt(form.data)}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={form.data}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          {...(Platform.OS === 'ios' ? { locale: 'pt-BR' } : {})}
          onChange={onChangeDate}
        />
      )}

      <Text style={styles.label}>Horário Inicial *</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowTime(true)}>
        <Text>{formatTimePt(form.hora)}</Text>
      </TouchableOpacity>
      {showTime && (
        <DateTimePicker
          value={form.hora}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          {...(Platform.OS === 'ios' ? { locale: 'pt-BR' } : {})}
          is24Hour={true}
          onChange={onChangeTime}
        />
      )}

      <Text style={styles.label}>Horário Final *</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimeEnd(true)}>
        <Text>{formatTimePt(form.horaFim)}</Text>
      </TouchableOpacity>
      {showTimeEnd && (
        <DateTimePicker
          value={form.horaFim}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          {...(Platform.OS === 'ios' ? { locale: 'pt-BR' } : {})}
          is24Hour={true}
          onChange={onChangeTimeEnd}
        />
      )}

      <Text style={styles.label}>Preço (R$) *</Text>
      <TextInput style={styles.input} value={form.preco} onChangeText={(text) => updateFormField('preco', text)} keyboardType="numeric" />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.label}>Categoria *</Text>
        <TouchableOpacity onPress={() => setCatModalVisible(true)}>
          <Text style={{ color: '#2b2fa3', fontWeight: '700' }}>+ Nova categoria</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.categoriaId}
          onValueChange={(value) => {
            try {
              updateFormField('categoriaId', value);
            } catch (e) {
              console.error('Erro ao selecionar categoria:', e);
            }
          }}
          style={styles.nativePicker}
          enabled={hasCategorias}
          mode="dialog"
        >
          <Picker.Item label={hasCategorias ? 'Selecione uma categoria...' : 'Nenhuma disponível'} value="" />
          {Array.isArray(categorias) && categorias.map((categoria) => {
            try {
              return categoria && categoria.id ? (
                <Picker.Item key={categoria.id} label={categoria.nome || 'Sem nome'} value={categoria.id} />
              ) : null;
            } catch (e) {
              console.error('Erro ao renderizar categoria:', e);
              return null;
            }
          })}
        </Picker>
        {!hasCategorias && <Text style={styles.emptyText}>Crie categorias em Perfil.</Text>}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.label}>Selecione os Locais Cadastrados</Text>
      </View>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={form.localId}
          onValueChange={(value) => {
            try {
              updateFormField('localId', value);
            } catch (e) {
              console.error('Erro ao selecionar local:', e);
            }
          }}
          style={styles.nativePicker}
          enabled={hasLocais}
          mode="dialog"
        >
          <Picker.Item label={hasLocais ? 'Selecione um local...' : 'Nenhum disponível'} value="" />
          {Array.isArray(locais) && locais.map((local) => {
            try {
              return local && local.id ? (
                <Picker.Item key={local.id} label={local.nome || 'Sem nome'} value={local.id} />
              ) : null;
            } catch (e) {
              console.error('Erro ao renderizar local:', e);
              return null;
            }
          })}
        </Picker>
        {!hasLocais && <Text style={styles.emptyText}>Crie locais em Perfil.</Text>}
      </View>

      <View style={{ alignItems: 'center', marginVertical: 6 }}>
        <Text style={{ color: '#888' }}>Ou</Text>
        <Text style={{ color: '#888', marginBottom: 8 }}>Marque no Mapa o Local Desejado</Text>
      </View>

      <TouchableOpacity style={styles.mapPreview} onPress={() => {
        // Abrir mapa imediatamente usando coordenadas já disponíveis
        const fallbackLat = lat ? parseFloat(lat) : -23.55052;
        const fallbackLng = lng ? parseFloat(lng) : -46.633308;
        
        if (!mapInitialRegion) {
          setMapInitialRegion({
            latitude: !isNaN(fallbackLat) ? fallbackLat : -23.55052,
            longitude: !isNaN(fallbackLng) ? fallbackLng : -46.633308,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
        
        setMapVisible(true);
        
        // Buscar localização do usuário em background (não bloqueia abertura do mapa)
        getLocalizacaoAtual().then(pos => {
          if (pos && pos.latitude && pos.longitude && !isNaN(Number(pos.latitude)) && !isNaN(Number(pos.longitude))) {
            setShowUserDot(true);
            // Atualiza região do mapa se ainda não tiver lat/lng definidos
            if (!lat && !lng) {
              setMapInitialRegion({
                latitude: Number(pos.latitude),
                longitude: Number(pos.longitude),
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
          }
        }).catch(e => {
          console.warn('Erro ao obter localização em background:', e);
          setShowUserDot(false);
        });
      }}>
        <Text style={styles.mapPreviewText}>Marque no Mapa</Text>
      </TouchableOpacity>

      <View style={styles.rowInline}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Latitude</Text>
          <TextInput style={styles.input} placeholder="ex: -23.5505" value={lat} onChangeText={setLat} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Longitude</Text>
          <TextInput style={styles.input} placeholder="ex: -46.6333" value={lng} onChangeText={setLng} keyboardType="numeric" />
        </View>
      </View>

      

      </ScrollView>

      <SafeAreaView style={styles.footerActions}>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.primaryBtn]} onPress={handleSubmit}>
            <Text style={styles.primaryText}>Salvar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.secondaryBtn]} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}>
        <View style={{ flex: 1 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={mapInitialRegion || { latitude: -23.55052, longitude: -46.633308, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
            showsUserLocation={showUserDot}
            onPress={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setMapCoord({ latitude, longitude });
            }}
          >
            {mapCoord && <Marker coordinate={mapCoord} />}
          </MapView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.secondaryBtn, styles.actionFlex]} onPress={() => { setMapVisible(false); setMapCoord(null); }}>
              <Text style={styles.secondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.actionFlex]}
              onPress={() => {
                if (mapCoord) {
                  setLat(String(mapCoord.latitude));
                  setLng(String(mapCoord.longitude));
                  setMapVisible(false);
                } else {
                  Alert.alert('Atenção', 'Toque no mapa para marcar o local.');
                }
              }}
            >
              <Text style={styles.primaryText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Nova Categoria */}
      <Modal visible={catModalVisible} transparent animationType="fade" onRequestClose={() => setCatModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova Categoria</Text>
            <TextInput
              placeholder="Nome da categoria"
              value={catName}
              onChangeText={setCatName}
              style={[styles.input, { marginTop: 8 }]}
            />
            <View style={[styles.modalActions, { paddingHorizontal: 0, marginTop: 10 }] }>
              <TouchableOpacity style={[styles.secondaryBtn, styles.actionFlex]} onPress={() => { setCatModalVisible(false); setCatName(''); }}>
                <Text style={styles.secondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryBtn, styles.actionFlex]} onPress={handleCreateCategoria}>
                <Text style={styles.primaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

export default function EventoFormScreen(props) {
  return (
    <ErrorBoundary>
      <EventoFormScreenContent {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  container: { flex: 1, backgroundColor: colors.background },
  formScroll: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 140 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#fff', fontSize: 16 },
  input: { borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8, backgroundColor: colors.surface, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  pageTitle: { fontSize: 18, fontWeight: '700', color: '#1F2340', marginBottom: 8 },
  pageTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sectionDivider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },
  uploadRowFixed: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  uploadThumbsScroll: { marginLeft: 12, flexGrow: 0 },
  uploadThumbsScrollRight: { marginRight: 12, flex: 1 },
  uploadThumbsContent: { alignItems: 'center' },
  dateButton: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center' },
  dateButton: { borderWidth: 1, borderColor: colors.border, padding: 12, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center' },
  pickerContainer: { marginBottom: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, backgroundColor: '#fff', overflow: 'hidden' },
  pickerContainer: { marginBottom: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: colors.surface, overflow: 'hidden' },
  nativePicker: { height: 50, width: '100%', color: 'black' },
  emptyText: { color: 'red', fontSize: 12, marginTop: 5, textAlign: 'center' },
  emptyText: { color: colors.danger, fontSize: 12, marginTop: 5, textAlign: 'center' },
  imageButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  imageButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  imagemPreview: { borderRadius: 8 },
  thumb: { width: 100, height: 100, borderRadius: 8, backgroundColor: '#eee' },
  uploadTile: { width: 120, height: 120, borderRadius: 8, borderWidth: 1, borderColor: '#d0d5dd', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', padding: 8 },
  uploadTile: { width: 120, height: 120, borderRadius: 8, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', padding: 8 },
  mapPreview: { height: 120, borderRadius: 12, backgroundColor: '#e9eef7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  mapPreview: { height: 120, borderRadius: 12, backgroundColor: '#e9eef7', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  mapPreviewText: { color: '#333', fontWeight: '600', backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, elevation: 2 },
  mapPreviewText: { color: colors.text, fontWeight: '600', backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, elevation: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerActions: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', elevation: 12 },
  footerActions: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, elevation: 12 },
  rowInline: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', padding: 12, backgroundColor: '#fff' },
  modalActions: { flexDirection: 'row', padding: 12, backgroundColor: colors.surface },
  actionFlex: { flex: 1, marginHorizontal: 5 },
  primaryBtn: { backgroundColor: '#2b2fa3', padding: 15, borderRadius: 10, alignItems: 'center', flex: 1, marginRight: 8 },
  primaryBtn: { backgroundColor: colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', flex: 1, marginRight: 8 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { backgroundColor: '#e34b4b', padding: 15, borderRadius: 10, alignItems: 'center', flex: 1, marginLeft: 8 },
  secondaryBtn: { backgroundColor: colors.danger, padding: 15, borderRadius: 10, alignItems: 'center', flex: 1, marginLeft: 8 },
  secondaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  thumbWrapper: { width: 100, height: 100, marginRight: 10, borderRadius: 8, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  thumbWrapper: { width: 100, height: 100, marginRight: 10, borderRadius: 8, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  removeBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(227,75,75,0.95)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  removeBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(220,38,38,0.95)', width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', backgroundColor: colors.surface, borderRadius: 12, padding: 16, elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2340' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
});