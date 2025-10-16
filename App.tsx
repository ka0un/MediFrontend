
import React, { useState } from 'react';
import { DashboardIcon, PatientsIcon, AppointmentsIcon, RecordsIcon, ReportsIcon, HealthCardIcon } from './components/Icons';
import PatientManagement from './components/PatientManagement';
import AppointmentManagement from './components/AppointmentManagement';
import ReportsDashboard from './components/ReportsDashboard';
import MedicalRecords from './components/MedicalRecords';
import type { Notification } from './types';

type View = 'dashboard' | 'patients' | 'appointments' | 'records' | 'reports';

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'patients', label: 'Patients', icon: PatientsIcon },
    { id: 'appointments', label: 'Appointments', icon: AppointmentsIcon },
    { id: 'records', label: 'Medical Records', icon: RecordsIcon },
    { id: 'reports', label: 'Reports', icon: ReportsIcon },
] as const;


const Sidebar = ({ activeView, setActiveView }: { activeView: View, setActiveView: (view: View) => void }) => {
    return (
        <aside className="w-64 bg-white text-slate-800 flex flex-col shadow-lg">
            <div className="flex items-center justify-center h-20 border-b-2 border-slate-100">
                <HealthCardIcon className="h-8 w-8 text-primary"/>
                <h1 className="text-2xl font-bold ml-2">MediSystem</h1>
            </div>
            <nav className="flex-grow px-4 py-4">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActiveView(item.id as View); }}
                        className={`flex items-center px-4 py-3 my-2 rounded-lg transition-colors duration-200 ${
                            activeView === item.id ? 'bg-primary text-white shadow-md' : 'hover:bg-primary-50 hover:text-primary-600'
                        }`}
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="ml-4 font-medium">{item.label}</span>
                    </a>
                ))}
            </nav>
        </aside>
    );
};

const Header = ({ activeView }: { activeView: View }) => {
    const title = navItems.find(item => item.id === activeView)?.label || 'Dashboard';
    return (
        <header className="h-20 bg-white shadow-sm flex items-center justify-between px-8">
            <h2 className="text-2xl font-semibold text-slate-700 capitalize">{title}</h2>
            <div>
                {/* User Profile / Actions can go here */}
            </div>
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

const Dashboard = () => (
    <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">Welcome to MediSystem</h1>
        <p className="mt-4 text-lg text-slate-600">Select an option from the sidebar to manage your healthcare services.</p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {navItems.filter(i => i.id !== 'dashboard').map(item => (
                 <div key={item.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer">
                    <item.icon className="h-12 w-12 text-primary mx-auto" />
                    <h3 className="mt-4 text-xl font-semibold">{item.label}</h3>
                 </div>
            ))}
        </div>
    </div>
);


export default function App() {
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => removeNotification(id), 5000);
    };

    const removeNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const renderView = () => {
        switch (activeView) {
            case 'dashboard': return <Dashboard />;
            case 'patients': return <PatientManagement addNotification={addNotification} />;
            case 'appointments': return <AppointmentManagement addNotification={addNotification} />;
            case 'reports': return <ReportsDashboard addNotification={addNotification}/>;
            case 'records': return <MedicalRecords addNotification={addNotification} />;
            default: return <div>Select a view</div>;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <NotificationArea notifications={notifications} removeNotification={removeNotification} />
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header activeView={activeView} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
}
