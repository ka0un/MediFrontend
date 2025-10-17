
export enum HospitalType {
  GOVERNMENT = 'GOVERNMENT',
  PRIVATE = 'PRIVATE',
}

export enum AppointmentStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  ONLINE_BANKING = 'ONLINE_BANKING',
  WALLET = 'WALLET',
}

export enum AccessType {
    VIEW = 'VIEW',
    UPDATE = 'UPDATE',
    DOWNLOAD = 'DOWNLOAD'
}

export enum Role {
    ADMIN = 'ADMIN',
    PATIENT = 'PATIENT',
}

export interface AuthUser {
    userId: number;
    username: string;
    role: Role;
    patientId: number | null;
}


export interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  digitalHealthCardNumber: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  medicalHistory?: string;
  bloodType?: string;
  allergies?: string;
}

export interface HealthcareProvider {
  id: number;
  name: string;
  specialty: string;
  hospitalName: string;
  hospitalType: HospitalType;
}

export interface TimeSlot {
  id: number;
  providerId: number;
  providerName: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  providerId: number;
  providerName: string;
  specialty: string;
  appointmentTime: string;
  confirmationNumber: string;
  status: AppointmentStatus;
  paymentRequired: boolean;
  hospitalName: string;
}

export interface PaymentData {
    appointmentId: number;
    amount: number;
    paymentMethod: PaymentMethod;
    cardNumber: string;
    cvv: string;
}

export interface StatisticalReport {
    kpis: {
        totalVisits: number;
        confirmedAppointments: number;
        pendingPayments: number;
        cancelledAppointments: number;
        totalRevenue: number;
        averageWaitTime: number;
        appointmentCompletionRate: number;
    };
    dailyVisits: {
        date: string;
        visitCount: number;
        confirmedCount: number;
        cancelledCount: number;
    }[];
    departmentBreakdowns: {
        department: string;
        totalAppointments: number;
        confirmedAppointments: number;
        revenue: number;
        completionRate: number;
    }[];
    filters: ReportFilters;
    generatedAt: string;
    message?: string;
}

export interface AdminDashboardData {
    totalPatients: number;
    totalAppointments: number;
    recentPatients: Patient[];
    recentAppointments: Appointment[];
}


export interface ReportFilters {
    hospital?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    reportType?: string | null;
    granularity?: string | null;
}

export interface Medication {
    id: number;
    medicationName: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string | null;
    prescribedBy: string;
    notes: string;
    active: boolean;
}

export interface Prescription {
    id: number;
    prescribedBy: string;
    prescriptionDate: string;
    diagnosis: string;
    treatment: string;
    notes: string;
    medications: string;
    followUpDate: string | null;
}

export type AddPrescriptionPayload = Omit<Prescription, 'id' | 'prescribedBy' | 'prescriptionDate'> & { patientId: number; staffId: string; };

export interface TestResult {
    id: number;
    testName: string;
    testDate: string;
    result: string;
    resultUnit: string;
    referenceRange: string;
    orderedBy: string;
    performedBy: string;
    notes: string;
}

export interface Vaccination {
    id: number;
    vaccineName: string;
    vaccinationDate: string;
    batchNumber: string;
    manufacturer: string;
    administeredBy: string;
    nextDoseDate: string | null;
    notes: string;
}

export interface MedicalRecord {
    patientId: number;
    name: string;
    email: string;
    phone: string;
    digitalHealthCardNumber: string;
    address: string;
    dateOfBirth: string;
    bloodType: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    medicalHistory: string;
    allergies: string;
    currentMedications: Medication[];
    previousVisits: {
        appointmentId: number;
        visitDate: string;
        providerName: string;
        specialty: string;
        hospitalName: string;
        status: AppointmentStatus;
    }[];
    prescriptions: Prescription[];
    testResults: TestResult[];
    vaccinations: Vaccination[];
    accessedAt: string;
    accessedBy: string;
}

export interface AccessLog {
    id: number;
    patientId: number;
    staffId: string;
    accessType: AccessType;
    accessTimestamp: string;
    purpose: string;
    accessGranted: boolean;
    denialReason: string | null;
}

export interface Notification {
    id: number;
    type: 'success' | 'error' | 'patient-not-found';
    message: string;
    cardNumber?: string; // For patient not found notifications
    onAction?: () => void; // For clickable actions like "Create New Patient"
}

export interface UtilizationReport {
    id: number;
    reportName: string;
    reportDate: string;
    startDate: string;
    endDate: string;
    department?: string;
    doctor?: string;
    serviceCategory?: string;
    totalServices: number;
    totalPatients: number;
    averageUtilization: number;
    peakHours?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUtilizationReportPayload {
    reportName: string;
    startDate: string;
    endDate: string;
    department?: string;
    doctor?: string;
    serviceCategory?: string;
}

export interface UpdateUtilizationReportPayload {
    reportName?: string;
    startDate?: string;
    endDate?: string;
    department?: string;
    doctor?: string;
    serviceCategory?: string;
    notes?: string;
}
