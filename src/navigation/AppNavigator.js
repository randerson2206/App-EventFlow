import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

// Importe todas as telas
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import MapaScreen from '../screens/MapaScreen';
import EventoDetailScreen from '../screens/EventoDetailScreen';
import EventoFormScreen from '../screens/EventoFormScreen';
import PerfilScreen from '../screens/PerfilScreen';
import MinhaContaScreen from '../screens/MinhaContaScreen';
import TermosScreen from '../screens/TermosScreen';
import NotificacaoScreen from '../screens/NotificacaoScreen';
import CategoriasScreen from '../screens/CategoriasScreen';
import LocaisScreen from '../screens/LocaisScreen';
import LocalFormScreen from '../screens/LocalFormScreen';
import EventosListScreen from '../screens/EventosListScreen';
import FavoritosScreen from '../screens/FavoritosScreen';
// removed temporary map/form screens

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const LogoTitle = () => (
  <Image
    source={require('../../assets/logo.png')}
    style={{ width: 180, height: 60 }}
    resizeMode="contain"
  />
);

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Mapa') iconName = focused ? 'location' : 'location-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person-circle' : 'person-circle-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        headerTitle: () => <LogoTitle />,
        headerStyle: { backgroundColor: '#007AFF' },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ tabBarLabel: 'Início' }} />
      <Tab.Screen name="Mapa" component={MapaScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <NavigationContainer
      onStateChange={(state) => {
        // Log navigation state changes for debugging
        if (__DEV__) {
          console.log('Navigation state changed:', state);
        }
      }}
      fallback={null}
    >
      <Stack.Navigator 
        screenOptions={{
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Home" component={HomeTabs} options={{ headerShown: false }} />
            <Stack.Screen name="EventoDetail" component={EventoDetailScreen} options={{ title: 'Detalhes do Evento' }} />
            <Stack.Screen name="EventoForm" component={EventoFormScreen} options={{ title: 'Gerenciar Evento' }} />
            <Stack.Screen name="EventosList" component={EventosListScreen} options={{ title: 'Listagem de Eventos' }} />
            <Stack.Screen name="Favoritos" component={FavoritosScreen} options={{ title: 'Meus Favoritos' }} />
            <Stack.Screen name="Categorias" component={CategoriasScreen} options={{ title: 'Categorias' }} />
            <Stack.Screen name="Locais" component={LocaisScreen} options={{ title: 'Locais' }} />
            <Stack.Screen name="LocalForm" component={LocalFormScreen} options={{ title: 'Gerenciar Local' }} />
            <Stack.Screen name="MinhaConta" component={MinhaContaScreen} options={{ title: 'Minha Conta' }} />
            <Stack.Screen name="Termos" component={TermosScreen} options={{ title: 'Termos e Privacidade' }} />
            <Stack.Screen name="Notificacao" component={NotificacaoScreen} options={{ title: 'Notificações' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}