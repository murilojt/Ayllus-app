import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';
import { colors } from '../theme';

// Faz as notificações aparecerem mesmo com o app aberto em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pede permissão de notificação e salva o token de push (Expo) no
 * perfil do usuário logado, pra que a nutricionista consiga enviar
 * mensagens push pra ele depois.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.primary,
    });
  }

  if (!Device.isDevice && Platform.OS !== 'web') {
    // Notificações push (remotas) só funcionam em dispositivo físico,
    // não em simulador/emulador. Lembretes locais funcionam normalmente.
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
    }

    return token;
  } catch {
    // Na versão web, getExpoPushTokenAsync pode falhar sem um projectId
    // configurado — não é crítico, os lembretes locais continuam funcionando.
    return null;
  }
}

/**
 * Limpa o token de push salvo no perfil e cancela os lembretes locais
 * agendados. Deve ser chamado antes do logout, senão o token continua
 * ativo e o próximo usuário a logar no mesmo aparelho pode receber
 * notificações (push ou lembretes locais) da conta anterior.
 */
export async function clearNotificationsOnLogout() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from('profiles').update({ push_token: null }).eq('id', user.id);
  }

  if (Platform.OS !== 'web') {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}

type Meal = {
  id: string;
  meal_name: string;
  meal_time: string | null; // formato "HH:MM:SS" ou "HH:MM"
};

/**
 * Agenda lembretes locais diários pra cada refeição que tem horário definido.
 * Cancela lembretes antigos antes, pra não duplicar quando a dieta mudar.
 */
export async function scheduleMealReminders(meals: Meal[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (Platform.OS === 'web') {
    // expo-notifications não agenda notificações locais recorrentes na web
    return;
  }

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  for (const meal of meals) {
    if (!meal.meal_time) continue;

    const [hourStr, minuteStr] = meal.meal_time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (isNaN(hour) || isNaN(minute)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora da refeição 🍽️',
        body: `${meal.meal_name} — confira sua dieta no app.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}
