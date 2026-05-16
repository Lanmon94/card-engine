import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function taroAdapter(): any {
  return {
    name: 'card-engine-taro-adapter',
    enforce: 'pre' as const,
    config() {
      return {
        resolve: {
          alias: {
            '@tarojs/components': path.resolve(__dirname, 'index.ts'),
          },
        },
      };
    },
  };
}
