import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { StatisticalReport, ReportFilters, HealthcareProvider } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, KpiCard, Button, Input, Select, Table, Badge, Spinner } from './ui';
import { ReportsIcon, UserIcon, HospitalIcon, StethoscopeIcon } from './Icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

    // Fetch providers for filtering
    const fetchProvidersData = useCallback(async () => {
        try {
            setIsLoadingProviders(true);
            const providersData = await api.getProviders();
            setProviders(providersData);
        } catch (error) {
            console.error('Error fetching providers:', error);
            // Don't show error notification as it's not critical
        } finally {
            setIsLoadingProviders(false);
        }
    }, []);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const reportData = await api.getStatisticalReport(filters);
            console.log('Fetched report data:', reportData);
            setReport(reportData);
        } catch (error) {
            console.error('Error fetching report:', error);
            addNotification('error', 'Failed to fetch report');
        } finally {
            setIsLoading(false);
        }
    }, [filters, addNotification]);

    // Fetch providers on mount
    useEffect(() => {
        fetchProvidersData();
    }, [fetchProvidersData]);

    // Fetch report when filters change
    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleExport = async (format: 'PDF' | 'CSV') => {
        try {
            if (format === 'PDF') {
                // Generate PDF from the modal content with charts
                const element = document.getElementById('export-report-content');
                if (!element) {
                    addNotification('error', 'Report content not found');
                    return;
                }

                addNotification('success', 'Generating PDF... Please wait.');
                
                // Store original styles
                const originalMaxHeight = element.style.maxHeight;
                const originalOverflow = element.style.overflow;
                
                // Temporarily remove height restriction to capture full content
                element.style.maxHeight = 'none';
                element.style.overflow = 'visible';
                
                // Wait for layout to update
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Capture the content as canvas
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowHeight: element.scrollHeight,
                    height: element.scrollHeight
                });

                // Restore original styles
                element.style.maxHeight = originalMaxHeight;
                element.style.overflow = originalOverflow;

                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                const imgWidth = 210; // A4 width in mm
                const pageHeight = 297; // A4 height in mm
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                let position = 0;

                // Add first page
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                // Add additional pages if content is longer than one page
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }

                // Download the PDF
                const filename = `healthcare-report-${new Date().toISOString().split('T')[0]}.pdf`;
                pdf.save(filename);
                
                setExportedFileUrl(`/exports/${filename}`);
                addNotification('success', `Report successfully exported as PDF.`);
                setShowExportModal(false);
                setShowShareModal(true);
            } else if (format === 'CSV') {
                // Use backend API for CSV export
                await api.exportReport(format, filters);
                setExportedFileUrl(`/exports/report-${Date.now()}.${format.toLowerCase()}`);
                addNotification('success', `Report successfully exported as ${format}.`);
                setShowExportModal(false);
                setShowShareModal(true);
            }
        } catch (error) {
            console.error('Export error:', error);
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
            {/* Export Modal - Comprehensive Report Preview */}
            {showExportModal && report && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-lg z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Appointments Statistical Records - Export Preview</h3>
                                <p className="text-sm text-slate-500 mt-1">Review complete report before exporting</p>
                            </div>
                            <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-6 max-h-[80vh] overflow-y-auto" id="export-report-content">
                            {/* Report Header */}
                            <div className="mb-6 pb-4 border-b border-slate-200">
                                <h2 className="text-xl font-bold text-gray-800 mb-2">Healthcare Statistical Report</h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600"><span className="font-semibold">Generated:</span> {new Date().toLocaleString()}</p>
                                        <p className="text-gray-600"><span className="font-semibold">Date Range:</span> {filters.startDate} to {filters.endDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600"><span className="font-semibold">Hospital:</span> {filters.hospital || 'All Hospitals'}</p>
                                        <p className="text-gray-600"><span className="font-semibold">Department:</span> {filters.department || 'All Departments'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Key Performance Indicators */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Key Performance Indicators</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-lg border border-cyan-200">
                                        <p className="text-sm font-medium text-cyan-700">Total Visits</p>
                                        <p className="text-3xl font-bold text-cyan-900">{report.kpis.totalVisits}</p>
                                        <p className="text-xs text-cyan-600 mt-1">{filters.startDate} to {filters.endDate}</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                                        <p className="text-sm font-medium text-green-700">Confirmed Appointments</p>
                                        <p className="text-3xl font-bold text-green-900">{report.kpis.confirmedAppointments}</p>
                                        <p className="text-xs text-green-600 mt-1">{((report.kpis.confirmedAppointments / report.kpis.totalVisits) * 100).toFixed(1)}% of total</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                                        <p className="text-sm font-medium text-yellow-700">Pending Payments</p>
                                        <p className="text-3xl font-bold text-yellow-900">{report.kpis.pendingPayments}</p>
                                        <p className="text-xs text-yellow-600 mt-1">{((report.kpis.pendingPayments / report.kpis.totalVisits) * 100).toFixed(1)}% of total</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                                        <p className="text-sm font-medium text-red-700">Cancelled Appointments</p>
                                        <p className="text-3xl font-bold text-red-900">{report.kpis.cancelledAppointments}</p>
                                        <p className="text-xs text-red-600 mt-1">{((report.kpis.cancelledAppointments / report.kpis.totalVisits) * 100).toFixed(1)}% of total</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                                        <p className="text-sm font-medium text-purple-700">Total Revenue</p>
                                        <p className="text-3xl font-bold text-purple-900">${report.kpis.totalRevenue.toFixed(2)}</p>
                                        <p className="text-xs text-purple-600 mt-1">Avg: ${(report.kpis.totalRevenue / report.kpis.totalVisits).toFixed(2)}/visit</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                                        <p className="text-sm font-medium text-blue-700">Average Wait Time</p>
                                        <p className="text-3xl font-bold text-blue-900">{report.kpis.averageWaitTime}</p>
                                        <p className="text-xs text-blue-600 mt-1">hours</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
                                        <p className="text-sm font-medium text-indigo-700">Completion Rate</p>
                                        <p className="text-3xl font-bold text-indigo-900">{report.kpis.appointmentCompletionRate.toFixed(1)}%</p>
                                        <p className="text-xs text-indigo-600 mt-1">{report.kpis.confirmedAppointments} completed</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
                                        <p className="text-sm font-medium text-pink-700">Total Departments</p>
                                        <p className="text-3xl font-bold text-pink-900">{report.departmentBreakdowns.length}</p>
                                        <p className="text-xs text-pink-600 mt-1">Active departments</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Visual Analytics</h3>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Daily Visits Trend Chart */}
                                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">Daily Visits Trend</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <LineChart data={report.dailyVisits}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                                                <YAxis style={{ fontSize: '12px' }} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="visitCount" stroke="#06b6d4" strokeWidth={2} name="Total Visits" />
                                                <Line type="monotone" dataKey="confirmedCount" stroke="#34d399" strokeWidth={2} name="Confirmed" />
                                                <Line type="monotone" dataKey="cancelledCount" stroke="#ef4444" strokeWidth={2} name="Cancelled" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Department Breakdown Pie Chart */}
                                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">Department Distribution</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <PieChart>
                                                <Pie 
                                                    data={report.departmentBreakdowns} 
                                                    dataKey="totalAppointments" 
                                                    nameKey="department" 
                                                    cx="50%" 
                                                    cy="50%" 
                                                    outerRadius={80} 
                                                    fill="#8884d8" 
                                                    label={(entry) => `${entry.department}: ${entry.totalAppointments}`}
                                                >
                                                    {report.departmentBreakdowns.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Appointment Status Bar Chart */}
                                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">Appointment Status Overview</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={[
                                                { status: 'Confirmed', count: report.kpis.confirmedAppointments },
                                                { status: 'Pending', count: report.kpis.pendingPayments },
                                                { status: 'Cancelled', count: report.kpis.cancelledAppointments }
                                            ]}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="status" style={{ fontSize: '12px' }} />
                                                <YAxis style={{ fontSize: '12px' }} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="count" fill="#06b6d4" name="Appointments" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Department Revenue Bar Chart */}
                                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-700 mb-3">Department Revenue</h4>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={report.departmentBreakdowns}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="department" style={{ fontSize: '10px' }} angle={-45} textAnchor="end" height={80} />
                                                <YAxis style={{ fontSize: '12px' }} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="revenue" fill="#34d399" name="Revenue ($)" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Department Details Table */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Department Breakdown Details</h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Department</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Total</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Confirmed</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Cancelled</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Revenue</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Completion %</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {report.departmentBreakdowns.map((dept, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{dept.department}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">{dept.totalAppointments}</td>
                                                    <td className="px-4 py-3 text-sm text-green-600 font-semibold">{dept.confirmedAppointments}</td>
                                                    <td className="px-4 py-3 text-sm text-red-600 font-semibold">{dept.cancelledAppointments || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">${dept.revenue.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">{dept.completionRate.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-slate-100 font-bold">
                                                <td className="px-4 py-3 text-sm text-slate-900">TOTAL</td>
                                                <td className="px-4 py-3 text-sm text-slate-900">{report.kpis.totalVisits}</td>
                                                <td className="px-4 py-3 text-sm text-green-700">{report.kpis.confirmedAppointments}</td>
                                                <td className="px-4 py-3 text-sm text-red-700">{report.kpis.cancelledAppointments}</td>
                                                <td className="px-4 py-3 text-sm text-slate-900">${report.kpis.totalRevenue.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-sm text-slate-900">{report.kpis.appointmentCompletionRate.toFixed(1)}%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Daily Visits Table */}
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Daily Visits Summary</h3>
                                <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-96">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Total Visits</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Confirmed</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">Cancelled</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-slate-200">
                                            {report.dailyVisits.map((visit, index) => (
                                                <tr key={index} className="hover:bg-slate-50">
                                                    <td className="px-4 py-3 text-sm text-slate-900">{visit.date}</td>
                                                    <td className="px-4 py-3 text-sm text-slate-600">{visit.visitCount}</td>
                                                    <td className="px-4 py-3 text-sm text-green-600">{visit.confirmedCount}</td>
                                                    <td className="px-4 py-3 text-sm text-red-600">{visit.cancelledCount}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Report Footer */}
                            <div className="mt-6 pt-4 border-t border-slate-200 text-center text-sm text-slate-500">
                                <p>This report was generated on {new Date().toLocaleString()}</p>
                                <p className="mt-1">Healthcare Management System - Statistical Reports Module</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-slate-600">
                                    <p className="font-semibold">Export Options:</p>
                                    <p>Download this comprehensive report with all charts and data</p>
                                </div>
                                <div className="flex space-x-3">
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => window.print()}
                                        className="flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print Report
                                    </Button>
                                    <Button onClick={() => handleExport('PDF')} className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                        </svg>
                                        Export as PDF
                                    </Button>
                                    <Button onClick={() => handleExport('CSV')} variant="secondary">
                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export as CSV
                                    </Button>
                                    <Button variant="secondary" onClick={() => setShowExportModal(false)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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