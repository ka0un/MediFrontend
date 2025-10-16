
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Patient, AuthUser } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Input, Spinner } from './ui';

type PatientFormData = Omit<Patient, 'id' | 'digitalHealthCardNumber'>;

export default function PatientAccount({ user, addNotification }: { user: AuthUser, addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Partial<PatientFormData>>({});
    const [isLoading, setIsLoading] = useState(true);

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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user.patientId) return;
        try {
            await api.updatePatient(user.patientId, formData);
            addNotification('success', 'Your profile has been updated successfully.');
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
                        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                        <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
                        <Input label="Digital Health Card Number" name="digitalHealthCardNumber" value={patient.digitalHealthCardNumber} disabled />
                        <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} />
                        <Input label="Blood Type" name="bloodType" value={formData.bloodType} onChange={handleChange} />
                        <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
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
