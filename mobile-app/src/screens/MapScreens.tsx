import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Circle, UrlTile } from 'react-native-maps';
import { COLORS } from '../theme/colors';
import { STAFF_MEMBERS } from '../store/useAppStore';

const ARCGIS_TILES =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';

// 4. GPS ATTENDANCE WITH GEOFENCE (PUNE SITE A: 18.5204, 73.8567)
export const AttendanceScreenView: React.FC<{
  insideGeofence: boolean;
  distanceMeters: number;
  checkedIn: boolean;
  checkInTime: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onBack: () => void;
}> = ({
  insideGeofence,
  distanceMeters,
  checkedIn,
  checkInTime,
  onCheckIn,
  onCheckOut,
  onBack,
}) => (
  <View style={styles.screenRoot}>
    <View style={styles.topNavHeader}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backArrow}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.topNavTitle}>Attendance</Text>
      <View style={{ width: 24 }} />
    </View>

    <View style={styles.whiteSheet}>
      <View style={styles.geofenceBanner}>
        <View style={styles.greenCheckCircle}>
          <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>✓</Text>
        </View>
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.bannerTitle}>
            {insideGeofence ? 'You are inside the site' : 'Outside site geofence'}
          </Text>
          <Text style={styles.bannerSub}>MK Tower - Site A</Text>
          <Text style={styles.bannerMeta}>
            Distance: {distanceMeters} m {checkedIn ? `• Checked In (${checkInTime})` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.mapBox}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: 18.5204,
            longitude: 73.8567,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          }}
        >
          <UrlTile urlTemplate={ARCGIS_TILES} maximumZ={19} />
          <Circle
            center={{ latitude: 18.5204, longitude: 73.8567 }}
            radius={100}
            strokeColor="rgba(34,160,76,0.9)"
            fillColor="rgba(34,160,76,0.25)"
          />
          <Marker
            coordinate={{ latitude: 18.5204, longitude: 73.8567 }}
            title="MK Tower - Site A"
            description="Rohit Sharma (EMP001)"
          />
        </MapView>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>GPS Accuracy</Text>
          <Text style={styles.metricVal}>± 6 m</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Geofence</Text>
          <Text style={styles.metricVal}>100 m</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.checkInBtn} onPress={onCheckIn}>
        <Text style={styles.checkInBtnText}>Check In</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkOutBtn} onPress={onCheckOut}>
        <Text style={styles.checkOutBtnText}>Check Out</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// 7. LIVE TEAM TRACKING SCREEN
export const LiveTrackingScreenView: React.FC<{
  selectedStaffId: string;
  onSelectStaff: (id: string) => void;
  onBack: () => void;
}> = ({ selectedStaffId, onSelectStaff, onBack }) => {
  const activeStaff =
    STAFF_MEMBERS.find((s) => s.id === selectedStaffId) || STAFF_MEMBERS[0];

  return (
    <View style={styles.screenRoot}>
      <View style={styles.topNavHeader}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topNavTitle}>Live Tracking</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.whiteSheet}>
        <View style={styles.trackingMapBox}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: 18.5204,
              longitude: 73.8567,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            <UrlTile urlTemplate={ARCGIS_TILES} maximumZ={19} />
            {STAFF_MEMBERS.map((m) => (
              <Marker
                key={m.id}
                coordinate={{ latitude: m.lat, longitude: m.lng }}
                title={m.name}
                description={`${m.site} • ${m.updated}`}
                onPress={() => onSelectStaff(m.id)}
              />
            ))}
          </MapView>

          <View style={styles.floatingStaffCard}>
            <Image
              source={require('../../assets/rohit_avatar.png')}
              style={styles.floatingAvatar}
            />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.bannerTitle}>{activeStaff.name}</Text>
              <Text style={styles.bannerSub}>
                {activeStaff.site} • {activeStaff.updated}
              </Text>
              <Text style={styles.bannerMeta}>Accuracy: {activeStaff.accuracy}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: COLORS.maroonHeader },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: '700' },
  topNavTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  whiteSheet: {
    flex: 1,
    backgroundColor: COLORS.sheetBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 16,
  },
  geofenceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenBannerBg,
    borderColor: COLORS.greenBannerBorder,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  greenCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.greenVerified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  bannerSub: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  bannerMeta: { fontSize: 11, color: COLORS.textMuted },
  mapBox: {
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 12,
  },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  metricLabel: { fontSize: 11, color: COLORS.textMuted },
  metricVal: { fontSize: 14, fontWeight: '800', color: COLORS.textDark, marginTop: 2 },
  checkInBtn: {
    backgroundColor: COLORS.greenVerified,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  checkInBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  checkOutBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  checkOutBtnText: { color: COLORS.textDark, fontSize: 13, fontWeight: '800' },
  trackingMapBox: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  floatingStaffCard: {
    position: 'absolute',
    bottom: 18,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  floatingAvatar: { width: 44, height: 44, borderRadius: 22 },
});
