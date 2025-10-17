/**
 * Example Integration: StaffMedicalRecords Component
 * 
 * This file demonstrates how to integrate the StaffMedicalRecords component
 * into your application, following the wireframe design and best practices.
 */

import React, { useState } from 'react';
import StaffMedicalRecords from './components/StaffMedicalRecords';
import type { AuthUser, Role } from './types';

/**
 * Example 1: Basic Integration
 * Simple integration with notification handling
 */
export const BasicIntegration: React.FC = () => {
    // Mock user data (replace with actual authentication)
    const [user] = useState<AuthUser>({
        userId: 1,
        username: 'dr.smith',
        role: 'ADMIN' as Role,
        patientId: null
    });

    // Simple notification handler
    const addNotification = (type: 'success' | 'error', message: string) => {
        console.log(`[${type.toUpperCase()}]: ${message}`);
        // You can replace this with your notification system (toast, alert, etc.)
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <StaffMedicalRecords 
                user={user} 
                addNotification={addNotification} 
            />
        </div>
    );
};

/**
 * Example 2: Integration with Notification System
 * Advanced integration with toast notifications
 */
export const AdvancedIntegration: React.FC = () => {
    const [user] = useState<AuthUser>({
        userId: 2,
        username: 'nurse.johnson',
        role: 'ADMIN' as Role,
        patientId: null
    });

    const [notifications, setNotifications] = useState<Array<{
        id: number;
        type: 'success' | 'error';
        message: string;
    }>>([]);

    const addNotification = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Notification Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map(notification => (
                    <div
                        key={notification.id}
                        className={`px-6 py-4 rounded-lg shadow-lg ${
                            notification.type === 'success'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                        }`}
                    >
                        {notification.message}
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="p-6">
                <StaffMedicalRecords 
                    user={user} 
                    addNotification={addNotification} 
                />
            </div>
        </div>
    );
};

/**
 * Example 3: Integration with Layout/Dashboard
 * Full dashboard integration with sidebar navigation
 */
export const DashboardIntegration: React.FC = () => {
    const [user] = useState<AuthUser>({
        userId: 3,
        username: 'admin.williams',
        role: 'ADMIN' as Role,
        patientId: null
    });

    const [activeView, setActiveView] = useState<'dashboard' | 'patients' | 'medical-records'>('medical-records');

    const addNotification = (type: 'success' | 'error', message: string) => {
        alert(`${type.toUpperCase()}: ${message}`);
    };

    return (
        <div className="flex h-screen bg-slate-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-primary">MediCare+</h2>
                    <p className="text-sm text-slate-500">Healthcare Staff Portal</p>
                </div>
                
                <nav className="mt-6">
                    <button
                        onClick={() => setActiveView('dashboard')}
                        className={`w-full px-6 py-3 text-left ${
                            activeView === 'dashboard'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveView('patients')}
                        className={`w-full px-6 py-3 text-left ${
                            activeView === 'patients'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Patients
                    </button>
                    <button
                        onClick={() => setActiveView('medical-records')}
                        className={`w-full px-6 py-3 text-left ${
                            activeView === 'medical-records'
                                ? 'bg-primary text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Medical Records
                    </button>
                </nav>

                {/* User Info */}
                <div className="absolute bottom-0 w-64 p-6 border-t">
                    <p className="text-sm font-medium text-slate-800">{user.username}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6">
                {activeView === 'medical-records' && (
                    <StaffMedicalRecords 
                        user={user} 
                        addNotification={addNotification} 
                    />
                )}
                {activeView === 'dashboard' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
                        <p>Dashboard content goes here...</p>
                    </div>
                )}
                {activeView === 'patients' && (
                    <div>
                        <h1 className="text-3xl font-bold mb-4">Patients</h1>
                        <p>Patient list goes here...</p>
                    </div>
                )}
            </main>
        </div>
    );
};

/**
 * Example 4: Integration with React Router
 * Route-based navigation
 */
// Uncomment if using react-router-dom
/*
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

export const RouterIntegration: React.FC = () => {
    const [user] = useState<AuthUser>({
        userId: 4,
        username: 'staff.member',
        role: 'ADMIN' as Role,
        patientId: null
    });

    const addNotification = (type: 'success' | 'error', message: string) => {
        console.log(`[${type}]: ${message}`);
    };

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/medical-records" />} />
                <Route 
                    path="/medical-records" 
                    element={
                        <StaffMedicalRecords 
                            user={user} 
                            addNotification={addNotification} 
                        />
                    } 
                />
            </Routes>
        </BrowserRouter>
    );
};
*/

/**
 * Example 5: Testing Mock Data
 * Useful for development and testing
 */
export const TestingIntegration: React.FC = () => {
    const [user] = useState<AuthUser>({
        userId: 999,
        username: 'test.user',
        role: 'ADMIN' as Role,
        patientId: null
    });

    const addNotification = (type: 'success' | 'error', message: string) => {
        // Log to console for testing
        console.log(`[${type}]`, message);
        
        // Could also log to test framework
        if (typeof window !== 'undefined' && (window as any).testResults) {
            (window as any).testResults.push({ type, message, timestamp: new Date() });
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
                <p className="text-sm text-yellow-800">
                    <strong>Testing Mode:</strong> All API calls and notifications will be logged to console
                </p>
            </div>
            
            <StaffMedicalRecords 
                user={user} 
                addNotification={addNotification} 
            />
        </div>
    );
};

/**
 * Default Export: Basic Integration
 * Use this as a starting point
 */
export default BasicIntegration;
