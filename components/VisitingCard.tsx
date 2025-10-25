import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { Appointment } from '../types';
import { Card, Button } from './ui';
import { HealthCardIcon } from './Icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function VisitingCard({ appointment }: { appointment: Appointment }) {
    const qrRef = useRef<HTMLCanvasElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Generate QR code using the npm package
        if (qrRef.current && appointment.confirmationNumber) {
            QRCode.toCanvas(qrRef.current, appointment.confirmationNumber, { width: 128, margin: 1 }, (error) => {
                if (error) console.error("QRCode generation error:", error);
            });
        }
    }, [appointment.confirmationNumber]);

    const downloadPNG = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 });
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const fileName = `visit-card-${appointment.confirmationNumber}.png`;
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadPDF = async () => {
        if (!cardRef.current) return;
        const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        // Calculate dimensions to fit card nicely
        const imgWidth = pageWidth - 20; // 10mm margin each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const y = Math.max(10, (pageHeight - imgHeight) / 2);
        pdf.addImage(imgData, 'PNG', 10, y, imgWidth, imgHeight);
        pdf.save(`visit-card-${appointment.confirmationNumber}.pdf`);
    };

    const shareCard = async () => {
        if (!cardRef.current) return;
        try {
            const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 2 });
            const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Could not create image blob');
            const file = new File([blob], `visit-card-${appointment.confirmationNumber}.png`, { type: 'image/png' });

            if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] })) {
                await (navigator as any).share({
                    files: [file],
                    title: 'Visit Card',
                    text: `Appointment visit card for ${appointment.patientName}`,
                });
            } else {
                // Fallback: download if sharing files isn't supported
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `visit-card-${appointment.confirmationNumber}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                alert('Sharing is not supported on this device/browser. The visit card has been downloaded instead.');
            }
        } catch (err) {
            console.error('Share failed:', err);
            alert('Unable to share the visit card. You can try downloading it instead.');
        }
    };

    return (
        <>
            <Card className="max-w-md mx-auto border-2 border-primary-200">
                <div ref={cardRef} className="p-4">
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
                </div>
            </Card>
            <div className="max-w-md mx-auto flex items-center gap-2 justify-end mt-2">
                <Button variant="secondary" onClick={downloadPNG}>Download PNG</Button>
                <Button variant="secondary" onClick={downloadPDF}>Download PDF</Button>
                <Button onClick={shareCard}>Share</Button>
            </div>
        </>
    );
}