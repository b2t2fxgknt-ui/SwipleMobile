import React, { useState, useEffect, useCallback } from 'react';
import { Platform, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SessionContext } from '../lib/SessionContext';
import { supabase } from '../lib/supabase';
import { COLORS, FONT } from '../lib/theme';

import ProfileScreen                from '../screens/main/ProfileScreen';
import OrdersScreen                 from '../screens/main/OrdersScreen';
import MissionsScreen               from '../screens/main/MissionsScreen';
import ProjetsScreenComponent       from '../screens/main/ProjetsScreen';
import RevenuesScreen               from '../screens/main/RevenuesScreen';
import ClientBriefsScreen           from '../screens/main/ClientBriefsScreen';
import GhostwritersScreen           from '../screens/main/GhostwritersScreen';

const Tab = createBottomTabNavigator();

// ── Screen wrappers (module-scope = stable refs, no remount on re-render) ─────

const ClientBriefsTabScreen     = () => <ClientBriefsScreen />;
const GhostwritersTabScreen     = () => <GhostwritersScreen />;
const MissionsTabScreen     = () => <MissionsScreen />;
const ProjetsTabScreen      = () => <ProjetsScreenComponent />;
const RevenuesTabScreen     = () => <RevenuesScreen />;
const OrdersWrapper         = () => <OrdersScreen />;

// ── Tab icon helper ───────────────────────────────────────────────────────────

function icon(name, nameOutline) {
  return ({ color, size, focused }) => (
    <Ionicons name={focused ? name : nameOutline} size={size} color={color} />
  );
}

// ── Custom tab bar button ─────────────────────────────────────────────────────

function TabButton(props) {
  return (
    <TouchableOpacity
      {...props}
      activeOpacity={0.7}
      style={[props.style, { flex: 1 }]}
    />
  );
}

// ── Screen options ────────────────────────────────────────────────────────────

function getScreenOptions(accentColor) {
  return {
    headerShown: false,
    tabBarActiveTintColor:   accentColor,
    tabBarInactiveTintColor: COLORS.textMuted,
    tabBarStyle: {
      backgroundColor: COLORS.bg,
      borderTopColor:  COLORS.border,
      borderTopWidth:  StyleSheet.hairlineWidth,
      elevation:       0,
      height:          Platform.OS === 'ios' ? 80 : 58,
      paddingBottom:   Platform.OS === 'ios' ? 26 : 8,
      paddingTop:      4,
    },
    tabBarLabelStyle: {
      fontSize:   10,
      fontWeight: '600',
      marginTop:  2,
    },
    tabBarButton: TabButton,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MainTabs({ session }) {
  const metaRole = session?.user?.user_metadata?.role;
  const [dbRole, setDbRole] = useState(null);

  const fetchRole = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (data?.role) setDbRole(data.role);
    } catch (_) {}
  }, [session?.user?.id]);

  useEffect(() => { fetchRole(); }, [fetchRole]);

  // metaRole (user_metadata) = priorité, dbRole = fallback
  const effectiveRole = metaRole ?? dbRole ?? 'client';
  const isFreelancer  = effectiveRole === 'prestataire' || effectiveRole === 'freelancer';
  const accentColor   = isFreelancer ? COLORS.prestataire : COLORS.primary;

  const screenOptions = useCallback(
    () => getScreenOptions(accentColor),
    [accentColor]
  );

  return (
    <SessionContext.Provider value={session}>
      <Tab.Navigator screenOptions={screenOptions} sceneContainerStyle={{ backgroundColor: COLORS.bg }}>

        {isFreelancer ? (
          /* ── FREELANCE : Missions · Projets · Revenus · Profil ── */
          <>
            <Tab.Screen
              name="Missions"
              component={MissionsTabScreen}
              options={{ tabBarIcon: icon('briefcase', 'briefcase-outline') }}
            />
            <Tab.Screen
              name="Projets"
              component={ProjetsTabScreen}
              options={{ tabBarIcon: icon('layers', 'layers-outline') }}
            />
            <Tab.Screen
              name="Revenus"
              component={RevenuesTabScreen}
              options={{ tabBarIcon: icon('bar-chart', 'bar-chart-outline') }}
            />
            <Tab.Screen
              name="Profil"
              component={ProfileScreen}
              options={{ tabBarIcon: icon('person', 'person-outline') }}
            />
          </>
        ) : (
          /* ── CLIENT : Briefs · Ghostwriters · Commandes · Profil ── */
          <>
            <Tab.Screen
              name="Briefs"
              component={ClientBriefsTabScreen}
              options={{ tabBarIcon: icon('document-text', 'document-text-outline') }}
            />
            <Tab.Screen
              name="Ghostwriters"
              component={GhostwritersTabScreen}
              options={{ tabBarIcon: icon('people', 'people-outline') }}
            />
            <Tab.Screen
              name="Commandes"
              component={OrdersWrapper}
              options={{ tabBarIcon: icon('receipt', 'receipt-outline') }}
            />
            <Tab.Screen
              name="Profil"
              component={ProfileScreen}
              options={{ tabBarIcon: icon('person', 'person-outline') }}
            />
          </>
        )}

      </Tab.Navigator>
    </SessionContext.Provider>
  );
}
