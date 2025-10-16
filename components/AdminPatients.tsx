
import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types';
import * as api from '../services/api';
import { PageTitle, Button, Modal, Spinner } from './ui';

export default function AdminPatients({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

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
        </div>
    );
}
