export type JwtPayloadType = {
  token: string;
  userId: string;
  iat: number;
  exp: number;
};
