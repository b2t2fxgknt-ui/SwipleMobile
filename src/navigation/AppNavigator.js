import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';
import { MissionsProvider }       from '../lib/MissionsContext';
import { ConversationsProvider }  from '../lib/ConversationsContext';
import { FavoritesProvider }      from '../lib/FavoritesContext';

import WelcomeScreen       from '../screens/auth/WelcomeScreen';
import LoginScreen         from '../screens/auth/LoginScreen';
import RegisterScreen      from '../screens/auth/RegisterScreen';
import OnboardingScreen    from '../screens/auth/OnboardingScreen';
import MainTabs            from './MainTabs';
import ServiceDetailScreen from '../screens/main/ServiceDetailScreen';
import OrderScreen         from '../screens/main/OrderScreen';

// ── Système de transaction ────────────────────────────────────────────────────
import MissionConfirmationScreen from '../screens/transaction/MissionConfirmationScreen';
import PaymentProcessingScreen   from '../screens/transaction/PaymentProcessingScreen';
import MissionTrackingScreen     from '../screens/transaction/MissionTrackingScreen';
import MissionBriefScreen        from '../screens/transaction/MissionBriefScreen';
import DeliveryScreen            from '../screens/transaction/DeliveryScreen';
import ValidationScreen          from '../screens/transaction/ValidationScreen';
import RevisionRequestScreen     from '../screens/transaction/RevisionRequestScreen';
import DisputeScreen                from '../screens/transaction/DisputeScreen';
import PendingValidationsScreen     from '../screens/transaction/PendingValidationsScreen';
import ReviewScreen              from '../screens/transaction/ReviewScreen';
import MessagerieScreen          from '../screens/main/MessagerieScreen';
import NotificationsScreen       from '../screens/main/NotificationsScreen';
import ServiceCreationScreen     from '../screens/main/ServiceCreationScreen';
import BriefDetailScreen         from '../screens/main/BriefDetailScreen';
import FavoritesScreen           from '../screens/main/FavoritesScreen';
import EditProfileScreen         from '../screens/main/EditProfileScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [session,   setSession]   = useState(undefined);
  const [onboarded, setOnboarded] = useState(null); // null = loading

  useEffect(() => {
    // Load session + onboarding flag in parallel
    Promise.all([
      supabase.auth.getSession(),
      AsyncStorage.getItem('swiple_onboarded'),
    ]).then(([{ data: { session } }, flag]) => {
      setSession(session);
      setOnboarded(!!flag);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined || onboarded === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* MissionsProvider ici = accessible par TOUS les écrans (tabs + transaction stack) */}
      <FavoritesProvider>
      <ConversationsProvider>
      <MissionsProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!session ? (
          <>
            <Stack.Screen name="Welcome"  component={WelcomeScreen}  />
            <Stack.Screen name="Login"    component={LoginScreen}    />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            {/* Post-inscription onboarding (shown once) */}
            {!onboarded && (
              <Stack.Screen
                name="Onboarding"
                component={OnboardingScreen}
                initialParams={{ role: session?.user?.user_metadata?.role ?? 'acheteur' }}
                options={{ animation: 'fade', gestureEnabled: false }}
              />
            )}

            <Stack.Screen name="Main">
              {() => <MainTabs session={session} />}
            </Stack.Screen>

            {/* Page détail d'un service — slide from right */}
            <Stack.Screen
              name="ServiceDetail"
              component={ServiceDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />

            {/* Checkout — modal slide from bottom */}
            <Stack.Screen
              name="Order"
              component={OrderScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />

            {/* ── Système de transaction ── */}

            {/* 1. Confirmation + paiement escrow */}
            <Stack.Screen
              name="MissionConfirmation"
              component={MissionConfirmationScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
            {/* 2. Processing animé */}
            <Stack.Screen
              name="PaymentProcessing"
              component={PaymentProcessingScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            {/* 3. Suivi mission côté client */}
            <Stack.Screen
              name="MissionTracking"
              component={MissionTrackingScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 4. Brief mission côté freelance */}
            <Stack.Screen
              name="MissionBrief"
              component={MissionBriefScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 5. Livraison avant/après */}
            <Stack.Screen
              name="Delivery"
              component={DeliveryScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 6. Succès validation */}
            <Stack.Screen
              name="Validation"
              component={ValidationScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            {/* 7. Demande de révision */}
            <Stack.Screen
              name="RevisionRequest"
              component={RevisionRequestScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
            {/* 8. Litige */}
            <Stack.Screen
              name="Dispute"
              component={DisputeScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 8b. Actions requises — liste validations en attente */}
            <Stack.Screen
              name="PendingValidations"
              component={PendingValidationsScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
            {/* 9. Messagerie */}
            <Stack.Screen
              name="Messagerie"
              component={MessagerieScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 10. Notifications */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 11. Review & Rating */}
            <Stack.Screen
              name="Review"
              component={ReviewScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal', gestureEnabled: false }}
            />
            {/* 12. Création de service (freelance) */}
            <Stack.Screen
              name="ServiceCreation"
              component={ServiceCreationScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />
            {/* 13. Détail d'un brief (freelance) */}
            <Stack.Screen
              name="BriefDetail"
              component={BriefDetailScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 14. Favoris freelances (acheteur) */}
            <Stack.Screen
              name="Favorites"
              component={FavoritesScreen}
              options={{ animation: 'slide_from_right' }}
            />
            {/* 15. Édition profil */}
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
            />

          </>
        )}
      </Stack.Navigator>
      </MissionsProvider>
      </ConversationsProvider>
      </FavoritesProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
