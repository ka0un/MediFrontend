import React, { useState, useEffect, useCallback } from 'react';
import type { HealthcareProvider, TimeSlot, Appointment, AuthUser } from '../types';
import { PaymentMethod, HospitalType } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Input, Select } from './ui';
import VisitingCard from './VisitingCard';

const specialties = ["Cardiology", "Dermatology", "Neurology", "Pediatrics", "General Practice"];

// Helper: deterministic avatar per provider id
const getDoctorAvatar = (id: number) => `https://i.pravatar.cc/150?img=${(id % 70) + 1}`;

// Helper: fee by hospital type
const getFeeForHospitalType = (hospitalType: HospitalType) => hospitalType === HospitalType.GOVERNMENT ? 0 : 50;

// Helper: find next available slot for a provider within the next N days
async function findNextAvailableSlot(providerId: number, maxDays = 14): Promise<{ date: string; slot: TimeSlot; slotsForDate: TimeSlot[] } | null> {
    const now = new Date();
    for (let d = 0; d < maxDays; d++) {
        const date = new Date(now);
        date.setDate(now.getDate() + d);
        const isoDate = date.toISOString();
        try {
            const slots = await api.getTimeSlots(providerId, isoDate);
            // Prefer future slots and available ones
            const upcomingAvailable = slots
                .filter(s => s.available && new Date(s.startTime).getTime() >= now.getTime())
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            if (upcomingAvailable.length > 0) {
                return { date: isoDate.split('T')[0], slot: upcomingAvailable[0], slotsForDate: slots };
            }
            // If we're looking at a future day (d>0), we can accept first available on that day
            if (d > 0) {
                const anyAvailable = slots
                    .filter(s => s.available)
                    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                if (anyAvailable.length > 0) {
                    return { date: isoDate.split('T')[0], slot: anyAvailable[0], slotsForDate: slots };
                }
            }
        } catch (e) {
            // ignore and continue to next day
        }
    }
    return null;
}

export default function AppointmentManagement({ user, addNotification }: { user: AuthUser, addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [providers, setProviders] = useState<HealthcareProvider[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [specialtyFilter, setSpecialtyFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [bookingTimeSlot, setBookingTimeSlot] = useState<TimeSlot | null>(null);
    const [appointmentToPay, setAppointmentToPay] = useState<Appointment | null>(null);

    const [confirmation, setConfirmation] = useState<Appointment | null>(null);

    // Cache next available slot per provider to show in the list
    const [nextAvailableMap, setNextAvailableMap] = useState<Record<number, { date: string; slot: TimeSlot } | null>>({});

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
    }, [fetchProviders]);

    // After providers are loaded, prefetch next available slot for each to display in list
    useEffect(() => {
        let cancelled = false;
        async function loadNextAvailabilities() {
            const entries = await Promise.all(providers.map(async (p) => {
                const found = await findNextAvailableSlot(p.id).catch(() => null);
                return [p.id, found ? { date: found.date, slot: found.slot } : null] as const;
            }));
            if (!cancelled) {
                const map: Record<number, { date: string; slot: TimeSlot } | null> = {};
                for (const [id, value] of entries) map[id] = value;
                setNextAvailableMap(map);
            }
        }
        if (providers.length > 0) {
            loadNextAvailabilities();
        } else {
            setNextAvailableMap({});
        }
        return () => { cancelled = true; };
    }, [providers]);

    const handleSelectProvider = async (provider: HealthcareProvider) => {
        setSelectedProvider(provider);
        try {
            // Prefer next available date for this provider
            const next = await findNextAvailableSlot(provider.id);
            if (next) {
                setSelectedDate(next.date);
                // Refresh slots for that date to ensure we have all slots shown
                const isoDate = new Date(next.date).toISOString();
                const slots = await api.getTimeSlots(provider.id, isoDate);
                setTimeSlots(slots);
            } else {
                // Fallback to currently selected date
                const isoDate = new Date(selectedDate).toISOString();
                const slots = await api.getTimeSlots(provider.id, isoDate);
                setTimeSlots(slots);
            }
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
        if (!user.patientId || !selectedProvider || !bookingTimeSlot) {
            addNotification('error', 'An unexpected error occurred. Missing information.');
            return;
        }
        try {
            const result = await api.bookAppointment({
                patientId: user.patientId,
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
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to book appointment');
        }
    };

    const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if(!appointmentToPay) return;
        const formData = new FormData(e.currentTarget);
        try {
            const providerForPayment = providers.find(p => p.id === appointmentToPay.providerId) || selectedProvider;
            const amount = providerForPayment ? getFeeForHospitalType(providerForPayment.hospitalType) : 50;
            const paymentData = {
                appointmentId: appointmentToPay.id,
                amount,
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
                {/* Provider Cards */}
                <div className="md:col-span-1">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Find a Provider</h2>
                        <Select label="Filter by Specialty" value={specialtyFilter} onChange={e => setSpecialtyFilter(e.target.value)}>
                            <option value="">All Specialties</option>
                            {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <div className="mt-4 max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <p>Loading...</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {providers.map(p => {
                                        const isSelected = selectedProvider?.id === p.id;
                                        const fee = getFeeForHospitalType(p.hospitalType);
                                        const next = nextAvailableMap[p.id]?.slot || null;
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => handleSelectProvider(p)}
                                                className={`group border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white ${isSelected ? 'ring-2 ring-primary/60 shadow-md' : ''}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <img src={getDoctorAvatar(p.id)} alt={`Dr. ${p.name}`} className="h-12 w-12 rounded-full object-cover flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-semibold truncate">{p.name}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.hospitalType === HospitalType.GOVERNMENT ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                {p.hospitalType === HospitalType.GOVERNMENT ? 'Government' : 'Private'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 truncate">{p.specialty}</p>
                                                        <p className="text-xs text-slate-500 truncate">{p.hospitalName}</p>

                                                        <div className="mt-2 flex items-center justify-between">
                                                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${fee === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                                                                Fee: {fee === 0 ? 'Free' : `$${fee}`}
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                {next ? (
                                                                    <>Next: {new Date(next.startTime).toLocaleDateString()} {new Date(next.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                                                                ) : 'Next: —'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex gap-2">
                                                    <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleSelectProvider(p); }}>
                                                        Select {fee > 0 ? `• $${fee}` : '• Free'}
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
                {/* Time Slots */}
                <div className="md:col-span-2">
                    {selectedProvider ? (
                        <Card>
                            <h2 className="text-xl font-bold mb-2">Available Slots for {selectedProvider.name}</h2>
                            <p className="text-sm text-slate-500 mb-2">
                                {nextAvailableMap[selectedProvider.id]?.slot
                                    ? <>Next available: <strong>{new Date(nextAvailableMap[selectedProvider.id]!.slot.startTime).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</strong></>
                                    : 'No upcoming availability found in the next 2 weeks'}
                            </p>
                            <Input label="Select Date" type="date" value={selectedDate} onChange={handleDateChange} />
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
                                {timeSlots.length === 0 && (
                                    <p className="col-span-full text-sm text-slate-500">No slots available for this date.</p>
                                )}
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
                <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="secondary" onClick={() => setBookingTimeSlot(null)}>Cancel</Button>
                    <Button onClick={handleBookAppointment}>Book For {user.username}</Button>
                </div>
            </Modal>

            {/* Payment Modal */}
            <Modal isOpen={!!appointmentToPay} onClose={() => setAppointmentToPay(null)} title="Process Payment">
                <p>Appointment with <strong>{appointmentToPay?.providerName}</strong> requires payment.</p>
                {appointmentToPay && (
                    (() => {
                        const p = providers.find(x => x.id === appointmentToPay.providerId) || selectedProvider;
                        const amount = p ? getFeeForHospitalType(p.hospitalType) : 50;
                        return <p className="text-lg font-bold">Amount: {amount === 0 ? 'Free' : `$${amount.toFixed(2)}`}</p>;
                    })()
                )}
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
                    <p className="text-sm text-gray-500 mt-2 mb-4">Your appointment is confirmed. Please keep this visit card for your records.</p>
                </div>
                {confirmation && <VisitingCard appointment={confirmation} />}
                <div className="mt-6 text-center">
                    <Button onClick={() => setConfirmation(null)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
}