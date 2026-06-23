import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsuario } from '../../context/UsuarioContext';
import { buscarProductos } from '../../services/ProductoService';
import { getRecetasPorPaciente } from '../../services/RecetaService';
import { getResumenDia, registrarConsumo, eliminarConsumo } from '../../services/ConsumoService';

const TIEMPOS = ['Desayuno', 'Merienda Mañana', 'Almuerzo', 'Merienda Tarde', 'Cena'];
const NT_GREEN = '#2e7d32';
const NT_GREEN_DARK = '#1b5e20';
const NT_ACCENT = '#81c784';

export default function ConsumoDiarioScreen() {
  const { usuarioActual } = useUsuario();
  const email = usuarioActual?.email ?? '';
  const consumoMaximo = usuarioActual?.consumoMaxCalorias ?? 2000;

  const [fechaSeleccionada] = useState(new Date().toISOString().split('T')[0]);
  const [resumen, setResumen] = useState([]);
  const [cargandoResumen, setCargandoResumen] = useState(false);

  const [tiempoSeleccionado, setTiempoSeleccionado] = useState('Desayuno');
  const [tipoBusqueda, setTipoBusqueda] = useState('producto'); // 'producto' | 'receta'
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [recetasDisponibles, setRecetasDisponibles] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const esProducto = (item) => item !== null && 'codigoBarras' in item;
  const esReceta = (item) => item !== null && 'idReceta' in item;

  const totalCaloriasDia = resumen.reduce((sum, t) => sum + t.totalCalorias, 0);
  const porcentajeConsumo = Math.min(100, Math.round((totalCaloriasDia / consumoMaximo) * 100));
  const colorEstado = porcentajeConsumo >= 100 ? '#dc3545' : porcentajeConsumo >= 85 ? '#ffc107' : NT_GREEN;

  const cargarResumen = useCallback(async () => {
    if (!email) return;
    setCargandoResumen(true);
    try {
      const data = await getResumenDia(email, fechaSeleccionada);
      setResumen(data ?? []);
    } catch (e) {
      console.error('🔴 Error al cargar resumen:', e);
    } finally {
      setCargandoResumen(false);
    }
  }, [email, fechaSeleccionada]);

  const cargarRecetas = useCallback(async () => {
    if (!email) return;
    try {
      const recetas = await getRecetasPorPaciente(email);
      setRecetasDisponibles(recetas ?? []);
    } catch (e) {
      console.error('🔴 Error al cargar recetas:', e);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      cargarResumen();
      cargarRecetas();
    }, [cargarResumen, cargarRecetas])
  );

  const handleBuscarProductos = async () => {
    if (!terminoBusqueda.trim()) return;
    setBuscando(true);
    setProductosEncontrados([]);
    setItemSeleccionado(null);
    try {
      const productos = await buscarProductos(terminoBusqueda);
      setProductosEncontrados(productos ?? []);
    } catch (e) {
      console.error('🔴 Error al buscar productos:', e);
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarItem = (item) => {
    setItemSeleccionado(item);
    setCantidad('1');
  };

  const seleccionarTipoBusqueda = (tipo) => {
    setTipoBusqueda(tipo);
    setItemSeleccionado(null);
    if (tipo === 'producto') {
      setProductosEncontrados([]);
    }
  };

  const handleAgregarAlRegistro = async () => {
    if (!itemSeleccionado) {
      setMensajeError('Seleccione un producto o receta.');
      return;
    }

    const consumo = {
      pacienteEmail: email,
      fecha: fechaSeleccionada,
      tiempoComida: tiempoSeleccionado,
      cantidad: Number(cantidad) || 1,
      productoCodigo: null,
      idReceta: null,
    };

    if (esProducto(itemSeleccionado)) {
      consumo.productoCodigo = itemSeleccionado.codigoBarras;
    } else if (esReceta(itemSeleccionado)) {
      consumo.idReceta = itemSeleccionado.idReceta;
    }

    setGuardando(true);
    setMensajeError('');

    try {
      await registrarConsumo(consumo);
      setMensajeExito('Consumo registrado.');
      setItemSeleccionado(null);
      setTerminoBusqueda('');
      setProductosEncontrados([]);
      setCantidad('1');
      cargarResumen();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (e) {
      setMensajeError(e?.message ?? 'Error al registrar.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarItem = async (idConsumo) => {
    try {
      await eliminarConsumo(idConsumo);
      cargarResumen();
    } catch (e) {
      console.error('🔴 Error al eliminar:', e);
    }
  };

  const getResumenPorTiempo = (tiempo) => resumen.find((r) => r.tiempoComida === tiempo);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.titulo}>📋 Registro Diario</Text>
        <Text style={styles.fechaTexto}>{fechaSeleccionada}</Text>

        {/* Resumen calórico */}
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardLabel}>Calorías del día</Text>
            <Text style={[styles.cardValor, { color: colorEstado }]}>
              {totalCaloriasDia} / {consumoMaximo} kcal
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${porcentajeConsumo}%`, backgroundColor: colorEstado }]} />
          </View>
        </View>

        {mensajeExito ? <View style={styles.alertExito}><Text style={styles.alertExitoTexto}>{mensajeExito}</Text></View> : null}
        {mensajeError ? <View style={styles.alertError}><Text style={styles.alertErrorTexto}>{mensajeError}</Text></View> : null}

        {/* Tiempos de comida */}
        {cargandoResumen ? (
          <ActivityIndicator color={NT_GREEN} style={{ marginVertical: 16 }} />
        ) : (
          TIEMPOS.map((tiempo) => {
            const r = getResumenPorTiempo(tiempo);
            return (
              <View key={tiempo} style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.tiempoTitulo}>{tiempo}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexto}>{r?.totalCalorias ?? 0} kcal</Text>
                  </View>
                </View>

                {r?.items?.length ? (
                  r.items.map((item) => (
                    <View key={item.idConsumo} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemNombre}>
                          {item.nombre} <Text style={styles.itemCantidad}>x{item.cantidad}</Text>
                        </Text>
                      </View>
                      <Text style={styles.itemCalorias}>{item.calorias} kcal</Text>
                      <TouchableOpacity onPress={() => handleEliminarItem(item.idConsumo)} style={styles.btnEliminar}>
                        <Text style={styles.btnEliminarTexto}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.vacioTexto}>Sin registros para este tiempo.</Text>
                )}
              </View>
            );
          })
        )}

        {/* Panel agregar */}
        <View style={[styles.card, styles.cardAgregar]}>
          <Text style={styles.cardTitleAgregar}>➕ Agregar al Registro</Text>

          <Text style={styles.label}>Tiempo de comida</Text>
          <View style={styles.selectorRow}>
            {TIEMPOS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, tiempoSeleccionado === t && styles.chipActivo]}
                onPress={() => setTiempoSeleccionado(t)}
              >
                <Text style={[styles.chipTexto, tiempoSeleccionado === t && styles.chipTextoActivo]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabGroup}>
            <TouchableOpacity
              style={[styles.tabBtn, tipoBusqueda === 'producto' && styles.tabBtnActivo]}
              onPress={() => seleccionarTipoBusqueda('producto')}
            >
              <Text style={[styles.tabBtnTexto, tipoBusqueda === 'producto' && styles.tabBtnTextoActivo]}>Producto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tipoBusqueda === 'receta' && styles.tabBtnActivo]}
              onPress={() => seleccionarTipoBusqueda('receta')}
            >
              <Text style={[styles.tabBtnTexto, tipoBusqueda === 'receta' && styles.tabBtnTextoActivo]}>Receta</Text>
            </TouchableOpacity>
          </View>

          {tipoBusqueda === 'producto' ? (
            <>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Nombre o código..."
                  value={terminoBusqueda}
                  onChangeText={setTerminoBusqueda}
                  onSubmitEditing={handleBuscarProductos}
                />
                <TouchableOpacity style={styles.searchBtn} onPress={handleBuscarProductos} disabled={buscando}>
                  <Text style={styles.searchBtnTexto}>🔍</Text>
                </TouchableOpacity>
              </View>

              {buscando ? (
                <ActivityIndicator color={NT_GREEN} style={{ marginVertical: 8 }} />
              ) : (
                <View style={styles.listaResultados}>
                  {productosEncontrados.map((p) => {
                    const activo = esProducto(itemSeleccionado) && itemSeleccionado.codigoBarras === p.codigoBarras;
                    return (
                      <TouchableOpacity
                        key={p.codigoBarras}
                        style={[styles.resultadoItem, activo && styles.resultadoItemActivo]}
                        onPress={() => seleccionarItem(p)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultadoNombre}>{p.descripcion}</Text>
                          <Text style={styles.resultadoSub}>{p.energiaKcal} kcal/porción</Text>
                        </View>
                        {activo ? <Text style={styles.checkIcon}>✓</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <View style={styles.listaResultados}>
              {recetasDisponibles.length === 0 ? (
                <Text style={styles.vacioTexto}>No tiene recetas creadas.</Text>
              ) : (
                recetasDisponibles.map((r) => {
                  const activo = esReceta(itemSeleccionado) && itemSeleccionado.idReceta === r.idReceta;
                  return (
                    <TouchableOpacity
                      key={r.idReceta}
                      style={[styles.resultadoItem, activo && styles.resultadoItemActivo]}
                      onPress={() => seleccionarItem(r)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resultadoNombre}>{r.nombreReceta}</Text>
                        <Text style={styles.resultadoSub}>{r.caloriasToTales} kcal</Text>
                      </View>
                      {activo ? <Text style={styles.checkIcon}>✓</Text> : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {itemSeleccionado ? (
            <View style={styles.itemSeleccionadoBox}>
              <Text style={styles.itemSeleccionadoNombre}>
                {esProducto(itemSeleccionado) ? itemSeleccionado.descripcion : itemSeleccionado.nombreReceta}
              </Text>
              <Text style={styles.itemSeleccionadoKcal}>
                {esProducto(itemSeleccionado) ? itemSeleccionado.energiaKcal : itemSeleccionado.caloriasToTales} kcal por porción
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Porciones</Text>
          <TextInput
            style={styles.input}
            value={cantidad}
            onChangeText={setCantidad}
            keyboardType="numeric"
          />

          <TouchableOpacity
            style={[styles.btnPrincipal, (guardando || !itemSeleccionado) && styles.btnDeshabilitado]}
            onPress={handleAgregarAlRegistro}
            disabled={guardando || !itemSeleccionado}
          >
            {guardando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Agregar</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f4' },
  container: { padding: 16, paddingBottom: 40 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  fechaTexto: { color: '#777', marginBottom: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontWeight: '600', color: '#333' },
  cardValor: { fontWeight: 'bold', fontSize: 16 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: '#e0e0e0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  alertExito: { backgroundColor: '#d4edda', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertExitoTexto: { color: '#155724' },
  alertError: { backgroundColor: '#f8d7da', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertErrorTexto: { color: '#721c24' },
  tiempoTitulo: { fontWeight: '600', fontSize: 15, color: '#222' },
  badge: { backgroundColor: NT_GREEN, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeTexto: { color: '#fff', fontSize: 12, fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  itemNombre: { fontWeight: '500', color: '#333' },
  itemCantidad: { color: '#888', fontWeight: '400' },
  itemCalorias: { color: '#777', marginRight: 10, fontSize: 13 },
  btnEliminar: { padding: 4 },
  btnEliminarTexto: { fontSize: 16 },
  vacioTexto: { color: '#999', fontSize: 13, paddingVertical: 6 },
  cardAgregar: { marginTop: 6 },
  cardTitleAgregar: { fontWeight: 'bold', fontSize: 16, marginBottom: 12, color: '#222' },
  label: { fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 4, fontSize: 13 },
  selectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: NT_GREEN, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  chipActivo: { backgroundColor: NT_GREEN },
  chipTexto: { color: NT_GREEN, fontSize: 12 },
  chipTextoActivo: { color: '#fff', fontWeight: '600' },
  tabGroup: { flexDirection: 'row', marginBottom: 12, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: NT_GREEN },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff' },
  tabBtnActivo: { backgroundColor: NT_GREEN },
  tabBtnTexto: { color: NT_GREEN, fontWeight: '600', fontSize: 13 },
  tabBtnTextoActivo: { color: '#fff' },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 6 },
  searchBtn: { backgroundColor: NT_GREEN, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnTexto: { color: '#fff' },
  listaResultados: { maxHeight: 200, marginBottom: 10 },
  resultadoItem: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  resultadoItemActivo: { backgroundColor: '#f1f8f1' },
  resultadoNombre: { fontWeight: '500', fontSize: 13, color: '#333' },
  resultadoSub: { color: '#888', fontSize: 11, marginTop: 2 },
  checkIcon: { color: NT_GREEN, fontWeight: 'bold' },
  itemSeleccionadoBox: { backgroundColor: '#f1f8f1', borderRadius: 8, padding: 10, marginBottom: 12 },
  itemSeleccionadoNombre: { fontWeight: 'bold', color: '#222', fontSize: 13 },
  itemSeleccionadoKcal: { color: '#777', fontSize: 12, marginTop: 2 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 14 },
  btnPrincipal: { backgroundColor: NT_GREEN, padding: 13, alignItems: 'center', borderRadius: 8 },
  btnDeshabilitado: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});