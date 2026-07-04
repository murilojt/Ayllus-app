import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as ExpoLinking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DietScreen from '../screens/DietScreen';
import { RootStackParamList } from './types';
import { colors } from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configura os links que abrem o app diretamente numa tela específica
// (usado no fluxo de "esqueci minha senha", vindo do e-mail)
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [ExpoLinking.createURL('/')],
  config: {
    screens: {
      Login: 'login',
      ForgotPassword: 'forgot-password',
      ResetPassword: 'reset-password',
      Diet: 'diet',
    },
  },
};

export default function RootNavigation() {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitializing(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen name="Diet" component={DietScreen} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
        {/* Sempre disponível: o link de redefinição de senha pode chegar
            tanto com o usuário deslogado quanto ainda com sessão antiga */}
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
