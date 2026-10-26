import React, { useState } from 'react';
import { IVProvider, useIV } from './context/IVContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardGrid from './views/DashboardGrid';
import DeviceDetailsView from './views/DeviceDetailsView';
import PatientsView from './views/PatientsView';
import VitalsAnalyticsView from './views/VitalsAnalyticsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';
import LoginView from './views/LoginView';
import AdminPanelView from './views/AdminPanelView';
import NotificationBellModal from './components/NotificationBellModal';
import AddDeviceModal from './components/AddDeviceModal';
import EditDeviceModal from './components/EditDeviceModal';
import AssignPatientModal from './components/AssignPatientModal';
import DemoSimulationBanner from './components/DemoSimulationBanner';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

function MainApp() {
  const { 
    currentView, 
    selectedDeviceId, 
    setSelectedDeviceId,
    isNotificationOpen, 
    setIsNotificationOpen,
    isAddDeviceOpen, 
    setIsAddDeviceOpen,
    editingDevice, 
    setEditingDevice,
    assigningDevice, 
    setAssigningDevice,
    toasts,
    currentUser 
  } = useIV();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isLoggedIn = Boolean(currentUser && localStorage.getItem('iv_logged_in') === 'true');

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={() => {}} />;
  }

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onCloseMobile={() => setMobileSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="main-content">
        {/* Doctor Demo Simulation Mode Banner */}
        <DemoSimulationBanner />

        {/* Top Navbar */}
        <Navbar onOpenMobile={() => setMobileSidebarOpen(true)} />

        {/* Notification Bell Dropdown Modal */}
        {isNotificationOpen && (
          <NotificationBellModal onClose={() => setIsNotificationOpen(false)} />
        )}

        {/* Main Page Body */}
        <main className="page-body">
          {selectedDeviceId ? (
            <DeviceDetailsView 
              deviceId={selectedDeviceId} 
              onBack={() => setSelectedDeviceId(null)} 
            />
          ) : (
            <>
              {currentView === 'dashboard' && <DashboardGrid />}
              {currentView === 'patients' && <PatientsView />}
              {currentView === 'vitals' && <VitalsAnalyticsView />}
              {currentView === 'assigns' && <PatientsView />}
              {currentView === 'reports' && <ReportsView />}
              {currentView === 'settings' && <SettingsView />}
              {currentView === 'admin' && <AdminPanelView />}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {isAddDeviceOpen && (
        <AddDeviceModal onClose={() => setIsAddDeviceOpen(false)} />
      )}

      {editingDevice && (
        <EditDeviceModal 
          device={editingDevice} 
          onClose={() => setEditingDevice(null)} 
        />
      )}

      {assigningDevice && (
        <AssignPatientModal 
          device={assigningDevice} 
          onClose={() => setAssigningDevice(null)} 
        />
      )}

      {/* Realtime Toast Container */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            {toast.type === 'critical' ? (
              <AlertTriangle size={18} className="text-danger flex-shrink-0" />
            ) : toast.type === 'success' ? (
              <CheckCircle size={18} className="text-success flex-shrink-0" />
            ) : (
              <Info size={18} className="text-primary flex-shrink-0" />
            )}
            <div className="toast-content">
              <div className="toast-title" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                {toast.title}
              </div>
              <div className="toast-msg" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {toast.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <IVProvider>
      <MainApp />
    </IVProvider>
  );
}
