import { useState, useEffect } from 'react';
import { getPlatform, type Platform } from '../platform';

export function usePlatform(): Platform {
  const [platform] = useState<Platform>(() => getPlatform());
  return platform;
}
