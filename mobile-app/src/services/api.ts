import { Platform } from 'react-native';
import { RoomBOQ, ToolItem, StaffMember } from '../store/useAppStore';

// Set EXPO_PUBLIC_API_URL in mobile-app/.env or eas.json once deployed to Render
// Example: https://mk-electricals-ops-api.onrender.com/api
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:4000/api'
    : 'http://localhost:4000/api');

export interface BackendStateResponse {
  staffMembers: StaffMember[];
  roomsBySite: Record<string, RoomBOQ[]>;
  boqNorms: { coil15: number; coil25: number; coil40: number; mcbRatio: number };
  toolsList: ToolItem[];
  latestAttendance?: {
    action_type: string;
    distance_m: number;
    inside_geofence: number;
    logged_at: string;
  };
}

export async function fetchBackendState(): Promise<BackendStateResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/state`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiPostAttendance(payload: {
  staffId: string;
  siteName: string;
  actionType: 'CHECK_IN' | 'CHECK_OUT';
  distanceMeters: number;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiPostBoqRoom(
  siteName: string,
  room: RoomBOQ
): Promise<RoomBOQ | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/boq/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...room, siteName }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiToggleToolStatus(
  toolId: string,
  signaturePath: string
): Promise<{ status: 'issued' | 'returned'; signedBy?: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/tools/${toolId}/toggle-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signaturePath }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
