import type { Patient, HealthcareProvider, TimeSlot, Appointment, PaymentData, StatisticalReport, ReportFilters, MedicalRecord, AccessLog, AddPrescriptionPayload, AuthUser, AdminDashboardData, AppointmentStatus, HospitalType, UtilizationReport, CreateUtilizationReportPayload, UpdateUtilizationReportPayload, AuditPage, AuditLog } from '../types';
import { apiClient } from './apiClient';

// Legacy BASE_URL kept for file download functions that need direct fetch
const BASE_URL = 'http://localhost:8080/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred', error: 'An unknown error occurred' }));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
      return undefined as T;
  }
  if (response.headers.get('Content-Type')?.includes('application/json')) {
    return response.json();
  }
  return response.text() as T;
}


async function handleFileResponse(response: Response, defaultFilename: string) {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = defaultFilename;
    if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch.length > 1) {
            filename = filenameMatch[1];
        }
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

// UC-00: Authentication
export const register = (data: any): Promise<AuthUser> => {
    return apiClient.post<AuthUser>('/auth/register', data);
};

export const login = (credentials: {username: string, password: string}): Promise<AuthUser> => {
    return apiClient.post<AuthUser>('/auth/login', credentials);
};

export const logout = (): Promise<{message: string}> => {
    return apiClient.post<{message: string}>('/auth/logout');
};


// UC-01: Appointment Management
export const getProviders = (specialty?: string): Promise<HealthcareProvider[]> => {
  const endpoint = specialty ? `/appointments/providers?specialty=${specialty}` : '/appointments/providers';
  return apiClient.get<HealthcareProvider[]>(endpoint);
};

export const getTimeSlots = (providerId: number, date: string): Promise<TimeSlot[]> => {
  return apiClient.get<TimeSlot[]>(`/appointments/timeslots?providerId=${providerId}&date=${date}`);
};

export const bookAppointment = (data: { patientId: number; providerId: number; timeSlotId: number }): Promise<Appointment> => {
  return apiClient.post<Appointment>('/appointments/book', data);
};

export const processPayment = (data: PaymentData): Promise<Appointment> => {
  return apiClient.post<Appointment>('/appointments/payment', data);
};

export const getAppointmentByConfirmation = (confirmationNumber: string): Promise<Appointment> => {
  return apiClient.get<Appointment>(`/appointments/confirmation/${confirmationNumber}`);
};

export const getPatientAppointments = (patientId: number): Promise<Appointment[]> => {
  return apiClient.get<Appointment[]>(`/appointments/patient/${patientId}`);
};

export const cancelAppointment = (appointmentId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/appointments/${appointmentId}`);
};

// UC-02: Patient Account Management
export const getPatient = (patientId: number): Promise<Patient> => {
    return apiClient.get<Patient>(`/patients/${patientId}`);
};

export const updatePatient = (patientId: number, patientData: Partial<Omit<Patient, 'id' | 'digitalHealthCardNumber'>>): Promise<Patient> => {
    return apiClient.put<Patient>(`/patients/${patientId}`, patientData);
};

export const createPatient = (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
    return apiClient.post<Patient>('/patients', patientData);
};


// UC-03: Statistical Reports (Admin)
export const getStatisticalReport = (filters: ReportFilters): Promise<StatisticalReport> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
    });
    return apiClient.get<StatisticalReport>(`/reports?${params.toString()}`);
};

export const exportReport = (format: 'PDF' | 'CSV', filters: ReportFilters) => {
    return fetch(`${BASE_URL}/reports/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, filters })
    }).then(res => handleFileResponse(res, `report.${format.toLowerCase()}`));
};


// UC-04: Medical Records Access
export const scanDigitalHealthCard = (cardNumber: string, staffId: string, purpose: string): Promise<MedicalRecord> => {
    return fetch(`${BASE_URL}/medical-records/scan-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, staffId, purpose })
    }).then(res => handleResponse(res));
};

export const getMedicalRecordByPatientId = (patientId: number, staffId?: string, purpose?: string): Promise<MedicalRecord> => {
    const params = new URLSearchParams();
    if(staffId) params.append('staffId', staffId);
    if(purpose) params.append('purpose', purpose);
    return fetch(`${BASE_URL}/medical-records/${patientId}?${params.toString()}`).then(res => handleResponse(res));
};

export const addPrescription = (data: AddPrescriptionPayload): Promise<MedicalRecord> => {
    return fetch(`${BASE_URL}/medical-records/prescriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            prescribedBy: data.staffId,
        }),
    }).then(res => handleResponse(res));
};

export const downloadMedicalRecordsPDF = (patientId: number, staffId?: string, purpose?: string) => {
    const params = new URLSearchParams();
    if (staffId) params.append('staffId', staffId);
    if (purpose) params.append('purpose', purpose);
    return fetch(`${BASE_URL}/medical-records/${patientId}/download?${params.toString()}`)
        .then(res => handleFileResponse(res, `medical_record_${patientId}.pdf`));
};


export const getAccessLogs = (patientId: number): Promise<AccessLog[]> => {
    return apiClient.get<AccessLog[]>(`/medical-records/${patientId}/access-logs`);
};

// Admin Endpoints
export const getAdminDashboard = (): Promise<AdminDashboardData> => {
    return apiClient.get<AdminDashboardData>('/admin/dashboard');
};

export const getAdminPatients = (): Promise<Patient[]> => {
    return apiClient.get<Patient[]>('/admin/patients');
};

export const getAdminAppointments = (): Promise<Appointment[]> => {
    return apiClient.get<Appointment[]>('/admin/appointments');
};

export const deletePatientByAdmin = (patientId: number): Promise<{message: string}> => {
    return apiClient.delete<{message: string}>(`/admin/patients/${patientId}`);
};

export const cancelAppointmentByAdmin = (appointmentId: number): Promise<{message: string}> => {
    return apiClient.delete<{message: string}>(`/admin/appointments/${appointmentId}`);
};

export const updateAppointmentStatusByAdmin = (appointmentId: number, status: AppointmentStatus): Promise<Appointment> => {
    return apiClient.put<Appointment>(`/admin/appointments/${appointmentId}/status`, { status });
};

// Admin Provider Management
export const createProvider = (providerData: { name: string; specialty: string; hospitalName: string; hospitalType: HospitalType; }): Promise<HealthcareProvider> => {
    return apiClient.post<HealthcareProvider>('/admin/providers', providerData);
};

export const updateProvider = (providerId: number, providerData: Partial<{ name: string; specialty: string; hospitalName: string; hospitalType: HospitalType; }>): Promise<HealthcareProvider> => {
    return apiClient.put<HealthcareProvider>(`/admin/providers/${providerId}`, providerData);
};

export const deleteProvider = (providerId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/admin/providers/${providerId}`);
};

// Admin Time Slot Management
export const getProviderTimeSlots = (providerId: number): Promise<TimeSlot[]> => {
    return apiClient.get<TimeSlot[]>(`/admin/providers/${providerId}/timeslots`);
};

export const createTimeSlot = (providerId: number, timeSlotData: { startTime: string; endTime: string; available: boolean }): Promise<TimeSlot> => {
    return apiClient.post<TimeSlot>(`/admin/providers/${providerId}/timeslots`, timeSlotData);
};

export const updateTimeSlot = (timeSlotId: number, timeSlotData: Partial<{ startTime: string; endTime: string; available: boolean }>): Promise<TimeSlot> => {
    return apiClient.put<TimeSlot>(`/admin/timeslots/${timeSlotId}`, timeSlotData);
};

export const deleteTimeSlot = (timeSlotId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/admin/timeslots/${timeSlotId}`);
};

// Utilization Report CRUD Operations

/**
 * CREATE - Generate a new utilization report
 */
export const createUtilizationReport = (data: CreateUtilizationReportPayload): Promise<UtilizationReport> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => handleResponse(res));
};

/**
 * READ - Get all utilization reports
 */
export const getAllUtilizationReports = (): Promise<UtilizationReport[]> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports`).then(res => handleResponse(res));
};

/**
 * READ - Get a specific utilization report by ID
 */
export const getUtilizationReportById = (id: number): Promise<UtilizationReport> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports/${id}`).then(res => handleResponse(res));
};

/**
 * UPDATE - Modify an existing utilization report
 */
export const updateUtilizationReport = (id: number, data: UpdateUtilizationReportPayload): Promise<UtilizationReport> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => handleResponse(res));
};

/**
 * DELETE - Remove a utilization report
 */
export const deleteUtilizationReport = (id: number): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports/${id}`, {
        method: 'DELETE'
    }).then(res => handleResponse(res));
};

/**
 * READ - Filter reports by department
 */
export const getUtilizationReportsByDepartment = (department: string): Promise<UtilizationReport[]> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports/filter/department/${department}`).then(res => handleResponse(res));
};

/**
 * READ - Filter reports by doctor
 */
export const getUtilizationReportsByDoctor = (doctor: string): Promise<UtilizationReport[]> => {
    return fetch(`${BASE_URL}/analytics/utilization-reports/filter/doctor/${doctor}`).then(res => handleResponse(res));
};

// Audit API
export const queryAuditLogs = (filters: {
    userId?: number;
    username?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: string; // ISO-8601
    endDate?: string;   // ISO-8601
    page?: number;
    size?: number;
    sortBy?: string;
    sortDirection?: 'ASC' | 'DESC';
}): Promise<AuditPage> => {
    const params = new URLSearchParams();
    if (filters.userId !== undefined) params.append('userId', String(filters.userId));
    if (filters.username) params.append('username', filters.username);
    if (filters.action) params.append('action', filters.action);
    if (filters.entityType) params.append('entityType', filters.entityType);
    if (filters.entityId) params.append('entityId', filters.entityId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    params.append('page', String(filters.page ?? 0));
    params.append('size', String(Math.min(filters.size ?? 20, 100)));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    params.append('sortDirection', filters.sortDirection ?? 'DESC');
    return apiClient.get<AuditPage>(`/audit?${params.toString()}`);
};

export const getAuditByHash = (auditHash: string): Promise<AuditLog> => {
    return apiClient.get<AuditLog>(`/audit/${auditHash}`);
};

export const getAuditByEntity = (entityType: string, entityId: string, page = 0, size = 20): Promise<AuditPage> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<AuditPage>(`/audit/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}?${params.toString()}`);
};

export const getAuditByUser = (userId: number, page = 0, size = 20): Promise<AuditPage> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    return apiClient.get<AuditPage>(`/audit/user/${userId}?${params.toString()}`);
};
