import { CacheKey } from '@/constants/cache.constants';
import util from 'util';

export const createCacheKey = (key: CacheKey, ...args: string[]): string => {
  return util.format(key, ...args);
};
