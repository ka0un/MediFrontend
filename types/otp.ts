/**
 * OTP TypeScript Types
 * Matches backend DTOs for type safety and consistency
 */

/**
 * Request DTO for sending OTP
 * Matches: com.hapangama.medibackend.dto.OtpSendRequest
 */
export interface OtpSendRequest {
  patientId: number;
  staffUsername: string;
}

/**
 * Response DTO for OTP send operation
 * Matches: com.hapangama.medibackend.dto.OtpSendResponse
 */
export interface OtpSendResponse {
  success: boolean;
  message: string;
  phoneNumber: string;  // Masked phone number
  expiresAt: string;    // ISO 8601 datetime string
}

/**
 * Request DTO for verifying OTP
 * Matches: com.hapangama.medibackend.dto.OtpVerifyRequest
 */
export interface OtpVerifyRequest {
  patientId: number;
  otpCode: string;
  staffUsername: string;
}

/**
 * Response DTO for OTP verification
 * Matches: com.hapangama.medibackend.dto.OtpVerifyResponse
 */
export interface OtpVerifyResponse {
  success: boolean;
  message: string;
}

/**
 * Response DTO for checking recent verification
 * Matches: com.hapangama.medibackend.dto.OtpCheckResponse
 */
export interface OtpCheckResponse {
  verified: boolean;
  message: string;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  message: string;
  error?: string;
  timestamp?: string;
}
