export type DeviceType = "mobile" | "tablet" | "desktop";

/** Small regex-based UA sniffer — good enough for admin analytics, not a security boundary. */
export function parseUserAgent(ua: string): { browser: string; os: string; deviceType: DeviceType } {
  return { browser: detectBrowser(ua), os: detectOS(ua), deviceType: detectDevice(ua) };
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/(chrome|crios)\//i.test(ua)) return "Chrome";
  if (/(firefox|fxios)\//i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

function detectOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function detectDevice(ua: string): DeviceType {
  if (/ipad|tablet|kindle|playbook|nexus (7|9|10)/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}
