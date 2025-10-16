import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { HealthcareProvider, TimeSlot } from '../types';
import { HospitalType } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Modal, Spinner, Input, Select } from './ui';
import { PlusIcon, EditIcon, TrashIcon, CalendarIcon } from './Icons';

export default function ProviderManagement({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [view, setView] = useState<'providers' | 'timeslots'>('providers');
    const [providers, setProviders] = useState<HealthcareProvider[]>([]);
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modal states
    const [providerModalOpen, setProviderModalOpen] = useState(false);
    const [providerToEdit, setProviderToEdit] = useState<HealthcareProvider | null>(null);
    const [providerToDelete, setProviderToDelete] = useState<HealthcareProvider | null>(null);
    const [timeSlotModalOpen, setTimeSlotModalOpen] = useState(false);
    const [timeSlotToEdit, setTimeSlotToEdit] = useState<TimeSlot | null>(null);
    const [timeSlotToDelete, setTimeSlotToDelete] = useState<TimeSlot | null>(null);

    // Filter states
    const [filters, setFilters] = useState({ name: '', specialty: '', hospital: '', type: '' });

    // Fetching providers
    const fetchProviders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getProviders();
            setProviders(data);
        } catch (error) {
            addNotification('error', 'Failed to fetch providers');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (view === 'providers') {
            fetchProviders();
        }
    }, [view, fetchProviders]);

    // Fetching time slots
    const fetchTimeSlots = useCallback(async () => {
        if (!selectedProvider) return;
        setIsLoading(true);
        try {
            const data = await api.getProviderTimeSlots(selectedProvider.id);
            setTimeSlots(data);
        } catch (error) {
            addNotification('error', `Failed to fetch time slots for ${selectedProvider.name}`);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProvider, addNotification]);

    useEffect(() => {
        if (view === 'timeslots') {
            fetchTimeSlots();
        }
    }, [view, fetchTimeSlots]);


    // Provider CRUD handlers
    const handleSaveProvider = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            specialty: formData.get('specialty') as string,
            hospitalName: formData.get('hospitalName') as string,
            hospitalType: formData.get('hospitalType') as HospitalType,
        };

        try {
            if (providerToEdit) {
                await api.updateProvider(providerToEdit.id, data);
                addNotification('success', 'Provider updated successfully');
            } else {
                await api.createProvider(data);
                addNotification('success', 'Provider created successfully');
            }
            setProviderModalOpen(false);
            setProviderToEdit(null);
            fetchProviders();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to save provider');
        }
    };

    const handleDeleteProvider = async () => {
        if (!providerToDelete) return;
        try {
            await api.deleteProvider(providerToDelete.id);
            addNotification('success', 'Provider deleted successfully');
            setProviderToDelete(null);
            fetchProviders();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to delete provider');
        }
    };
    
    // Time Slot CRUD handlers
    const handleSaveTimeSlot = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedProvider) return;

        const formData = new FormData(e.currentTarget);
        const data = {
            startTime: new Date(formData.get('startTime') as string).toISOString(),
            endTime: new Date(formData.get('endTime') as string).toISOString(),
            available: (formData.get('available') as string) === 'on',
        };

        try {
            if (timeSlotToEdit) {
                await api.updateTimeSlot(timeSlotToEdit.id, data);
                addNotification('success', 'Time slot updated successfully');
            } else {
                await api.createTimeSlot(selectedProvider.id, data);
                addNotification('success', 'Time slot created successfully');
            }
            setTimeSlotModalOpen(false);
            setTimeSlotToEdit(null);
            fetchTimeSlots();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to save time slot');
        }
    };

    const handleDeleteTimeSlot = async () => {
        if (!timeSlotToDelete) return;
        try {
            await api.deleteTimeSlot(timeSlotToDelete.id);
            addNotification('success', 'Time slot deleted successfully');
            setTimeSlotToDelete(null);
            fetchTimeSlots();
        } catch (error) {
            addNotification('error', error instanceof Error ? error.message : 'Failed to delete time slot');
        }
    };

    // Filtering logic
    const filteredProviders = useMemo(() => {
        return providers.filter(p => 
            p.name.toLowerCase().includes(filters.name.toLowerCase()) &&
            p.specialty.toLowerCase().includes(filters.specialty.toLowerCase()) &&
            p.hospitalName.toLowerCase().includes(filters.hospital.toLowerCase()) &&
            (filters.type === '' || p.hospitalType === filters.type)
        );
    }, [providers, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const openProviderModal = (provider: HealthcareProvider | null = null) => {
        setProviderToEdit(provider);
        setProviderModalOpen(true);
    };

    const openTimeSlotModal = (slot: TimeSlot | null = null) => {
        setTimeSlotToEdit(slot);
        setTimeSlotModalOpen(true);
    };

    const manageTimeSlots = (provider: HealthcareProvider) => {
        setSelectedProvider(provider);
        setView('timeslots');
    };

    // Main render
    if (isLoading) return <Spinner />;

    if (view === 'timeslots' && selectedProvider) {
        return (
            <div>
                <PageTitle actions={<Button onClick={() => setView('providers')}>Back to Providers</Button>}>
                    Manage Time Slots for {selectedProvider.name}
                </PageTitle>
                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">{selectedProvider.specialty} at {selectedProvider.hospitalName}</h3>
                        <Button onClick={() => openTimeSlotModal()}>
                            <PlusIcon className="w-5 h-5 mr-2" /> Add New Time Slot
                        </Button>
                    </div>
                    {timeSlots.length === 0 ? <p>No time slots found.</p> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map(slot => (
                                        <tr key={slot.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(slot.startTime).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(slot.endTime).toLocaleString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${slot.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {slot.available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                <Button variant="secondary" onClick={() => openTimeSlotModal(slot)}><EditIcon /></Button>
                                                <Button variant="danger" onClick={() => setTimeSlotToDelete(slot)}><TrashIcon /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        );
    }

    return (
        <div>
            <PageTitle actions={<Button onClick={() => openProviderModal()}><PlusIcon className="w-5 h-5 mr-2" /> Create New Provider</Button>}>
                Healthcare Providers
            </PageTitle>
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Input label="Search by Name" name="name" value={filters.name} onChange={handleFilterChange} />
                    <Input label="Search by Specialty" name="specialty" value={filters.specialty} onChange={handleFilterChange} />
                    <Input label="Search by Hospital" name="hospital" value={filters.hospital} onChange={handleFilterChange} />
                    <Select label="Filter by Type" name="type" value={filters.type} onChange={handleFilterChange}>
                        <option value="">All Types</option>
                        <option value={HospitalType.GOVERNMENT}>Government</option>
                        <option value={HospitalType.PRIVATE}>Private</option>
                    </Select>
                </div>
            </Card>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                 <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                     <tbody>
                        {filteredProviders.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{p.specialty}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{p.hospitalName}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.hospitalType === 'GOVERNMENT' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {p.hospitalType}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <Button variant="secondary" onClick={() => manageTimeSlots(p)}><CalendarIcon className="mr-1" /> Time Slots</Button>
                                    <Button variant="secondary" onClick={() => openProviderModal(p)}><EditIcon /></Button>
                                    <Button variant="danger" onClick={() => setProviderToDelete(p)}><TrashIcon /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Provider Modal */}
            <Modal isOpen={providerModalOpen} onClose={() => setProviderModalOpen(false)} title={providerToEdit ? 'Edit Provider' : 'Create New Provider'}>
                <form onSubmit={handleSaveProvider} className="space-y-4">
                    <Input label="Provider Name" name="name" defaultValue={providerToEdit?.name} required />
                    <Input label="Specialty" name="specialty" defaultValue={providerToEdit?.specialty} required />
                    <Input label="Hospital Name" name="hospitalName" defaultValue={providerToEdit?.hospitalName} required />
                    <Select label="Hospital Type" name="hospitalType" defaultValue={providerToEdit?.hospitalType || HospitalType.GOVERNMENT}>
                        <option value={HospitalType.GOVERNMENT}>Government</option>
                        <option value={HospitalType.PRIVATE}>Private</option>
                    </Select>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setProviderModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{providerToEdit ? 'Update Provider' : 'Create Provider'}</Button>
                    </div>
                </form>
            </Modal>
            
            {/* Delete Provider Modal */}
            <Modal isOpen={!!providerToDelete} onClose={() => setProviderToDelete(null)} title="Confirm Deletion">
                <p>Are you sure you want to delete <strong>{providerToDelete?.name}</strong> ({providerToDelete?.specialty})? This action cannot be undone.</p>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setProviderToDelete(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteProvider}>Delete</Button>
                </div>
            </Modal>
            
            {/* Time Slot Modal */}
            <Modal isOpen={timeSlotModalOpen} onClose={() => setTimeSlotModalOpen(false)} title={timeSlotToEdit ? 'Edit Time Slot' : 'Create New Time Slot'}>
                 <form onSubmit={handleSaveTimeSlot} className="space-y-4">
                    <Input label="Start Time" name="startTime" type="datetime-local" defaultValue={timeSlotToEdit?.startTime.substring(0,16)} required />
                    <Input label="End Time" name="endTime" type="datetime-local" defaultValue={timeSlotToEdit?.endTime.substring(0,16)} required />
                    <div className="flex items-center">
                        <input id="available" name="available" type="checkbox" defaultChecked={timeSlotToEdit?.available ?? true} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                        <label htmlFor="available" className="ml-2 block text-sm text-gray-900">Available for booking</label>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setTimeSlotModalOpen(false)}>Cancel</Button>
                        <Button type="submit">{timeSlotToEdit ? 'Update Time Slot' : 'Create Time Slot'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Time Slot Modal */}
            <Modal isOpen={!!timeSlotToDelete} onClose={() => setTimeSlotToDelete(null)} title="Confirm Deletion">
                <p>Are you sure you want to delete the time slot from <strong>{timeSlotToDelete && new Date(timeSlotToDelete.startTime).toLocaleString()}</strong> to <strong>{timeSlotToDelete && new Date(timeSlotToDelete.endTime).toLocaleString()}</strong>?</p>
                 <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => setTimeSlotToDelete(null)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteTimeSlot}>Delete</Button>
                </div>
            </Modal>
        </div>
    );
}
