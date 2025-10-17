import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { UtilizationReport, CreateUtilizationReportPayload, UpdateUtilizationReportPayload } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, Button, Input } from './ui';
import { ReportsIcon } from './Icons';

/**
 * AnalyticsDashboard Component
 * Manages CRUD operations for Service Utilization Reports
 * Follows Single Responsibility Principle - handles only UI and user interactions
 */
export default function AnalyticsDashboard({ 
    addNotification 
}: { 
    addNotification: (type: 'success' | 'error', message: string) => void 
}) {
    const [reports, setReports] = useState<UtilizationReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<UtilizationReport | null>(null);
    const [formData, setFormData] = useState<CreateUtilizationReportPayload>({
        reportName: '',
        startDate: '',
        endDate: '',
        department: '',
        doctor: '',
        serviceCategory: ''
    });

    // READ - Fetch all reports on component mount
    useEffect(() => {
        fetchAllReports();
    }, []);

    const fetchAllReports = async () => {
        setIsLoading(true);
        try {
            const data = await api.getAllUtilizationReports();
            setReports(data);
        } catch (error) {
            addNotification('error', 'Failed to fetch utilization reports');
        } finally {
            setIsLoading(false);
        }
    };

    // CREATE - Generate new report
    const handleCreateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newReport = await api.createUtilizationReport(formData);
            setReports(prev => [newReport, ...prev]);
            addNotification('success', `Report "${newReport.reportName}" created successfully`);
            setShowCreateModal(false);
            resetForm();
        } catch (error: any) {
            addNotification('error', error.message || 'Failed to create report');
        }
    };

    // UPDATE - Modify existing report
    const handleUpdateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReport) return;

        const updateData: UpdateUtilizationReportPayload = {
            reportName: formData.reportName,
            startDate: formData.startDate,
            endDate: formData.endDate,
            department: formData.department,
            doctor: formData.doctor,
            serviceCategory: formData.serviceCategory,
            notes: formData.notes
        };

        try {
            const updatedReport = await api.updateUtilizationReport(selectedReport.id, updateData);
            setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
            addNotification('success', `Report "${updatedReport.reportName}" updated successfully`);
            setShowEditModal(false);
            setSelectedReport(null);
            resetForm();
        } catch (error: any) {
            addNotification('error', error.message || 'Failed to update report');
        }
    };

    // DELETE - Remove report
    const handleDeleteReport = async (id: number, reportName: string) => {
        if (!confirm(`Are you sure you want to delete "${reportName}"?`)) return;

        try {
            await api.deleteUtilizationReport(id);
            setReports(prev => prev.filter(r => r.id !== id));
            addNotification('success', `Report "${reportName}" deleted successfully`);
        } catch (error: any) {
            addNotification('error', error.message || 'Failed to delete report');
        }
    };

    const openEditModal = (report: UtilizationReport) => {
        setSelectedReport(report);
        setFormData({
            reportName: report.reportName,
            startDate: report.startDate,
            endDate: report.endDate,
            department: report.department || '',
            doctor: report.doctor || '',
            serviceCategory: report.serviceCategory || '',
            notes: report.notes || ''
        });
        setShowEditModal(true);
    };

    const resetForm = () => {
        setFormData({
            reportName: '',
            startDate: '',
            endDate: '',
            department: '',
            doctor: '',
            serviceCategory: ''
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Prepare chart data
    const chartData = reports.slice(0, 10).map(report => ({
        name: report.reportName.substring(0, 15) + (report.reportName.length > 15 ? '...' : ''),
        utilization: report.averageUtilization,
        services: report.totalServices,
        patients: report.totalPatients
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <PageTitle>Analytics Dashboard - Service Utilization</PageTitle>
                <Button onClick={() => setShowCreateModal(true)}>
                    + Generate New Report
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Reports</p>
                            <p className="text-3xl font-bold text-primary">{reports.length}</p>
                        </div>
                        <ReportsIcon className="h-12 w-12 text-primary opacity-20" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Avg Utilization</p>
                            <p className="text-3xl font-bold text-primary">
                                {reports.length > 0 
                                    ? (reports.reduce((sum, r) => sum + r.averageUtilization, 0) / reports.length).toFixed(1)
                                    : 0}%
                            </p>
                        </div>
                        <ReportsIcon className="h-12 w-12 text-primary opacity-20" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Services</p>
                            <p className="text-3xl font-bold text-primary">
                                {reports.reduce((sum, r) => sum + r.totalServices, 0)}
                            </p>
                        </div>
                        <ReportsIcon className="h-12 w-12 text-primary opacity-20" />
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600">Total Patients</p>
                            <p className="text-3xl font-bold text-primary">
                                {reports.reduce((sum, r) => sum + r.totalPatients, 0)}
                            </p>
                        </div>
                        <ReportsIcon className="h-12 w-12 text-primary opacity-20" />
                    </div>
                </Card>
            </div>

            {/* Chart */}
            {reports.length > 0 && (
                <Card className="mb-6 p-6">
                    <h3 className="font-bold text-lg mb-4">Utilization Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="utilization" fill="#06b6d4" name="Utilization %" />
                            <Bar dataKey="services" fill="#34d399" name="Services" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
            )}

            {/* Reports Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Report Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date Range</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Services</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Patients</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Utilization</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Peak Hours</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-6 py-4 text-center">Loading...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-4 text-center">No reports available. Generate your first report!</td></tr>
                            ) : (
                                reports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{report.reportName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {report.startDate} to {report.endDate}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{report.department || 'All'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{report.totalServices}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{report.totalPatients}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{report.averageUtilization.toFixed(1)}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{report.peakHours || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <button 
                                                onClick={() => openEditModal(report)}
                                                className="text-primary hover:text-primary-600 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteReport(report.id, report.reportName)}
                                                className="text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create Modal */}
            {showCreateModal && (
                <Modal title="Generate New Utilization Report" onClose={() => { setShowCreateModal(false); resetForm(); }}>
                    <form onSubmit={handleCreateReport} className="space-y-4">
                        <Input 
                            label="Report Name *" 
                            name="reportName" 
                            value={formData.reportName} 
                            onChange={handleInputChange}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Start Date *" 
                                name="startDate" 
                                type="date" 
                                value={formData.startDate} 
                                onChange={handleInputChange}
                                required
                            />
                            <Input 
                                label="End Date *" 
                                name="endDate" 
                                type="date" 
                                value={formData.endDate} 
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <Input 
                            label="Department (Optional)" 
                            name="department" 
                            value={formData.department} 
                            onChange={handleInputChange}
                            placeholder="e.g., Cardiology"
                        />
                        <Input 
                            label="Doctor (Optional)" 
                            name="doctor" 
                            value={formData.doctor} 
                            onChange={handleInputChange}
                            placeholder="e.g., Dr. Smith"
                        />
                        <Input 
                            label="Service Category (Optional)" 
                            name="serviceCategory" 
                            value={formData.serviceCategory} 
                            onChange={handleInputChange}
                            placeholder="e.g., Consultation"
                        />
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button type="submit">Generate Report</Button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedReport && (
                <Modal title="Edit Utilization Report" onClose={() => { setShowEditModal(false); setSelectedReport(null); resetForm(); }}>
                    <form onSubmit={handleUpdateReport} className="space-y-4">
                        <Input 
                            label="Report Name" 
                            name="reportName" 
                            value={formData.reportName} 
                            onChange={handleInputChange}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input 
                                label="Start Date" 
                                name="startDate" 
                                type="date" 
                                value={formData.startDate} 
                                onChange={handleInputChange}
                            />
                            <Input 
                                label="End Date" 
                                name="endDate" 
                                type="date" 
                                value={formData.endDate} 
                                onChange={handleInputChange}
                            />
                        </div>
                        <Input 
                            label="Department" 
                            name="department" 
                            value={formData.department} 
                            onChange={handleInputChange}
                        />
                        <Input 
                            label="Doctor" 
                            name="doctor" 
                            value={formData.doctor} 
                            onChange={handleInputChange}
                        />
                        <Input 
                            label="Service Category" 
                            name="serviceCategory" 
                            value={formData.serviceCategory} 
                            onChange={handleInputChange}
                        />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                            <textarea 
                                name="notes"
                                value={formData.notes || ''}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setShowEditModal(false); setSelectedReport(null); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button type="submit">Update Report</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
