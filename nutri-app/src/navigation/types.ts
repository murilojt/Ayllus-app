export type RootStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: { access_token?: string; refresh_token?: string } | undefined;
  Diet: undefined;
};
