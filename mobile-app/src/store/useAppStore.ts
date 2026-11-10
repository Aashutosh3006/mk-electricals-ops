import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import { fetchBackendState, apiPostAttendance, apiPostBoqRoom, apiToggleToolStatus } from '../services/api';

export type ScreenId =
  | 'splash'
  | 'login'
  | 'emp_dashboard'
  | 'attendance'
  | 'id_card'
  | 'owner_dashboard'
  | 'live_tracking'
  | 'boq'
  | 'tools'
  | 'reports'
  | 'tasks'
  | 'materials'
  | 'sites'
  | 'dispatch'
  | 'staff'
  | 'approvals';

export interface RoomBOQ {
  id: string;
  name: string;
  light: number;
  fan: number;
  plug6A: number;
  power16A: number;
  ac: number;
}

export interface ToolItem {
  id: string;
  name: string;
  type: 'drill' | 'meter' | 'puller';
  issuedTo: string;
  date: string;
  status: 'issued' | 'returned';
  serial: string;
  signedBy?: string;
  signaturePath?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  site: string;
  updated: string;
  accuracy: string;
  lat: number;
  lng: number;
  dept: string;
  joiningDate: string;
  status: string;
}

export const INITIAL_ROOMS: Record<string, RoomBOQ[]> = {
  'MK Tower - Site A': [
    { id: 'r1', name: 'Living Room', light: 5, fan: 2, plug6A: 3, power16A: 1, ac: 1 },
    { id: 'r2', name: 'Bedroom 1', light: 6, fan: 2, plug6A: 6, power16A: 2, ac: 2 },
    { id: 'r3', name: 'Bedroom 2', light: 6, fan: 2, plug6A: 5, power16A: 2, ac: 1 },
    { id: 'r4', name: 'Kitchen', light: 3, fan: 1, plug6A: 3, power16A: 4, ac: 0 },
    { id: 'r5', name: 'Balcony', light: 3, fan: 0, plug6A: 1, power16A: 0, ac: 0 },
  ],
  'Phoenix Residency - Site B': [
    { id: 'b1', name: 'Living Room', light: 6, fan: 2, plug6A: 4, power16A: 1, ac: 1 },
    { id: 'b2', name: 'Master Bedroom', light: 5, fan: 1, plug6A: 5, power16A: 2, ac: 1 },
  ],
};

export const INITIAL_TOOLS: ToolItem[] = [
  { id: 'T01', name: 'Drill Machine', type: 'drill', issuedTo: 'Rohit Sharma', date: '24 Oct 2026', status: 'issued', serial: 'MK-DRL-104' },
  { id: 'T02', name: 'Multimeter', type: 'meter', issuedTo: 'Ajay Verma', date: '22 Oct 2026', status: 'issued', serial: 'MK-DMM-209' },
  { id: 'T03', name: 'Cable Puller', type: 'puller', issuedTo: 'Sandeep Yadav', date: '20 Oct 2026', status: 'issued', serial: 'MK-CPL-088' },
  { id: 'T04', name: 'Insulation Tester', type: 'meter', issuedTo: 'Kiran Deshmukh', date: '19 Oct 2026', status: 'issued', serial: 'MK-MEG-311' },
  { id: 'T05', name: 'Rotary Hammer', type: 'drill', issuedTo: 'Rohit Sharma', date: '18 Oct 2026', status: 'issued', serial: 'MK-RHM-112' },
  { id: 'T06', name: 'Clamp Meter', type: 'meter', issuedTo: 'Vikram Patil', date: '17 Oct 2026', status: 'issued', serial: 'MK-CLM-401' },
  { id: 'T07', name: 'Hydraulic Crimper', type: 'puller', issuedTo: 'Sandeep Yadav', date: '15 Oct 2026', status: 'issued', serial: 'MK-CRM-055' },
  { id: 'T08', name: 'Laser Distance Meter', type: 'meter', issuedTo: 'Vikram Patil', date: '14 Oct 2026', status: 'issued', serial: 'MK-LDM-019' },
  { id: 'T09', name: 'Earth Resistance Kit', type: 'meter', issuedTo: 'Kiran Deshmukh', date: '12 Oct 2026', status: 'issued', serial: 'MK-ERT-072' },
  { id: 'T10', name: 'Conduit Bender', type: 'puller', issuedTo: 'Ajay Verma', date: '10 Oct 2026', status: 'issued', serial: 'MK-CND-133' },
  { id: 'T11', name: 'Wall Chaser Cutter', type: 'drill', issuedTo: 'Rohit Sharma', date: '08 Oct 2026', status: 'issued', serial: 'MK-WCH-091' },
  { id: 'T12', name: 'Phase Sequence Meter', type: 'meter', issuedTo: 'Kiran Deshmukh', date: '05 Oct 2026', status: 'issued', serial: 'MK-PSM-204' },
  { id: 'T13', name: 'Digital Lux Meter', type: 'meter', issuedTo: 'Vikram Patil', date: '01 Oct 2026', status: 'returned', serial: 'MK-LUX-012' },
];

export const STAFF_MEMBERS: StaffMember[] = [
  { id: 'EMP001', name: 'Rohit Sharma', role: 'Electrician', site: 'At Site A', updated: '2 min ago', accuracy: '±6 m', lat: 18.5204, lng: 73.8567, dept: 'Site Execution', joiningDate: '12 Jan 2025', status: 'Active' },
  { id: 'EMP002', name: 'Ajay Verma', role: 'Sr. Wireman', site: 'At Site A', updated: '4 min ago', accuracy: '±8 m', lat: 18.5235, lng: 73.8525, dept: 'Site Execution', joiningDate: '04 Mar 2025', status: 'Active' },
  { id: 'EMP003', name: 'Sandeep Yadav', role: 'Panel Technician', site: 'At Site B', updated: '5 min ago', accuracy: '±5 m', lat: 18.5162, lng: 73.8610, dept: 'HT/LT Panels', joiningDate: '19 May 2025', status: 'Active' },
  { id: 'EMP004', name: 'Vikram Patil', role: 'Site Supervisor', site: 'At Site A', updated: '1 min ago', accuracy: '±6 m', lat: 18.5179, lng: 73.8512, dept: 'Supervision', joiningDate: '10 Nov 2024', status: 'Active' },
];

export function getRoomTotalPoints(r: RoomBOQ): number {
  return (r.light || 0) + (r.fan || 0) + (r.plug6A || 0) + (r.power16A || 0) + (r.ac || 0);
}

export function useAppStore() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('emp_dashboard');
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [loginRole, setLoginRole] = useState<'employee' | 'owner'>('employee');
  const [empIdInput, setEmpIdInput] = useState('EMP001');
  const [passwordInput, setPasswordInput] = useState('mk2026');
  const [insideGeofence, setInsideGeofence] = useState(true);
  const [distanceMeters, setDistanceMeters] = useState(18);
  const [checkedIn, setCheckedIn] = useState(true);
  const [checkInTime, setCheckInTime] = useState('09:02 AM');
  const [selectedSite, setSelectedSite] = useState('MK Tower - Site A');
  const [roomsBySite, setRoomsBySite] = useState<Record<string, RoomBOQ[]>>(INITIAL_ROOMS);
  const [boqNorms, setBoqNorms] = useState({ coil15: 0.15, coil25: 0.25, coil40: 0.35, mcbRatio: 0.2 });
  const [toolsList, setToolsList] = useState<ToolItem[]>(INITIAL_TOOLS);
  const [toolsTab, setToolsTab] = useState<'issued' | 'returned'>('issued');
  const [trackingTab, setTrackingTab] = useState<'map' | 'list'>('map');
  const [selectedStaffId, setSelectedStaffId] = useState('EMP001');

  const syncFromBackend = useCallback(async () => {
    setSyncStatus('connecting');
    const data = await fetchBackendState();
    if (data) {
      if (data.roomsBySite) setRoomsBySite(data.roomsBySite);
      if (data.boqNorms) setBoqNorms(data.boqNorms);
      if (data.toolsList) setToolsList(data.toolsList);
      if (data.latestAttendance) {
        setCheckedIn(data.latestAttendance.action_type === 'CHECK_IN');
        setDistanceMeters(data.latestAttendance.distance_m);
        setInsideGeofence(Boolean(data.latestAttendance.inside_geofence));
        setCheckInTime(data.latestAttendance.logged_at);
      }
      setSyncStatus('online');
    } else {
      setSyncStatus('offline');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem('mk_ops_local_cache_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.roomsBySite) setRoomsBySite(parsed.roomsBySite);
          if (parsed.toolsList) setToolsList(parsed.toolsList);
        }
      } catch {}
      await syncFromBackend();
    })();
  }, [syncFromBackend]);

  useEffect(() => {
    AsyncStorage.setItem(
      'mk_ops_local_cache_v2',
      JSON.stringify({ roomsBySite, toolsList })
    ).catch(() => {});
  }, [roomsBySite, toolsList]);

  const recordAttendanceSync = async (actionType: 'CHECK_IN' | 'CHECK_OUT') => {
    if (actionType === 'CHECK_IN') {
      setCheckedIn(true);
      setCheckInTime('09:41 AM');
    } else {
      setCheckedIn(false);
    }
    const res = await apiPostAttendance({
      staffId: empIdInput || 'EMP001',
      siteName: selectedSite,
      actionType,
      distanceMeters,
    });
    if (res && res.loggedAt) {
      setCheckInTime(res.loggedAt);
      setSyncStatus('online');
    }
  };

  const addBoqRoomSync = async (newRoom: RoomBOQ) => {
    setRoomsBySite((prev) => ({
      ...prev,
      [selectedSite]: [...(prev[selectedSite] || []), newRoom],
    }));
    const saved = await apiPostBoqRoom(selectedSite, newRoom);
    if (saved) setSyncStatus('online');
  };

  const signAndToggleToolSync = async (id: string, sigPath: string) => {
    setToolsList((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'issued' ? 'returned' : 'issued',
              signedBy: t.issuedTo,
              signaturePath: sigPath,
            }
          : t
      )
    );
    const updated = await apiToggleToolStatus(id, sigPath);
    if (updated) setSyncStatus('online');
  };

  return {
    syncStatus,
    syncFromBackend,
    recordAttendanceSync,
    addBoqRoomSync,
    signAndToggleToolSync,
    currentScreen,
    setCurrentScreen,
    loginRole,
    setLoginRole,
    empIdInput,
    setEmpIdInput,
    passwordInput,
    setPasswordInput,
    insideGeofence,
    setInsideGeofence,
    distanceMeters,
    setDistanceMeters,
    checkedIn,
    setCheckedIn,
    checkInTime,
    setCheckInTime,
    selectedSite,
    setSelectedSite,
    roomsBySite,
    setRoomsBySite,
    boqNorms,
    setBoqNorms,
    toolsList,
    setToolsList,
    toolsTab,
    setToolsTab,
    trackingTab,
    setTrackingTab,
    selectedStaffId,
    setSelectedStaffId,
  };
}
