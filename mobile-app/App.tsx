import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS } from './src/theme/colors';
import { useAppStore } from './src/store/useAppStore';
import {
  SplashScreenView,
  LoginScreenView,
  DashboardScreenView,
  DigitalIdCardScreenView,
  BoqSurveyScreenView,
  ToolCustodyScreenView,
  ReportsScreenView,
} from './src/screens/MainScreens';
import {
  AttendanceScreenView,
  LiveTrackingScreenView,
} from './src/screens/MapScreens';

export default function App() {
  const store = useAppStore();
  const { currentScreen, setCurrentScreen } = store;

  const backToHome = () =>
    setCurrentScreen(store.loginRole === 'owner' ? 'owner_dashboard' : 'emp_dashboard');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.maroonDark} />

      {/* Live Node.js + SQLite Sync Status Bar */}
      <View style={styles.syncBar}>
        <View style={styles.syncRow}>
          <View
            style={[
              styles.syncDot,
              {
                backgroundColor:
                  store.syncStatus === 'online'
                    ? '#22C55E'
                    : store.syncStatus === 'connecting'
                    ? '#F59E0B'
                    : '#FB7185',
              },
            ]}
          />
          <Text style={styles.syncLabel}>
            {store.syncStatus === 'online'
              ? 'SQLite API Connected (Live Sync)'
              : store.syncStatus === 'connecting'
              ? 'Connecting to Node/SQLite API...'
              : 'Offline Queue Mode (Local State)'}
          </Text>
        </View>
        <TouchableOpacity onPress={store.syncFromBackend} style={styles.syncBtn}>
          <Text style={styles.syncBtnText}>↻ Sync</Text>
        </TouchableOpacity>
      </View>

      {currentScreen === 'splash' && (
        <SplashScreenView onContinue={() => setCurrentScreen('login')} />
      )}

      {currentScreen === 'login' && (
        <LoginScreenView
          role={store.loginRole}
          empId={store.empIdInput}
          password={store.passwordInput}
          onChangeRole={(r) => {
            store.setLoginRole(r);
            store.setEmpIdInput(r === 'owner' ? 'OWN001' : 'EMP001');
          }}
          onChangeId={store.setEmpIdInput}
          onChangePassword={store.setPasswordInput}
          onLogin={() =>
            setCurrentScreen(
              store.loginRole === 'owner' ? 'owner_dashboard' : 'emp_dashboard'
            )
          }
        />
      )}

      {(currentScreen === 'emp_dashboard' || currentScreen === 'owner_dashboard') && (
        <DashboardScreenView
          role={currentScreen === 'owner_dashboard' ? 'owner' : 'employee'}
          onNavigate={setCurrentScreen}
        />
      )}

      {currentScreen === 'attendance' && (
        <AttendanceScreenView
          insideGeofence={store.insideGeofence}
          distanceMeters={store.distanceMeters}
          checkedIn={store.checkedIn}
          checkInTime={store.checkInTime}
          onCheckIn={() => store.recordAttendanceSync('CHECK_IN')}
          onCheckOut={() => store.recordAttendanceSync('CHECK_OUT')}
          onBack={backToHome}
        />
      )}

      {currentScreen === 'id_card' && <DigitalIdCardScreenView onBack={backToHome} />}

      {currentScreen === 'live_tracking' && (
        <LiveTrackingScreenView
          selectedStaffId={store.selectedStaffId}
          onSelectStaff={store.setSelectedStaffId}
          onBack={backToHome}
        />
      )}

      {currentScreen === 'boq' && (
        <BoqSurveyScreenView
          siteName={store.selectedSite}
          rooms={store.roomsBySite[store.selectedSite] || []}
          norms={store.boqNorms}
          onBack={backToHome}
          onAddRoom={(newRoom) => store.addBoqRoomSync(newRoom)}
        />
      )}

      {currentScreen === 'tools' && (
        <ToolCustodyScreenView
          tools={store.toolsList}
          tab={store.toolsTab}
          onChangeTab={store.setToolsTab}
          onSignAndToggleTool={(id, sigPath) => store.signAndToggleToolSync(id, sigPath)}
          onBack={backToHome}
        />
      )}

      {(currentScreen === 'reports' ||
        currentScreen === 'tasks' ||
        currentScreen === 'materials' ||
        currentScreen === 'sites' ||
        currentScreen === 'dispatch' ||
        currentScreen === 'staff' ||
        currentScreen === 'approvals') && <ReportsScreenView onBack={backToHome} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.maroonDark,
  },
  syncBar: {
    backgroundColor: '#1A0206',
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251,113,133,0.2)',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  syncLabel: {
    color: '#FFE4E8',
    fontSize: 11,
    fontWeight: '600',
  },
  syncBtn: {
    backgroundColor: 'rgba(184,20,44,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
