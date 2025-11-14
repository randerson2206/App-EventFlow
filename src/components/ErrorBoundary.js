import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You could send this to a logging service
    console.error('Boundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  reset = () => this.setState({ hasError: false, error: null, errorInfo: null });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.title}>Algo saiu errado</Text>
          <Text style={styles.message}>O aplicativo encontrou um erro. Você pode tentar novamente.</Text>
          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorDetails}>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.errorInfo && (
                <Text style={styles.errorStack}>{this.state.errorInfo.componentStack}</Text>
              )}
            </ScrollView>
          )}
          <TouchableOpacity onPress={this.reset} style={styles.button}>
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8, color: '#1F2340' },
  message: { fontSize: 14, color: '#333', textAlign: 'center', marginBottom: 16 },
  errorDetails: { maxHeight: 200, width: '100%', backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 12, color: '#FF3B30', fontFamily: 'monospace' },
  errorStack: { fontSize: 11, color: '#666', fontFamily: 'monospace', marginTop: 8 },
  button: { backgroundColor: '#2b2fa3', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
