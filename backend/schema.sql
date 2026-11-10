-- MK Electricals Operations App v2 — SQLite Database Schema & Initial Seed

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  user_type TEXT NOT NULL DEFAULT 'employee',
  password_hash TEXT NOT NULL,
  site TEXT NOT NULL,
  updated TEXT NOT NULL,
  accuracy TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  dept TEXT NOT NULL,
  joining_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS sites (
  name TEXT PRIMARY KEY,
  area TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  geofence_radius_m INTEGER NOT NULL DEFAULT 100,
  progress INTEGER NOT NULL DEFAULT 75
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  staff_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'CHECK_IN' | 'CHECK_OUT'
  distance_m REAL NOT NULL,
  inside_geofence INTEGER NOT NULL,
  logged_at TEXT NOT NULL,
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS boq_rooms (
  id TEXT PRIMARY KEY,
  site_name TEXT NOT NULL,
  name TEXT NOT NULL,
  light INTEGER NOT NULL DEFAULT 0,
  fan INTEGER NOT NULL DEFAULT 0,
  plug6A INTEGER NOT NULL DEFAULT 0,
  power16A INTEGER NOT NULL DEFAULT 0,
  ac INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS boq_norms (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  coil15 REAL NOT NULL DEFAULT 0.15,
  coil25 REAL NOT NULL DEFAULT 0.25,
  coil40 REAL NOT NULL DEFAULT 0.35,
  mcb_ratio REAL NOT NULL DEFAULT 0.20
);

CREATE TABLE IF NOT EXISTS tools_custody (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  issued_to TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued',
  serial TEXT NOT NULL,
  signed_by TEXT,
  signature_path TEXT
);
