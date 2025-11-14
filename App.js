import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';
import { setupGlobalErrorHandler } from './src/utils/errorLogger';
 

function InnerApp() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    // Setup global error handler
    setupGlobalErrorHandler();
    
    // Global JS error handler to avoid hard crashes
    const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
    
    if (global.ErrorUtils?.setGlobalHandler) {
      global.ErrorUtils.setGlobalHandler((error, isFatal) => {
        try {
          console.error('🔴 [GLOBAL ERROR]:', error);
          console.error('🔴 [STACK]:', error.stack);
          console.error('🔴 [FATAL]:', isFatal);
          
          // Log detalhado para debug
          if (error.message) console.error('🔴 [MESSAGE]:', error.message);
          if (error.name) console.error('🔴 [NAME]:', error.name);
          
          // Não deixar app crashar por erros não fatais
          if (isFatal) {
            console.error('🔴 [FATAL ERROR] - Tentando prevenir crash...');
            // Em vez de crashar, mostrar alerta e continuar
            setTimeout(() => {
              Alert.alert(
                'Erro Inesperado', 
                'O app encontrou um erro. Tente recarregar a tela atual.',
                [{ text: 'OK' }]
              );
            }, 100);
          }
        } catch (e) {
          console.error('🔴 [ERROR IN ERROR HANDLER]:', e);
        }
        
        // Chamar handler original apenas para erros não fatais
        if (!isFatal && typeof defaultHandler === 'function') {
          try {
            defaultHandler(error, isFatal);
          } catch (e) {
            console.error('🔴 [ERROR IN DEFAULT HANDLER]:', e);
          }
        }
      });
    }
    
    // Prevenir crash por unhandled promise rejections
    const originalPromiseRejection = global.console.warn;
    global.Promise.prototype._rejectionHandler = function(reason) {
      console.error('🔴 [UNHANDLED PROMISE REJECTION]:', reason);
    };
    
  }, []);

  return (
    <AuthProvider>
      <ErrorBoundary>
        <InnerApp />
      </ErrorBoundary>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});