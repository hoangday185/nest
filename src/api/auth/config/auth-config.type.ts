export type AuthConfig = {
  accessSecret: string;
  accessExpireIn: string;
  refreshSecret: string;
  refreshExpireIn: string;
  forgotSecret: string;
  forgotExpireIn: string;
  confirmEmailSecret: string;
  confirmEmailExpireIn: string;
};
