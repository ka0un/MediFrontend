
import React, { useState } from 'react';
import type { MedicalRecord, AccessLog, AddPrescriptionPayload } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Input, Modal } from './ui';
import { HealthCardIcon } from './Icons';

const RecordSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-3 text-primary">{title}</h3>
        {children}
    </div>
);

export default function MedicalRecords({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [cardNumber, setCardNumber] = useState('');
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'record' | 'logs'>('record');
    const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
    
    const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

    const handleScanCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setRecord(null);
        try {
            const data = await api.scanDigitalHealthCard(cardNumber, 'STAFF-UI-001', 'General consultation from UI');
            setRecord(data);
            setActiveTab('record');
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to fetch medical record');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleViewLogs = async () => {
        if (!record) return;
        try {
            const logs = await api.getAccessLogs(record.patientId);
            setAccessLogs(logs);
            setActiveTab('logs');
        } catch (error) {
            addNotification('error', 'Failed to fetch access logs');
        }
    };
    
    const handleDownloadPdf = async () => {
        if (!record) return;
        try {
            await api.downloadMedicalRecordsPDF(record.patientId, 'STAFF-UI-001', 'Patient copy from UI');
            addNotification('success', 'Medical record PDF download started.');
        } catch (error) {
            addNotification('error', 'Failed to download PDF.');
        }
    };
    
    const handleAddPrescription = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!record) return;
        
        const formData = new FormData(e.currentTarget);
        const prescriptionData: AddPrescriptionPayload = {
            patientId: record.patientId,
            staffId: "DR-UI-001",
            diagnosis: formData.get('diagnosis') as string,
            treatment: formData.get('treatment') as string,
            notes: formData.get('notes') as string,
            medications: formData.get('medications') as string,
            followUpDate: formData.get('followUpDate') as string,
        };
        
        try {
            const updatedRecord = await api.addPrescription(prescriptionData);
            setRecord(updatedRecord);
            setIsPrescriptionModalOpen(false);
            addNotification('success', 'Prescription added successfully.');
        } catch(error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to add prescription.');
        }
    };

    return (
        <div>
            <PageTitle>Medical Records</PageTitle>
            <Card className="mb-6">
                <form onSubmit={handleScanCard} className="flex items-end space-x-2">
                    <div className="flex-grow">
                        <Input label="Scan Digital Health Card" id="cardNumber" value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="e.g., DHC-2025-001" />
                    </div>
                    <Button type="submit" disabled={isLoading || !cardNumber}>
                        {isLoading ? 'Loading...' : 'Access Records'}
                    </Button>
                </form>
            </Card>

            {record && (
                <Card>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{record.name}</h2>
                            <p className="text-slate-500">{record.email} | {record.phone}</p>
                            <p className="text-slate-500">DOB: {record.dateOfBirth}</p>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="secondary" onClick={handleDownloadPdf}>Download PDF</Button>
                            <Button variant="secondary" onClick={() => setIsPrescriptionModalOpen(true)}>Add Prescription</Button>
                        </div>
                    </div>
                    
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button onClick={() => setActiveTab('record')} className={`${activeTab === 'record' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Medical Record
                            </button>
                            <button onClick={handleViewLogs} className={`${activeTab === 'logs' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Access Logs
                            </button>
                        </nav>
                    </div>

                    <div className="pt-6">
                        {activeTab === 'record' ? (
                            <div>
                                <RecordSection title="Patient Information">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <p><strong>Health Card:</strong> {record.digitalHealthCardNumber}</p>
                                        <p><strong>Blood Type:</strong> {record.bloodType}</p>
                                        <p><strong>Allergies:</strong> {record.allergies}</p>
                                        <p><strong>Medical History:</strong> {record.medicalHistory}</p>
                                    </div>
                                </RecordSection>
                                <RecordSection title="Current Medications">
                                    {record.currentMedications.map(m => <div key={m.id} className="text-sm mb-2 p-2 bg-slate-50 rounded">{m.medicationName} {m.dosage}, {m.frequency}</div>)}
                                </RecordSection>
                                 <RecordSection title="Prescriptions">
                                    {record.prescriptions.map(p => <div key={p.id} className="text-sm mb-2 p-2 bg-slate-50 rounded"><strong>{p.prescriptionDate.split('T')[0]}:</strong> {p.diagnosis} - {p.medications}</div>)}
                                </RecordSection>
                            </div>
                        ) : (
                             <RecordSection title="Access History">
                                {accessLogs.map(log => (
                                    <div key={log.id} className="text-sm mb-2 p-2 bg-slate-50 rounded flex justify-between">
                                        <span><strong>{log.accessTimestamp.replace('T', ' ')}</strong> - {log.staffId} performed <strong>{log.accessType}</strong> for: "{log.purpose}"</span>
                                        <span className={`font-bold ${log.accessGranted ? 'text-green-600' : 'text-red-600'}`}>{log.accessGranted ? 'GRANTED' : 'DENIED'}</span>
                                    </div>
                                ))}
                             </RecordSection>
                        )}
                    </div>
                </Card>
            )}
             <Modal isOpen={isPrescriptionModalOpen} onClose={() => setIsPrescriptionModalOpen(false)} title={`Add Prescription for ${record?.name}`}>
                <form onSubmit={handleAddPrescription} className="space-y-4">
                    <Input name="diagnosis" label="Diagnosis" required/>
                    <Input name="medications" label="Medications" required/>
                    <Input name="treatment" label="Treatment Plan"/>
                    <Input name="notes" label="Notes"/>
                    <Input name="followUpDate" label="Follow-up Date" type="date"/>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" type="button" onClick={() => setIsPrescriptionModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Prescription</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
