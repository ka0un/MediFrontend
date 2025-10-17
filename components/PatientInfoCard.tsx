import React from 'react';
import { Card, Button } from './ui';
import type { MedicalRecord } from '../types';

/**
 * Props interface following Interface Segregation Principle
 */
interface PatientInfoCardProps {
    record: MedicalRecord;
    onConfirmAccess?: () => void;
    showActions?: boolean;
}

/**
 * Helper function to format dates consistently
 * Follows DRY principle and makes code more maintainable
 */
const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Helper function to calculate age from date of birth
 */
const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

/**
 * InfoField Component - Reusable component for displaying label-value pairs
 * Follows Single Responsibility Principle
 */
const InfoField: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-1">{value || 'N/A'}</p>
    </div>
);

/**
 * PatientInfoCard Component
 * 
 * Follows SOLID Principles:
 * - Single Responsibility: Only displays patient information
 * - Open/Closed: Can be extended with new display fields without modification
 * - Liskov Substitution: Can be replaced with other patient info displays
 * - Interface Segregation: Props are minimal and focused
 * - Dependency Inversion: Depends on MedicalRecord interface, not concrete implementation
 * 
 * Best Practices:
 * - Uses semantic HTML for accessibility
 * - Consistent styling with design system
 * - Responsive grid layout
 * - Clear visual hierarchy
 */
export const PatientInfoCard: React.FC<PatientInfoCardProps> = ({
    record,
    onConfirmAccess,
    showActions = true,
}) => {
    const age = calculateAge(record.dateOfBirth);

    return (
        <Card>
            {/* Patient Header with Avatar */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    {/* Patient Avatar/Initial */}
                    <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold">
                        {record.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Patient Name and Basic Info */}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">{record.name}</h2>
                        <p className="text-sm text-slate-500">
                            Patient ID: <span className="font-mono font-semibold">{record.digitalHealthCardNumber}</span>
                        </p>
                        <p className="text-sm text-slate-500">
                            Date of Birth: {formatDate(record.dateOfBirth)} ({age} years old)
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                {showActions && onConfirmAccess && (
                    <Button onClick={onConfirmAccess} className="text-sm">
                        Verify Identity with OTP
                    </Button>
                )}
            </div>

            {/* Patient Information Grid */}
            <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Contact Information */}
                    <div>
                        <InfoField label="Email" value={record.email} />
                        <InfoField label="Phone" value={record.phone} />
                    </div>

                    {/* Medical Information */}
                    <div>
                        <InfoField label="Blood Type" value={record.bloodType} />
                        <InfoField label="Allergies" value={record.allergies} />
                    </div>

                    {/* Address */}
                    <div>
                        <InfoField label="Address" value={record.address} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="mt-6 pt-6 border-t">
                    <h4 className="text-md font-semibold text-slate-700 mb-3">Emergency Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField label="Name" value={record.emergencyContactName} />
                        <InfoField label="Phone" value={record.emergencyContactPhone} />
                    </div>
                </div>

                {/* Medical History */}
                {record.medicalHistory && (
                    <div className="mt-6 pt-6 border-t">
                        <h4 className="text-md font-semibold text-slate-700 mb-3">Medical History</h4>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.medicalHistory}</p>
                        </div>
                    </div>
                )}

                {/* Insurance Information */}
                <div className="mt-6 pt-6 border-t bg-blue-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Insurance</p>
                            <p className="text-sm font-semibold text-blue-900 mt-1">Government Coverage</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Last Updated</p>
                            <p className="text-sm font-semibold text-blue-900 mt-1">
                                {formatDate(record.accessedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
