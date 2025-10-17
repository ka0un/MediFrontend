import React from 'react';
import { Card, Button, Input } from './ui';
import { QrCodeIcon } from './Icons';
import { QRScanner } from './QRScanner';

/**
 * Props interface following Interface Segregation Principle
 * Only exposes what's needed for patient scanning functionality
 */
interface PatientScannerProps {
    staffId: string;
    onScanSuccess: (cardNumber: string, purpose: string) => Promise<void>;
    onManualSearch: (patientId: string, purpose: string) => Promise<void>;
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
    isLoading = false,
}) => {
    const [patientId, setPatientId] = React.useState('');
    const [showScanner, setShowScanner] = React.useState(false);
    const [validationError, setValidationError] = React.useState('');

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

    // Handle QR scan success
    const handleQRScanSuccess = async (decodedText: string) => {
        // Play beep sound for successful scan
        playBeepSound();
        
        setPatientId(decodedText);
        setShowScanner(false);
        setValidationError('');
        
        // Automatically trigger search after successful scan
        const purpose = 'Medical record access';
        await onScanSuccess(decodedText, purpose);
    };

    // Handle QR scan error
    const handleQRScanError = (errorMessage: string) => {
        console.error('Scanner error:', errorMessage);
    };

    // Handle manual search
    const handleManualSearchWithError = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        // Validation
        if (!patientId.trim()) {
            setValidationError('Please enter a patient card number');
            return;
        }

        // Validate card number format: ABC-2024-123 or ABCD-2024-123
        const cardNumberRegex = /^[A-Z]{1,4}-\d{4}-\d{3,}$/;
        if (!cardNumberRegex.test(patientId.trim())) {
            setValidationError('Invalid format. Expected: ABC-2024-123 or ABCD-2024-123');
            return;
        }

        const purpose = 'Medical record access';
        await onScanSuccess(patientId, purpose);
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
                        onChange={(e) => {
                            setPatientId(e.target.value);
                            setValidationError(''); // Clear error on input change
                        }}
                        placeholder="ABC-2024-123 or ABCD-2024-123"
                        className="max-w-xs mx-auto mt-4"
                        error={validationError}
                    />
                </div>

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
        </Card>
    );
};
