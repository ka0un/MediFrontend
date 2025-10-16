
import React, { useState, useEffect, useCallback } from 'react';
import type { AdminDashboardData } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, KpiCard, Spinner } from './ui';
import { PatientsIcon, AppointmentsIcon } from './Icons';

type AdminView = 'dashboard' | 'patients' | 'appointments' | 'reports';

export default function AdminDashboard({ setActiveView, addNotification }: { setActiveView: (view: AdminView) => void, addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await api.getAdminDashboard();
            setData(result);
        } catch (error) {
            addNotification('error', 'Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);
    
    if (isLoading) return <Spinner />;
    if (!data) return <Card>Could not load dashboard data.</Card>;

    return (
        <div>
            <PageTitle>Admin Dashboard</PageTitle>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <KpiCard title="Total Patients" value={data.totalPatients} icon={<PatientsIcon />} />
                <KpiCard title="Total Appointments" value={data.totalAppointments} icon={<AppointmentsIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Recent Patients</h3>
                        <button onClick={() => setActiveView('patients')} className="text-sm font-semibold text-primary hover:underline">View All</button>
                    </div>
                    <ul className="space-y-3">
                        {data.recentPatients.map(p => (
                            <li key={p.id} className="p-3 bg-slate-50 rounded-md">
                                <p className="font-semibold text-slate-800">{p.name}</p>
                                <p className="text-sm text-slate-500">{p.email}</p>
                            </li>
                        ))}
                    </ul>
                </Card>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">Recent Appointments</h3>
                        <button onClick={() => setActiveView('appointments')} className="text-sm font-semibold text-primary hover:underline">View All</button>
                    </div>
                     <ul className="space-y-3">
                        {data.recentAppointments.map(a => (
                            <li key={a.id} className="p-3 bg-slate-50 rounded-md">
                                <p className="font-semibold text-slate-800">{a.patientName} with {a.providerName}</p>
                                <p className="text-sm text-slate-500">{new Date(a.appointmentTime).toLocaleString()} - <span className="font-medium">{a.status}</span></p>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
}
