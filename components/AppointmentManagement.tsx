
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Correctly import PaymentMethod as a value for use with enums, not just as a type.
import type { HealthcareProvider, TimeSlot, Patient, Appointment } from '../types';
import { PaymentMethod, HospitalType } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Input, Select } from './ui';
import { AppointmentsIcon, ChevronDownIcon } from './Icons';

const specialties = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "General Practice"];

export default function AppointmentManagement({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [providers, setProviders] = useState<HealthcareProvider[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [bookingPatientId, setBookingPatientId] = useState<string>('');
    const [bookingTimeSlot, setBookingTimeSlot] = useState<TimeSlot | null>(null);
    const [appointmentToPay, setAppointmentToPay] = useState<Appointment | null>(null);

    const [confirmation, setConfirmation] = useState<Appointment | null>(null);

    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getProviders(specialtyFilter);
            setProviders(data);
        } catch (error) {
            addNotification('error', 'Failed to fetch providers');
        } finally {
            setIsLoading(false);
        }
    }, [specialtyFilter, addNotification]);
    
    useEffect(() => {
        fetchProviders();
        api.getAllPatients().then(setPatients).catch(() => addNotification('error', 'Failed to fetch patients list.'));
    }, [fetchProviders, addNotification]);

    const handleSelectProvider = async (provider: HealthcareProvider) => {
        setSelectedProvider(provider);
        try {
            const isoDate = new Date(selectedDate).toISOString();
            const slots = await api.getTimeSlots(provider.id, isoDate);
            setTimeSlots(slots);
        } catch (error) {
            addNotification('error', 'Failed to fetch time slots');
        }
    };

    const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setSelectedDate(newDate);
        if (selectedProvider) {
            try {
                const isoDate = new Date(newDate).toISOString();
                const slots = await api.getTimeSlots(selectedProvider.id, isoDate);
                setTimeSlots(slots);
            } catch (error) {
                addNotification('error', 'Failed to fetch time slots');
            }
        }
    };

    const handleBookAppointment = async () => {
        if (!bookingPatientId || !selectedProvider || !bookingTimeSlot) {
            addNotification('error', 'Please select a patient and time slot.');
            return;
        }
        try {
            const result = await api.bookAppointment({
                patientId: Number(bookingPatientId),
                providerId: selectedProvider.id,
                timeSlotId: bookingTimeSlot.id,
            });

            if (result.paymentRequired) {
                setAppointmentToPay(result);
                addNotification('success', 'Appointment pending. Please complete payment.');
            } else {
                setConfirmation(result);
                addNotification('success', `Appointment confirmed! Confirmation #: ${result.confirmationNumber}`);
            }
            setBookingTimeSlot(null);
            setBookingPatientId('');
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to book appointment');
        }
    };

    const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!appointmentToPay) return;
        const formData = new FormData(e.currentTarget);
        try {
            const paymentData = {
                appointmentId: appointmentToPay.id,
                amount: 100.00, // Demo amount
                paymentMethod: formData.get('paymentMethod') as PaymentMethod,
                cardNumber: formData.get('cardNumber') as string,
                cvv: formData.get('cvv') as string,
            };
            const result = await api.processPayment(paymentData);
            setConfirmation(result);
            addNotification('success', 'Payment successful! Appointment confirmed.');
            setAppointmentToPay(null);
        } catch(error){
            addNotification('error', error instanceof Error ? error.message : 'Payment failed');
        }
    };

    return (
        <div>
            <PageTitle>Book an Appointment</PageTitle>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Provider List */}
                <div className="md:col-span-1">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Find a Provider</h2>
                        <Select label="Filter by Specialty" value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)}>
                            <option value="">All Specialties</option>
                            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                            {isLoading ? <p>Loading...</p> : providers.map(p => (
                                <div key={p.id} onClick={() => handleSelectProvider(p)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedProvider?.id === p.id ? 'bg-primary-100 ring-2 ring-primary' : 'hover:bg-slate-100'}`}>
                                    <p className="font-semibold">{p.name}</p>
                                    <p className="text-sm text-slate-600">{p.specialty}</p>
                                    <p className="text-sm text-slate-500">{p.hospitalName} ({p.hospitalType})</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
                {/* Time Slots */}
                <div className="md:col-span-2">
                    {selectedProvider ? (
                        <Card>
                            <h2 className="text-xl font-bold mb-4">Available Slots for {selectedProvider.name}</h2>
                            <Input label="Select Date" type="date" value={selectedDate} onChange={handleDateChange} />
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
                                {timeSlots.map(slot => (
                                    <Button
                                        key={slot.id}
                                        disabled={!slot.available}
                                        onClick={() => setBookingTimeSlot(slot)}
                                    >
                                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Button>
                                ))}
                            </div>
                        </Card>
                    ) : (
                        <Card className="flex items-center justify-center h-full">
                            <p className="text-slate-500">Select a provider to see available time slots.</p>
                        </Card>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            <Modal isOpen={!!bookingTimeSlot} onClose={() => setBookingTimeSlot(null)} title="Confirm Booking">
                <p>You are booking an appointment with <strong>{selectedProvider?.name}</strong> on <strong>{new Date(selectedDate).toDateString()}</strong> at <strong>{bookingTimeSlot && new Date(bookingTimeSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.</p>
                <div className="mt-4">
                    <Select label="Select Patient" value={bookingPatientId} onChange={e => setBookingPatientId(e.target.value)}>
                        <option value="">-- Select a Patient --</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="secondary" onClick={() => setBookingTimeSlot(null)}>Cancel</Button>
                    <Button onClick={handleBookAppointment}>Book</Button>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={!!appointmentToPay} onClose={() => setAppointmentToPay(null)} title="Process Payment">
                <p>Appointment with <strong>{appointmentToPay?.providerName}</strong> requires payment.</p>
                <p className="text-lg font-bold">Amount: $100.00</p>
                <form onSubmit={handlePayment} className="space-y-4 mt-4">
                    <Select name="paymentMethod" label="Payment Method" defaultValue={PaymentMethod.CREDIT_CARD}>
                        <option value={PaymentMethod.CREDIT_CARD}>Credit Card</option>
                        <option value={PaymentMethod.DEBIT_CARD}>Debit Card</option>
                    </Select>
                    <Input name="cardNumber" label="Card Number" required />
                    <Input name="cvv" label="CVV" required />
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="secondary" type="button" onClick={() => setAppointmentToPay(null)}>Cancel</Button>
                        <Button type="submit">Pay Now</Button>
                    </div>
                </form>
            </Modal>
            
            {/* Confirmation Modal */}
            <Modal isOpen={!!confirmation} onClose={() => setConfirmation(null)} title="Appointment Confirmed!">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Success!</h3>
                    <div className="mt-2 px-7 py-3">
                        <p className="text-sm text-gray-500">Your appointment is confirmed.</p>
                        <p className="font-semibold text-gray-800 mt-2">Confirmation Number:</p>
                        <p className="text-lg font-bold text-primary">{confirmation?.confirmationNumber}</p>
                    </div>
                    <div className="mt-4">
                        <Button onClick={() => setConfirmation(null)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
