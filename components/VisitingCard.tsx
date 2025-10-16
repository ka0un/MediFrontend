import React, { useEffect, useRef } from 'react';
import type { Appointment } from '../types';
import { Card } from './ui';
import { HealthCardIcon } from './Icons';

// Add QRCode to the Window interface for TypeScript to recognize it
declare global {
    interface Window {
        QRCode: any;
    }
}

export default function VisitingCard({ appointment }: { appointment: Appointment }) {
    const qrRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        // Check if the QRCode library is loaded on the window object before using it
        if (window.QRCode && qrRef.current && appointment.confirmationNumber) {
            window.QRCode.toCanvas(qrRef.current, appointment.confirmationNumber, { width: 128, margin: 1 }, (error: any) => {
                if (error) console.error("QRCode generation error:", error);
            });
        }
    }, [appointment.confirmationNumber]);

    return (
        <Card className="max-w-md mx-auto border-2 border-primary-200">
            <div className="flex items-center justify-between pb-4 border-b-2 border-dashed">
                <div className="flex items-center">
                    <HealthCardIcon className="h-8 w-8 text-primary"/>
                    <h2 className="text-2xl font-bold ml-2 text-slate-800">MediSystem</h2>
                </div>
                <p className="font-semibold text-primary">Visit Card</p>
            </div>
            <div className="flex justify-between pt-4">
                <div className="space-y-2 text-sm">
                    <p><strong>Patient:</strong> {appointment.patientName}</p>
                    <p><strong>Provider:</strong> {appointment.providerName}</p>
                    <p><strong>Specialty:</strong> {appointment.specialty}</p>
                    <p><strong>Hospital:</strong> {appointment.hospitalName}</p>
                    <p><strong>Date & Time:</strong> {new Date(appointment.appointmentTime).toLocaleString()}</p>
                    <p><strong>Confirmation #:</strong> <span className="font-mono">{appointment.confirmationNumber}</span></p>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <canvas ref={qrRef} className="w-32 h-32"></canvas>
                    <p className="text-xs text-slate-500 mt-1">Scan at reception</p>
                </div>
            </div>
        </Card>
    );
}