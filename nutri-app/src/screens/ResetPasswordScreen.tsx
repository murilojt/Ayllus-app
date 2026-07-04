import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alert';
import { authStyles } from '../styles/authStyles';
import { colors } from '../theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

type ResetPasswordParams = RootStackParamList['ResetPassword'];

// Extrai access_token/refresh_token tanto de query params (deep link nativo)
// quanto do fragmento #... da URL (comportamento padrão do Supabase na web)
function extractTokens(routeParams: ResetPasswordParams): {
  access_token?: string;
  refresh_token?: string;
} {
  if (routeParams?.access_token) {
    return {
      access_token: routeParams.access_token,
      refresh_token: routeParams.refresh_token,
    };
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    return {
      access_token: params.get('access_token') ?? undefined,
      refresh_token: params.get('refresh_token') ?? undefined,
    };
  }

  return {};
}

export default function ResetPasswordScreen({ route, navigation }: Props) {
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function setup() {
      const { access_token, refresh_token } = extractTokens(route.params);

      if (!access_token || !refresh_token) {
        setInvalidLink(true);
        setReady(true);
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        setInvalidLink(true);
      }

      // Remove os tokens do hash da URL depois de consumi-los, pra não
      // deixá-los expostos na barra de endereço/histórico do navegador.
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      setReady(true);
    }
    setup();
  }, [route.params]);

  async function handleSubmit() {
    if (password.length < 6) {
      showAlert('Atenção', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Atenção', 'As senhas não coincidem.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      showAlert('Erro', error.message);
      return;
    }

    setDone(true);
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (invalidLink) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Link inválido ou expirado</Text>
        <Text style={styles.subtitle}>
          Solicite um novo link de recuperação de senha.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          accessibilityLabel="Voltar pro login"
        >
          <Text style={styles.backLink}>Voltar pro login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Senha atualizada!</Text>
        <Text style={styles.subtitle}>
          Sua senha foi alterada com sucesso.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="link"
          accessibilityLabel="Ir para o login"
        >
          <Text style={styles.backLink}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={authStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={authStyles.content}>
        <Text style={styles.title}>Crie uma nova senha</Text>

        <TextInput
          style={authStyles.input}
          placeholder="Nova senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Nova senha"
        />
        <TextInput
          style={authStyles.input}
          placeholder="Confirme a nova senha"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          accessibilityLabel="Confirme a nova senha"
        />

        <TouchableOpacity
          style={authStyles.button}
          onPress={handleSubmit}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Salvar nova senha"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={authStyles.buttonText}>Salvar nova senha</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  backLink: { color: colors.primary, fontSize: 14, fontWeight: '600', marginTop: 8 },
});
