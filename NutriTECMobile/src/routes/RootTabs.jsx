import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from './screens/HomeScreen.jsx';
import ConsumoDiarioScreen from './screens/ConsumoDiarioScreen.jsx';
import RecetasScreen from './screens/RecetasScreen.jsx';

const Tab = createBottomTabNavigator();

const NT_GREEN = '#2e7d32';
const NT_GREEN_DARK = '#1b5e20';

// Sin lib de iconos: usamos emoji como ícono simple para no agregar otra dependencia.
const ICONS = {
  Home: '🏠',
  Registro: '📋',
  Recetas: '📖',
};

export default function RootTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: NT_GREEN,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e0e0e0' },
        tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Registro" component={ConsumoDiarioScreen} options={{ title: 'Registro Diario' }} />
      <Tab.Screen name="Recetas" component={RecetasScreen} options={{ title: 'Recetas' }} />
    </Tab.Navigator>
  );
}