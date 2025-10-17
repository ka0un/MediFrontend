
import React, { useState, useEffect, useCallback } from 'react';
import type { Patient } from '../types';
import * as api from '../services/api';
import { PageTitle, Button, Modal, Spinner, Input } from './ui';
import { validatePhoneNumber, validateAddress, validateEmail, validateRequired } from '../utils/validation';
import { PatientsIcon, EditIcon, TrashIcon, CalendarIcon } from './Icons';

type PatientFormData = Omit<Patient, 'id' | 'digitalHealthCardNumber'>;

export default function AdminPatients({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
    const [updatingPatient, setUpdatingPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Partial<PatientFormData>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleUpdate = async () => {
        if (!updatingPatient) return;
        
        // Validate form before submission
        if (!validateForm()) {
            addNotification('error', 'Please fix the validation errors before submitting.');
            return;
        }
        
        try {
            await api.updatePatient(updatingPatient.id, formData);
            addNotification('success', 'Patient updated successfully');
            setUpdatingPatient(null);
            setFormData({});
            setErrors({});
            fetchPatients();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to update patient');
        }
    };

    // Filter patients based on search term
    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm) ||
        patient.digitalHealthCardNumber.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <PatientsIcon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Patient Management</h1>
                            <p className="text-blue-100 mt-1">Manage all patient accounts and information</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{patients.length}</div>
                        <div className="text-blue-100 text-sm">Total Patients</div>
                    </div>
                </div>
            </div>

            {/* Search and Stats Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search patients by name, email, phone, or health card..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>{filteredPatients.length} patients found</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patients Table */}
            {isLoading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                    <Spinner />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-12">
                            <PatientsIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm ? 'No patients found' : 'No patients available'}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm 
                                    ? 'Try adjusting your search terms' 
                                    : 'Patients will appear here once they register'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Patient Information
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Contact Details
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Health Card
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredPatients.map((patient, index) => (
                                        <tr key={patient.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                            <span className="text-white font-semibold text-lg">
                                                                {patient.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-semibold text-gray-900">{patient.name}</div>
                                                        {patient.dateOfBirth && (
                                                            <div className="flex items-center text-sm text-gray-500 mt-1">
                                                                <CalendarIcon className="w-4 h-4 mr-1" />
                                                                {new Date(patient.dateOfBirth).toLocaleDateString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium text-gray-900">{patient.email}</div>
                                                    <div className="text-sm text-gray-500">{patient.phone}</div>
                                                    {patient.address && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs" title={patient.address}>
                                                            {patient.address}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {patient.digitalHealthCardNumber}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleUpdateClick(patient)}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                                    >
                                                        <EditIcon className="w-4 h-4 mr-1" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingPatient(patient)}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                                    >
                                                        <TrashIcon className="w-4 h-4 mr-1" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            <Modal isOpen={!!deletingPatient} onClose={() => setDeletingPatient(null)} title="Confirm Patient Deletion">
                <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                        <TrashIcon className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Patient Account</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Are you sure you want to delete <span className="font-semibold text-gray-900">{deletingPatient?.name}</span>? 
                        This action will permanently remove their account and cannot be undone.
                    </p>
                    <div className="flex justify-center space-x-3">
                        <Button variant="secondary" onClick={() => setDeletingPatient(null)}>Cancel</Button>
                        <Button variant="danger" onClick={handleDelete}>Delete Patient</Button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!updatingPatient} onClose={() => setUpdatingPatient(null)} title={`Edit Patient Information`}>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                                {updatingPatient?.name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{updatingPatient?.name}</h3>
                            <p className="text-sm text-gray-600">Health Card: {updatingPatient?.digitalHealthCardNumber}</p>
                        </div>
                    </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Full Name" 
                            name="name" 
                            value={formData.name || ''} 
                            onChange={handleFormChange} 
                            required 
                            error={errors.name}
                        />
                        <Input 
                            label="Email" 
                            name="email" 
                            type="email" 
                            value={formData.email || ''} 
                            onChange={handleFormChange} 
                            required 
                            error={errors.email}
                        />
                        <Input 
                            label="Phone" 
                            name="phone" 
                            value={formData.phone || ''} 
                            onChange={handleFormChange} 
                            required 
                            error={errors.phone}
                            helperText="Enter 10-digit phone number (e.g., 1234567890)"
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
                            error={errors.address}
                            helperText="Enter full address (optional)"
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

            <Modal isOpen={!!updatingPatient} onClose={() => setUpdatingPatient(null)} title={`Update Patient: ${updatingPatient?.name}`}>
                <form onSubmit={(e) => { e.preventDefault(); handleUpdate(); }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label="Full Name" 
                            name="name" 
                            value={formData.name || ''} 
                            onChange={handleFormChange} 
                            required 
                            error={errors.name}
                        />
                        <Input 
                            label="Email" 
                            name="email" 
                            type="email" 
                            value={formData.email || ''} 
                            onChange={handleFormChange} 
                            required 
                            error={errors.email}
                        />
                        <Input 
                            label="Phone" 
                            name="phone" 
                            value={formData.phone || ''} 
                            onChange={handleFormChange} 
                            required 
                            error={errors.phone}
                            helperText="Enter 10-digit phone number (e.g., 1234567890)"
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
                            error={errors.address}
                            helperText="Enter full address (optional)"
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
