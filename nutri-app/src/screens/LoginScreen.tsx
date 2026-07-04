import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '../lib/supabase';
import { showAlert } from '../lib/alert';
import { authStyles } from '../styles/authStyles';
import { colors } from '../theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      showAlert('Atenção', 'Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        showAlert('Erro ao entrar', error.message);
      }
      // Se o login der certo, o listener de auth no App.tsx
      // já redireciona automaticamente para a tela principal.
    } catch (err) {
      console.error('Erro ao tentar logar:', err);
      showAlert(
        'Erro de conexão',
        'Não foi possível conectar ao servidor. Verifique sua internet e as configurações do app (veja o console do navegador pra mais detalhes).'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={authStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={authStyles.content}>
        <Text style={styles.title}>Minha Dieta</Text>
        <Text style={styles.subtitle}>Entre com seu e-mail e senha</Text>

        <TextInput
          style={authStyles.input}
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="E-mail"
        />

        <TextInput
          style={authStyles.input}
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Senha"
        />

        <TouchableOpacity
          style={authStyles.button}
          onPress={handleLogin}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Entrar"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={authStyles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          accessibilityRole="link"
          accessibilityLabel="Esqueci minha senha"
        >
          <Text style={styles.forgotLink}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <Text style={styles.helper}>
          Não tem acesso ainda? Fale com sua nutricionista.
        </Text>

        <View style={styles.legalRow}>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            accessibilityLabel="Política de Privacidade"
          >
            <Text style={styles.legalLink}>Política de Privacidade</Text>
          </TouchableOpacity>
          <Text style={styles.legalDivider}>·</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_OF_USE_URL)}
            accessibilityRole="link"
            accessibilityLabel="Termos de Uso"
          >
            <Text style={styles.legalLink}>Termos de Uso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 32 },
  forgotLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
  },
  helper: { marginTop: 24, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  legalLink: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  legalDivider: { fontSize: 12, color: colors.textMuted, marginHorizontal: 8 },
});
