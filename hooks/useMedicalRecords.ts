import { useState, useCallback, useEffect } from 'react';
import type { MedicalRecord } from '../types';
import * as api from '../services/api';
import { offlineStorage } from '../utils/offlineStorage';

/**
 * Custom hook for managing medical records state and operations
 * Follows Single Responsibility Principle - handles only medical records business logic
 * Includes offline access support (UC-04 A4)
 */
export const useMedicalRecords = () => {
    const [record, setRecord] = useState<MedicalRecord | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Initialize offline storage
    useEffect(() => {
        offlineStorage.init().catch(console.error);

        // Listen for online/offline events
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

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
            // Try network first
            const data = await api.getMedicalRecordByPatientId(patientId, staffId, purpose);
            setRecord(data);
            
            // Cache for offline access
            await offlineStorage.cacheMedicalRecord(data);
            
            return data;
        } catch (err) {
            // If offline, try cached data
            if (!navigator.onLine || isOffline) {
                console.log('Offline mode: fetching from cache');
                const cachedData = await offlineStorage.getCachedRecord(patientId);
                if (cachedData) {
                    setRecord(cachedData);
                    setError('Showing cached data (offline mode)');
                    return cachedData;
                }
            }
            
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch medical record';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isOffline]);

    const scanDigitalCard = useCallback(async (
        cardNumber: string,
        staffId: string,
        purpose: string
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            // Try network first
            const data = await api.scanDigitalHealthCard(cardNumber, staffId, purpose);
            setRecord(data);
            
            // Cache for offline access
            await offlineStorage.cacheMedicalRecord(data);
            
            return data;
        } catch (err) {
            // If offline, try cached data
            if (!navigator.onLine || isOffline) {
                console.log('Offline mode: fetching from cache by card number');
                const cachedData = await offlineStorage.getCachedRecordByCardNumber(cardNumber);
                if (cachedData) {
                    setRecord(cachedData);
                    setError('Showing cached data (offline mode)');
                    return cachedData;
                }
            }
            
            const errorMessage = err instanceof Error ? err.message : 'Failed to scan card';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [isOffline]);

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
        isOffline,
        fetchRecordByPatientId,
        scanDigitalCard,
        downloadPDF,
        clearRecord,
    };
};
