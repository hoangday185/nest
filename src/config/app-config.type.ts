export type AppConfig = {
  nodeEnv: string;
  name: string;
  url: string;
  port: number;
  apiPrefix: string;
  debug: boolean;
  corsOrigin: boolean | string | RegExp | (string | RegExp)[];
};
