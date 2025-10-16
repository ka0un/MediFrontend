import React, { useState, useEffect, useCallback } from 'react';
import type { Appointment, AuthUser } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Spinner } from './ui';
import VisitingCard from './VisitingCard';

export default function MyAppointments({ user, addNotification }: { user: AuthUser, addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [appointmentForCard, setAppointmentForCard] = useState<Appointment | null>(null);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

    const fetchAppointments = useCallback(async () => {
        if (!user.patientId) return;
        setIsLoading(true);
        try {
            const data = await api.getPatientAppointments(user.patientId);
            setAppointments(data.sort((a, b) => new Date(b.appointmentTime).getTime() - new Date(a.appointmentTime).getTime()));
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to fetch appointments');
        } finally {
            setIsLoading(false);
        }
    }, [user.patientId, addNotification]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleCancel = async () => {
        if (!appointmentToCancel) return;
        try {
            await api.cancelAppointment(appointmentToCancel.id);
            addNotification('success', 'Appointment cancelled successfully.');
            setAppointmentToCancel(null);
            fetchAppointments(); // Refresh list
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to cancel appointment');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'text-green-600 bg-green-100';
            case 'PENDING_PAYMENT': return 'text-yellow-600 bg-yellow-100';
            case 'CANCELLED': return 'text-red-600 bg-red-100';
            case 'COMPLETED': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    
    const upcomingAppointments = appointments.filter(a => new Date(a.appointmentTime) > new Date() && a.status !== 'CANCELLED' && a.status !== 'COMPLETED');
    const pastAppointments = appointments.filter(a => new Date(a.appointmentTime) <= new Date() || a.status === 'CANCELLED' || a.status === 'COMPLETED');

    const renderAppointmentList = (apps: Appointment[], title: string) => (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-4">{title}</h2>
            {apps.length === 0 ? (
                <Card><p>No {title.toLowerCase()} found.</p></Card>
            ) : (
                <div className="space-y-4">
                    {apps.map(appt => (
                        <Card key={appt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                           <div className="flex-grow mb-4 sm:mb-0">
                                <p className="font-bold text-lg">{appt.providerName} <span className="text-base font-normal text-slate-600">- {appt.specialty}</span></p>
                                <p className="text-slate-500">{new Date(appt.appointmentTime).toLocaleString()}</p>
                                <p className="text-sm text-slate-500">{appt.hospitalName}</p>
                           </div>
                           <div className="flex items-center space-x-2 w-full sm:w-auto flex-wrap">
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                                    {appt.status.replace('_', ' ')}
                                </span>
                                <Button variant="secondary" onClick={() => setAppointmentForCard(appt)}>View Card</Button>
                                {(appt.status === 'CONFIRMED' || appt.status === 'PENDING_PAYMENT') && (
                                    <Button variant="danger" onClick={() => setAppointmentToCancel(appt)}>Cancel</Button>
                                )}
                           </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );


    return (
        <div>
            <PageTitle>My Appointments</PageTitle>
            {isLoading ? <Spinner /> : (
                <>
                   {renderAppointmentList(upcomingAppointments, "Upcoming Appointments")}
                   {renderAppointmentList(pastAppointments, "Past Appointments")}
                </>
            )}

            <Modal isOpen={!!appointmentForCard} onClose={() => setAppointmentForCard(null)} title="Visit Card">
                {appointmentForCard && <VisitingCard appointment={appointmentForCard} />}
                 <div className="mt-6 text-center">
                    <Button onClick={() => setAppointmentForCard(null)}>Close</Button>
                </div>
            </Modal>

            <Modal isOpen={!!appointmentToCancel} onClose={() => setAppointmentToCancel(null)} title="Confirm Cancellation">
                <p>Are you sure you want to cancel your appointment with <strong>{appointmentToCancel?.providerName}</strong> on {appointmentToCancel && new Date(appointmentToCancel.appointmentTime).toLocaleDateString()}?</p>
                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="secondary" onClick={() => setAppointmentToCancel(null)}>Keep Appointment</Button>
                    <Button variant="danger" onClick={handleCancel}>Cancel Appointment</Button>
                </div>
            </Modal>
        </div>
    );
}