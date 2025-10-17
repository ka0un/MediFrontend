import { useState, useCallback } from 'react';
import type { MedicalRecord } from '../types';
import * as api from '../services/api';

/**
 * Custom hook for managing medical records state and operations
 * Follows Single Responsibility Principle - handles only medical records business logic
 */
export const useMedicalRecords = () => {
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearRecord = useCallback(() => {
        setRecord(null);
        setError(null);
    }, []);

    const fetchRecordByPatientId = useCallback(async (
        patientId: number,
        staffId: string,
        purpose: string
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getMedicalRecordByPatientId(patientId, staffId, purpose);
            setRecord(data);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medical record';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const scanDigitalCard = useCallback(async (
        cardNumber: string,
        staffId: string,
        purpose: string
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.scanDigitalHealthCard(cardNumber, staffId, purpose);
            setRecord(data);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to scan card';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const downloadPDF = useCallback(async (
        patientId: number,
        staffId: string,
        purpose: string
    ) => {
        try {
            await api.downloadMedicalRecordsPDF(patientId, staffId, purpose);
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to download PDF';
            setError(errorMessage);
            throw err;
        }
    }, []);

    return {
        record,
        isLoading,
        error,
        fetchRecordByPatientId,
        scanDigitalCard,
        downloadPDF,
        clearRecord,
    };
};
