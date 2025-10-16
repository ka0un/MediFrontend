import type { Patient, HealthcareProvider, TimeSlot, Appointment, PaymentData, StatisticalReport, ReportFilters, MedicalRecord, AccessLog, AddPrescriptionPayload, AuthUser, AdminDashboardData, AppointmentStatus, HospitalType } from '../types';

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
    return fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => handleResponse(res));
};

export const login = (credentials: {username: string, password: string}): Promise<AuthUser> => {
    return fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    }).then(res => handleResponse(res));
};

export const logout = (): Promise<{message: string}> => {
    return fetch(`${BASE_URL}/auth/logout`, { method: 'POST' }).then(res => handleResponse(res));
};


// UC-01: Appointment Management
export const getProviders = (specialty?: string): Promise<HealthcareProvider[]> => {
  const url = new URL(`${BASE_URL}/appointments/providers`);
  if (specialty) url.searchParams.append('specialty', specialty);
  return fetch(url.toString()).then(res => handleResponse(res));
};

export const getTimeSlots = (providerId: number, date: string): Promise<TimeSlot[]> => {
  const url = new URL(`${BASE_URL}/appointments/timeslots`);
  url.searchParams.append('providerId', providerId.toString());
  url.searchParams.append('date', date);
  return fetch(url.toString()).then(res => handleResponse(res));
};

export const bookAppointment = (data: { patientId: number; providerId: number; timeSlotId: number }): Promise<Appointment> => {
  return fetch(`${BASE_URL}/appointments/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => handleResponse(res));
};

export const processPayment = (data: PaymentData): Promise<Appointment> => {
  return fetch(`${BASE_URL}/appointments/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(res => handleResponse(res));
};

export const getAppointmentByConfirmation = (confirmationNumber: string): Promise<Appointment> => {
  return fetch(`${BASE_URL}/appointments/confirmation/${confirmationNumber}`).then(res => handleResponse(res));
};

export const getPatientAppointments = (patientId: number): Promise<Appointment[]> => {
  return fetch(`${BASE_URL}/appointments/patient/${patientId}`).then(res => handleResponse(res));
};

export const cancelAppointment = (appointmentId: number): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/appointments/${appointmentId}`, {
        method: 'DELETE'
    }).then(res => handleResponse(res));
};

// UC-02: Patient Account Management
export const getPatient = (patientId: number): Promise<Patient> => {
    return fetch(`${BASE_URL}/patients/${patientId}`).then(res => handleResponse(res));
};

export const updatePatient = (patientId: number, patientData: Partial<Omit<Patient, 'id' | 'digitalHealthCardNumber'>>): Promise<Patient> => {
    return fetch(`${BASE_URL}/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
    }).then(res => handleResponse(res));
};


// UC-03: Statistical Reports (Admin)
export const getStatisticalReport = (filters: ReportFilters): Promise<StatisticalReport> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
    });
    return fetch(`${BASE_URL}/reports?${params.toString()}`).then(res => handleResponse(res));
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
    return fetch(`${BASE_URL}/medical-records/${patientId}/access-logs`).then(res => handleResponse(res));
};

// Admin Endpoints
export const getAdminDashboard = (): Promise<AdminDashboardData> => {
    return fetch(`${BASE_URL}/admin/dashboard`).then(res => handleResponse(res));
};

export const getAdminPatients = (): Promise<Patient[]> => {
    return fetch(`${BASE_URL}/admin/patients`).then(res => handleResponse(res));
};

export const getAdminAppointments = (): Promise<Appointment[]> => {
    return fetch(`${BASE_URL}/admin/appointments`).then(res => handleResponse(res));
};

export const deletePatientByAdmin = (patientId: number): Promise<{message: string}> => {
    return fetch(`${BASE_URL}/admin/patients/${patientId}`, {
        method: 'DELETE'
    }).then(res => handleResponse(res));
};

export const cancelAppointmentByAdmin = (appointmentId: number): Promise<{message: string}> => {
    return fetch(`${BASE_URL}/admin/appointments/${appointmentId}`, {
        method: 'DELETE'
    }).then(res => handleResponse(res));
};

export const updateAppointmentStatusByAdmin = (appointmentId: number, status: AppointmentStatus): Promise<Appointment> => {
    return fetch(`${BASE_URL}/admin/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    }).then(res => handleResponse(res));
};

// Admin Provider Management
export const createProvider = (providerData: { name: string; specialty: string; hospitalName: string; hospitalType: HospitalType; }): Promise<HealthcareProvider> => {
    return fetch(`${BASE_URL}/admin/providers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData)
    }).then(res => handleResponse(res));
};

export const updateProvider = (providerId: number, providerData: Partial<{ name: string; specialty: string; hospitalName: string; hospitalType: HospitalType; }>): Promise<HealthcareProvider> => {
    return fetch(`${BASE_URL}/admin/providers/${providerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(providerData)
    }).then(res => handleResponse(res));
};

export const deleteProvider = (providerId: number): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/admin/providers/${providerId}`, {
        method: 'DELETE'
    }).then(res => handleResponse(res));
};

// Admin Time Slot Management
export const getProviderTimeSlots = (providerId: number): Promise<TimeSlot[]> => {
    return fetch(`${BASE_URL}/admin/providers/${providerId}/timeslots`).then(res => handleResponse(res));
};

export const createTimeSlot = (providerId: number, timeSlotData: { startTime: string; endTime: string; available: boolean }): Promise<TimeSlot> => {
    return fetch(`${BASE_URL}/admin/providers/${providerId}/timeslots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeSlotData)
    }).then(res => handleResponse(res));
};

export const updateTimeSlot = (timeSlotId: number, timeSlotData: Partial<{ startTime: string; endTime: string; available: boolean }>): Promise<TimeSlot> => {
    return fetch(`${BASE_URL}/admin/timeslots/${timeSlotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(timeSlotData)
    }).then(res => handleResponse(res));
};

export const deleteTimeSlot = (timeSlotId: number): Promise<{ message: string }> => {
    return fetch(`${BASE_URL}/admin/timeslots/${timeSlotId}`, {
        method: 'DELETE'
    }).then(res => handleResponse(res));
};
