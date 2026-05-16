declare const process: { env?: { TARO_ENV?: string } } | undefined;

export type Platform = 'h5' | 'weapp' | 'rn' | 'unknown';

export function getPlatform(): Platform {
  if (typeof process !== 'undefined' && process?.env?.TARO_ENV) {
    const env = process.env.TARO_ENV;
    if (env === 'h5') return 'h5';
    if (env === 'weapp') return 'weapp';
    if (env === 'rn') return 'rn';
  }
  return 'unknown';
}
