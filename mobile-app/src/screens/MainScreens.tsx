import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Svg, { Rect, Path, Circle, Line } from 'react-native-svg';
import { COLORS } from '../theme/colors';
import { MKLogo } from '../components/MKLogo';
import { SignaturePadModal } from '../components/SignaturePadModal';
import {
  ScreenId,
  RoomBOQ,
  ToolItem,
  STAFF_MEMBERS,
  getRoomTotalPoints,
} from '../store/useAppStore';

// 1. SPLASH SCREEN
export const SplashScreenView: React.FC<{ onContinue: () => void }> = ({ onContinue }) => (
  <TouchableOpacity style={styles.splashContainer} activeOpacity={0.9} onPress={onContinue}>
    <View style={{ height: 24 }} />
    <MKLogo size="lg" />
    <View style={styles.splashBottom}>
      <Svg width={300} height={90} viewBox="0 0 320 100" fill="none" stroke="#F43F5E" strokeWidth={1}>
        <Line x1="0" y1="95" x2="320" y2="95" strokeOpacity={0.6} />
        <Rect x="28" y="52" width="26" height="43" />
        <Rect x="62" y="34" width="32" height="61" />
        <Rect x="102" y="60" width="22" height="35" />
        <Rect x="135" y="45" width="28" height="50" />
        <Rect x="175" y="22" width="36" height="73" />
        <Rect x="220" y="48" width="28" height="47" />
      </Svg>
      <Text style={styles.splashSub}>Site Operations App</Text>
      <ActivityIndicator size="small" color={COLORS.boltRed} style={{ marginTop: 12 }} />
    </View>
  </TouchableOpacity>
);

// 2. LOGIN SCREEN
export const LoginScreenView: React.FC<{
  role: 'employee' | 'owner';
  empId: string;
  password: string;
  onChangeRole: (r: 'employee' | 'owner') => void;
  onChangeId: (v: string) => void;
  onChangePassword: (v: string) => void;
  onLogin: () => void;
}> = ({ role, empId, password, onChangeRole, onChangeId, onChangePassword, onLogin }) => {
  const [showPass, setShowPass] = useState(false);
  return (
    <View style={styles.loginContainer}>
      <View style={{ marginTop: 20 }}>
        <MKLogo size="md" />
      </View>
      <View style={styles.loginForm}>
        <Text style={styles.signInTitle}>Sign In</Text>
        <View style={styles.roleToggleWrap}>
          <TouchableOpacity
            style={[styles.rolePill, role === 'employee' && styles.rolePillActive]}
            onPress={() => onChangeRole('employee')}
          >
            <Text style={styles.rolePillText}>Employee</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rolePill, role === 'owner' && styles.rolePillActive]}
            onPress={() => onChangeRole('owner')}
          >
            <Text style={styles.rolePillText}>Owner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputBox}>
          <TextInput
            value={empId}
            onChangeText={onChangeId}
            placeholder={role === 'employee' ? 'Employee ID' : 'Owner ID'}
            placeholderTextColor="#FDA4AF"
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputBox}>
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry={!showPass}
            placeholder="Password"
            placeholderTextColor="#FDA4AF"
            style={[styles.textInput, { flex: 1 }]}
          />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Text style={{ color: '#FFE4E8', fontSize: 12, fontWeight: '700' }}>
              {showPass ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.primaryMaroonBtn} onPress={onLogin}>
          <Text style={styles.primaryMaroonBtnText}>Login</Text>
        </TouchableOpacity>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </View>
      <Text style={styles.versionFooter}>MK Electricals Operations v2.0</Text>
    </View>
  );
};

// 3 & 6. EMPLOYEE AND OWNER DASHBOARDS
export const DashboardScreenView: React.FC<{
  role: 'employee' | 'owner';
  onNavigate: (s: ScreenId) => void;
}> = ({ role, onNavigate }) => {
  const isOwner = role === 'owner';
  const cards: { id: ScreenId; label: string; badge?: string }[] = isOwner
    ? [
        { id: 'live_tracking', label: 'Live Tracking', badge: '5 Live' },
        { id: 'sites', label: 'Sites', badge: '3 Active' },
        { id: 'dispatch', label: 'Dispatch' },
        { id: 'staff', label: 'Staff' },
        { id: 'boq', label: 'BOQ / Survey', badge: '61 Pts' },
        { id: 'tools', label: 'Tool Custody', badge: '12 Issued' },
        { id: 'reports', label: 'Reports' },
        { id: 'approvals', label: 'Approvals', badge: '2 Pending' },
      ]
    : [
        { id: 'attendance', label: 'Attendance', badge: '18m In' },
        { id: 'tasks', label: 'My Tasks' },
        { id: 'materials', label: 'Materials' },
        { id: 'boq', label: 'BOQ / Survey', badge: '61 Pts' },
        { id: 'tools', label: 'Tool Custody', badge: '12 Issued' },
        { id: 'id_card', label: 'My ID Card', badge: 'QR Verified' },
      ];

  return (
    <View style={styles.screenRoot}>
      <View style={styles.dashboardHeader}>
        <View style={styles.rowCenter}>
          <Image
            source={
              isOwner
                ? require('../../assets/manish_avatar.png')
                : require('../../assets/rohit_avatar.png')
            }
            style={styles.avatarImg}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.greetingSub}>Good Morning,</Text>
            <Text style={styles.greetingName}>
              {isOwner ? 'Mr. Manish Kumar 👋' : 'Rohit Sharma 👋'}
            </Text>
            <Text style={styles.greetingRole}>
              {isOwner ? 'Owner' : 'Electrician • EMP001'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.whiteSheet} contentContainerStyle={styles.gridWrap}>
        {cards.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={styles.gridCard}
            onPress={() => onNavigate(c.id)}
          >
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeSymbol}>⚡</Text>
            </View>
            <Text style={styles.gridCardTitle}>{c.label}</Text>
            {c.badge ? <Text style={styles.gridCardSub}>{c.badge}</Text> : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// 5. DIGITAL STAFF ID CARD (QR VERIFIED)
export const DigitalIdCardScreenView: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <View style={styles.screenRoot}>
    <View style={styles.topNavHeader}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.topNavTitle}>My ID Card</Text>
      <View style={{ width: 24 }} />
    </View>
    <View style={styles.idCardOuter}>
      <View style={styles.idCardPaper}>
        <MKLogo size="sm" darkText />
        <Image
          source={require('../../assets/rohit_avatar.png')}
          style={styles.idAvatar}
        />
        <Text style={styles.idName}>Rohit Sharma</Text>
        <Text style={styles.idCode}>EMP001</Text>
        <Text style={styles.idRole}>Electrician</Text>

        <View style={styles.qrWrapper}>
          <Svg width={104} height={104} viewBox="0 0 100 100" fill="#111827">
            <Path d="M8 8h26v26H8V8zm4 4v18h18V12H12zm4 4h10v10H16V16z" />
            <Path d="M66 8h26v26H66V8zm4 4v18h18V12H70zm4 4h10v10H74V16z" />
            <Path d="M8 66h26v26H8V66zm4 4v18h18V70H12zm4 4h10v10H16V74z" />
            <Rect x="44" y="44" width="12" height="12" />
            <Rect x="40" y="20" width="12" height="6" />
            <Rect x="62" y="40" width="6" height="12" />
            <Rect x="20" y="52" width="18" height="6" />
            <Rect x="52" y="64" width="18" height="6" />
          </Svg>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified</Text>
        </View>

        <View style={styles.idMetaTable}>
          <View style={styles.idMetaRow}>
            <Text style={styles.idMetaLabel}>Joining Date</Text>
            <Text style={styles.idMetaVal}>12 Jan 2025</Text>
          </View>
          <View style={styles.idMetaRow}>
            <Text style={styles.idMetaLabel}>Department</Text>
            <Text style={styles.idMetaVal}>Site Execution</Text>
          </View>
          <View style={styles.idMetaRow}>
            <Text style={styles.idMetaLabel}>Status</Text>
            <Text style={styles.idMetaVal}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

// 8. ROOM-BY-ROOM BOQ SURVEY + AUTO WIRE/MCB CALCULATOR
export const BoqSurveyScreenView: React.FC<{
  siteName: string;
  rooms: RoomBOQ[];
  norms: { coil15: number; coil25: number; coil40: number; mcbRatio: number };
  onBack: () => void;
  onAddRoom: (room: RoomBOQ) => void;
}> = ({ siteName, rooms, norms, onBack, onAddRoom }) => {
  let lightFan = 0,
    plug6 = 0,
    pwrAc = 0,
    totalPts = 0;
  rooms.forEach((r) => {
    lightFan += (r.light || 0) + (r.fan || 0);
    plug6 += r.plug6A || 0;
    pwrAc += (r.power16A || 0) + (r.ac || 0);
    totalPts += getRoomTotalPoints(r);
  });
  const c15 = Math.ceil(lightFan * norms.coil15);
  const c25 = Math.ceil(plug6 * norms.coil25);
  const c40 = Math.ceil(pwrAc * norms.coil40);
  const mcbs = Math.ceil(totalPts * norms.mcbRatio);

  return (
    <View style={styles.screenRoot}>
      <View style={styles.topNavHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>BOQ / Survey</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.whiteSheet}>
        <View style={styles.siteSelectorBox}>
          <Text style={styles.siteSelectorText}>{siteName}</Text>
          <Text style={styles.siteSelectorArrow}>▾</Text>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {rooms.map((rm) => (
            <View key={rm.id} style={styles.listRowCard}>
              <Text style={styles.listRowTitle}>{rm.name}</Text>
              <Text style={styles.listRowRight}>{getRoomTotalPoints(rm)} points ›</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.boqSummaryCard}>
          <Text style={styles.boqSummaryHeading}>
            ⚡ Auto Wire & MCB Estimate ({totalPts} pts)
          </Text>
          <View style={styles.boqSummaryRow}>
            <Text style={styles.boqPill}>1.5mm²: {c15} Coils</Text>
            <Text style={styles.boqPill}>2.5mm²: {c25} Coils</Text>
            <Text style={styles.boqPill}>4.0mm²: {c40} Coils</Text>
            <Text style={styles.boqPill}>MCBs: {mcbs} Nos</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryMaroonBtn}
          onPress={() =>
            onAddRoom({
              id: 'rm_' + Date.now(),
              name: `Room ${rooms.length + 1}`,
              light: 4,
              fan: 1,
              plug6A: 3,
              power16A: 1,
              ac: 1,
            })
          }
        >
          <Text style={styles.primaryMaroonBtnText}>+ Add Room / Survey</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 9. TOOL CUSTODY WITH NATIVE SIGNATURE PAD
export const ToolCustodyScreenView: React.FC<{
  tools: ToolItem[];
  tab: 'issued' | 'returned';
  onChangeTab: (t: 'issued' | 'returned') => void;
  onSignAndToggleTool: (id: string, sigPath: string) => void;
  onBack: () => void;
}> = ({ tools, tab, onChangeTab, onSignAndToggleTool, onBack }) => {
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const issuedCount = tools.filter((t) => t.status === 'issued').length;
  const visible = tools.filter((t) => t.status === tab);

  return (
    <View style={styles.screenRoot}>
      <View style={styles.topNavHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Tool Custody</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.whiteSheet}>
        <View style={styles.segmentedBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'issued' && styles.segmentBtnActive]}
            onPress={() => onChangeTab('issued')}
          >
            <Text
              style={[
                styles.segmentText,
                tab === 'issued' && styles.segmentTextActive,
              ]}
            >
              Issued ({issuedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'returned' && styles.segmentBtnActive]}
            onPress={() => onChangeTab('returned')}
          >
            <Text
              style={[
                styles.segmentText,
                tab === 'returned' && styles.segmentTextActive,
              ]}
            >
              Returned
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }}>
          {visible.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listRowCard}
              onPress={() => setSelectedTool(item)}
            >
              <View>
                <Text style={styles.listRowTitle}>
                  {item.name} {item.signedBy ? '✍️ Signed' : ''}
                </Text>
                <Text style={styles.listRowSub}>Issued to: {item.issuedTo}</Text>
                <Text style={styles.listRowDate}>{item.date}</Text>
              </View>
              <Text style={styles.listRowRight}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedTool ? (
          <SignaturePadModal
            visible={!!selectedTool}
            title={`${selectedTool.name} (${selectedTool.serial})`}
            subtitle={`Custodian: ${selectedTool.issuedTo} • Issued: ${selectedTool.date}`}
            initialSvgPath={selectedTool.signaturePath}
            primaryActionLabel={
              selectedTool.status === 'issued'
                ? 'Sign & Mark Returned'
                : 'Sign & Re-Issue Tool'
            }
            onClose={() => setSelectedTool(null)}
            onConfirm={(sigPath) => {
              onSignAndToggleTool(selectedTool.id, sigPath);
              setSelectedTool(null);
            }}
          />
        ) : null}
      </View>
    </View>
  );
};

// 10. REPORTS SCREEN
export const ReportsScreenView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const reports = [
    'Attendance Report',
    'Task Summary',
    'Material Issue & Return',
    'BOQ / Survey Report',
    'Tool Custody Report',
    'Team Movement (GPS)',
  ];
  return (
    <View style={styles.screenRoot}>
      <View style={styles.topNavHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.whiteSheet}>
        {reports.map((rep) => (
          <View key={rep} style={styles.listRowCard}>
            <Text style={styles.listRowTitle}>{rep}</Text>
            <Text style={styles.listRowRight}>›</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: COLORS.maroonHeader },
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.maroonDark,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 42,
  },
  splashBottom: { alignItems: 'center' },
  splashSub: { color: '#FFE4E8', fontSize: 13, fontWeight: '600', marginTop: 8 },
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.maroonDark,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 28,
  },
  loginForm: { gap: 14 },
  signInTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  roleToggleWrap: {
    flexDirection: 'row',
    backgroundColor: '#1A0307',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(251,113,133,0.3)',
  },
  rolePill: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  rolePillActive: { backgroundColor: COLORS.crimsonPrimary },
  rolePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.maroonInput,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(253,164,175,0.3)',
  },
  textInput: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', width: '100%' },
  primaryMaroonBtn: {
    backgroundColor: COLORS.crimsonPrimary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryMaroonBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  forgotText: { color: '#FFE4E8', fontSize: 12, textAlign: 'center', marginTop: 6 },
  versionFooter: { color: 'rgba(255,228,232,0.5)', fontSize: 11, textAlign: 'center' },
  dashboardHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FDA4AF',
  },
  greetingSub: { color: '#FFE4E8', fontSize: 11 },
  greetingName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  greetingRole: { color: '#FECDD3', fontSize: 11 },
  whiteSheet: {
    flex: 1,
    backgroundColor: COLORS.sheetBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.roseSoftBg,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconBadgeSymbol: { fontSize: 18, color: COLORS.crimsonPrimary },
  gridCardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  gridCardSub: { fontSize: 10, fontWeight: '700', color: COLORS.crimsonPrimary, marginTop: 3 },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  topNavTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  idCardOuter: { flex: 1, padding: 16 },
  idCardPaper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  idAvatar: { width: 68, height: 68, borderRadius: 34, marginTop: 6 },
  idName: { fontSize: 17, fontWeight: '800', color: COLORS.textDark },
  idCode: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  idRole: { fontSize: 11, color: COLORS.textMuted },
  qrWrapper: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verifiedBadge: {
    backgroundColor: COLORS.greenVerified,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 999,
  },
  verifiedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  idMetaTable: { width: '100%', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, gap: 6 },
  idMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  idMetaLabel: { fontSize: 12, color: COLORS.textMuted },
  idMetaVal: { fontSize: 12, fontWeight: '800', color: COLORS.textDark },
  siteSelectorBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  siteSelectorText: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  siteSelectorArrow: { fontSize: 13, color: COLORS.textSecondary },
  listRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  listRowTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  listRowSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  listRowDate: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  listRowRight: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  boqSummaryCard: {
    backgroundColor: COLORS.roseSoftBg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.roseBorder,
    marginVertical: 8,
  },
  boqSummaryHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.crimsonPrimary,
    marginBottom: 6,
  },
  boqSummaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  boqPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 999,
    padding: 4,
    marginBottom: 12,
  },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.crimsonPrimary },
  segmentText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  segmentTextActive: { color: '#FFFFFF' },
});
