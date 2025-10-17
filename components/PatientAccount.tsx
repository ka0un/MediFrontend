
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Patient, AuthUser } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Input, Spinner } from './ui';
import { validatePhoneNumber, validateAddress, validateEmail, validateRequired } from '../utils/validation';
import { UserIcon, HealthCardIcon, StethoscopeIcon, CalendarIcon, EditIcon, PlusIcon } from './Icons';

type PatientFormData = Omit<Patient, 'id' | 'digitalHealthCardNumber'>;

export default function PatientAccount({ user, addNotification }: { user: AuthUser, addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Partial<PatientFormData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeSection, setActiveSection] = useState<'personal' | 'medical' | 'payment'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isBackendDown, setIsBackendDown] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([
        { id: 1, type: 'Credit Card', last4: '4242', expiry: '12/25', isDefault: true },
        { id: 2, type: 'Debit Card', last4: '1234', expiry: '08/26', isDefault: false }
    ]);

    // Check if backend is down based on error type
    const checkBackendStatus = (error: any) => {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes('network') || 
                message.includes('fetch') || 
                message.includes('connection') ||
                message.includes('refused') ||
                message.includes('timeout') ||
                message.includes('unreachable')) {
                setIsBackendDown(true);
                return true;
            }
        }
        setIsBackendDown(false);
        return false;
    };

    const fetchPatientData = useCallback(async () => {
        if (!user.patientId) return;
        setIsLoading(true);
        try {
            const data = await api.getPatient(user.patientId);
            setPatient(data);
            setFormData({
                name: data.name,
                email: data.email,
                phone: data.phone,
                address: data.address || '',
                dateOfBirth: data.dateOfBirth || '',
                emergencyContactName: data.emergencyContactName || '',
                emergencyContactPhone: data.emergencyContactPhone || '',
                medicalHistory: data.medicalHistory || '',
                bloodType: data.bloodType || '',
                allergies: data.allergies || '',
            });
            setIsBackendDown(false); // Reset backend status on successful fetch
        } catch (error) {
            if (checkBackendStatus(error)) {
                addNotification('error', 'Unable to connect to the server. Please check your internet connection and try again later.');
            } else {
            addNotification('error', 'Failed to fetch your account details.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [user.patientId, addNotification]);

    useEffect(() => {
        fetchPatientData();
    }, [fetchPatientData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        // Validate required fields
        if (!formData.name) {
            newErrors.name = 'Full name is required';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else {
            const emailValidation = validateEmail(formData.email);
            if (!emailValidation.isValid) {
                newErrors.email = emailValidation.message || '';
            }
        }
        
        if (!formData.phone) {
            newErrors.phone = 'Phone number is required';
        } else {
            const phoneValidation = validatePhoneNumber(formData.phone);
            if (!phoneValidation.isValid) {
                newErrors.phone = phoneValidation.message || '';
            }
        }
        
        // Validate optional fields if they have values
        if (formData.address) {
            const addressValidation = validateAddress(formData.address);
            if (!addressValidation.isValid) {
                newErrors.address = addressValidation.message || '';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.patientId) return;
        
        // Validate form before submission
        if (!validateForm()) {
            addNotification('error', 'Please fix the validation errors before submitting.');
            return;
        }
        
        try {
            await api.updatePatient(user.patientId, formData);
            addNotification('success', 'Your profile has been updated successfully.');
            setErrors({});
            setIsEditing(false); // Exit edit mode on success
            setIsBackendDown(false); // Reset backend status on successful update
            fetchPatientData(); // Refresh data after update
        } catch(error) {
            if (checkBackendStatus(error)) {
                addNotification('error', 'Unable to save changes at this time. Please try again later.');
            } else {
            addNotification('error', error instanceof Error ? error.message : 'Failed to update profile.');
            }
        }
    };
    
    if(isLoading) return <Spinner />;
    if(!patient) return <Card>Could not load your profile.</Card>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Backend Down Banner */}
            {isBackendDown && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                <strong>Connection Issue:</strong> Unable to connect to the server. Some features may be limited. Please check your internet connection and try again later.
                            </p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => {
                                    setIsBackendDown(false);
                                    fetchPatientData();
                                }}
                                className="text-red-400 hover:text-red-600 text-sm font-medium"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <UserIcon className="w-8 h-8 text-white" />
                        </div>
        <div>
                            <h1 className="text-3xl font-bold">My Account</h1>
                            <p className="text-blue-100 mt-1">Manage your personal information and preferences</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{patient?.name}</div>
                        <div className="text-blue-100 text-sm">Patient Profile</div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-8 px-6">
                        <button
                            onClick={() => setActiveSection('personal')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeSection === 'personal'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <UserIcon className="w-5 h-5" />
                                <span>Personal Information</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveSection('medical')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeSection === 'medical'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <StethoscopeIcon className="w-5 h-5" />
                                <span>Medical Information</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveSection('payment')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                activeSection === 'payment'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                <span>Payment Options</span>
                            </div>
                        </button>
                    </nav>
                </div>
            </div>

            {/* Content Sections */}
            {activeSection === 'personal' && (
                <Card className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <UserIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                                <p className="text-sm text-gray-600">Update your personal details and contact information</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            disabled={isBackendDown}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors duration-200 ${
                                isBackendDown 
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                    : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                            }`}
                        >
                            <EditIcon className="w-4 h-4 mr-2" />
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Full Name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                                error={errors.name}
                                disabled={!isEditing}
                            />
                            <Input 
                                label="Email" 
                                name="email" 
                                type="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                                error={errors.email}
                                disabled={!isEditing}
                            />
                            <Input 
                                label="Phone" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                required 
                                error={errors.phone}
                                helperText="Enter 10-digit phone number (e.g., 1234567890)"
                                disabled={!isEditing}
                            />
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">Digital Health Card Number</label>
                                <div className="flex items-center space-x-3 p-3 bg-gray-50 border border-gray-300 rounded-lg">
                                    <HealthCardIcon className="w-5 h-5 text-gray-400" />
                                    <span className="text-gray-900 font-mono">{patient?.digitalHealthCardNumber}</span>
                                </div>
                            </div>
                            <Input 
                                label="Date of Birth" 
                                name="dateOfBirth" 
                                type="date" 
                                value={formData.dateOfBirth} 
                                onChange={handleChange}
                                disabled={!isEditing}
                            />
                            <Input 
                                label="Address" 
                                name="address" 
                                value={formData.address} 
                                onChange={handleChange} 
                                error={errors.address}
                                helperText="Enter full address (optional)"
                                disabled={!isEditing}
                            />
                        </div>
                        
                        {isEditing && (
                            <div className="flex justify-end pt-4 border-t border-gray-200">
                                <Button 
                                    type="submit" 
                                    className="px-6"
                                    disabled={isBackendDown}
                                >
                                    {isBackendDown ? 'Save Unavailable' : 'Save Changes'}
                                </Button>
                            </div>
                        )}
                    </form>
                </Card>
            )}

            {activeSection === 'medical' && (
                <Card className="mb-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <StethoscopeIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Medical Information</h2>
                            <p className="text-sm text-gray-600">Manage your medical details and emergency contacts</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Blood Type" 
                                name="bloodType" 
                                value={formData.bloodType} 
                                onChange={handleChange}
                                placeholder="O+, A-, B+, etc."
                            />
                            <Input 
                                label="Allergies" 
                                name="allergies" 
                                value={formData.allergies} 
                                onChange={handleChange}
                                placeholder="Penicillin, Peanuts, etc."
                            />
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
                                value={formData.emergencyContactPhone} 
                                onChange={handleChange}
                                placeholder="+1-234-567-8901"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                            <textarea
                                name="medicalHistory"
                                value={formData.medicalHistory}
                                onChange={(e) => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Enter your medical history, previous surgeries, chronic conditions, etc."
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-200">
                            <Button 
                                type="submit" 
                                className="px-6"
                                disabled={isBackendDown}
                            >
                                {isBackendDown ? 'Update Unavailable' : 'Update Medical Info'}
                            </Button>
                        </div>
                </form>
            </Card>
            )}

            {activeSection === 'payment' && (
                <Card className="mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Payment Options</h2>
                                <p className="text-sm text-gray-600">Manage your payment methods and billing preferences</p>
                            </div>
                        </div>
                        <button 
                            disabled={isBackendDown}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg transition-colors duration-200 ${
                                isBackendDown 
                                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                    : 'text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                            }`}
                        >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            {isBackendDown ? 'Add Unavailable' : 'Add Payment Method'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {paymentMethods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{method.type} ending in {method.last4}</div>
                                        <div className="text-sm text-gray-500">Expires {method.expiry}</div>
                                    </div>
                                    {method.isDefault && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        disabled={isBackendDown}
                                        className={`text-sm font-medium ${
                                            isBackendDown 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-blue-600 hover:text-blue-800'
                                        }`}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        disabled={isBackendDown}
                                        className={`text-sm font-medium ${
                                            isBackendDown 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : 'text-red-600 hover:text-red-800'
                                        }`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="text-sm font-medium text-blue-900">Billing Information</h3>
                                <p className="text-sm text-blue-700 mt-1">
                                    Your payment methods are securely stored and encrypted. You can update or remove them at any time.
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};
