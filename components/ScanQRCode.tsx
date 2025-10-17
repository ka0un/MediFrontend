import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import type { Appointment } from '../types';
import { AppointmentStatus } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Spinner, Select } from './ui';

export default function ScanQRCode({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [scannedAppointment, setScannedAppointment] = useState<Appointment | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const readerElementId = "qr-reader";

    const onScanSuccess = useCallback(async (decodedText: string) => {
        if (scannerRef.current) {
            // State 2 corresponds to 'SCANNING'. Check before trying to stop.
            if (scannerRef.current.getState() === 2) { 
                try {
                    await scannerRef.current.stop();
                } catch (err) {
                    console.error("Error stopping scanner on success:", err);
                }
            }
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getAppointmentByConfirmation(decodedText);
            setScannedAppointment(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to find appointment.';
            setError(errorMessage);
            addNotification('error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        // Initialize scanner instance on first render
        if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(readerElementId);
        }
        const scanner = scannerRef.current;

        const config = {
            fps: 10,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.max(50, Math.floor(minEdge * 0.8));
                return { width: qrboxSize, height: qrboxSize };
            }
        };

        // Start scanning only if no appointment is currently displayed
        if (!scannedAppointment) {
            // State 2 is SCANNING. If not scanning, start it.
            if (scanner.getState() !== 2) {
                 scanner.start(
                    { facingMode: "environment" },
                    config,
                    onScanSuccess,
                    (errorMessage: string) => { /* ignore failures */ }
                ).catch((err: any) => {
                    setError("Could not start QR scanner. Please grant camera permissions and refresh the page.");
                    console.error("Scanner start error:", err);
                });
            }
        }

        // Cleanup function to stop the scanner when the component unmounts or state changes
        return () => {
            if (scannerRef.current && scannerRef.current.getState() === 2) {
                try {
                    scannerRef.current.stop();
                } catch (err) {
                    console.error("Failed to stop scanner on cleanup.", err);
                }
            }
        };
    }, [scannedAppointment, onScanSuccess]);
    
    const handleUpdateStatus = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!scannedAppointment) return;

        const formData = new FormData(e.currentTarget);
        const newStatus = formData.get('status') as AppointmentStatus;

        setIsUpdating(true);
        try {
            const updatedAppointment = await api.updateAppointmentStatusByAdmin(scannedAppointment.id, newStatus);
            setScannedAppointment(updatedAppointment);
            addNotification('success', 'Appointment status updated.');
        } catch (err) {
            addNotification('error', err instanceof Error ? err.message : 'Failed to update status.');
        } finally {
            setIsUpdating(false);
        }
    };
    
    const resetScanner = () => {
        setScannedAppointment(null);
        setError(null);
        // The useEffect hook will handle restarting the scanner automatically.
    };

    return (
        <div>
            <PageTitle>Scan Patient Visit Card</PageTitle>
            <Card>
                {/* The reader element is always in the DOM, but hidden when not needed. */}
                <div id={readerElementId} className={scannedAppointment || isLoading || error ? 'hidden' : ''} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
                
                {error && (
                     <div className="text-center">
                        <p className="text-red-500 text-center mt-4">{error}</p>
                        <Button onClick={resetScanner} className="mt-4">Try Again</Button>
                    </div>
                )}

                {isLoading && <Spinner />}

                {scannedAppointment && !isLoading && (
                    <div>
                        <h3 className="text-xl font-bold text-center mb-4">Appointment Found</h3>
                        <div className="space-y-2 text-lg p-4 bg-slate-50 rounded-lg">
                             <p><strong>Patient:</strong> {scannedAppointment.patientName}</p>
                             <p><strong>Provider:</strong> {scannedAppointment.providerName}</p>
                             <p><strong>Time:</strong> {new Date(scannedAppointment.appointmentTime).toLocaleString()}</p>
                             <p><strong>Current Status:</strong> <span className="font-bold">{scannedAppointment.status.replace('_', ' ')}</span></p>
                        </div>
                        <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4">
                            <Select label="Update Status" name="status" defaultValue={scannedAppointment.status}>
                                {Object.values(AppointmentStatus).map(status => (
                                    <option key={status} value={status}>{status.replace('_', ' ')}</option>
                                ))}
                            </Select>
                            <div className="flex justify-end space-x-2">
                                <Button type="button" variant="secondary" onClick={resetScanner}>Scan Another</Button>
                                <Button type="submit" disabled={isUpdating}>{isUpdating ? 'Updating...' : 'Update Status'}</Button>
                            </div>
                        </form>
                    </div>
                )}
            </Card>
        </div>
    );
}