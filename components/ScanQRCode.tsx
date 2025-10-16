import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Appointment } from '../types';
import { AppointmentStatus } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Spinner, Select } from './ui';

// Add Html5Qrcode to the Window interface for TypeScript to recognize it
declare global {
    interface Window {
        Html5Qrcode: any;
    }
}

export default function ScanQRCode({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [scannedAppointment, setScannedAppointment] = useState<Appointment | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Using refs to hold the scanner instance and its state to avoid issues with stale closures in callbacks.
    const scannerRef = useRef<any>(null);
    const isScanningRef = useRef(false);
    const readerElementId = "qr-reader";

    const stopScanner = useCallback(async () => {
        try {
            if (scannerRef.current && isScanningRef.current) {
                await scannerRef.current.stop();
                isScanningRef.current = false;
            }
        } catch (err) {
            console.error("Failed to stop scanner gracefully.", err);
            // Even if stopping fails, we mark it as not scanning to allow restart attempts.
            isScanningRef.current = false;
        }
    }, []);

    const onScanSuccess = useCallback(async (decodedText: string, decodedResult: any) => {
        await stopScanner();
        
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
    }, [addNotification, stopScanner]);

    const onScanFailure = (errorMessage: string) => {
        // This callback is called frequently, so we typically ignore it to avoid spamming logs.
    };
    
    const startScanner = useCallback(() => {
        if (!scannerRef.current || isScanningRef.current) {
            return;
        }

        try {
            isScanningRef.current = true;
            scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        // FIX: Enforce a minimum size of 50px for the qrbox to prevent library errors.
                        const qrboxSize = Math.max(50, Math.floor(minEdge * 0.8));
                        return { width: qrboxSize, height: qrboxSize };
                    }
                },
                onScanSuccess,
                onScanFailure
            ).catch((err: any) => {
                setError("Could not start QR scanner. Please grant camera permissions and refresh the page.");
                console.error("Scanner start error:", err);
                isScanningRef.current = false; // Reset state on failure
            });
        } catch (err) {
            setError("An unexpected error occurred while trying to start the scanner.");
            console.error("Scanner start exception:", err);
            isScanningRef.current = false;
        }
    }, [onScanSuccess]);


    useEffect(() => {
        if (window.Html5Qrcode) {
            if (!scannerRef.current) {
                // Initialize the scanner instance only once.
                scannerRef.current = new window.Html5Qrcode(readerElementId);
            }
            
            // Start scanning only if there's no appointment displayed.
            if (!scannedAppointment) {
                 startScanner();
            }
        } else {
            console.error("Html5Qrcode library not loaded.");
            setError("QR Code scanning library failed to load. Please refresh the page.");
        }

        // Cleanup function to stop the scanner when the component unmounts.
        return () => {
           stopScanner();
        };
    }, [scannedAppointment, startScanner, stopScanner]);
    
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
        // The useEffect hook will automatically restart the scanner when `scannedAppointment` becomes null.
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