
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { StatisticalReport, ReportFilters, HealthcareProvider } from '../types';
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

interface Patient {
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
}

export default function ReportsDashboard({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [report, setReport] = useState<StatisticalReport | null>(null);
    const [providers, setProviders] = useState<HealthcareProvider[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingProviders, setIsLoadingProviders] = useState(false);
    const [filters, setFilters] = useState<ReportFilters>(initialFilters);
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [isLoadingPatients, setIsLoadingPatients] = useState(true);

    // Fetch patients from API
    const fetchPatients = useCallback(async () => {
        try {
            const data = await api.getAdminPatients();
            setPatients(data);
            // Filter patients by name
            const results = data.filter(patient => 
                patient.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredPatients(results);
        } catch (error) {
            addNotification('error', 'Failed to fetch patients');
        }
    }, [searchTerm, addNotification]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    // Filter patients when search term changes
    useEffect(() => {
        const results = patients.filter(patient => 
            patient.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPatients(results);
    }, [searchTerm, patients]);

    // Calculate today's patients count
    const getTodaysPatientsCount = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        return patients.filter(patient => {
            // Assuming patient has a registrationDate field
            const regDate = patient.registrationDate || patient.createdAt;
            return regDate && regDate.startsWith(today);
        }).length;
    }, [patients]);

    // Export to CSV function
    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Health Card #'];
        const csvContent = [
            headers.join(','),
            ...filteredPatients.map(p => 
                `"${p.name}","${p.email}","${p.phone}","${p.healthCard}"`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addNotification('success', 'Patient data exported successfully');
    };

    const fetchProviders = useCallback(async () => {
        setIsLoadingProviders(true);
        try {
            const data = await api.getProviders();
            setProviders(data);
        } catch (error) {
            addNotification('error', 'Failed to fetch providers');
        } finally {
            setIsLoadingProviders(false);
        }
    }, [addNotification]);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const [reportData] = await Promise.all([
                api.getStatisticalReport(filters),
                fetchProviders()
            ]);
            setReport(reportData);
        } catch (error) {
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
            addNotification('success', `Report successfully exported as ${format}.`);
        } catch (error) {
            addNotification('error', `Failed to export report as ${format}.`);
        }
    };

    return (
        <div>
            <PageTitle>Statistical Reports</PageTitle>

            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                    <Input label="Start Date" name="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
                    <Input label="End Date" name="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
                    <Input label="Hospital" name="hospital" value={filters.hospital} onChange={handleFilterChange} />
                    <Input label="Department" name="department" value={filters.department} onChange={handleFilterChange} />
                    <Button onClick={fetchReport}>Apply Filters</Button>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="secondary" onClick={() => handleExport('CSV')}>Export CSV</Button>
                    <Button variant="secondary" onClick={() => handleExport('PDF')}>Export PDF</Button>
                </div>
            </Card>

            {isLoading ? <p>Loading report...</p> : !report || report.message ? (
                 <Card><p>{report?.message || 'No data available for the selected filters.'}</p></Card>
            ) : (
                <>
                    {/* Appointments Statistical Records Title */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Appointments Statistical Records</h2>
                        <div className="w-16 h-1 bg-cyan-500 mt-2 rounded-full"></div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <KpiCard title="Total Visits" value={report.kpis.totalVisits} icon={<ReportsIcon />} />
                        <KpiCard title="Confirmed Appointments" value={report.kpis.confirmedAppointments} icon={<ReportsIcon />} />
                        <KpiCard title="Total Revenue" value={`$${report.kpis.totalRevenue.toFixed(2)}`} icon={<ReportsIcon />} />
                        <KpiCard title="Completion Rate" value={`${report.kpis.appointmentCompletionRate.toFixed(1)}%`} icon={<ReportsIcon />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        <Card className="lg:col-span-3">
                            <h3 className="font-bold text-lg mb-4">Daily Visits</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={report.dailyVisits}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="visitCount" fill="#06b6d4" name="Total Visits" />
                                    <Bar dataKey="confirmedCount" fill="#34d399" name="Confirmed" />
                                    <Bar dataKey="cancelledCount" fill="#ef4444" name="Cancelled" />
                                </BarChart>
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

                    {/* Provider Statistical Records Title */}
                    <div className="mt-8 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Provider's Statistical Records</h2>
                        <div className="w-16 h-1 bg-cyan-500 mt-2 rounded-full"></div>
                    </div>

                    {/* Provider Distribution Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Providers by Specialty */}
                        <Card>
                            <div className="flex items-center mb-4">
                                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-600 mr-3">
                                    <StethoscopeIcon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Providers by Specialty</h3>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={Object.entries(
                                                providers.reduce((acc, provider) => {
                                                    acc[provider.specialty] = (acc[provider.specialty] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map(([name, value]) => ({ name, value }))}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            outerRadius={80}
                                            fill="#06b6d4"
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, percent }) => (
                                                <text 
                                                    x={0} 
                                                    y={0} 
                                                    fill={chartTextColor}
                                                    textAnchor="middle"
                                                    fontSize={12}
                                                >
                                                    {`${name}: ${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            )}
                                        >
                                            {Object.entries(
                                                providers.reduce((acc, provider) => {
                                                    acc[provider.specialty] = (acc[provider.specialty] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: chartBackground,
                                                border: `1px solid ${chartGridColor}`,
                                                borderRadius: '0.5rem',
                                                color: chartTextColor
                                            }}
                                            formatter={(value: number) => [`${value} providers`, 'Count']} 
                                        />
                                        <Legend 
                                            wrapperStyle={{
                                                color: chartTextColor,
                                                fontSize: '0.875rem',
                                                paddingTop: '1rem'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Providers by Hospital Type */}
                        <Card>
                            <div className="flex items-center mb-4">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
                                    <HospitalIcon className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800">Providers by Hospital Type</h3>
                            </div>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={Object.entries(
                                            providers.reduce((acc, provider) => {
                                                const type = provider.hospitalType === 'GOVERNMENT' ? 'Government' : 'Private';
                                                acc[type] = (acc[type] || 0) + 1;
                                                return acc;
                                            }, {} as Record<string, number>)
                                        ).map(([name, count]) => ({ name, count }))}
                                        margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid 
                                            strokeDasharray="3 3" 
                                            stroke={chartGridColor}
                                        />
                                        <XAxis 
                                            dataKey="name" 
                                            tick={{ fill: chartTextColor, fontSize: 12 }}
                                            axisLine={{ stroke: chartGridColor }}
                                            tickLine={{ stroke: chartGridColor }}
                                        />
                                        <YAxis 
                                            tick={{ fill: chartTextColor, fontSize: 12 }}
                                            axisLine={{ stroke: chartGridColor }}
                                            tickLine={{ stroke: chartGridColor }}
                                        />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: chartBackground,
                                                border: `1px solid ${chartGridColor}`,
                                                borderRadius: '0.5rem',
                                                color: chartTextColor
                                            }}
                                            formatter={(value: number) => [`${value} providers`, 'Count']} 
                                        />
                                        <Bar dataKey="count" name="Providers" radius={[4, 4, 0, 0]}>
                                            {Object.entries(
                                                providers.reduce((acc, provider) => {
                                                    const type = provider.hospitalType === 'GOVERNMENT' ? 'Government' : 'Private';
                                                    acc[type] = (acc[type] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>)
                                            ).map((_, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke={chartBackground}
                                                    strokeWidth={1}
                                                />
                                            ))}
                                        </Bar>
                                        <Legend 
                                            wrapperStyle={{
                                                color: chartTextColor,
                                                fontSize: '0.875rem',
                                                paddingTop: '1rem'
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* Patient Records Dashboard */}
                    <div className="mt-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Patient Records Analysis</h2>
                            <div className="w-16 h-1 bg-cyan-500 mt-2 rounded-full"></div>
                        </div>

                        <Card>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-800">Patient Records</h3>
                                <div className="flex space-x-2">
                                    <Input 
                                        type="text" 
                                        placeholder="Search by name..." 
                                        className="w-80"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <Button variant="secondary" onClick={exportToCSV}>
                                        Export to CSV
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Patient Count Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center">
                                        <div className="p-3 rounded-full bg-cyan-100 text-cyan-600 mr-4">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Total Patients</p>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {patients.length}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center">
                                        <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                                            <UserIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Today's Patients</p>
                                            <p className="text-2xl font-semibold text-gray-900">
                                                {getTodaysPatientsCount()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <Table>
                                    <Table.Head>
                                        <Table.Row>
                                            <Table.Header>Name</Table.Header>
                                            <Table.Header>Email</Table.Header>
                                            <Table.Header>Phone</Table.Header>
                                            <Table.Header>Health Card #</Table.Header>
                                            <Table.Header>Actions</Table.Header>
                                        </Table.Row>
                                    </Table.Head>
                                    <Table.Body>
                                        {filteredPatients.length > 0 ? (
                                            filteredPatients.map((patient, index) => (
                                                <Table.Row key={index} className="hover:bg-gray-50">
                                                    <Table.Cell className="font-medium text-gray-900">
                                                        {patient.name}
                                                    </Table.Cell>
                                                    <Table.Cell>{patient.email}</Table.Cell>
                                                    <Table.Cell>{patient.phone}</Table.Cell>
                                                    <Table.Cell>{patient.digitalHealthCardNumber || 'N/A'}</Table.Cell>
                                                    <Table.Cell>
                                                        <Button size="sm" variant="ghost">View</Button>
                                                    </Table.Cell>
                                                </Table.Row>
                                            ))
                                        ) : (
                                            <Table.Row>
                                                <td colSpan={5} className="text-center py-8 text-gray-500">
                                                    No patients found matching your search.
                                                </td>
                                            </Table.Row>
                                        )}
                                    </Table.Body>
                                </Table>
                            </div>
                            
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                                <div className="text-sm text-gray-600">
                                    Showing <span className="font-medium">1</span> to <span className="font-medium">3</span> of <span className="font-medium">24</span> results
                                </div>
                                <div className="flex space-x-2">
                                    <Button size="sm" variant="outline" disabled>Previous</Button>
                                    <Button size="sm" variant="primary">1</Button>
                                    <Button size="sm" variant="outline">2</Button>
                                    <Button size="sm" variant="outline">3</Button>
                                    <Button size="sm" variant="outline">Next</Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
