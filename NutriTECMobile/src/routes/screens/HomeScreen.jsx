import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsuario } from '../../context/UsuarioContext';
import { getResumenDia } from '../../services/ConsumoService';
import { getNutricionistaDePaciente } from '../../services/PacienteNutricionistaService';

const NT_GREEN = '#2e7d32';
const NT_GREEN_DARK = '#1b5e20';

export default function HomeScreen({ navigation }) {
  const { usuarioActual, setUsuarioActual } = useUsuario();
  const [totalCalorias, setTotalCalorias] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [nutricionista, setNutricionista] = useState(null);
  const [cargandoNutricionista, setCargandoNutricionista] = useState(true);

  const consumoMaximo = usuarioActual?.consumoMaxCalorias ?? 2000;
  const hoy = new Date().toISOString().split('T')[0];

  const cargarResumen = useCallback(async () => {
    if (!usuarioActual?.email) return;
    setCargando(true);
    try {
      const resumen = await getResumenDia(usuarioActual.email, hoy);
      const total = (resumen ?? []).reduce((sum, t) => sum + t.totalCalorias, 0);
      setTotalCalorias(total);
    } catch (e) {
      console.error('🔴 Error al cargar resumen:', e);
    } finally {
      setCargando(false);
    }
  }, [usuarioActual, hoy]);

  const cargarNutricionista = useCallback(async () => {
    if (!usuarioActual?.email) return;
    setCargandoNutricionista(true);
    try {
      const data = await getNutricionistaDePaciente(usuarioActual.email);
      setNutricionista(data);
    } catch (e) {
      console.error('🔴 Error al cargar nutricionista:', e);
    } finally {
      setCargandoNutricionista(false);
    }
  }, [usuarioActual]);

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
      cargarNutricionista();
    }, [cargarResumen, cargarNutricionista])
  );

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          setUsuarioActual(null);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  const porcentaje = Math.min(100, Math.round((totalCalorias / consumoMaximo) * 100));
  const colorBarra = porcentaje >= 100 ? '#dc3545' : porcentaje >= 85 ? '#ffc107' : NT_GREEN;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.brand}>NutriTEC</Text>
          <Text style={styles.subtitle}>Hola, {usuarioActual?.nombre ?? 'Paciente'} 👋</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutTexto}>Salir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calorías de hoy</Text>

          {cargando ? (
            <ActivityIndicator color={NT_GREEN} style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={[styles.calorieText, { color: colorBarra }]}>
                {totalCalorias} / {consumoMaximo} kcal
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${porcentaje}%`, backgroundColor: colorBarra }]} />
              </View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tu nutricionista</Text>

          {cargandoNutricionista ? (
            <ActivityIndicator color={NT_GREEN} style={{ marginVertical: 8 }} />
          ) : nutricionista ? (
            <>
              <Text style={styles.cardText}>{nutricionista.nombreNutricionista}</Text>
              <Text style={styles.cardSubtext}>{nutricionista.emailNutricionista}</Text>
            </>
          ) : (
            <Text style={styles.cardText}>
              Aún no tenés un nutricionista asignado. Usá Registro Diario para llevar el control de tu consumo.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f4' },
  header: {
    backgroundColor: NT_GREEN_DARK,
    padding: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextBlock: { flex: 1 },
  brand: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#fff', fontSize: 14, marginTop: 4 },
  logoutBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  container: { padding: 16 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 10 },
  cardText: { color: '#333', fontSize: 14, fontWeight: '600' },
  cardSubtext: { color: '#777', fontSize: 13, marginTop: 2 },
  calorieText: { fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
});