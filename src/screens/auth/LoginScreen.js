import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, FONT, RADIUS } from '../../lib/theme';
import BubbleBackground from '../../components/ui/BubbleBackground';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Connexion échouée', 'Email ou mot de passe incorrect.');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <BubbleBackground variant="welcome" />

      <SafeAreaView>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

            <Text style={styles.wordmark}>Swiple</Text>
            <Text style={styles.title}>Connexion</Text>

            {/* Champs */}
            <View style={styles.fields}>
              {[
                { key: 'email',    label: 'Email',        placeholder: 'ton@email.com', value: email,    set: setEmail,    secure: false, keyboard: 'email-address' },
                { key: 'password', label: 'Mot de passe', placeholder: '••••••••',      value: password, set: setPassword, secure: true,  keyboard: 'default'       },
              ].map(field => {
                const isFocused = focusedField === field.key;
                return (
                  <View key={field.key} style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, isFocused && { color: COLORS.primaryLight }]}>
                      {field.label}
                    </Text>
                    <TextInput
                      style={[styles.input, isFocused && { borderColor: COLORS.primary }]}
                      placeholder={field.placeholder}
                      placeholderTextColor={COLORS.textLight}
                      value={field.value}
                      onChangeText={field.set}
                      secureTextEntry={field.secure}
                      autoCapitalize="none"
                      keyboardType={field.keyboard}
                      onFocus={() => setFocusedField(field.key)}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.82}
            >
              <Text style={styles.btnText}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.bottomFooter}>
        <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
          <Text style={styles.footerText}>
            Pas encore de compte ?{'  '}
            <Text style={styles.footerLink}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  backBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    alignSelf: 'flex-start',
  },
  backText: { fontSize: 20, color: COLORS.textMuted },
  form: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  wordmark: {
    fontSize: 15,
    color: COLORS.primaryLight,
    ...FONT.bold,
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    color: COLORS.text,
    ...FONT.bold,
    letterSpacing: -0.3,
    marginBottom: SPACING.xl,
  },
  fields: { gap: SPACING.md, marginBottom: SPACING.lg },
  fieldGroup: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    ...FONT.medium,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.text,
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnLoading: { opacity: 0.5 },
  btnText: { fontSize: 15, color: '#fff', ...FONT.semibold },
  bottomFooter: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: 38,
  },
  footerText: { fontSize: 14, color: COLORS.textMuted },
  footerLink: { color: COLORS.primaryLight, ...FONT.semibold },
});
