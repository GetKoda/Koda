// ============================================================================
// Device Frame Presets
//
// Popular devices with exact dimensions for frame creation.
// ============================================================================

export interface DeviceFrame {
  id: string;
  name: string;
  category: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'watch' | 'custom';
  width: number;
  height: number;
  icon: string;
}

export const DEVICE_FRAMES: DeviceFrame[] = [
  // Phones
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', category: 'phone', width: 393, height: 852, icon: 'iphone' },
  { id: 'iphone-15', name: 'iPhone 15', category: 'phone', width: 390, height: 844, icon: 'iphone' },
  { id: 'iphone-se', name: 'iPhone SE', category: 'phone', width: 375, height: 667, icon: 'iphone' },
  { id: 'pixel-8', name: 'Pixel 8', category: 'phone', width: 412, height: 915, icon: 'android' },
  { id: 'galaxy-s24', name: 'Galaxy S24', category: 'phone', width: 360, height: 780, icon: 'android' },

  // Tablets
  { id: 'ipad-pro-12', name: 'iPad Pro 12.9"', category: 'tablet', width: 1024, height: 1366, icon: 'tablet' },
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', category: 'tablet', width: 834, height: 1194, icon: 'tablet' },
  { id: 'ipad-air', name: 'iPad Air', category: 'tablet', width: 820, height: 1180, icon: 'tablet' },
  { id: 'ipad-mini', name: 'iPad Mini', category: 'tablet', width: 744, height: 1133, icon: 'tablet' },

  // Laptops
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', category: 'laptop', width: 1728, height: 1117, icon: 'laptop' },
  { id: 'macbook-pro-14', name: 'MacBook Pro 14"', category: 'laptop', width: 1512, height: 982, icon: 'laptop' },
  { id: 'macbook-air-15', name: 'MacBook Air 15"', category: 'laptop', width: 1440, height: 932, icon: 'laptop' },
  { id: 'macbook-air-13', name: 'MacBook Air 13"', category: 'laptop', width: 1280, height: 832, icon: 'laptop' },
  { id: 'surface-laptop', name: 'Surface Laptop 5', category: 'laptop', width: 1504, height: 1000, icon: 'laptop' },

  // Desktop
  { id: 'imac-24', name: 'iMac 24"', category: 'desktop', width: 1920, height: 1080, icon: 'monitor' },
  { id: 'imac-27', name: 'iMac 27"', category: 'desktop', width: 2560, height: 1440, icon: 'monitor' },
  { id: 'desktop-1080', name: 'Desktop 1080p', category: 'desktop', width: 1920, height: 1080, icon: 'monitor' },
  { id: 'desktop-1440', name: 'Desktop 1440p', category: 'desktop', width: 2560, height: 1440, icon: 'monitor' },
  { id: 'desktop-4k', name: 'Desktop 4K', category: 'desktop', width: 3840, height: 2160, icon: 'monitor' },

  // Watch
  { id: 'apple-watch-9', name: 'Apple Watch 9', category: 'watch', width: 202, height: 248, icon: 'watch' },
];

export const DEVICE_CATEGORIES = [
  { id: 'phone' as const, label: 'Phones' },
  { id: 'tablet' as const, label: 'Tablets' },
  { id: 'laptop' as const, label: 'Laptops' },
  { id: 'desktop' as const, label: 'Desktops' },
  { id: 'watch' as const, label: 'Watches' },
  { id: 'custom' as const, label: 'Custom' },
];
