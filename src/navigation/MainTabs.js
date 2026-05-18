import React from 'react';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../lib/theme';

import DashboardScreen from '../screens/main/DashboardScreen';
import GenerateScreen  from '../screens/main/GenerateScreen';
import AnalyzeScreen   from '../screens/main/AnalyzeScreen';
import HistoryScreen   from '../screens/main/HistoryScreen';
import ProfileScreen   from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabButton(props) {
  return <TouchableOpacity {...props} activeOpacity={0.7} style={[props.style, { flex: 1 }]} />;
}

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: COLORS.primary,
  tabBarInactiveTintColor: COLORS.textMuted,
  tabBarStyle: {
    backgroundColor: COLORS.bg,
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 0,
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 26 : 8,
    paddingTop: 4,
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  tabBarButton: TabButton,
};

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={screenOptions} sceneContainerStyle={{ backgroundColor: COLORS.bg }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Générer"
        component={GenerateScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Analyser"
        component={AnalyzeScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'search' : 'search-outline'} size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Historique"
        component={HistoryScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
