import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui';

interface OtpVerificationModalProps {
    isOpen: boolean;
    patientName: string;
    maskedPhone: string;
    patientId: number;
    staffUsername: string;
    onClose: () => void;
    onVerified: () => void;
    onResendOtp: () => Promise<void>;
}

/**
 * OTP Verification Modal Component
 * Allows staff to verify patient identity using OTP sent to patient's phone
 */
export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
    isOpen,
    patientName,
    maskedPhone,
    patientId,
    staffUsername,
    onClose,
    onVerified,
    onResendOtp,
}) => {
    const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown timer for resend button
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [isOpen]);

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newOtp = [...otpCode];
        newOtp[index] = value;
        setOtpCode(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Handle paste
        if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then((text) => {
                const digits = text.replace(/\D/g, '').slice(0, 6);
                const newOtp = digits.split('').concat(Array(6 - digits.length).fill(''));
                setOtpCode(newOtp);
                if (digits.length === 6) {
                    inputRefs.current[5]?.focus();
                }
            });
        }
    };

    const handleVerify = async () => {
        const code = otpCode.join('');
        
        if (code.length !== 6) {
            setError('Please enter complete 6-digit OTP code');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const response = await fetch('http://localhost:8080/api/otp/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientId,
                    otpCode: code,
                    staffUsername,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                onVerified();
                handleClose();
            } else {
                setError(data.message || 'Invalid OTP code. Please try again.');
                // Clear OTP inputs on error
                setOtpCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError('Failed to verify OTP. Please try again.');
            console.error('OTP verification error:', err);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError('');
        setOtpCode(['', '', '', '', '', '']);

        try {
            await onResendOtp();
            setCountdown(60); // 60 second cooldown
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError('Failed to resend OTP. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    const handleClose = () => {
        setOtpCode(['', '', '', '', '', '']);
        setError('');
        setCountdown(0);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Verify Patient Identity</h2>
                    <p className="text-sm text-slate-600">
                        OTP sent to <strong>{patientName}</strong>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        Phone: {maskedPhone}
                    </p>
                </div>

                {/* OTP Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                        Enter 6-Digit OTP Code
                    </label>
                    <div className="flex justify-center gap-2 mb-2">
                        {otpCode.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                disabled={isVerifying}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-center text-slate-500">
                        Code expires in 10 minutes
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 text-center">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleVerify}
                        disabled={isVerifying || otpCode.join('').length !== 6}
                        className="w-full"
                    >
                        {isVerifying ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            'Verify Identity'
                        )}
                    </Button>

                    <div className="flex gap-2">
                        <button
                            onClick={handleResend}
                            disabled={isResending || countdown > 0}
                            className="flex-1 py-2 px-4 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isResending ? 'Resending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                        </button>

                        <button
                            onClick={handleClose}
                            disabled={isVerifying}
                            className="flex-1 py-2 px-4 text-sm text-slate-600 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 text-center">
                        <strong>Note:</strong> Ask the patient to check their phone for the OTP message.
                        If not received, they can check spam or request a resend.
                    </p>
                </div>
            </div>
        </div>
    );
};
