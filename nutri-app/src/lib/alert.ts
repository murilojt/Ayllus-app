import { Alert, Platform } from 'react-native';

/**
 * Alert.alert() do React Native não exibe nada visualmente na versão web
 * (react-native-web não implementa isso de forma confiável). Esse helper
 * usa window.alert() na web e o Alert nativo no app, garantindo que o
 * usuário sempre veja a mensagem, em qualquer plataforma.
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
