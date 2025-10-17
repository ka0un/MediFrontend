import { StatisticalReport, HealthcareProvider } from '../types/reports';

export const exportToCSV = (data: any[][], filename: string) => {
  try {
    const csvContent = data.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
};

export const exportStatisticalData = (report: StatisticalReport, filters: { startDate: string; endDate: string }) => {
  if (!report) return false;
  
  const statsData = [
    ['Metric', 'Value'],
    ['Total Visits', report.kpis.totalVisits],
    ['Confirmed Appointments', report.kpis.confirmedAppointments],
    ['Pending Payments', report.kpis.pendingPayments],
    ['Cancelled Appointments', report.kpis.cancelledAppointments],
    ['Total Revenue', `$${report.kpis.totalRevenue.toFixed(2)}`],
    ['Average Wait Time', `${report.kpis.averageWaitTime} mins`],
    ['Appointment Completion Rate', `${report.kpis.appointmentCompletionRate.toFixed(1)}%`],
    ['', ''],
    ['Date Range', `${filters.startDate} to ${filters.endDate}`]
  ];

  const filename = `statistics_${new Date().toISOString().split('T')[0]}.csv`;
  return exportToCSV(statsData, filename);
};

export const exportProvidersData = (providers: HealthcareProvider[]) => {
  const headers = ['Name', 'Specialty', 'Hospital Name', 'Hospital Type'];
  const data = [
    headers,
    ...providers.map(provider => [
      provider.name || '',
      provider.specialty || '',
      provider.hospitalName || '',
      provider.hospitalType || ''
    ])
  ];

  const filename = `providers_${new Date().toISOString().split('T')[0]}.csv`;
  return exportToCSV(data, filename);
};

export const exportProvidersStats = (providers: HealthcareProvider[]) => {
  const providerCounts = providers.reduce((acc, provider) => {
    if (!provider.hospitalType) return acc;
    const type = provider.hospitalType === 'GOVERNMENT' ? 'Government' : 'Private';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = [
    ['Hospital Type', 'Provider Count'],
    ...Object.entries(providerCounts).map(([type, count]) => [type, count.toString()])
  ];

  const filename = `providers_stats_${new Date().toISOString().split('T')[0]}.csv`;
  return exportToCSV(data, filename);
};
