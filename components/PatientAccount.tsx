
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Patient, AuthUser } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Input, Spinner } from './ui';
import { validatePhoneNumber, validateAddress, validateEmail, validateRequired } from '../utils/validation';

type PatientFormData = Omit<Patient, 'id' | 'digitalHealthCardNumber'>;

export default function PatientAccount({ user, addNotification }: { user: AuthUser, addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Partial<PatientFormData>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        } catch (error) {
            addNotification('error', 'Failed to fetch your account details.');
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
            fetchPatientData(); // Refresh data after update
        } catch(error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to update profile.');
        }
    };
    
    if(isLoading) return <Spinner />;
    if(!patient) return <Card>Could not load your profile.</Card>;

    return (
        <div>
            <PageTitle>My Account</PageTitle>
            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required error={errors.name} />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required error={errors.email} />
                        <Input 
                            label="Phone" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            required 
                            error={errors.phone}
                            helperText="Enter 10-digit phone number (e.g., 1234567890)"
                        />
                        <Input label="Digital Health Card Number" name="digitalHealthCardNumber" value={patient.digitalHealthCardNumber} disabled />
                        <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                        <Input label="Blood Type" name="bloodType" value={formData.bloodType} onChange={handleChange} />
                        <Input 
                            label="Address" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            error={errors.address}
                            helperText="Enter full address (optional)"
                        />
                        <Input label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} />
                        <Input label="Emergency Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} />
                        <Input label="Emergency Contact Phone" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} />
                        <div className="md:col-span-2">
                            <Input label="Medical History" name="medicalHistory" value={formData.medicalHistory} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Update Profile</Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};
