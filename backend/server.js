const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'mk_electricals.db');
const SESSION_SECRET = process.env.SESSION_SECRET || (
  process.env.NODE_ENV === 'production' ? '' : crypto.randomBytes(32).toString('hex')
);
const OWNER_USER_ID = process.env.OWNER_USER_ID || 'mkelectricals';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;
if (!SESSION_SECRET) throw new Error('Set SESSION_SECRET before starting the production API.');
if (!OWNER_PASSWORD) throw new Error('Set OWNER_PASSWORD before starting the API.');

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Initialize SQLite database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function passwordMatches(password, storedValue) {
  if (typeof password !== 'string' || typeof storedValue !== 'string') return false;
  const [scheme, salt, storedHash] = storedValue.split(':');
  if (scheme === 'scrypt' && salt && storedHash) {
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(storedHash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  }
  const candidate = crypto.createHash('sha256').update(password).digest();
  const expected = crypto.createHash('sha256').update(storedValue).digest();
  return crypto.timingSafeEqual(candidate, expected);
}

function createAccessToken(user) {
  const payload = Buffer.from(JSON.stringify({
    sub: user.id,
    role: user.user_type,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }
  const [payload, signature] = token.split('.');
  if (!payload || !signature) {
    return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
  }
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest();
  let actual;
  try {
    actual = Buffer.from(signature, 'base64url');
  } catch {
    return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
  }
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!claims.sub || !claims.exp || claims.exp <= Date.now()) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    const user = db.prepare("SELECT id, user_type FROM staff WHERE id = ? AND status = 'Active'").get(claims.sub);
    if (!user || user.user_type !== claims.role) {
      return res.status(401).json({ error: 'Account unavailable. Please sign in again.' });
    }
    req.user = { id: user.id, role: user.user_type };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
  }
}

function requireOwner(req, res, next) {
  if (req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only the owner can manage employee accounts.' });
  }
  next();
}

const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schemaSql);

// Seed starter records for a new installation; existing operational data is never overwritten.
function seedDatabaseIfEmpty() {
  const staffCount = db.prepare('SELECT COUNT(*) AS cnt FROM staff').get().cnt;
  if (staffCount > 0 && !process.argv.includes('--reseed')) return;

  db.exec('DELETE FROM attendance_logs; DELETE FROM boq_rooms; DELETE FROM tools_custody; DELETE FROM staff; DELETE FROM sites; DELETE FROM boq_norms;');

  const insertSite = db.prepare('INSERT INTO sites (name, area, lat, lng, geofence_radius_m, progress) VALUES (?, ?, ?, ?, ?, ?)');
  insertSite.run('MK Tower - Site A', 'Shivajinagar, Pune', 18.5204, 73.8567, 100, 78);
  insertSite.run('Phoenix Residency - Site B', 'Kothrud, Pune', 18.5074, 73.8077, 120, 54);
  insertSite.run('Orion Tech Park - Site C', 'Hinjawadi, Pune', 18.5913, 73.7389, 150, 91);

  db.prepare(`
    INSERT INTO staff (id, name, role, user_type, password_hash, site, updated, accuracy, lat, lng, dept, joining_date, status)
    VALUES (?, 'MK Electricals Owner', 'Owner', 'owner', ?, 'HQ / All Sites', '', '', 18.5204, 73.8567, 'Management', ?, 'Active')
  `).run(OWNER_USER_ID, hashPassword(OWNER_PASSWORD), new Date().toISOString().slice(0, 10));

  db.prepare('INSERT INTO boq_norms (id, coil15, coil25, coil40, mcb_ratio) VALUES (1, 0.15, 0.25, 0.35, 0.20)').run();

  console.log('SQLite database initialized with sites and an owner account.');
}

seedDatabaseIfEmpty();

function ensureOwnerAccount() {
  const transaction = db.transaction(() => {
    let owner = db.prepare("SELECT * FROM staff WHERE id = ? AND user_type = 'owner'").get(OWNER_USER_ID);
    if (!owner) {
      owner = db.prepare("SELECT * FROM staff WHERE id = 'OWN001' AND user_type = 'owner'").get();
      if (owner && owner.id !== OWNER_USER_ID) {
        const conflictingAccount = db.prepare('SELECT id FROM staff WHERE id = ?').get(OWNER_USER_ID);
        if (conflictingAccount) throw new Error(`Cannot migrate owner account: ${OWNER_USER_ID} is already in use.`);
        db.prepare(`
          INSERT INTO staff (id, name, role, user_type, password_hash, site, updated, accuracy, lat, lng, dept, joining_date, status)
          VALUES (?, ?, ?, 'owner', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          OWNER_USER_ID,
          owner.name,
          owner.role,
          hashPassword(OWNER_PASSWORD),
          owner.site,
          owner.updated,
          owner.accuracy,
          owner.lat,
          owner.lng,
          owner.dept,
          owner.joining_date,
          owner.status
        );
        db.prepare('UPDATE attendance_logs SET staff_id = ? WHERE staff_id = ?').run(OWNER_USER_ID, owner.id);
        db.prepare('DELETE FROM staff WHERE id = ?').run(owner.id);
      }
    }
    const ownerRecord = db.prepare("SELECT id FROM staff WHERE id = ? AND user_type = 'owner'").get(OWNER_USER_ID);
    if (ownerRecord) {
      db.prepare('UPDATE staff SET password_hash = ?, status = ? WHERE id = ?')
        .run(hashPassword(OWNER_PASSWORD), 'Active', OWNER_USER_ID);
    } else {
      const mainSite = db.prepare('SELECT lat, lng FROM sites ORDER BY name LIMIT 1').get();
      db.prepare(`
        INSERT INTO staff (id, name, role, user_type, password_hash, site, updated, accuracy, lat, lng, dept, joining_date, status)
        VALUES (?, ?, 'Owner', 'owner', ?, 'HQ / All Sites', '', '', ?, ?, 'Management', ?, 'Active')
      `).run(
        OWNER_USER_ID,
        'MK Electricals Owner',
        hashPassword(OWNER_PASSWORD),
        mainSite?.lat || 0,
        mainSite?.lng || 0,
        new Date().toISOString().slice(0, 10)
      );
    }
  });
  transaction();
}

ensureOwnerAccount();

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
  const { empId, password } = req.body || {};
  if (typeof empId !== 'string' || !empId.trim() || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Enter your staff ID and password.' });
  }
  const user = db.prepare('SELECT * FROM staff WHERE id = ?').get(empId.trim());
  if (!user || user.status !== 'Active' || !passwordMatches(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect staff ID or password.' });
  }
  return res.json({
    authenticated: true,
    token: createAccessToken(user),
    id: user.id,
    name: user.name,
    role: user.role,
    userType: user.user_type,
    dept: user.dept,
    joiningDate: user.joining_date,
    status: user.status,
  });
});

app.use('/api', requireAuth);

// 3. Full Synced State Snapshot
app.get('/api/state', (req, res) => {
  const staff = db.prepare("SELECT * FROM staff WHERE user_type = 'employee'").all();
  const sites = db.prepare('SELECT * FROM sites').all();
  const rawRooms = db.prepare('SELECT * FROM boq_rooms').all();
  const normsRow = db.prepare('SELECT * FROM boq_norms WHERE id = 1').get();
  const tools = db.prepare('SELECT * FROM tools_custody ORDER BY rowid DESC').all();
  const requestedStaffId = typeof req.query.staffId === 'string' ? req.query.staffId : '';
  const staffId = req.user.role === 'employee'
    ? req.user.id
    : requestedStaffId || staff[0]?.id;
  const latestAttendance = staffId
    ? db
        .prepare('SELECT * FROM attendance_logs WHERE staff_id = ? ORDER BY id DESC LIMIT 1')
        .get(staffId)
    : undefined;

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

app.post('/api/staff', requireOwner, (req, res) => {
  const { id, name, password, role, dept, siteName } = req.body || {};
  if (
    typeof id !== 'string' ||
    !/^[A-Za-z0-9_-]{3,30}$/.test(id.trim()) ||
    typeof name !== 'string' ||
    !name.trim() ||
    typeof password !== 'string' ||
    password.length < 8 ||
    typeof role !== 'string' ||
    !role.trim() ||
    typeof dept !== 'string' ||
    !dept.trim() ||
    typeof siteName !== 'string'
  ) {
    return res.status(400).json({ error: 'Enter an ID, name, role, department, site, and a password of at least 8 characters.' });
  }
  const site = db.prepare('SELECT * FROM sites WHERE name = ?').get(siteName);
  if (!site) return res.status(400).json({ error: 'Select a valid site.' });
  if (db.prepare('SELECT 1 FROM staff WHERE id = ?').get(id.trim())) {
    return res.status(409).json({ error: 'That employee ID is already in use.' });
  }

  const joiningDate = new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO staff (id, name, role, user_type, password_hash, site, updated, accuracy, lat, lng, dept, joining_date, status)
    VALUES (?, ?, ?, 'employee', ?, ?, 'Never', '—', ?, ?, ?, ?, 'Active')
  `).run(
    id.trim(),
    name.trim(),
    role.trim(),
    hashPassword(password),
    siteName,
    site.lat,
    site.lng,
    dept.trim(),
    joiningDate
  );
  const created = db.prepare(`
    SELECT id, name, role, site, updated, accuracy, lat, lng, dept, joining_date AS joiningDate, status
    FROM staff WHERE id = ?
  `).get(id.trim());
  res.status(201).json(created);
});

// 4. Attendance Check-In / Check-Out with Geofence Verification
app.post('/api/attendance', (req, res) => {
  const { staffId, siteName, actionType, lat, lng } = req.body || {};
  if (req.user.role === 'employee' && req.user.id !== staffId) {
    return res.status(403).json({ error: 'You can only record your own attendance.' });
  }
  if (
    typeof staffId !== 'string' ||
    typeof siteName !== 'string' ||
    !['CHECK_IN', 'CHECK_OUT'].includes(actionType) ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return res.status(400).json({ error: 'Valid staff, site, action, and GPS coordinates are required.' });
  }
  const staffMember = db.prepare("SELECT id FROM staff WHERE id = ? AND user_type = 'employee' AND status = 'Active'").get(staffId);
  if (!staffMember) return res.status(404).json({ error: 'Active employee not found.' });
  const site = db.prepare('SELECT * FROM sites WHERE name = ?').get(siteName);
  if (!site) return res.status(404).json({ error: 'Site not found.' });
  const dist = computeDistanceMeters(lat, lng, site.lat, site.lng);
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
  const { id, siteName, name, light = 0, fan = 0, plug6A = 0, power16A = 0, ac = 0 } = req.body || {};
  const counts = [light, fan, plug6A, power16A, ac];
  if (
    typeof siteName !== 'string' ||
    !db.prepare('SELECT 1 FROM sites WHERE name = ?').get(siteName) ||
    typeof name !== 'string' ||
    !name.trim() ||
    counts.some((count) => !Number.isInteger(count) || count < 0)
  ) {
    return res.status(400).json({ error: 'Enter a room name and valid non-negative point counts for an existing site.' });
  }
  const roomId = id || 'rm_' + Date.now();
  db.prepare(`
    INSERT OR REPLACE INTO boq_rooms (id, site_name, name, light, fan, plug6A, power16A, ac)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(roomId, siteName, name, light, fan, plug6A, power16A, ac);

  res.json({ id: roomId, siteName, name, light, fan, plug6A, power16A, ac });
});

// 6. Update BOQ Wire/MCB Calculator Multiplier Norms
app.put('/api/boq/norms', requireOwner, (req, res) => {
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
  const { signaturePath } = req.body || {};
  if (typeof signaturePath !== 'string' || !signaturePath.trim()) {
    return res.status(400).json({ error: 'A signature is required to change tool custody.' });
  }
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
app.post('/api/tools/issue', requireOwner, (req, res) => {
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
  const { staffId, lat, lng, accuracy, site } = req.body || {};
  if (
    typeof staffId !== 'string' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return res.status(400).json({ error: 'Valid staff ID and GPS coordinates are required.' });
  }
  const staffMember = db.prepare("SELECT id FROM staff WHERE id = ? AND user_type = 'employee'").get(staffId);
  if (!staffMember) return res.status(404).json({ error: 'Employee not found.' });
  db.prepare('UPDATE staff SET lat = ?, lng = ?, accuracy = ?, site = ?, updated = ? WHERE id = ?').run(
    lat,
    lng,
    accuracy,
    site,
    new Date().toISOString(),
    staffId
  );
  res.json({ ok: true, staffId, lat, lng });
});

app.listen(PORT, () => {
  console.log(`⚡ MK Electricals SQLite Backend API running on http://localhost:${PORT}`);
});
