import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getPacienteByEmail } from '../../services/PacienteService';
import { useUsuario } from '../../context/UsuarioContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const { setUsuarioActual } = useUsuario();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'El correo y la contraseña son obligatorios.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Ingresá un correo válido.');
      return;
    }

    setCargando(true);
    try {
      const paciente = await getPacienteByEmail(email.trim());

      if (!paciente) {
        Alert.alert('Error', 'No existe una cuenta con ese correo.');
        return;
      }

      if (paciente.Password && paciente.Password !== password) {
        Alert.alert('Error', 'Contraseña incorrecta.');
        return;
      }

      setUsuarioActual(paciente);
      navigation.replace('MainTabs');
    } catch (e) {
      console.error('Error de login:', e);
      Alert.alert('Error', 'No se pudo conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.wrapper}>
        <View style={styles.card}>
          <Text style={styles.brand}>NutriTEC</Text>
          <Text style={styles.subtitle}>Iniciá sesión para continuar</Text>

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="correo@ejemplo.com"
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />

          <TouchableOpacity
            style={styles.btnPrincipal}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Iniciar Sesión</Text>}
          </TouchableOpacity>

          <Text style={styles.footerText}>¿No tenés cuenta? Registrate desde la plataforma web.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const NT_GREEN = '#2e7d32';
const NT_GREEN_DARK = '#1b5e20';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: NT_GREEN_DARK },
  wrapper: { flexGrow: 1, backgroundColor: NT_GREEN_DARK, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 420, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  brand: { fontSize: 26, fontWeight: 'bold', color: NT_GREEN_DARK, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  label: { fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16, color: 'black' },
  btnPrincipal: { backgroundColor: NT_GREEN, padding: 14, alignItems: 'center', borderRadius: 8, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footerText: { marginTop: 18, textAlign: 'center', color: '#666', fontSize: 13 },
});