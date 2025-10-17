/**
 * OTP Service
 * Frontend equivalent of backend's OtpVerificationService
 */

import { apiClient } from './apiClient';
import type {
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  OtpCheckResponse,
} from '../types/otp';

/**
 * OTP Service Interface
 * Defines the contract for OTP operations (Interface Segregation Principle)
 */
export interface IOtpService {
  sendOtp(request: OtpSendRequest): Promise<OtpSendResponse>;
  verifyOtp(request: OtpVerifyRequest): Promise<OtpVerifyResponse>;
  checkRecentVerification(patientId: number): Promise<OtpCheckResponse>;
}

/**
 * OTP Service Implementation
 * Matches backend controller endpoints exactly
 */
export class OtpService implements IOtpService {
  /**
   * Send OTP to patient's phone
   * POST /api/otp/send
   * 
   * @param request - OTP send request with patientId and staffUsername
   * @returns Promise with masked phone number and expiry time
   */
  async sendOtp(request: OtpSendRequest): Promise<OtpSendResponse> {
    return apiClient.post<OtpSendResponse>('/otp/send', request);
  }

  /**
   * Verify OTP code entered by staff
   * POST /api/otp/verify
   * 
   * @param request - OTP verification request with patientId, otpCode, and staffUsername
   * @returns Promise with verification result
   */
  async verifyOtp(request: OtpVerifyRequest): Promise<OtpVerifyResponse> {
    return apiClient.post<OtpVerifyResponse>('/otp/verify', request);
  }

  /**
   * Check if patient has recent verification (within 5 minutes)
   * GET /api/otp/check-verification?patientId={patientId}
   * 
   * @param patientId - Patient ID to check
   * @returns Promise with verification status
   */
  async checkRecentVerification(patientId: number): Promise<OtpCheckResponse> {
    return apiClient.get<OtpCheckResponse>(`/otp/check-verification?patientId=${patientId}`);
  }
}

/**
 * Singleton instance
 * Following Dependency Inversion Principle
 */
export const otpService = new OtpService();

/**
 * Create custom instance (for testing with mock apiClient)
 */
export const createOtpService = (): OtpService => {
  return new OtpService();
};
