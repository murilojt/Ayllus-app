import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
  registerForPushNotificationsAsync,
  scheduleMealReminders,
  clearNotificationsOnLogout,
} from '../lib/notifications';
import { colors } from '../theme';

type Meal = {
  id: string;
  meal_name: string;
  meal_time: string | null;
  description: string;
};

type Message = {
  id: string;
  body: string;
  read: boolean;
  created_at: string;
};

export default function DietScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDiet = useCallback(async () => {
    try {
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Busca a dieta ativa mais recente do paciente e suas refeições
      const { data: diet, error: dietError } = await supabase
        .from('diets')
        .select('id')
        .eq('patient_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dietError) throw dietError;

      let loadedMeals: Meal[] = [];

      if (diet) {
        const { data: mealsData, error: mealsError } = await supabase
          .from('meals')
          .select('id, meal_name, meal_time, description')
          .eq('diet_id', diet.id)
          .order('meal_time', { ascending: true });
        if (mealsError) throw mealsError;
        loadedMeals = mealsData ?? [];
      }

      // Busca as mensagens recentes da nutricionista
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, body, read, created_at')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (messagesError) throw messagesError;

      setMeals(loadedMeals);
      setMessages(messagesData ?? []);

      // Agenda os lembretes locais com base nos horários das refeições
      await scheduleMealReminders(loadedMeals);
    } catch (err) {
      console.error('Erro ao carregar a dieta:', err);
      setError('Não foi possível carregar sua dieta. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDiet();
    registerForPushNotificationsAsync();
  }, [loadDiet]);

  function handleRefresh() {
    setRefreshing(true);
    loadDiet();
  }

  async function handleLogout() {
    await clearNotificationsOnLogout();
    await supabase.auth.signOut();
  }

  async function handleMarkRead(messageId: string) {
    await supabase.from('messages').update({ read: true }).eq('id', messageId);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadDiet}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unreadMessages = messages.filter((m) => !m.read);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Dieta</Text>
        <TouchableOpacity
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <Text style={styles.logout}>Sair</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListHeaderComponent={
          messages.length > 0 ? (
            <View style={styles.messagesBlock}>
              <Text style={styles.sectionLabel}>
                Mensagens da nutricionista
                {unreadMessages.length > 0 ? ` (${unreadMessages.length} nova${unreadMessages.length > 1 ? 's' : ''})` : ''}
              </Text>
              {messages.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => !m.read && handleMarkRead(m.id)}
                  style={[styles.messageCard, !m.read && styles.messageCardUnread]}
                  accessibilityRole="button"
                  accessibilityLabel={m.read ? 'Mensagem lida' : 'Marcar mensagem como lida'}
                >
                  <Text style={styles.messageBody}>{m.body}</Text>
                  <Text style={styles.messageDate}>
                    {new Date(m.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.empty}>
              Nenhuma dieta cadastrada ainda. Volte mais tarde.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.mealName}>{item.meal_name}</Text>
              {item.meal_time && (
                <Text style={styles.mealTime}>{item.meal_time}</Text>
              )}
            </View>
            <Text style={styles.mealDescription}>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  logout: { color: colors.danger, fontSize: 14, fontWeight: '600' },
  empty: { color: colors.textSecondary, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  messagesBlock: { marginBottom: 20 },
  messageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageCardUnread: {
    borderColor: colors.primary,
    backgroundColor: colors.unreadBackground,
  },
  messageBody: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginBottom: 4 },
  messageDate: { fontSize: 11, color: colors.textMuted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  mealTime: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  mealDescription: { fontSize: 14, color: colors.textBody, lineHeight: 20 },
});
