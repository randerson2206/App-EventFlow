import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermosScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Termos de Uso e Política de Privacidade</Text>
      <Text style={styles.paragraph}>Aqui ficará o texto dos termos e políticas. Este é um placeholder para que você possa substituir pelo conteúdo real.</Text>
      <Text style={styles.paragraph}>- Termo 1</Text>
      <Text style={styles.paragraph}>- Termo 2</Text>
      <Text style={styles.paragraph}>Última atualização: 24/10/2025</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  paragraph: { color: '#444', marginBottom: 8 },
});
