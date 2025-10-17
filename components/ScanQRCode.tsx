import React, { useState, useCallback } from 'react';
import QRScanner from './QRScanner';
import type { Appointment } from '../types';
import { AppointmentStatus } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Spinner, Select } from './ui';

export default function ScanQRCode({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [isScanning, setIsScanning] = useState(false);
    const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [patientInfo, setPatientInfo] = useState<{ name: string; patientId: number } | null>(null);

    // Handle QR code scan success
    const handleScanSuccess = useCallback(async (decodedText: string) => {
        setIsScanning(false);
        setIsLoading(true);
        
        try {
            // First, get the appointment by confirmation number
            const scannedAppointment = await api.getAppointmentByConfirmation(decodedText);
            
            // Then fetch all appointments for this patient
            const allAppointments = await api.getPatientAppointments(scannedAppointment.patientId);
            
            setPatientInfo({
                name: scannedAppointment.patientName,
                patientId: scannedAppointment.patientId
            });
            setPatientAppointments(allAppointments);
            setSelectedAppointment(scannedAppointment);
            
            addNotification('success', `Loaded ${allAppointments.length} appointment(s) for ${scannedAppointment.patientName}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to find appointment or patient data.';
            addNotification('error', errorMessage);
            setIsScanning(false);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    // Handle QR scan error
    const handleScanError = useCallback((error: string) => {
        addNotification('error', `Scanner error: ${error}`);
    }, [addNotification]);
    
    // Handle appointment status update
    const handleUpdateStatus = async (appointmentId: number, newStatus: AppointmentStatus) => {
        setIsUpdating(true);
        try {
            const updatedAppointment = await api.updateAppointmentStatusByAdmin(appointmentId, newStatus);
            
            // Update the appointment in the list
            setPatientAppointments(prev =>
                prev.map(apt => apt.id === appointmentId ? updatedAppointment : apt)
            );
            
            // Update selected appointment if it's the one being updated
            if (selectedAppointment?.id === appointmentId) {
                setSelectedAppointment(updatedAppointment);
            }
            
            addNotification('success', 'Appointment status updated successfully.');
        } catch (err) {
            addNotification('error', err instanceof Error ? err.message : 'Failed to update status.');
        } finally {
            setIsUpdating(false);
        }
    };
    
    // Reset to scan another patient
    const resetScanner = () => {
        setPatientAppointments([]);
        setSelectedAppointment(null);
        setPatientInfo(null);
        setIsScanning(false);
    };

    // Get status badge color
    const getStatusColor = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.CONFIRMED:
                return 'bg-green-100 text-green-800 border-green-200';
            case AppointmentStatus.PENDING_PAYMENT:
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case AppointmentStatus.COMPLETED:
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case AppointmentStatus.CANCELLED:
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div>
            <PageTitle>Scan Patient Visit Card</PageTitle>
            
            {/* QR Scanner Modal */}
            <QRScanner
                isScanning={isScanning}
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onClose={() => setIsScanning(false)}
            />

            {/* Main Content */}
            {!patientAppointments.length && !isLoading && (
                <Card>
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-6 bg-primary-50 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Scan Patient Visit Card</h3>
                        <p className="text-slate-600 mb-8">
                            Click the button below to scan a patient's QR code and view their appointments
                        </p>
                        <Button onClick={() => setIsScanning(true)} className="px-8 py-3 text-lg">
                            <svg className="w-6 h-6 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            Start Scanning
                        </Button>
                    </div>
                </Card>
            )}

            {/* Loading State */}
            {isLoading && (
                <Card>
                    <div className="text-center py-12">
                        <Spinner />
                        <p className="mt-4 text-slate-600">Loading patient appointments...</p>
                    </div>
                </Card>
            )}

            {/* Patient Appointments List */}
            {patientAppointments.length > 0 && !isLoading && (
                <div className="space-y-6">
                    {/* Patient Info Header */}
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{patientInfo?.name}</h3>
                                <p className="text-slate-600">Patient ID: {patientInfo?.patientId}</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    Total Appointments: {patientAppointments.length}
                                </p>
                            </div>
                            <Button variant="secondary" onClick={resetScanner}>
                                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                                Scan Another Patient
                            </Button>
                        </div>
                    </Card>

                    {/* Appointments Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        {patientAppointments.map((appointment) => (
                            <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Appointment Details */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="text-lg font-semibold text-slate-800">
                                                    {appointment.providerName}
                                                </h4>
                                                <p className="text-sm text-slate-600">{appointment.specialty}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                                                {appointment.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {new Date(appointment.appointmentTime).toLocaleString()}
                                            </div>
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                {appointment.hospitalName}
                                            </div>
                                            {appointment.confirmationNumber && (
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                    </svg>
                                                    Conf: <span className="font-mono ml-1">{appointment.confirmationNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Update Controls */}
                                    <div className="flex flex-col gap-2 md:min-w-[200px]">
                                        <Select
                                            label="Update Status"
                                            value={appointment.status}
                                            onChange={(e) => handleUpdateStatus(appointment.id, e.target.value as AppointmentStatus)}
                                            disabled={isUpdating}
                                        >
                                            {Object.values(AppointmentStatus).map(status => (
                                                <option key={status} value={status}>
                                                    {status.replace('_', ' ')}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}