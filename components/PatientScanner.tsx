import React from 'react';
import { Card, Button, Input } from './ui';
import { QrCodeIcon } from './Icons';
import { QRScanner } from './QRScanner';
import { CreatePatientModal, CreatePatientData } from './CreatePatientModal';

/**
 * Props interface following Interface Segregation Principle
 * Only exposes what's needed for patient scanning functionality
 */
interface PatientScannerProps {
    staffId: string;
    onScanSuccess: (cardNumber: string, purpose: string) => Promise<void>;
    onManualSearch: (patientId: string, purpose: string) => Promise<void>;
    onCreatePatient?: (patientData: CreatePatientData) => Promise<void>;
    isLoading?: boolean;
}

/**
 * PatientScanner Component
 * 
 * Follows SOLID Principles:
 * - Single Responsibility: Only handles patient identification/search UI
 * - Open/Closed: Extensible through props without modifying the component
 * - Liskov Substitution: Can be replaced with any patient identification mechanism
 * - Interface Segregation: Props interface only includes necessary methods
 * - Dependency Inversion: Depends on abstractions (callbacks) not concrete implementations
 */
export const PatientScanner: React.FC<PatientScannerProps> = ({
    staffId,
    onScanSuccess,
    onManualSearch,
    onCreatePatient,
    isLoading = false,
}) => {
    const [patientId, setPatientId] = React.useState('');
    const [error, setError] = React.useState('');
    const [showScanner, setShowScanner] = React.useState(false);
    const [showCreateModal, setShowCreateModal] = React.useState(false);
    const [notFoundCardNumber, setNotFoundCardNumber] = React.useState<string>('');
    const [isPatientNotFound, setIsPatientNotFound] = React.useState(false);

    /**
     * Play success beep sound
     * Uses Web Audio API for reliable cross-browser sound generation
     */
    const playBeepSound = () => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Configure beep: 800Hz frequency, 200ms duration
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (err) {
            console.warn('Failed to play beep sound:', err);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!patientId.trim()) {
            setError('Please scan or enter a patient card number');
            return;
        }

        try {
            const purpose = 'Medical record access'; // Default purpose for logging
            await onScanSuccess(patientId, purpose);
            // Reset form on success
            setPatientId('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Handle QR scan success
    const handleQRScanSuccess = async (decodedText: string) => {
        try {
            // Play beep sound for successful scan
            playBeepSound();
            
            setPatientId(decodedText);
            setShowScanner(false);
            setError('');
            setIsPatientNotFound(false);
            
            // Automatically trigger search after successful scan
            const purpose = 'Medical record access';
            await onScanSuccess(decodedText, purpose);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch patient record';
            setError(errorMessage);
            
            // Check if error is "patient not found"
            if (errorMessage.toLowerCase().includes('not found') || 
                errorMessage.toLowerCase().includes('404') ||
                errorMessage.toLowerCase().includes('no patient')) {
                setIsPatientNotFound(true);
                setNotFoundCardNumber(decodedText);
            }
        }
    };

    // Handle QR scan error
    const handleQRScanError = (errorMessage: string) => {
        setError(`Scanner error: ${errorMessage}`);
        setIsPatientNotFound(false);
    };

    // Handle create new patient
    const handleCreatePatient = async (patientData: CreatePatientData) => {
        if (!onCreatePatient) {
            setError('Patient creation is not available');
            return;
        }

        try {
            await onCreatePatient(patientData);
            setShowCreateModal(false);
            setIsPatientNotFound(false);
            setError('');
            // Optionally retry the search after creating
            if (patientData.digitalHealthCardNumber) {
                const purpose = 'Medical record access';
                await onScanSuccess(patientData.digitalHealthCardNumber, purpose);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create patient profile');
            throw err; // Re-throw to let modal handle it
        }
    };

    // Handle manual search with patient not found handling
    const handleManualSearchWithError = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsPatientNotFound(false);

        // Validation
        if (!patientId.trim()) {
            setError('Please scan or enter a patient card number');
            return;
        }

        try {
            const purpose = 'Medical record access';
            await onScanSuccess(patientId, purpose);
            // Reset form on success
            setPatientId('');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
            
            // Check if error is "patient not found"
            if (errorMessage.toLowerCase().includes('not found') || 
                errorMessage.toLowerCase().includes('404') ||
                errorMessage.toLowerCase().includes('no patient')) {
                setIsPatientNotFound(true);
                setNotFoundCardNumber(patientId);
            }
        }
    };

    return (
        <Card>
            <div className="flex items-center gap-2 mb-4">
                <QrCodeIcon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-slate-800">Scan Patient Card</h2>
            </div>

            <form onSubmit={handleManualSearchWithError} className="space-y-4">
                {/* QR Code Scan Area */}
                <div className="border-2 border-dashed border-primary-300 rounded-lg p-8 text-center bg-primary-50">
                    <QrCodeIcon className="w-16 h-16 mx-auto mb-3 text-primary" />
                    <p className="text-sm text-slate-600 mb-3">
                        Position the patient's QR code in front of the camera
                    </p>
                    
                    {/* Scan QR Button */}
                    <Button
                        type="button"
                        onClick={() => setShowScanner(true)}
                        className="mb-4"
                    >
                        <QrCodeIcon className="w-5 h-5 inline-block mr-2" />
                        Open Camera to Scan QR Code
                    </Button>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-300"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-primary-50 text-slate-500">OR</span>
                        </div>
                    </div>
                    
                    <Input
                        label="Enter card number manually"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        placeholder="HBC-12345"
                        className="max-w-xs mx-auto mt-4"
                    />
                </div>

                {/* Error Display with Patient Not Found UI */}
                {error && (
                    <div className={`border px-4 py-3 rounded ${
                        isPatientNotFound 
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-medium">
                                    {isPatientNotFound ? '⚠️ Patient Not Found' : '❌ Error'}
                                </p>
                                <p className="text-sm mt-1">{error}</p>
                                {isPatientNotFound && (
                                    <p className="text-sm mt-2">
                                        Card Number: <span className="font-mono font-semibold">{notFoundCardNumber}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                        {isPatientNotFound && onCreatePatient && (
                            <Button
                                type="button"
                                onClick={() => setShowCreateModal(true)}
                                className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700"
                            >
                                ➕ Create New Patient Profile
                            </Button>
                        )}
                    </div>
                )}

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Searching...
                        </span>
                    ) : (
                        'Search Patient'
                    )}
                </Button>
            </form>

            <div className="mt-4 text-xs text-slate-500">
                <p>Staff ID: {staffId}</p>
                <p className="mt-1">Enter the patient's ID to access their medical records.</p>
            </div>
            
            {/* QR Scanner Modal */}
            <QRScanner
                isScanning={showScanner}
                onScanSuccess={handleQRScanSuccess}
                onScanError={handleQRScanError}
                onClose={() => setShowScanner(false)}
            />
            
            {/* Create Patient Modal */}
            <CreatePatientModal
                isOpen={showCreateModal}
                scannedCardNumber={notFoundCardNumber}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreatePatient}
            />
        </Card>
    );
};
