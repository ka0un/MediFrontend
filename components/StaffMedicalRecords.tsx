import React, { useState } from 'react';
import { PageTitle } from './ui';
import { PatientScanner } from './PatientScanner';
import { PatientInfoCard } from './PatientInfoCard';
import { MedicalRecordsDisplay } from './MedicalRecordsDisplay';
import { useMedicalRecords } from '../hooks/useMedicalRecords';
import { CreatePatientModal, CreatePatientData } from './CreatePatientModal';
import * as api from '../services/api';
import type { AuthUser } from '../types';

/**
 * Props interface following Interface Segregation Principle
 */
interface StaffMedicalRecordsProps {
    user: AuthUser;
    addNotification: (type: 'success' | 'error' | 'patient-not-found', message: string, options?: { cardNumber?: string, onAction?: () => void }) => void;
}

/**
 * StaffMedicalRecords Component
 * 
 * Main component for healthcare staff to access patient medical records
 * 
 * Follows SOLID Principles:
 * - Single Responsibility: Orchestrates the medical records workflow
 * - Open/Closed: Can be extended with new features without modification
 * - Liskov Substitution: Can be replaced with other record access interfaces
 * - Interface Segregation: Minimal props interface
 * - Dependency Inversion: Depends on hooks and child components (abstractions)
 * 
 * Best Practices:
 * - Component composition for maintainability
 * - Custom hooks for business logic separation
 * - Clear state management
 * - Proper error handling
 * - User feedback through notifications
 * 
 * Workflow:
 * 1. Staff scans patient card or enters patient ID
 * 2. System displays patient information for verification
 * 3. Staff confirms patient identity to access full medical records
 * 4. System displays comprehensive medical records with multiple tabs
 */
export const StaffMedicalRecords: React.FC<StaffMedicalRecordsProps> = ({
    user,
    addNotification,
}) => {
    const {
        record,
        isLoading,
        error,
        scanDigitalCard,
        fetchRecordByPatientId,
        downloadPDF,
        clearRecord,
    } = useMedicalRecords();

    // State to track if staff has confirmed patient identity
    const [isIdentityConfirmed, setIsIdentityConfirmed] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [notFoundCardNumber, setNotFoundCardNumber] = useState<string>('');

    // Get staff ID from user (use username as staff ID for demo)
    const staffId = user.username;

    /**
     * Handle QR code scan or card number entry
     */
    const handleScanSuccess = async (cardNumber: string, purpose: string) => {
        try {
            await scanDigitalCard(cardNumber, staffId, purpose);
            setIsIdentityConfirmed(false); // Reset confirmation on new search
            addNotification('success', 'Patient record retrieved successfully');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to scan card';
            
            // Check if error is "patient not found"
            if (errorMessage.toLowerCase().includes('not found') || 
                errorMessage.toLowerCase().includes('404') ||
                errorMessage.toLowerCase().includes('no patient')) {
                // Store card number for modal
                setNotFoundCardNumber(cardNumber);
                
                // Show special notification with create button
                addNotification('patient-not-found', errorMessage, {
                    cardNumber: cardNumber,
                    onAction: () => setShowCreateModal(true)
                });
            } else {
                // Show regular error notification
                addNotification('error', errorMessage);
            }
            
            // Don't re-throw - we've handled the error with notification
        }
    };

    /**
     * Handle manual patient ID search
     */
    const handleManualSearch = async (patientIdStr: string, purpose: string) => {
        try {
            // Extract numeric ID from patient ID string (e.g., "HBC-12345" -> 12345)
            const numericId = parseInt(patientIdStr.replace(/\D/g, ''), 10);
            
            if (isNaN(numericId)) {
                throw new Error('Invalid patient ID format');
            }

            await fetchRecordByPatientId(numericId, staffId, purpose);
            setIsIdentityConfirmed(false); // Reset confirmation on new search
            addNotification('success', 'Patient record retrieved successfully');
        } catch (err) {
            addNotification('error', err instanceof Error ? err.message : 'Failed to fetch patient record');
        }
    };

    /**
     * Handle patient identity confirmation
     * This is a critical step in the workflow to ensure proper patient identification
     */
    const handleConfirmIdentity = () => {
        setIsIdentityConfirmed(true);
        addNotification('success', 'Patient identity confirmed. Access granted to medical records.');
    };

    /**
     * Handle PDF download
     */
    const handleDownloadPDF = async () => {
        if (!record) return;
        
        try {
            await downloadPDF(record.patientId, staffId, 'Staff downloading medical records PDF');
            addNotification('success', 'Medical record PDF downloaded successfully');
        } catch (err) {
            addNotification('error', err instanceof Error ? err.message : 'Failed to download PDF');
        }
    };

    /**
     * Handle starting a new search
     */
    const handleNewSearch = () => {
        clearRecord();
        setIsIdentityConfirmed(false);
    };

    /**
     * Handle creating a new patient profile
     */
    const handleCreatePatient = async (patientData: CreatePatientData) => {
        try {
            const newPatient = await api.createPatient(patientData);
            setShowCreateModal(false);
            addNotification('success', `Patient profile created successfully! Patient ID: ${newPatient.id}`);
            
            // Auto-search the newly created patient
            if (patientData.digitalHealthCardNumber) {
                const purpose = 'Medical record access';
                await handleScanSuccess(patientData.digitalHealthCardNumber, purpose);
            }
            
            return newPatient;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create patient profile';
            addNotification('error', errorMessage);
            throw err;
        }
    };

    return (
        <div className="space-y-6">
            <PageTitle>Medical Records Access</PageTitle>

            {/* Display any errors */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Patient Scanner - Always visible for new searches */}
            {!record && (
                <PatientScanner
                    staffId={staffId}
                    onScanSuccess={handleScanSuccess}
                    onManualSearch={handleManualSearch}
                    isLoading={isLoading}
                />
            )}

            {/* Patient Information Card - Shown after successful search */}
            {record && !isIdentityConfirmed && (
                <div>
                    <PatientInfoCard
                        record={record}
                        onConfirmAccess={handleConfirmIdentity}
                        onDownloadPDF={handleDownloadPDF}
                        showActions={true}
                    />
                    
                    {/* New Search Button */}
                    <div className="mt-4 flex justify-center">
                        <button
                            onClick={handleNewSearch}
                            className="text-primary hover:text-primary-700 text-sm font-medium underline"
                        >
                            Search for a different patient
                        </button>
                    </div>
                </div>
            )}

            {/* Medical Records Display - Shown after identity confirmation */}
            {record && isIdentityConfirmed && (
                <div>
                    {/* Patient Info Summary Bar */}
                    <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-primary-800">
                                    Viewing records for: <span className="font-bold">{record.name}</span>
                                </p>
                                <p className="text-xs text-primary-600 mt-1">
                                    Patient ID: {record.digitalHealthCardNumber} | 
                                    Last accessed: {new Date(record.accessedAt).toLocaleString()}
                                </p>
                            </div>
                            <button
                                onClick={handleNewSearch}
                                className="text-primary-700 hover:text-primary-900 text-sm font-medium underline"
                            >
                                New Search
                            </button>
                        </div>
                    </div>

                    {/* Medical Records */}
                    <MedicalRecordsDisplay record={record} />
                </div>
            )}

            {/* Help Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Important Information</h3>
                <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                    <li>All access to patient medical records is logged for security and compliance</li>
                    <li>Enter the patient's ID to retrieve their medical records</li>
                    <li>Always verify patient identity before confirming access</li>
                    <li>Patient consent is required for sharing records with third parties</li>
                    <li>Report any unauthorized access attempts immediately</li>
                </ul>
            </div>

            {/* Create Patient Modal */}
            <CreatePatientModal
                isOpen={showCreateModal}
                scannedCardNumber={notFoundCardNumber}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreatePatient}
            />
        </div>
    );
};

export default StaffMedicalRecords;
