const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mk_electricals.db');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize SQLite database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schemaSql);

// Seed initial data matching MK Electricals Operations App v2 mockup if empty
function seedDatabaseIfEmpty() {
  const staffCount = db.prepare('SELECT COUNT(*) AS cnt FROM staff').get().cnt;
  if (staffCount > 0 && !process.argv.includes('--reseed')) return;

  db.exec('DELETE FROM attendance_logs; DELETE FROM boq_rooms; DELETE FROM tools_custody; DELETE FROM staff; DELETE FROM sites; DELETE FROM boq_norms;');

  const insertSite = db.prepare('INSERT INTO sites (name, area, lat, lng, geofence_radius_m, progress) VALUES (?, ?, ?, ?, ?, ?)');
  insertSite.run('MK Tower - Site A', 'Shivajinagar, Pune', 18.5204, 73.8567, 100, 78);
  insertSite.run('Phoenix Residency - Site B', 'Kothrud, Pune', 18.5074, 73.8077, 120, 54);
  insertSite.run('Orion Tech Park - Site C', 'Hinjawadi, Pune', 18.5913, 73.7389, 150, 91);

  const insertStaff = db.prepare(`
    INSERT INTO staff (id, name, role, user_type, password_hash, site, updated, accuracy, lat, lng, dept, joining_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStaff.run('EMP001', 'Rohit Sharma', 'Electrician', 'employee', 'mk2026', 'At Site A', '2 min ago', '±6 m', 18.5204, 73.8567, 'Site Execution', '12 Jan 2025', 'Active');
  insertStaff.run('EMP002', 'Ajay Verma', 'Sr. Wireman', 'employee', 'mk2026', 'At Site A', '4 min ago', '±8 m', 18.5235, 73.8525, 'Site Execution', '04 Mar 2025', 'Active');
  insertStaff.run('EMP003', 'Sandeep Yadav', 'Panel Technician', 'employee', 'mk2026', 'At Site B', '5 min ago', '±5 m', 18.5162, 73.8610, 'HT/LT Panels', '19 May 2025', 'Active');
  insertStaff.run('EMP004', 'Vikram Patil', 'Site Supervisor', 'employee', 'mk2026', 'At Site A', '1 min ago', '±6 m', 18.5179, 73.8512, 'Supervision', '10 Nov 2024', 'Active');
  insertStaff.run('OWN001', 'Mr. Manish Kumar', 'Owner', 'owner', 'owner2026', 'HQ / All Sites', 'Just now', '±5 m', 18.5204, 73.8567, 'Management', '01 Jan 2020', 'Active');

  db.prepare('INSERT INTO boq_norms (id, coil15, coil25, coil40, mcb_ratio) VALUES (1, 0.15, 0.25, 0.35, 0.20)').run();

  const insertRoom = db.prepare(`
    INSERT INTO boq_rooms (id, site_name, name, light, fan, plug6A, power16A, ac)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRoom.run('r1', 'MK Tower - Site A', 'Living Room', 5, 2, 3, 1, 1);
  insertRoom.run('r2', 'MK Tower - Site A', 'Bedroom 1', 6, 2, 6, 2, 2);
  insertRoom.run('r3', 'MK Tower - Site A', 'Bedroom 2', 6, 2, 5, 2, 1);
  insertRoom.run('r4', 'MK Tower - Site A', 'Kitchen', 3, 1, 3, 4, 0);
  insertRoom.run('r5', 'MK Tower - Site A', 'Balcony', 3, 0, 1, 0, 0);
  insertRoom.run('b1', 'Phoenix Residency - Site B', 'Living Room', 6, 2, 4, 1, 1);
  insertRoom.run('b2', 'Phoenix Residency - Site B', 'Master Bedroom', 5, 1, 5, 2, 1);

  const insertTool = db.prepare(`
    INSERT INTO tools_custody (id, name, type, issued_to, issue_date, status, serial, signed_by, signature_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const seedTools = [
    ['T01', 'Drill Machine', 'drill', 'Rohit Sharma', '24 Oct 2026', 'issued', 'MK-DRL-104'],
    ['T02', 'Multimeter', 'meter', 'Ajay Verma', '22 Oct 2026', 'issued', 'MK-DMM-209'],
    ['T03', 'Cable Puller', 'puller', 'Sandeep Yadav', '20 Oct 2026', 'issued', 'MK-CPL-088'],
    ['T04', 'Insulation Tester', 'meter', 'Kiran Deshmukh', '19 Oct 2026', 'issued', 'MK-MEG-311'],
    ['T05', 'Rotary Hammer', 'drill', 'Rohit Sharma', '18 Oct 2026', 'issued', 'MK-RHM-112'],
    ['T06', 'Clamp Meter', 'meter', 'Vikram Patil', '17 Oct 2026', 'issued', 'MK-CLM-401'],
    ['T07', 'Hydraulic Crimper', 'puller', 'Sandeep Yadav', '15 Oct 2026', 'issued', 'MK-CRM-055'],
    ['T08', 'Laser Distance Meter', 'meter', 'Vikram Patil', '14 Oct 2026', 'issued', 'MK-LDM-019'],
    ['T09', 'Earth Resistance Kit', 'meter', 'Kiran Deshmukh', '12 Oct 2026', 'issued', 'MK-ERT-072'],
    ['T10', 'Conduit Bender', 'puller', 'Ajay Verma', '10 Oct 2026', 'issued', 'MK-CND-133'],
    ['T11', 'Wall Chaser Cutter', 'drill', 'Rohit Sharma', '08 Oct 2026', 'issued', 'MK-WCH-091'],
    ['T12', 'Phase Sequence Meter', 'meter', 'Kiran Deshmukh', '05 Oct 2026', 'issued', 'MK-PSM-204'],
    ['T13', 'Digital Lux Meter', 'meter', 'Vikram Patil', '01 Oct 2026', 'returned', 'MK-LUX-012'],
  ];
  seedTools.forEach((t) => insertTool.run(...t, null, null));

  db.prepare(`
    INSERT INTO attendance_logs (staff_id, site_name, action_type, distance_m, inside_geofence, logged_at)
    VALUES ('EMP001', 'MK Tower - Site A', 'CHECK_IN', 18, 1, '09:02 AM')
  `).run();

  console.log('SQLite database seeded with MK Electricals Operations v2 records.');
}

seedDatabaseIfEmpty();

// Haversine formula to compute distance in meters between 2 GPS coordinates
function computeDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MK Electricals SQLite API v2', timestamp: new Date().toISOString() });
});

// 2. Auth Login
app.post('/api/auth/login', (req, res) => {
  const { empId, password } = req.body;
  const user = db.prepare('SELECT * FROM staff WHERE id = ?').get(empId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid Employee/Owner ID' });
  }
  return res.json({
    id: user.id,
    name: user.name,
    role: user.role,
    userType: user.user_type,
    dept: user.dept,
    joiningDate: user.joining_date,
  });
});

// 3. Full Synced State Snapshot
app.get('/api/state', (req, res) => {
  const staff = db.prepare("SELECT * FROM staff WHERE user_type = 'employee'").all();
  const sites = db.prepare('SELECT * FROM sites').all();
  const rawRooms = db.prepare('SELECT * FROM boq_rooms').all();
  const normsRow = db.prepare('SELECT * FROM boq_norms WHERE id = 1').get();
  const tools = db.prepare('SELECT * FROM tools_custody ORDER BY rowid DESC').all();
  const latestAttendance = db
    .prepare('SELECT * FROM attendance_logs WHERE staff_id = ? ORDER BY id DESC LIMIT 1')
    .get('EMP001');

  const roomsBySite = {};
  rawRooms.forEach((r) => {
    if (!roomsBySite[r.site_name]) roomsBySite[r.site_name] = [];
    roomsBySite[r.site_name].push({
      id: r.id,
      name: r.name,
      light: r.light,
      fan: r.fan,
      plug6A: r.plug6A,
      power16A: r.power16A,
      ac: r.ac,
    });
  });

  res.json({
    staffMembers: staff.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      site: s.site,
      updated: s.updated,
      accuracy: s.accuracy,
      lat: s.lat,
      lng: s.lng,
      dept: s.dept,
      joiningDate: s.joining_date,
      status: s.status,
    })),
    sites,
    roomsBySite,
    boqNorms: {
      coil15: normsRow.coil15,
      coil25: normsRow.coil25,
      coil40: normsRow.coil40,
      mcbRatio: normsRow.mcb_ratio,
    },
    toolsList: tools.map((t) => ({
      id: t.id,
      name: t.name,
      type: t.type,
      issuedTo: t.issued_to,
      date: t.issue_date,
      status: t.status,
      serial: t.serial,
      signedBy: t.signed_by || undefined,
      signaturePath: t.signature_path || undefined,
    })),
    latestAttendance,
  });
});

// 4. Attendance Check-In / Check-Out with Geofence Verification
app.post('/api/attendance', (req, res) => {
  const { staffId = 'EMP001', siteName = 'MK Tower - Site A', actionType = 'CHECK_IN', lat, lng, distanceMeters } = req.body;
  const site = db.prepare('SELECT * FROM sites WHERE name = ?').get(siteName) || {
    lat: 18.5204,
    lng: 73.8567,
    geofence_radius_m: 100,
  };

  const dist =
    typeof distanceMeters === 'number'
      ? distanceMeters
      : lat && lng
      ? computeDistanceMeters(lat, lng, site.lat, site.lng)
      : 18;
  const inside = dist <= site.geofence_radius_m ? 1 : 0;

  if (actionType === 'CHECK_IN' && !inside) {
    return res.status(400).json({
      error: `Outside site geofence (${dist} m > ${site.geofence_radius_m} m limit)`,
      distanceMeters: dist,
      insideGeofence: false,
    });
  }

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  db.prepare(`
    INSERT INTO attendance_logs (staff_id, site_name, action_type, distance_m, inside_geofence, logged_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(staffId, siteName, actionType, dist, inside, timeStr);

  res.json({
    ok: true,
    actionType,
    distanceMeters: dist,
    insideGeofence: Boolean(inside),
    loggedAt: timeStr,
  });
});

// 5. Add or Update Room in BOQ Survey
app.post('/api/boq/rooms', (req, res) => {
  const { id, siteName = 'MK Tower - Site A', name, light = 0, fan = 0, plug6A = 0, power16A = 0, ac = 0 } = req.body;
  const roomId = id || 'rm_' + Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO boq_rooms (id, site_name, name, light, fan, plug6A, power16A, ac)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(roomId, siteName, name, light, fan, plug6A, power16A, ac);

  res.json({ id: roomId, siteName, name, light, fan, plug6A, power16A, ac });
});

// 6. Update BOQ Wire/MCB Calculator Multiplier Norms
app.put('/api/boq/norms', (req, res) => {
  const { coil15 = 0.15, coil25 = 0.25, coil40 = 0.35, mcbRatio = 0.2 } = req.body;
  db.prepare('UPDATE boq_norms SET coil15 = ?, coil25 = ?, coil40 = ?, mcb_ratio = ? WHERE id = 1').run(
    coil15,
    coil25,
    coil40,
    mcbRatio
  );
  res.json({ coil15, coil25, coil40, mcbRatio });
});

// 7. Sign & Toggle Tool Custody Status (Issued <-> Returned)
app.put('/api/tools/:id/toggle-status', (req, res) => {
  const { id } = req.params;
  const { signaturePath } = req.body;
  const tool = db.prepare('SELECT * FROM tools_custody WHERE id = ?').get(id);
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  const nextStatus = tool.status === 'issued' ? 'returned' : 'issued';
  const signedBy = signaturePath ? tool.issued_to : tool.signed_by;
  const sig = signaturePath || tool.signature_path;

  db.prepare('UPDATE tools_custody SET status = ?, signed_by = ?, signature_path = ? WHERE id = ?').run(
    nextStatus,
    signedBy,
    sig,
    id
  );

  res.json({
    id,
    status: nextStatus,
    signedBy,
    signaturePath: sig,
  });
});

// 8. Issue New Tool / Meter with Signature
app.post('/api/tools/issue', (req, res) => {
  const { name, type = 'meter', issuedTo, serial = 'MK-NEW-501', signaturePath } = req.body;
  const id = 'T' + Date.now();
  const issueDate = '10 Nov 2026';
  const signedBy = signaturePath ? issuedTo : null;

  db.prepare(`
    INSERT INTO tools_custody (id, name, type, issued_to, issue_date, status, serial, signed_by, signature_path)
    VALUES (?, ?, ?, ?, ?, 'issued', ?, ?, ?)
  `).run(id, name, type, issuedTo, issueDate, serial, signedBy, signaturePath || null);

  res.json({ id, name, type, issuedTo, date: issueDate, status: 'issued', serial, signedBy, signaturePath });
});

// 9. Live Staff GPS Telemetry Ping
app.post('/api/gps/ping', (req, res) => {
  const { staffId = 'EMP001', lat, lng, accuracy = '±6 m', site = 'At Site A' } = req.body;
  db.prepare('UPDATE staff SET lat = ?, lng = ?, accuracy = ?, site = ?, updated = ? WHERE id = ?').run(
    lat,
    lng,
    accuracy,
    site,
    'Just now',
    staffId
  );
  res.json({ ok: true, staffId, lat, lng });
});

app.listen(PORT, () => {
  console.log(`⚡ MK Electricals SQLite Backend API running on http://localhost:${PORT}`);
});
