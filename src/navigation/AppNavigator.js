import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { COLORS } from '../lib/theme';

import WelcomeScreen         from '../screens/auth/WelcomeScreen';
import LoginScreen           from '../screens/auth/LoginScreen';
import RegisterScreen        from '../screens/auth/RegisterScreen';
import MainTabs              from './MainTabs';
import ResultScreen          from '../screens/main/ResultScreen';
import AnalysisResultScreen  from '../screens/main/AnalysisResultScreen';
import PaywallScreen         from '../screens/main/PaywallScreen';
import LegalScreen           from '../screens/main/LegalScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!session ? (
          <>
            <Stack.Screen name="Welcome"  component={WelcomeScreen}  />
            <Stack.Screen name="Login"    component={LoginScreen}    />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Result"         component={ResultScreen}         options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="AnalysisResult" component={AnalysisResultScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Paywall"        component={PaywallScreen}        options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
            <Stack.Screen name="Legal"          component={LegalScreen}          options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
});
