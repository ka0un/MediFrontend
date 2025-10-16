
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Patient } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Input } from './ui';
import { PatientsIcon } from './Icons';

type PatientFormData = Omit<Patient, 'id'>;

const PatientForm = ({ patient, onSave, onCancel }: { patient?: Patient | null; onSave: (patient: PatientFormData) => void; onCancel: () => void; }) => {
    const [formData, setFormData] = useState<PatientFormData>({
        name: '', email: '', phone: '', digitalHealthCardNumber: '', address: '', dateOfBirth: '',
        emergencyContactName: '', emergencyContactPhone: '', medicalHistory: '', bloodType: '', allergies: ''
    });

    useEffect(() => {
        if (patient) {
            setFormData({
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                digitalHealthCardNumber: patient.digitalHealthCardNumber,
                address: patient.address || '',
                dateOfBirth: patient.dateOfBirth || '',
                emergencyContactName: patient.emergencyContactName || '',
                emergencyContactPhone: patient.emergencyContactPhone || '',
                medicalHistory: patient.medicalHistory || '',
                bloodType: patient.bloodType || '',
                allergies: patient.allergies || '',
            });
        }
    }, [patient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const isEditMode = useMemo(() => !!patient, [patient]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
                <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
                <Input label="Digital Health Card Number" name="digitalHealthCardNumber" value={formData.digitalHealthCardNumber} onChange={handleChange} required disabled={isEditMode}/>
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
            <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">{isEditMode ? 'Update Patient' : 'Create Patient'}</Button>
            </div>
        </form>
    );
};


export default function PatientManagement({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

    const fetchPatients = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getAllPatients();
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

    const handleCreate = () => {
        setEditingPatient(null);
        setIsModalOpen(true);
    };
    
    const handleEdit = (patient: Patient) => {
        setEditingPatient(patient);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingPatient) return;
        try {
            await api.deletePatient(deletingPatient.id);
            addNotification('success', 'Patient deleted successfully');
            setDeletingPatient(null);
            fetchPatients();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to delete patient');
        }
    };
    
    const handleSave = async (data: PatientFormData) => {
        try {
            if (editingPatient) {
                await api.updatePatient(editingPatient.id, data);
                addNotification('success', 'Patient updated successfully');
            } else {
                await api.createPatient(data);
                addNotification('success', 'Patient created successfully');
            }
            setIsModalOpen(false);
            fetchPatients();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to save patient');
        }
    };

    return (
        <div>
            <PageTitle actions={<Button onClick={handleCreate}>Create Patient</Button>}>Patient Management</PageTitle>
            {isLoading ? <p>Loading...</p> : (
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
                                        <Button variant="secondary" onClick={() => handleEdit(patient)}>Edit</Button>
                                        <Button variant="danger" onClick={() => setDeletingPatient(patient)}>Delete</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPatient ? 'Edit Patient' : 'Create Patient'}>
                <PatientForm patient={editingPatient} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
            <Modal isOpen={!!deletingPatient} onClose={() => setDeletingPatient(null)} title="Confirm Deletion">
                <p>Are you sure you want to delete patient {deletingPatient?.name}? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setDeletingPatient(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDelete}>Delete</Button>
                </div>
            </Modal>
        </div>
    );
}
