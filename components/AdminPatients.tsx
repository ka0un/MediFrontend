
import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types';
import * as api from '../services/api';
import { PageTitle, Button, Modal, Spinner, Input } from './ui';

type PatientFormData = Omit<Patient, 'id' | 'digitalHealthCardNumber'>;

export default function AdminPatients({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [updatingPatient, setUpdatingPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Partial<PatientFormData>>({});

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getAdminPatients();
            setPatients(data);
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to fetch patients');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const handleDelete = async () => {
        if (!deletingPatient) return;
        try {
            await api.deletePatientByAdmin(deletingPatient.id);
            addNotification('success', 'Patient deleted successfully');
            setDeletingPatient(null);
            fetchPatients();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to delete patient');
            setDeletingPatient(null);
        }
    };

    const handleUpdateClick = (patient: Patient) => {
        setUpdatingPatient(patient);
        setFormData({
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            address: patient.address || '',
            dateOfBirth: patient.dateOfBirth || '',
            emergencyContactName: patient.emergencyContactName || '',
            emergencyContactPhone: patient.emergencyContactPhone || '',
            medicalHistory: patient.medicalHistory || '',
            bloodType: patient.bloodType || '',
            allergies: patient.allergies || '',
        });
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        if (!updatingPatient) return;
        try {
            await api.updatePatient(updatingPatient.id, formData);
            addNotification('success', 'Patient updated successfully');
            setUpdatingPatient(null);
            setFormData({});
            fetchPatients();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to update patient');
        }
    };

    return (
        <div>
            <PageTitle>All Patient Accounts</PageTitle>
            {isLoading ? <Spinner /> : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Card #</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {patients.map(patient => (
                                <tr key={patient.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{patient.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.digitalHealthCardNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <Button variant="primary" onClick={() => handleUpdateClick(patient)}>Update</Button>
                                        <Button variant="danger" onClick={() => setDeletingPatient(patient)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal isOpen={!!deletingPatient} onClose={() => setDeletingPatient(null)} title="Confirm Deletion">
                <p>Are you sure you want to delete patient {deletingPatient?.name}? This action will permanently remove their account and cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setDeletingPatient(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete Patient</Button>
                </div>
            </Modal>

            <Modal isOpen={!!updatingPatient} onClose={() => setUpdatingPatient(null)} title={`Update Patient: ${updatingPatient?.name}`}>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Full Name" 
                            name="name" 
                            value={formData.name || ''} 
                            onChange={handleFormChange} 
                            required 
                        />
                        <Input 
                            label="Email" 
                            name="email" 
                            type="email" 
                            value={formData.email || ''} 
                            onChange={handleFormChange} 
                            required 
                        />
                        <Input 
                            label="Phone" 
                            name="phone" 
                            value={formData.phone || ''} 
                            onChange={handleFormChange} 
                            required 
                        />
                        <Input 
                            label="Digital Health Card Number" 
                            name="digitalHealthCardNumber" 
                            value={updatingPatient?.digitalHealthCardNumber || ''} 
                            disabled 
                        />
                        <Input 
                            label="Date of Birth" 
                            name="dateOfBirth" 
                            type="date" 
                            value={formData.dateOfBirth || ''} 
                            onChange={handleFormChange} 
                        />
                        <Input 
                            label="Blood Type" 
                            name="bloodType" 
                            value={formData.bloodType || ''} 
                            onChange={handleFormChange} 
                        />
                        <Input 
                            label="Address" 
                            name="address" 
                            value={formData.address || ''} 
                            onChange={handleFormChange} 
                        />
                        <Input 
                            label="Allergies" 
                            name="allergies" 
                            value={formData.allergies || ''} 
                            onChange={handleFormChange} 
                        />
                        <Input 
                            label="Emergency Contact Name" 
                            name="emergencyContactName" 
                            value={formData.emergencyContactName || ''} 
                            onChange={handleFormChange} 
                        />
                        <Input 
                            label="Emergency Contact Phone" 
                            name="emergencyContactPhone" 
                            value={formData.emergencyContactPhone || ''} 
                            onChange={handleFormChange} 
                        />
                        <div className="md:col-span-2">
                            <Input 
                                label="Medical History" 
                                name="medicalHistory" 
                                value={formData.medicalHistory || ''} 
                                onChange={handleFormChange} 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" onClick={() => setUpdatingPatient(null)}>Cancel</Button>
                        <Button type="submit">Update Patient</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
