import React, { useState } from 'react';
import { Card } from './ui';
import type { MedicalRecord, Prescription, TestResult, Vaccination } from '../types';
import { StethoscopeIcon } from './Icons';

/**
 * Props interface following Interface Segregation Principle
 */
interface MedicalRecordsDisplayProps {
    record: MedicalRecord;
}

/**
 * Helper function to format dates
 */
const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

/**
 * Helper function to format datetime
 */
const formatDateTime = (dateString: string): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * SectionHeader Component - Reusable section header
 * Follows Single Responsibility Principle
 */
const SectionHeader: React.FC<{ title: string; count?: number; icon?: React.ReactNode }> = ({
    title,
    count,
    icon,
}) => (
    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-primary-200">
        <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-lg font-semibold text-primary-800">{title}</h3>
            {count !== undefined && (
                <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {count}
                </span>
            )}
        </div>
    </div>
);

/**
 * LabResultCard Component - Displays individual lab results
 * Follows Single Responsibility Principle
 */
const LabResultCard: React.FC<{ result: TestResult }> = ({ result }) => {
    // Determine if result is abnormal (basic logic)
    const isAbnormal = result.notes?.toLowerCase().includes('high') || 
                       result.notes?.toLowerCase().includes('low') ||
                       result.notes?.toLowerCase().includes('abnormal');

    return (
        <div className={`p-4 rounded-lg border-2 ${
            isAbnormal ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
        }`}>
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h4 className="font-semibold text-slate-800">{result.testName}</h4>
                    <p className="text-xs text-slate-500">{formatDate(result.testDate)}</p>
                </div>
                {isAbnormal && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-semibold">
                        Abnormal
                    </span>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                <div>
                    <p className="text-xs text-slate-500">Result</p>
                    <p className="font-semibold text-slate-800">
                        {result.result} {result.resultUnit}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500">Reference Range</p>
                    <p className="font-semibold text-slate-800">{result.referenceRange}</p>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-xs text-slate-600">
                    <span className="font-medium">Ordered by:</span> {result.orderedBy} | 
                    <span className="font-medium"> Performed by:</span> {result.performedBy}
                </p>
                {result.notes && (
                    <p className="text-xs text-slate-600 mt-1">
                        <span className="font-medium">Notes:</span> {result.notes}
                    </p>
                )}
            </div>
        </div>
    );
};

/**
 * VisitHistoryCard Component - Displays visit history
 * Follows Single Responsibility Principle
 */
const VisitHistoryCard: React.FC<{ visit: MedicalRecord['previousVisits'][0] }> = ({ visit }) => {
    const statusColors = {
        COMPLETED: 'bg-green-100 text-green-800',
        CONFIRMED: 'bg-blue-100 text-blue-800',
        PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
        CANCELLED: 'bg-red-100 text-red-800',
    };

    return (
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-slate-800">
                        {formatDateTime(visit.visitDate)}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                        Appointment ID: #{visit.appointmentId}
                    </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-semibold ${statusColors[visit.status]}`}>
                    {visit.status.replace('_', ' ')}
                </span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <p className="text-xs text-slate-500">Provider</p>
                        <p className="font-medium text-slate-800">{visit.providerName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Specialty</p>
                        <p className="font-medium text-slate-800">{visit.specialty}</p>
                    </div>
                </div>
                <div className="mt-2">
                    <p className="text-xs text-slate-500">Hospital</p>
                    <p className="font-medium text-slate-800">{visit.hospitalName}</p>
                </div>
            </div>
        </div>
    );
};

/**
 * PrescriptionCard Component - Displays prescriptions
 * Follows Single Responsibility Principle
 */
const PrescriptionCard: React.FC<{ prescription: Prescription }> = ({ prescription }) => (
    <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="flex justify-between items-start mb-3">
            <div>
                <p className="text-sm font-semibold text-slate-800">
                    {formatDate(prescription.prescriptionDate)}
                </p>
                <p className="text-xs text-slate-600">Prescribed by: {prescription.prescribedBy}</p>
            </div>
        </div>

        <div className="space-y-2">
            <div>
                <p className="text-xs font-medium text-slate-600">Diagnosis</p>
                <p className="text-sm text-slate-800">{prescription.diagnosis}</p>
            </div>
            
            <div>
                <p className="text-xs font-medium text-slate-600">Medications</p>
                <p className="text-sm text-slate-800 font-semibold">{prescription.medications}</p>
            </div>

            <div>
                <p className="text-xs font-medium text-slate-600">Treatment</p>
                <p className="text-sm text-slate-800">{prescription.treatment}</p>
            </div>

            {prescription.notes && (
                <div>
                    <p className="text-xs font-medium text-slate-600">Notes</p>
                    <p className="text-sm text-slate-800">{prescription.notes}</p>
                </div>
            )}

            {prescription.followUpDate && (
                <div className="pt-2 border-t border-blue-300">
                    <p className="text-xs font-medium text-blue-700">
                        Follow-up: {formatDate(prescription.followUpDate)}
                    </p>
                </div>
            )}
        </div>
    </div>
);

/**
 * VaccinationCard Component - Displays vaccination records
 * Follows Single Responsibility Principle
 */
const VaccinationCard: React.FC<{ vaccination: Vaccination }> = ({ vaccination }) => (
    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h4 className="font-semibold text-slate-800">{vaccination.vaccineName}</h4>
                <p className="text-xs text-slate-500">{formatDate(vaccination.vaccinationDate)}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mt-3">
            <div>
                <p className="text-xs text-slate-500">Batch Number</p>
                <p className="font-semibold text-slate-800">{vaccination.batchNumber}</p>
            </div>
            <div>
                <p className="text-xs text-slate-500">Manufacturer</p>
                <p className="font-semibold text-slate-800">{vaccination.manufacturer}</p>
            </div>
        </div>

        <div className="mt-3 pt-3 border-t border-green-300">
            <p className="text-xs text-slate-600">
                <span className="font-medium">Administered by:</span> {vaccination.administeredBy}
            </p>
            {vaccination.nextDoseDate && (
                <p className="text-xs text-green-700 mt-1 font-semibold">
                    Next dose: {formatDate(vaccination.nextDoseDate)}
                </p>
            )}
            {vaccination.notes && (
                <p className="text-xs text-slate-600 mt-1">{vaccination.notes}</p>
            )}
        </div>
    </div>
);

/**
 * MedicalRecordsDisplay Component
 * 
 * Follows SOLID Principles:
 * - Single Responsibility: Only handles display of medical records data
 * - Open/Closed: Can be extended with new record types without modification
 * - Liskov Substitution: Sub-components can be replaced with alternatives
 * - Interface Segregation: Props are minimal and focused
 * - Dependency Inversion: Depends on MedicalRecord interface
 * 
 * Best Practices:
 * - Component composition for maintainability
 * - Consistent styling and layout
 * - Clear visual hierarchy
 * - Responsive design
 * - Accessible tabbed interface
 */
export const MedicalRecordsDisplay: React.FC<MedicalRecordsDisplayProps> = ({ record }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'labs' | 'visits' | 'prescriptions' | 'vaccinations'>('overview');

    const tabs = [
        { id: 'overview', label: 'Overview', count: null },
        { id: 'labs', label: 'Lab Results', count: record.testResults.length },
        { id: 'visits', label: 'Visit History', count: record.previousVisits.length },
        { id: 'prescriptions', label: 'Prescriptions', count: record.prescriptions.length },
        { id: 'vaccinations', label: 'Vaccinations', count: record.vaccinations.length },
    ] as const;

    return (
        <Card>
            <div className="flex items-center gap-2 mb-6">
                <StethoscopeIcon className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold text-slate-800">Medical Records</h2>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`${
                                    activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                                } px-2 py-0.5 rounded-full text-xs font-semibold`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-xs font-medium text-blue-600 uppercase">Total Visits</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">{record.previousVisits.length}</p>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-xs font-medium text-green-600 uppercase">Lab Tests</p>
                                <p className="text-3xl font-bold text-green-900 mt-1">{record.testResults.length}</p>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <p className="text-xs font-medium text-purple-600 uppercase">Prescriptions</p>
                                <p className="text-3xl font-bold text-purple-900 mt-1">{record.prescriptions.length}</p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-xs font-medium text-orange-600 uppercase">Vaccinations</p>
                                <p className="text-3xl font-bold text-orange-900 mt-1">{record.vaccinations.length}</p>
                            </div>
                        </div>

                        {/* Current Medications */}
                        {record.currentMedications.length > 0 && (
                            <div>
                                <SectionHeader title="Current Medications" count={record.currentMedications.length} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {record.currentMedications.filter(m => m.active).map((med) => (
                                        <div key={med.id} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                            <p className="font-semibold text-slate-800">{med.medicationName}</p>
                                            <p className="text-sm text-slate-600 mt-1">
                                                {med.dosage} - {med.frequency}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                Prescribed by: {med.prescribedBy}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity Summary */}
                        <div>
                            <SectionHeader title="Recent Activity" />
                            <div className="space-y-3">
                                {record.previousVisits.slice(0, 3).map((visit) => (
                                    <VisitHistoryCard key={visit.appointmentId} visit={visit} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Lab Results Tab */}
                {activeTab === 'labs' && (
                    <div>
                        <SectionHeader title="Laboratory Test Results" count={record.testResults.length} />
                        {record.testResults.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {record.testResults.map((result) => (
                                    <LabResultCard key={result.id} result={result} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <p className="text-slate-500">No lab results available</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Visit History Tab */}
                {activeTab === 'visits' && (
                    <div>
                        <SectionHeader title="Previous Visits" count={record.previousVisits.length} />
                        {record.previousVisits.length > 0 ? (
                            <div className="space-y-3">
                                {record.previousVisits.map((visit) => (
                                    <VisitHistoryCard key={visit.appointmentId} visit={visit} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <p className="text-slate-500">No visit history available</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Prescriptions Tab */}
                {activeTab === 'prescriptions' && (
                    <div>
                        <SectionHeader title="Prescription History" count={record.prescriptions.length} />
                        {record.prescriptions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {record.prescriptions.map((prescription) => (
                                    <PrescriptionCard key={prescription.id} prescription={prescription} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <p className="text-slate-500">No prescriptions available</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Vaccinations Tab */}
                {activeTab === 'vaccinations' && (
                    <div>
                        <SectionHeader title="Vaccination Records" count={record.vaccinations.length} />
                        {record.vaccinations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {record.vaccinations.map((vaccination) => (
                                    <VaccinationCard key={vaccination.id} vaccination={vaccination} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-slate-50 rounded-lg">
                                <p className="text-slate-500">No vaccination records available</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};
