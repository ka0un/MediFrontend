import React, { useState } from 'react';
import { Card, Button, Input } from './ui';
import { XIcon } from './Icons';
import { validatePhoneNumber, validateAddress, validateEmail, validateRequired } from '../utils/validation';
import { generateHealthCardNumber } from '../utils/healthCardGenerator';

/**
 * Props interface for CreatePatientModal
 */
interface CreatePatientModalProps {
    isOpen: boolean;
    scannedCardNumber?: string;
    onClose: () => void;
    onSubmit: (patientData: CreatePatientData) => Promise<void>;
}

/**
 * Patient creation data structure
 */
export interface CreatePatientData {
    name: string;
    email: string;
    phone: string;
    digitalHealthCardNumber: string;
    address?: string;
    dateOfBirth?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    bloodType?: string;
    allergies?: string;
    gender?: string;
}

/**
 * CreatePatientModal Component
 * 
 * Modal for creating a new patient profile when patient is not found
 * Follows SOLID Principles:
 * - Single Responsibility: Only handles patient profile creation UI
 * - Open/Closed: Extensible through props
 * - Interface Segregation: Minimal props interface
 * - Dependency Inversion: Depends on callback abstractions
 */
export const CreatePatientModal: React.FC<CreatePatientModalProps> = ({
    isOpen,
    scannedCardNumber,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState<CreatePatientData>({
        name: '',
        email: '',
        phone: '',
        digitalHealthCardNumber: scannedCardNumber || generateHealthCardNumber(),
        address: '',
        dateOfBirth: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        bloodType: '',
        allergies: '',
        gender: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update card number if prop changes or generate new one if modal opens without scanned card
    React.useEffect(() => {
        if (scannedCardNumber) {
            setFormData(prev => ({ ...prev, digitalHealthCardNumber: scannedCardNumber }));
        } else if (isOpen && !formData.digitalHealthCardNumber) {
            // Generate new health card number when modal opens without scanned card
            setFormData(prev => ({ ...prev, digitalHealthCardNumber: generateHealthCardNumber() }));
        }
    }, [scannedCardNumber, isOpen, formData.digitalHealthCardNumber]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validate required fields
        const nameValidation = validateRequired(formData.name, 'Name');
        if (!nameValidation.isValid) {
            newErrors.name = nameValidation.message || '';
        }

        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
            newErrors.email = emailValidation.message || '';
        }

        const phoneValidation = validatePhoneNumber(formData.phone);
        if (!phoneValidation.isValid) {
            newErrors.phone = phoneValidation.message || '';
        }

        // Health card number is auto-generated, no validation needed

        // Validate optional address field
        if (formData.address) {
            const addressValidation = validateAddress(formData.address);
            if (!addressValidation.isValid) {
                newErrors.address = addressValidation.message || '';
            }
        }

        // Validate date of birth
        if (formData.dateOfBirth) {
            const dob = new Date(formData.dateOfBirth);
            const today = new Date();
            if (dob > today) {
                newErrors.dateOfBirth = 'Date of birth cannot be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        
        // Validate specific fields on change
        if (name === 'phone') {
            const validation = validatePhoneNumber(value);
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, phone: validation.message || '' }));
            }
        } else if (name === 'address') {
            const validation = validateAddress(value);
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, address: validation.message || '' }));
            }
        } else if (name === 'email') {
            const validation = validateEmail(value);
            if (!validation.isValid) {
                setErrors(prev => ({ ...prev, email: validation.message || '' }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            // Reset form on success
            setFormData({
                name: '',
                email: '',
                phone: '',
                digitalHealthCardNumber: scannedCardNumber || generateHealthCardNumber(),
                address: '',
                dateOfBirth: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                bloodType: '',
                allergies: '',
                gender: '',
            });
            setErrors({});
        } catch (err) {
            // Error handling is done by parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                digitalHealthCardNumber: scannedCardNumber || generateHealthCardNumber(),
                address: '',
                dateOfBirth: '',
                emergencyContactName: '',
                emergencyContactPhone: '',
                bloodType: '',
                allergies: '',
                gender: '',
            });
            setErrors({});
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <Card>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Create New Patient Profile</h2>
                            <p className="text-sm text-slate-600 mt-1">
                                Patient not found. Please fill in the details to create a new profile.
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name *"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    error={errors.name}
                                />
                                <Input
                                    label="Email Address *"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john.doe@example.com"
                                    error={errors.email}
                                />
                                <Input
                                    label="Phone Number *"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+1-234-567-8900"
                                    error={errors.phone}
                                    helperText="Enter 10-digit phone number (e.g., 1234567890)"
                                />
                                <Input
                                    label="Health Card Number"
                                    name="digitalHealthCardNumber"
                                    value={formData.digitalHealthCardNumber}
                                    onChange={handleChange}
                                    placeholder="Auto-generated"
                                    disabled={true}
                                    helperText="Auto-generated unique health card number"
                                />
                            </div>
                        </div>

                        {/* Personal Details Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Personal Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Date of Birth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    error={errors.dateOfBirth}
                                />
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-slate-700">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                        <option value="Prefer not to say">Prefer not to say</option>
                                    </select>
                                </div>
                                <Input
                                    label="Blood Type"
                                    name="bloodType"
                                    value={formData.bloodType}
                                    onChange={handleChange}
                                    placeholder="O+, A-, B+, etc."
                                />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="123 Main Street, City, Country"
                                        rows={2}
                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                                            errors.address 
                                                ? 'border-red-300 focus:ring-red-500' 
                                                : 'border-slate-300 focus:ring-primary'
                                        }`}
                                    />
                                    {errors.address && (
                                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                                    )}
                                    {!errors.address && (
                                        <p className="mt-1 text-sm text-gray-500">Enter full address (optional)</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Medical Information Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Medical Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Known Allergies
                                    </label>
                                    <textarea
                                        name="allergies"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        placeholder="Penicillin, Peanuts, etc. (Leave blank if none)"
                                        rows={2}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact Section */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-4">Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Emergency Contact Name"
                                    name="emergencyContactName"
                                    value={formData.emergencyContactName}
                                    onChange={handleChange}
                                    placeholder="Jane Doe"
                                />
                                <Input
                                    label="Emergency Contact Phone"
                                    name="emergencyContactPhone"
                                    type="tel"
                                    value={formData.emergencyContactPhone}
                                    onChange={handleChange}
                                    placeholder="+1-234-567-8901"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="flex-1 bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Creating Profile...
                                    </span>
                                ) : (
                                    'Create Patient Profile'
                                )}
                            </Button>
                        </div>

                        <p className="text-xs text-slate-500 text-center">
                            * Required fields
                        </p>
                    </form>
                </Card>
            </div>
        </div>
    );
};
