/**
 * Backend address. A phone cannot reach "localhost" of your PC — set EXPO_PUBLIC_API_URL to the PC's LAN IP,
 * e.g.  EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api npx expo start
 * The Android emulator reaches the host machine at 10.0.2.2.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api').replace(/\/$/, '');

/** How often (ms) to log a location point while the user is on duty and the app is open. */
export const TRACK_INTERVAL_MS = 5 * 60 * 1000;

export const COLORS = { primary: '#337ab7', primaryDark: '#286090', side: '#2e353d', danger: '#d9534f', success: '#5cb85c', text: '#333', muted: '#777', border: '#ddd', bg: '#f4f6f8' };
