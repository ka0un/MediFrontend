import React from 'react';
import { AppointmentsIcon, RecordsIcon, PatientsIcon } from './Icons';
import type { AuthUser } from '../types';

type PatientView = 'dashboard' | 'book-appointment' | 'my-records' | 'my-account';

const patientActions = [
    { id: 'book-appointment', label: 'Book Appointment', icon: AppointmentsIcon },
    { id: 'my-records', label: 'View Medical Records', icon: RecordsIcon },
    { id: 'my-account', label: 'Manage My Account', icon: PatientsIcon },
];

export default function PatientDashboard({ user, setActiveView }: { user: AuthUser, setActiveView: (view: PatientView) => void }) {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800">Welcome, {user.username}!</h1>
            <p className="mt-4 text-lg text-slate-600">What would you like to do today?</p>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                {patientActions.map(item => (
                    <div
                        key={item.id}
                        className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center justify-center"
                        onClick={() => setActiveView(item.id as PatientView)}
                        role="button"
                        tabIndex={0}
                        onKeyPress={(e) => e.key === 'Enter' && setActiveView(item.id as PatientView)}
                    >
                        <item.icon className="h-12 w-12 text-primary mx-auto" />
                        <h3 className="mt-4 text-xl font-semibold">{item.label}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}