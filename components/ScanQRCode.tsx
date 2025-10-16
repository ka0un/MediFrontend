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
    const scannerRef = useRef<any>(null);

    const onScanSuccess = useCallback((decodedText: string, decodedResult: any) => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch((err: any) => console.error("Failed to stop scanner", err));
        }

        setIsLoading(true);
        setError(null);
        api.getAppointmentByConfirmation(decodedText)
            .then(data => {
                setScannedAppointment(data);
            })
            .catch(err => {
                setError(err.message || 'Failed to find appointment.');
                addNotification('error', err.message || 'Failed to find appointment.');
            })
            .finally(() => setIsLoading(false));

    }, [addNotification]);

    const onScanFailure = (errorMessage: string) => {
        // This callback is called frequently, so we typically ignore it to avoid spamming logs.
    };
    
    const startScanner = useCallback(() => {
        if (scannerRef.current && !scannerRef.current.isScanning) {
            scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        const qrboxSize = Math.floor(minEdge * 0.7);
                        return { width: qrboxSize, height: qrboxSize };
                    }
                },
                onScanSuccess,
                onScanFailure
            ).catch((err: any) => {
                setError("Could not start QR scanner. Please grant camera permissions and refresh the page.");
                console.error("Scanner start error:", err)
            });
        }
    }, [onScanSuccess]);

    useEffect(() => {
        const cleanup = () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch((err: any) => {
                    console.warn("Failed to stop QR scanner on cleanup.", err);
                });
            }
        };

        // Check if the library is loaded before creating an instance
        if (window.Html5Qrcode) {
            if (!scannerRef.current) {
                 scannerRef.current = new window.Html5Qrcode("qr-reader");
            }
            startScanner();
        } else {
            console.error("Html5Qrcode library not loaded.");
            setError("QR Code scanning library failed to load. Please refresh the page.");
        }

        return cleanup;
    }, [startScanner]);
    
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
        // Add a small delay to allow React to re-render the DOM element before starting the scanner
        setTimeout(() => startScanner(), 100);
    };

    return (
        <div>
            <PageTitle>Scan Patient Visit Card</PageTitle>
            <Card>
                <div id="qr-reader" className={scannedAppointment || isLoading ? 'hidden' : ''} style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}></div>
                
                {error && !scannedAppointment && <p className="text-red-500 text-center mt-4">{error}</p>}
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