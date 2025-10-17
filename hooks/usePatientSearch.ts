import { useState, useCallback } from 'react';

/**
 * Custom hook for managing patient search state
 * Follows Single Responsibility Principle - handles only search-related state
 */
export const usePatientSearch = () => {
    const [searchMethod, setSearchMethod] = useState<'qr' | 'manual'>('qr');
    const [patientId, setPatientId] = useState('');

    const resetSearch = useCallback(() => {
        setPatientId('');
    }, []);

    const validateSearch = useCallback((): { isValid: boolean; error?: string } => {
        if (searchMethod === 'manual' && !patientId.trim()) {
            return { isValid: false, error: 'Please enter a patient ID' };
        }
        return { isValid: true };
    }, [searchMethod, patientId]);

    return {
        searchMethod,
        setSearchMethod,
        patientId,
        setPatientId,
        resetSearch,
        validateSearch,
    };
};
