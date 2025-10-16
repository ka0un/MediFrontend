import React, { useState, useEffect, useCallback } from 'react';
import { DashboardIcon, PatientsIcon, AppointmentsIcon, RecordsIcon, ReportsIcon, HealthCardIcon, LogoutIcon, QrCodeIcon, StethoscopeIcon } from './components/Icons';
import AdminDashboard from './components/AdminDashboard';
import AdminPatients from './components/AdminPatients';
import AdminAppointments from './components/AdminAppointments';
import PatientDashboard from './components/PatientDashboard';
import PatientAccount from './components/PatientAccount';
import AppointmentManagement from './components/AppointmentManagement';
import ReportsDashboard from './components/ReportsDashboard';
import MedicalRecords from './components/MedicalRecords';
import Auth from './components/Auth';
import type { Notification, AuthUser } from './types';
import { Role } from './types';
import * as api from './services/api';
import MyAppointments from './components/MyAppointments';
import ScanQRCode from './components/ScanQRCode';
import ProviderManagement from './components/ProviderManagement';


const useAuth = () => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('auth');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse auth data from localStorage", error);
            localStorage.removeItem('auth');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (credentials: {username: string, password: string}) => {
        const userData = await api.login(credentials);
        localStorage.setItem('auth', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const register = useCallback(async (data: any) => {
        const userData = await api.register(data);
        localStorage.setItem('auth', JSON.stringify(userData));
        setUser(userData);
        return userData;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch (error) {
            console.error("Logout API call failed, proceeding with client-side logout.", error);
        } finally {
            localStorage.removeItem('auth');
            setUser(null);
        }
    }, []);

    return { user, login, register, logout, loading };
};


const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'provider-management', label: 'Providers', icon: StethoscopeIcon },
    { id: 'patients', label: 'All Patients', icon: PatientsIcon },
    { id: 'appointments', label: 'All Appointments', icon: AppointmentsIcon },
    { id: 'scan-qr', label: 'Scan Visit Card', icon: QrCodeIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
];

const patientNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'book-appointment', label: 'Book Appointment', icon: AppointmentsIcon },
    { id: 'my-appointments', label: 'My Appointments', icon: RecordsIcon },
    { id: 'my-records', label: 'Medical Records', icon: HealthCardIcon },
    { id: 'my-account', label: 'My Account', icon: PatientsIcon },
];

type AdminView = 'dashboard' | 'patients' | 'appointments' | 'reports' | 'scan-qr' | 'provider-management';
type PatientView = 'dashboard' | 'book-appointment' | 'my-records' | 'my-account' | 'my-appointments';


const Sidebar = ({ navItems, activeView, setActiveView, onLogout }: { navItems: typeof adminNavItems | typeof patientNavItems, activeView: string, setActiveView: (view: any) => void, onLogout: () => void }) => {
    return (
        <aside className="w-64 bg-white text-slate-800 flex flex-col shadow-lg flex-shrink-0">
            <div className="flex items-center justify-center h-20 border-b-2 border-slate-100">
                <HealthCardIcon className="h-8 w-8 text-primary"/>
                <h1 className="text-2xl font-bold ml-2">MediSystem</h1>
            </div>
            <nav className="flex-grow px-4 py-4">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActiveView(item.id); }}
                        className={`flex items-center px-4 py-3 my-2 rounded-lg transition-colors duration-200 ${
                            activeView === item.id ? 'bg-primary text-white shadow-md' : 'hover:bg-primary-50 hover:text-primary-600'
                        }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="ml-4 font-medium">{item.label}</span>
                    </a>
                ))}
            </nav>
            <div className="px-4 py-4 border-t-2 border-slate-100">
                <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); onLogout(); }}
                    className="flex items-center px-4 py-3 my-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600"
                >
                    <LogoutIcon className="h-5 w-5" />
                    <span className="ml-4 font-medium">Logout</span>
                </a>
            </div>
        </aside>
    );
};

const Header = ({ title }: { title: string }) => {
    return (
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8 flex-shrink-0">
            <h2 className="text-2xl font-semibold text-slate-700 capitalize">{title}</h2>
        </header>
    );
};

const NotificationArea = ({ notifications, removeNotification }: { notifications: Notification[], removeNotification: (id: number) => void }) => {
    return (
        <div className="fixed top-5 right-5 z-50 w-full max-w-sm">
            {notifications.map(n => (
                <div key={n.id} className={`relative rounded-md shadow-lg p-4 mb-2 ${n.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                    <button onClick={() => removeNotification(n.id)} className="absolute top-1 right-2 text-white font-bold">&times;</button>
                    {n.message}
                </div>
            ))}
        </div>
    );
};

const AdminApp = ({ user, onLogout, addNotification }: { user: AuthUser, onLogout: () => void, addNotification: (type: 'success' | 'error', message: string) => void }) => {
    const [activeView, setActiveView] = useState<AdminView>('dashboard');
    const title = adminNavItems.find(item => item.id === activeView)?.label || 'Dashboard';

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <AdminDashboard setActiveView={setActiveView} addNotification={addNotification} />;
            case 'provider-management': return <ProviderManagement addNotification={addNotification} />;
            case 'patients': return <AdminPatients addNotification={addNotification} />;
            case 'appointments': return <AdminAppointments addNotification={addNotification} />;
            case 'scan-qr': return <ScanQRCode addNotification={addNotification} />;
            case 'reports': return <ReportsDashboard addNotification={addNotification} />;
            default: return <div>Select a view</div>;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar navItems={adminNavItems} activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={title} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

const PatientApp = ({ user, onLogout, addNotification }: { user: AuthUser, onLogout: () => void, addNotification: (type: 'success' | 'error', message: string) => void }) => {
    const [activeView, setActiveView] = useState<PatientView>('dashboard');
    const title = patientNavItems.find(item => item.id === activeView)?.label || 'Dashboard';
    
    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <PatientDashboard user={user} setActiveView={setActiveView} />;
            case 'book-appointment': return <AppointmentManagement user={user} addNotification={addNotification} />;
            case 'my-appointments': return <MyAppointments user={user} addNotification={addNotification} />;
            case 'my-records': return <MedicalRecords user={user} addNotification={addNotification} />;
            case 'my-account': return <PatientAccount user={user} addNotification={addNotification} />;
            default: return <div>Select a view</div>;
        }
    };

     return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar navItems={patientNavItems} activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title={title} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default function App() {
    const { user, login, register, logout, loading } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), 5000);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <>
            <NotificationArea notifications={notifications} removeNotification={removeNotification} />
            {!user ? (
                <Auth onLogin={login} onRegister={register} addNotification={addNotification} />
            ) : user.role === Role.ADMIN ? (
                <AdminApp user={user} onLogout={logout} addNotification={addNotification} />
            ) : (
                <PatientApp user={user} onLogout={logout} addNotification={addNotification} />
            )}
        </>
    );
}