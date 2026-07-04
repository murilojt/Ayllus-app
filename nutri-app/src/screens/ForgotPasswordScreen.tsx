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
} from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { showAlert } from '../lib/alert';
import { authStyles } from '../styles/authStyles';
import { colors } from '../theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email) {
      showAlert('Atenção', 'Digite seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      // Gera o link de retorno: no celular abre de volta o app (nutriapp://reset-password),
      // na versão web abre a própria página de redefinição.
      const redirectTo = ExpoLinking.createURL('reset-password');

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        showAlert('Erro', error.message);
        return;
      }
      setSent(true);
    } catch (err) {
      console.error('Erro ao solicitar redefinição de senha:', err);
      showAlert('Erro de conexão', 'Não foi possível conectar ao servidor.');
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
        <Text style={styles.title}>Recuperar senha</Text>

        {sent ? (
          <>
            <Text style={styles.subtitle}>
              Enviamos um link pro e-mail {email}. Abra-o pra criar uma nova
              senha.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="link"
              accessibilityLabel="Voltar pro login"
            >
              <Text style={styles.backLink}>Voltar pro login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Digite o e-mail cadastrado. Vamos te enviar um link pra criar
              uma nova senha.
            </Text>

            <TextInput
              style={authStyles.input}
              placeholder="E-mail"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="E-mail"
            />

            <TouchableOpacity
              style={authStyles.button}
              onPress={handleSend}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Enviar link"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={authStyles.buttonText}>Enviar link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              accessibilityRole="link"
              accessibilityLabel="Voltar pro login"
            >
              <Text style={styles.backLink}>Voltar pro login</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  backLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
});
