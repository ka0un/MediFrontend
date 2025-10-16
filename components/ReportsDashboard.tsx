
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { StatisticalReport, ReportFilters } from '../types';
import * as api from '../services/api';
import { PageTitle, Card, KpiCard, Button, Input, Select } from './ui';
import { ReportsIcon } from './Icons';

const COLORS = ['#06b6d4', '#34d399', '#f59e0b', '#ef4444', '#6366f1', '#ec4899'];

const today = new Date();
const thirtyDaysAgo = new Date(new Date().setDate(today.getDate() - 30));

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const initialFilters: ReportFilters = {
    startDate: formatDate(thirtyDaysAgo),
    endDate: formatDate(today),
    hospital: '',
    department: '',
};

export default function ReportsDashboard({ addNotification }: { addNotification: (type: 'success' | 'error', message: string) => void }) {
    const [report, setReport] = useState<StatisticalReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<ReportFilters>(initialFilters);

    const fetchReport = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getStatisticalReport(filters);
            setReport(data);
        } catch (error) {
            addNotification('error', 'Failed to fetch report');
        } finally {
            setIsLoading(false);
        }
    }, [filters, addNotification]);

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
                </>
            )}
        </div>
    );
}
