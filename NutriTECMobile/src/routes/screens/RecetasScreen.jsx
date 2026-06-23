import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useUsuario } from '../../context/UsuarioContext';
import { buscarProductos } from '../../services/ProductoService';
import {
  getRecetasPorPaciente,
  crearReceta,
  actualizarReceta,
  eliminarReceta,
} from '../../services/RecetaService';

const NT_GREEN = '#2e7d32';
const NT_GREEN_DARK = '#1b5e20';

export default function RecetasScreen() {
  const { usuarioActual } = useUsuario();
  const email = usuarioActual?.email ?? '';

  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [nombreReceta, setNombreReceta] = useState('');
  const [ingredientes, setIngredientes] = useState([]);

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [buscandoProducto, setBuscandoProducto] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const caloriasTotal = ingredientes.reduce((sum, i) => sum + i.caloriasAporte, 0);

  const cargarRecetas = useCallback(async () => {
    if (!email) return;
    setCargando(true);
    try {
      const data = await getRecetasPorPaciente(email);
      setRecetas(data ?? []);
    } catch (e) {
      console.error('🔴 Error al cargar recetas:', e);
    } finally {
      setCargando(false);
    }
  }, [email]);

  useFocusEffect(
    useCallback(() => {
      cargarRecetas();
    }, [cargarRecetas])
  );

  const abrirFormulario = (receta) => {
    setMostrarFormulario(true);
    setMensajeError('');
    setMensajeExito('');

    if (receta) {
      setEditandoId(receta.idReceta ?? null);
      setNombreReceta(receta.nombreReceta);
      setIngredientes(
        (receta.detalles ?? []).map((d) => ({
          productoCodigo: d.productoCodigo,
          descripcion: d.producto?.descripcion ?? d.productoCodigo,
          cantidadPorciones: d.cantidadPorciones,
          caloriasAporte: (d.producto?.energiaKcal ?? 0) * d.cantidadPorciones,
          energiaKcalUnitaria: d.producto?.energiaKcal ?? 0,
        }))
      );
    } else {
      setEditandoId(null);
      setNombreReceta('');
      setIngredientes([]);
    }
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEditandoId(null);
    setTerminoBusqueda('');
    setProductosEncontrados([]);
  };

  const handleBuscarProducto = async () => {
    if (!terminoBusqueda.trim()) return;
    setBuscandoProducto(true);
    try {
      const productos = await buscarProductos(terminoBusqueda);
      setProductosEncontrados(productos ?? []);
    } catch (e) {
      console.error('🔴 Error al buscar producto:', e);
    } finally {
      setBuscandoProducto(false);
    }
  };

  const agregarIngrediente = (producto) => {
    const existeIndex = ingredientes.findIndex((i) => i.productoCodigo === producto.codigoBarras);

    if (existeIndex >= 0) {
      setIngredientes((prev) =>
        prev.map((ing, idx) =>
          idx === existeIndex
            ? {
              ...ing,
              cantidadPorciones: ing.cantidadPorciones + 1,
              caloriasAporte: producto.energiaKcal * (ing.cantidadPorciones + 1),
            }
            : ing
        )
      );
      return;
    }

    setIngredientes((prev) => [
      ...prev,
      {
        productoCodigo: producto.codigoBarras,
        descripcion: producto.descripcion,
        cantidadPorciones: 1,
        caloriasAporte: producto.energiaKcal,
        energiaKcalUnitaria: producto.energiaKcal,
      },
    ]);

    setTerminoBusqueda('');
    setProductosEncontrados([]);
  };

  const actualizarCantidadIngrediente = (index, nuevaCantidadStr) => {
    const nuevaCantidad = Number(nuevaCantidadStr) || 0;
    setIngredientes((prev) =>
      prev.map((ing, idx) =>
        idx === index
          ? { ...ing, cantidadPorciones: nuevaCantidad, caloriasAporte: ing.energiaKcalUnitaria * nuevaCantidad }
          : ing
      )
    );
  };

  const eliminarIngrediente = (index) => {
    setIngredientes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const guardarReceta = async () => {
    if (!nombreReceta.trim()) {
      setMensajeError('Ingrese un nombre para la receta.');
      return;
    }
    if (ingredientes.length === 0) {
      setMensajeError('Agregue al menos un ingrediente.');
      return;
    }

    const dto = {
      nombreReceta,
      creadoPorEmail: email,
      ingredientes: ingredientes.map((i) => ({
        productoCodigo: i.productoCodigo,
        cantidadPorciones: i.cantidadPorciones,
      })),
    };

    setGuardando(true);
    setMensajeError('');

    try {
      if (editandoId) {
        await actualizarReceta(editandoId, dto);
        setMensajeExito('Receta actualizada.');
      } else {
        await crearReceta(dto);
        setMensajeExito('Receta creada con éxito.');
      }
      cancelarFormulario();
      cargarRecetas();
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (e) {
      setMensajeError(e?.message ?? 'Error al guardar la receta.');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarReceta = (id) => {
    Alert.alert('Eliminar receta', '¿Desea eliminar esta receta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarReceta(id);
            cargarRecetas();
          } catch (e) {
            console.error('🔴 Error al eliminar receta:', e);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.titulo}>📖 Mis Recetas</Text>
          {!mostrarFormulario && (
            <TouchableOpacity style={styles.btnNueva} onPress={() => abrirFormulario()}>
              <Text style={styles.btnNuevaTexto}>+ Nueva Receta</Text>
            </TouchableOpacity>
          )}
        </View>

        {mensajeExito ? <View style={styles.alertExito}><Text style={styles.alertExitoTexto}>{mensajeExito}</Text></View> : null}
        {mensajeError ? <View style={styles.alertError}><Text style={styles.alertErrorTexto}>{mensajeError}</Text></View> : null}

        {mostrarFormulario ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>{editandoId ? 'Editar' : 'Nueva'} Receta</Text>

            <Text style={styles.label}>Nombre de la receta *</Text>
            <TextInput
              style={styles.input}
              value={nombreReceta}
              onChangeText={setNombreReceta}
              placeholder="Ej: Pinto Casero"
            />

            <Text style={styles.label}>Buscar ingrediente</Text>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Nombre o código de barras..."
                value={terminoBusqueda}
                onChangeText={setTerminoBusqueda}
                onSubmitEditing={handleBuscarProducto}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleBuscarProducto} disabled={buscandoProducto}>
                <Text style={styles.searchBtnTexto}>🔍</Text>
              </TouchableOpacity>
            </View>

            {buscandoProducto ? (
              <ActivityIndicator color={NT_GREEN} style={{ marginVertical: 8 }} />
            ) : productosEncontrados.length > 0 ? (
              <View style={styles.listaResultados}>
                {productosEncontrados.map((p) => (
                  <TouchableOpacity key={p.codigoBarras} style={styles.resultadoItem} onPress={() => agregarIngrediente(p)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultadoNombre}>{p.descripcion}</Text>
                      <Text style={styles.resultadoSub}>
                        {p.energiaKcal} kcal | {p.tamanoPorcion}{p.unidadMedida}/porción
                      </Text>
                    </View>
                    <Text style={styles.addIcon}>+</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {ingredientes.length > 0 && (
              <View style={styles.tablaIngredientes}>
                <Text style={styles.label}>Ingredientes</Text>
                {ingredientes.map((ing, index) => (
                  <View key={`${ing.productoCodigo}-${index}`} style={styles.ingredienteRow}>
                    <Text style={styles.ingredienteNombre}>{ing.descripcion}</Text>
                    <TextInput
                      style={styles.porcionesInput}
                      value={String(ing.cantidadPorciones)}
                      onChangeText={(val) => actualizarCantidadIngrediente(index, val)}
                      keyboardType="numeric"
                    />
                    <Text style={styles.ingredienteKcal}>{Math.round(ing.caloriasAporte)} kcal</Text>
                    <TouchableOpacity onPress={() => eliminarIngrediente(index)}>
                      <Text style={styles.btnEliminarTexto}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total estimado:</Text>
                  <Text style={styles.totalValor}>{Math.round(caloriasTotal)} kcal</Text>
                </View>
              </View>
            )}

            <View style={styles.formBtnRow}>
              <TouchableOpacity style={styles.btnCancelar} onPress={cancelarFormulario}>
                <Text style={styles.btnCancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnGuardar} onPress={guardarReceta} disabled={guardando}>
                {guardando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnGuardarTexto}>{editandoId ? 'Actualizar' : 'Guardar'} Receta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : cargando ? (
          <ActivityIndicator color={NT_GREEN} style={{ marginVertical: 24 }} />
        ) : recetas.length === 0 ? (
          <View style={styles.vacioContainer}>
            <Text style={styles.vacioIcono}>📖</Text>
            <Text style={styles.vacioTexto}>No tiene recetas creadas aún.</Text>
            <TouchableOpacity style={styles.btnNueva} onPress={() => abrirFormulario()}>
              <Text style={styles.btnNuevaTexto}>Crear mi primera receta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recetas.map((r) => (
            <View key={r.idReceta} style={styles.card}>
              <View style={styles.recetaHeader}>
                <Text style={styles.recetaNombre}>{r.nombreReceta}</Text>
                <View style={styles.recetaAcciones}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => abrirFormulario(r)}>
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleEliminarReceta(r.idReceta)}>
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsGrid}>
                <Text style={styles.statItem}>Calorías: <Text style={styles.statValorVerde}>{r.caloriasToTales} kcal</Text></Text>
                <Text style={styles.statItem}>Proteínas: <Text style={styles.statValor}>{r.proteinasTotales}g</Text></Text>
                <Text style={styles.statItem}>Carbohidratos: <Text style={styles.statValor}>{r.carbohidratosTotales}g</Text></Text>
                <Text style={styles.statItem}>Grasas: <Text style={styles.statValor}>{r.grasasTotales}g</Text></Text>
              </View>

              {r.detalles && r.detalles.length > 0 && (
                <View style={styles.ingredientesPreview}>
                  <Text style={styles.ingredientesLabel}>Ingredientes:</Text>
                  {r.detalles.map((d, idx) => (
                    <Text key={idx} style={styles.ingredientePreviewItem}>
                      • {d.producto?.descripcion ?? d.productoCodigo} ({d.cantidadPorciones} porciones)
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f4f6f4' },
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  titulo: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  btnNueva: { backgroundColor: NT_GREEN, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnNuevaTexto: { color: '#fff', fontWeight: '600', fontSize: 13 },
  alertExito: { backgroundColor: '#d4edda', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertExitoTexto: { color: '#155724' },
  alertError: { backgroundColor: '#f8d7da', borderRadius: 8, padding: 10, marginBottom: 12 },
  alertErrorTexto: { color: '#721c24' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2 },
  cardTitulo: { fontWeight: 'bold', fontSize: 16, color: '#222', marginBottom: 14 },
  label: { fontWeight: '600', color: '#333', marginBottom: 6, fontSize: 13 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 14 },
  searchRow: { flexDirection: 'row', marginBottom: 10 },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, marginRight: 6 },
  searchBtn: { backgroundColor: NT_GREEN, borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnTexto: { color: '#fff' },
  listaResultados: { maxHeight: 180, marginBottom: 10, borderWidth: 1, borderColor: '#eee', borderRadius: 8 },
  resultadoItem: { flexDirection: 'row', alignItems: 'center', padding: 8, borderBottomWidth: 1, borderColor: '#eee' },
  resultadoNombre: { fontWeight: '500', fontSize: 13, color: '#333' },
  resultadoSub: { color: '#888', fontSize: 11, marginTop: 2 },
  addIcon: { color: NT_GREEN, fontWeight: 'bold', fontSize: 18, paddingHorizontal: 8 },
  tablaIngredientes: { marginTop: 6, marginBottom: 6 },
  ingredienteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee', gap: 8 },
  ingredienteNombre: { flex: 1.5, fontSize: 12, color: '#333' },
  porcionesInput: { flex: 0.7, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 6, fontSize: 12, textAlign: 'center' },
  ingredienteKcal: { flex: 1, fontSize: 12, color: '#555', textAlign: 'right' },
  btnEliminarTexto: { fontSize: 14, paddingHorizontal: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 10, gap: 8 },
  totalLabel: { fontWeight: '600', color: '#333' },
  totalValor: { fontWeight: 'bold', color: NT_GREEN },
  formBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  btnCancelar: { borderWidth: 1, borderColor: '#999', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  btnCancelarTexto: { color: '#555', fontWeight: '600' },
  btnGuardar: { backgroundColor: NT_GREEN, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, minWidth: 130, alignItems: 'center' },
  btnGuardarTexto: { color: '#fff', fontWeight: '600' },
  vacioContainer: { alignItems: 'center', paddingVertical: 40 },
  vacioIcono: { fontSize: 40, marginBottom: 8 },
  vacioTexto: { color: '#999', marginBottom: 14, fontSize: 14 },
  recetaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  recetaNombre: { fontWeight: '600', fontSize: 15, color: '#222', flex: 1 },
  recetaAcciones: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  statItem: { width: '47%', fontSize: 12, color: '#666' },
  statValor: { fontWeight: '600', color: '#333' },
  statValorVerde: { fontWeight: '600', color: NT_GREEN },
  ingredientesPreview: { borderTopWidth: 1, borderColor: '#eee', paddingTop: 8 },
  ingredientesLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  ingredientePreviewItem: { fontSize: 12, color: '#444', marginBottom: 2 },
});