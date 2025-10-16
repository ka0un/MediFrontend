
import React, { useState, useEffect, useCallback } from 'react';
import type { Appointment } from '../types';
import * as api from '../services/api';
import { PageTitle, Button, Modal, Spinner } from './ui';

export default function AdminAppointments({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getAdminAppointments();
            setAppointments(data);
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to fetch appointments');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleCancel = async () => {
        if (!cancellingAppointment) return;
        try {
            await api.cancelAppointmentByAdmin(cancellingAppointment.id);
            addNotification('success', 'Appointment cancelled successfully');
            setCancellingAppointment(null);
            fetchAppointments();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to cancel appointment');
            setCancellingAppointment(null);
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

    return (
        <div>
            <PageTitle>All Appointments</PageTitle>
            {isLoading ? <Spinner /> : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appointments.map(appt => (
                                <tr key={appt.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appt.patientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.providerName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(appt.appointmentTime).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(appt.status)}`}>
                                            {appt.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.hospitalName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {appt.status !== 'CANCELLED' && appt.status !== 'COMPLETED' && (
                                            <Button variant="danger" onClick={() => setCancellingAppointment(appt)}>Cancel</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal isOpen={!!cancellingAppointment} onClose={() => setCancellingAppointment(null)} title="Confirm Cancellation">
                <p>Are you sure you want to cancel the appointment for <strong>{cancellingAppointment?.patientName}</strong> with <strong>{cancellingAppointment?.providerName}</strong>?</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setCancellingAppointment(null)}>Keep Appointment</Button>
                    <Button variant="danger" onClick={handleCancel}>Cancel Appointment</Button>
                </div>
            </Modal>
        </div>
    );
}
