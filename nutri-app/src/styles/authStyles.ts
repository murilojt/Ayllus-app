import { StyleSheet } from 'react-native';
import { colors } from '../theme';

// Estilos compartilhados pelas telas de autenticação (Login, ForgotPassword,
// ResetPassword), que antes duplicavam os mesmos valores em cada arquivo.
export const authStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
