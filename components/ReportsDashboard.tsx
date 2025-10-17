
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { StatisticalReport, ReportFilters } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, KpiCard, Button, Input, Select, Table, Badge, Spinner } from './ui';
import { ReportsIcon, UserIcon, HospitalIcon, StethoscopeIcon } from './Icons';

const COLORS = ['#06b6d4', '#34d399', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

const chartTextColor = '#4B5563'; // text-gray-600
const chartGridColor = '#E5E7EB'; // border-gray-200
const chartBackground = '#FFFFFF'; // bg-white

const today = new Date();
const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const initialFilters: ReportFilters = {
    startDate: formatDate(thirtyDaysAgo),
    endDate: formatDate(today),
    hospital: '',
    department: '',
};

type ReportType = 'statistical' | 'utilization' | 'financial' | 'patient';
type Granularity = 'daily' | 'weekly' | 'monthly';

export default function ReportsDashboard({ 
    addNotification,
    setActiveView 
}: { 
    addNotification: (type: 'success' | 'error', message: string) => void;
    setActiveView?: (view: string) => void;
}) {
    const [report, setReport] = useState<StatisticalReport | null>(null);
    const [providers, setProviders] = useState<HealthcareProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [filters, setFilters] = useState<ReportFilters>(initialFilters);
    const [reportType, setReportType] = useState<ReportType>('statistical');
    const [granularity, setGranularity] = useState<Granularity>('daily');
    const [drillDownDepartment, setDrillDownDepartment] = useState<string | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [exportedFileUrl, setExportedFileUrl] = useState<string | null>(null);
    const [shareEmail, setShareEmail] = useState('');

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const [reportData] = await Promise.all([
                api.getStatisticalReport(filters),
                fetchProviders()
            ]);
            console.log('Fetched report data:', reportData);
            setReport(reportData);
        } catch (error) {
            console.error('Error fetching report:', error);
            addNotification('error', 'Failed to fetch report');
        } finally {
            setIsLoading(false);
        }
    }, [filters, addNotification, fetchProviders]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleExport = async (format: 'PDF' | 'CSV') => {
        try {
            await api.exportReport(format, filters);
            setExportedFileUrl(`/exports/report-${Date.now()}.${format.toLowerCase()}`);
            addNotification('success', `Report successfully exported as ${format}.`);
            setShowExportModal(false);
            setShowShareModal(true);
        } catch (error) {
            addNotification('error', `Failed to export report as ${format}.`);
        }
    };

    const handleDrillDown = (department: string) => {
        setDrillDownDepartment(department);
        setFilters(prev => ({ ...prev, department }));
    };

    const handleShare = async () => {
        if (!shareEmail || !exportedFileUrl) return;
        try {
            // Simulate sharing functionality
            addNotification('success', `Report shared successfully with ${shareEmail}`);
            setShowShareModal(false);
            setShareEmail('');
        } catch (error) {
            addNotification('error', 'Failed to share report');
        }
    };

    const validateFilters = () => {
        if (new Date(filters.startDate) > new Date(filters.endDate)) {
            addNotification('error', 'Start date must be before end date');
            return false;
        }
        return true;
    };

    const handleApplyFilters = () => {
        if (validateFilters()) {
            fetchReport();
        }
    };

    return (
        <div>
            <PageTitle>Statistical Reports</PageTitle>

            <Card className="mb-6">
                <h3 className="font-bold text-lg mb-4">Filter & Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hospital</label>
                        <select 
                            name="hospital" 
                            value={filters.hospital} 
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Hospitals</option>
                            <option value="Colombo General">Colombo General</option>
                            <option value="City Government Hospital">City Government Hospital</option>
                            <option value="Advanced Private Clinic">Advanced Private Clinic</option>
                            <option value="Elite Medical Center">Elite Medical Center</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                        <select 
                            name="department" 
                            value={filters.department} 
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">All Departments</option>
                            <option value="Cardiology">Cardiology</option>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Dermatology">Dermatology</option>
                            <option value="Orthopedics">Orthopedics</option>
                            <option value="Outpatient">Outpatient</option>
                        </select>
                    </div>
                    <Input label="Start Date" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
                    <Input label="End Date" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Report Type</label>
                        <select 
                            value={reportType} 
                            onChange={(e) => setReportType(e.target.value as ReportType)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="statistical">Statistical</option>
                            <option value="utilization">Utilization</option>
                            <option value="financial">Financial</option>
                            <option value="patient">Patient Demographics</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Granularity</label>
                        <select 
                            value={granularity} 
                            onChange={(e) => setGranularity(e.target.value as Granularity)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                        <Button onClick={handleApplyFilters}>Apply Filters</Button>
                        {drillDownDepartment && (
                            <Button variant="secondary" onClick={() => { setDrillDownDepartment(null); setFilters(prev => ({ ...prev, department: '' })); }}>Clear Drill-Down</Button>
                        )}
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="secondary" onClick={() => setShowExportModal(true)}>Export Report</Button>
                        <Button onClick={() => setActiveView && setActiveView('analytics')}>Utilization Analytics</Button>
                    </div>
                </div>
            </Card>

            {isLoading ? (
                <Card className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <Spinner className="mx-auto mb-4" />
                        <p className="text-gray-600">Loading report data...</p>
                    </div>
                </Card>
            ) : !report || report.message ? (
                <Card>
                    <div className="text-center py-8">
                        <p className="text-gray-600">{report?.message || 'No data available for the selected filters.'}</p>
                        <p className="text-sm text-gray-500 mt-2">Try adjusting your filters or check if the backend server is running.</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Appointments Statistical Records Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Appointments Statistical Records</h2>
                        <div className="w-16 h-1 bg-cyan-500 mt-2 rounded-full"></div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div>
                            <KpiCard 
                                title="Total Visits" 
                                value={report.kpis.totalVisits} 
                                icon={<ReportsIcon />}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {filters.startDate} to {filters.endDate}
                            </p>
                        </div>
                        <div>
                            <KpiCard 
                                title="Confirmed" 
                                value={report.kpis.confirmedAppointments} 
                                icon={<ReportsIcon />}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {((report.kpis.confirmedAppointments / report.kpis.totalVisits) * 100).toFixed(1)}% of total
                            </p>
                        </div>
                        <div>
                            <KpiCard 
                                title="Total Revenue" 
                                value={`$${report.kpis.totalRevenue.toFixed(2)}`} 
                                icon={<ReportsIcon />}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Avg: ${(report.kpis.totalRevenue / report.kpis.totalVisits).toFixed(2)}/visit
                            </p>
                        </div>
                        <div>
                            <KpiCard 
                                title="Completion" 
                                value={`${report.kpis.appointmentCompletionRate.toFixed(1)}%`} 
                                icon={<ReportsIcon />}
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {report.kpis.completedAppointments || 0} completed
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                        <Card className="lg:col-span-3">
                            <h3 className="font-bold text-lg mb-4">{granularity.charAt(0).toUpperCase() + granularity.slice(1)} Visits Trend</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={report.dailyVisits}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="visitCount" stroke="#06b6d4" strokeWidth={2} name="Total Visits" />
                                    <Line type="monotone" dataKey="confirmedCount" stroke="#34d399" strokeWidth={2} name="Confirmed" />
                                    <Line type="monotone" dataKey="cancelledCount" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Card>
                        <Card className="lg:col-span-2">
                             <h3 className="font-bold text-lg mb-4">Department Breakdown</h3>
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={report.departmentBreakdowns} dataKey="totalAppointments" nameKey="department" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                        {report.departmentBreakdowns.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* Department Breakdown Table with Drill-Down */}
                    <Card>
                        <h3 className="font-bold text-lg mb-4">Department Details {drillDownDepartment && `- ${drillDownDepartment}`}</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Total Appointments</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Confirmed</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cancelled</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Completion Rate</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {report.departmentBreakdowns.map((dept, index) => (
                                        <tr key={index} className={`hover:bg-slate-50 ${drillDownDepartment === dept.department ? 'bg-primary-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{dept.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{dept.totalAppointments}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{dept.confirmedAppointments}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{dept.cancelledAppointments}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {((dept.confirmedAppointments / dept.totalAppointments) * 100).toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button 
                                                    onClick={() => handleDrillDown(dept.department)}
                                                    className="text-primary hover:text-primary-600 font-medium"
                                                >
                                                    Drill Down →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
            {/* Export Modal */}
            {showExportModal && (
                <Modal title="Export Report" onClose={() => setShowExportModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Export current report with applied filters and graphics</p>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Active Filters:</p>
                            <ul className="text-sm text-slate-600 list-disc list-inside">
                                <li>Hospital: {filters.hospital || 'All'}</li>
                                <li>Department: {filters.department || 'All'}</li>
                                <li>Date Range: {filters.startDate} to {filters.endDate}</li>
                                <li>Report Type: {reportType}</li>
                                <li>Granularity: {granularity}</li>
                            </ul>
                        </div>
                        <div className="flex space-x-2 pt-4">
                            <Button onClick={() => handleExport('PDF')} className="flex-1">Export as PDF</Button>
                            <Button onClick={() => handleExport('CSV')} variant="secondary" className="flex-1">Export as CSV</Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Share Modal */}
            {showShareModal && (
                <Modal title="Share Report" onClose={() => setShowShareModal(false)}>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Share exported report with department heads or stakeholders</p>
                        <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-sm text-green-800">✓ Report exported successfully</p>
                            <p className="text-xs text-green-600 mt-1">{exportedFileUrl}</p>
                        </div>
                        <Input 
                            label="Recipient Email" 
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder="department.head@hospital.com"
                        />
                        <div className="flex space-x-2 pt-4">
                            <Button onClick={handleShare} className="flex-1">Send Report</Button>
                            <Button onClick={() => setShowShareModal(false)} variant="secondary" className="flex-1">Close</Button>
                        </div>
                    </div>
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