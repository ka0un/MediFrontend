/**
 * useOtpVerification Hook
 * Custom hook for OTP verification workflow
 * Follows Single Responsibility Principle - handles only OTP state and operations
 */

import { useState, useCallback } from 'react';
import { otpService } from '../services/otpService';
import type { OtpSendResponse, OtpVerifyResponse } from '../types/otp';

/**
 * OTP Verification state and operations
 */
export interface UseOtpVerificationResult {
  // State
  isLoading: boolean;
  error: string | null;
  maskedPhone: string | null;
  isVerified: boolean;
  
  // Operations
  sendOtp: (patientId: number, staffUsername: string) => Promise<OtpSendResponse>;
  verifyOtp: (patientId: number, otpCode: string, staffUsername: string) => Promise<OtpVerifyResponse>;
  checkRecentVerification: (patientId: number) => Promise<boolean>;
  resetState: () => void;
}

/**
 * Custom hook for OTP verification workflow
 * Encapsulates business logic following SRP
 */
export const useOtpVerification = (): UseOtpVerificationResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  /**
   * Send OTP to patient's phone
   */
  const sendOtp = useCallback(async (
    patientId: number,
    staffUsername: string
  ): Promise<OtpSendResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await otpService.sendOtp({ patientId, staffUsername });
      
      if (response.success) {
        setMaskedPhone(response.phoneNumber);
      } else {
        setError(response.message);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify OTP code
   */
  const verifyOtp = useCallback(async (
    patientId: number,
    otpCode: string,
    staffUsername: string
  ): Promise<OtpVerifyResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await otpService.verifyOtp({
        patientId,
        otpCode,
        staffUsername,
      });
      
      if (response.success) {
        setIsVerified(true);
      } else {
        setError(response.message);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if patient has recent verification
   */
  const checkRecentVerification = useCallback(async (
    patientId: number
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await otpService.checkRecentVerification(patientId);
      setIsVerified(response.verified);
      return response.verified;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check verification';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset all state
   */
  const resetState = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setMaskedPhone(null);
    setIsVerified(false);
  }, []);

  return {
    isLoading,
    error,
    maskedPhone,
    isVerified,
    sendOtp,
    verifyOtp,
    checkRecentVerification,
    resetState,
  };
};
