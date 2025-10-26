import React, { useEffect, useMemo, useState } from 'react';
import { PageTitle, Card, Input, Select, Button, Table, Badge, Modal } from './ui';
import * as api from '../services/api';
import type { AuditLog } from '../types';

const ACTIONS = [
  'USER_LOGIN','LOGIN_FAILED','USER_REGISTERED','REGISTRATION_FAILED',
  'PATIENT_CREATED','PATIENT_PROFILE_VIEWED','PATIENT_PROFILE_UPDATED','PATIENT_DELETED','PATIENTS_LIST_VIEWED',
  'APPOINTMENT_BOOKED','APPOINTMENT_CANCELLED','APPOINTMENT_STATUS_UPDATED','APPOINTMENT_PAYMENT_PROCESSED',
  'MEDICAL_RECORD_VIEWED','MEDICAL_RECORD_UPDATED','PRESCRIPTION_ADDED','MEDICAL_RECORD_DOWNLOADED',
  'PROVIDER_CREATED','PROVIDER_UPDATED','PROVIDER_DELETED'
];

const variantForAction = (action: string): 'default'|'primary'|'success'|'warning'|'error' => {
  if (action.includes('FAILED') || action.includes('DELETED') || action.includes('CANCEL')) return 'error';
  if (action.includes('CREATED') || action.includes('BOOKED') || action.includes('PAYMENT')) return 'success';
  if (action.includes('UPDATED') || action.includes('STATUS')) return 'primary';
  return 'default';
};

export default function AuditHistory({ addNotification }: { addNotification: (t: 'success' | 'error', m: string) => void }) {
  const [filters, setFilters] = useState({
    userId: '',
    username: '',
    action: '',
    entityType: '',
    entityId: '',
    startDate: '',
    endDate: '',
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ content: AuditLog[]; currentPage: number; totalItems: number; totalPages: number; pageSize?: number; hasNext?: boolean; hasPrevious?: boolean; } | null>(null);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const canSearch = useMemo(() => true, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.queryAuditLogs({
        userId: filters.userId ? Number(filters.userId) : undefined,
        username: filters.username || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        entityId: filters.entityId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        size,
        sortDirection: 'DESC',
      });
      setData(res);
    } catch (e: any) {
      addNotification('error', e?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [page, size]);

  const onApply = () => { setPage(0); fetchLogs(); };
  const onReset = () => {
    setFilters({ userId: '', username: '', action: '', entityType: '', entityId: '', startDate: '', endDate: '' });
    setPage(0);
    setSize(20);
    fetchLogs();
  };

  return (
    <div>
      <PageTitle>Audit History</PageTitle>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="User ID" value={filters.userId} onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))} />
          <Input label="Username" value={filters.username} onChange={e => setFilters(f => ({ ...f, username: e.target.value }))} />
          <Select label="Action" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
            <option value="">All</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Input label="Entity Type" value={filters.entityType} onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))} />
          <Input label="Entity ID" value={filters.entityId} onChange={e => setFilters(f => ({ ...f, entityId: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Date" type="datetime-local" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
            <Input label="End Date" type="datetime-local" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={onReset}>Reset</Button>
          <Button onClick={onApply} disabled={!canSearch || loading}>Apply Filters</Button>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-500">{data ? `${data.totalItems} results` : ' '} </p>
          <div className="flex items-center gap-2">
            <Select label="Page Size" value={String(size)} onChange={e => { setSize(Number(e.target.value)); setPage(0); }}>
              {[10,20,50,100].map(n => <option key={n} value={n}>{n} / page</option>)}
            </Select>
            <div className="flex items-center gap-1 mt-6">
              <Button variant="secondary" onClick={() => setPage(p => Math.max(0, p-1))} disabled={!data || page === 0}>Prev</Button>
              <span className="text-sm text-slate-600">Page {page+1} {data ? `of ${data.totalPages}` : ''}</span>
              <Button variant="secondary" onClick={() => setPage(p => (data && p+1 < data.totalPages) ? p+1 : p)} disabled={!data || page+1 >= (data?.totalPages ?? 0)}>Next</Button>
            </div>
          </div>
        </div>

        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Header>Time</Table.Header>
              <Table.Header>Hash</Table.Header>
              <Table.Header>Action</Table.Header>
              <Table.Header>User</Table.Header>
              <Table.Header>Entity</Table.Header>
              <Table.Header>Details</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {loading && (
              <Table.Row><Table.Cell className="py-8" colSpan={6}>Loading...</Table.Cell></Table.Row>
            )}
            {!loading && data && data.content.length === 0 && (
              <Table.Row><Table.Cell className="py-8" colSpan={6}>No results</Table.Cell></Table.Row>
            )}
            {!loading && data && data.content.map(log => (
              <Table.Row key={log.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(log)}>
                <Table.Cell>{new Date(log.timestamp).toLocaleString()}</Table.Cell>
                <Table.Cell><code className="text-xs bg-slate-100 px-2 py-0.5 rounded">{log.auditHash}</code></Table.Cell>
                <Table.Cell><Badge variant={variantForAction(log.action)}>{log.action}</Badge></Table.Cell>
                <Table.Cell>{log.username} <span className="text-xs text-slate-400">(ID {log.userId})</span></Table.Cell>
                <Table.Cell>{log.entityType} <span className="text-xs text-slate-400">#{log.entityId}</span></Table.Cell>
                <Table.Cell className="truncate max-w-[24rem]" title={log.details}>{log.details}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Audit Log Details">
        {selected && (
          <div className="space-y-2 text-sm">
            <p><strong>Hash:</strong> <code>{selected.auditHash}</code></p>
            <p><strong>Action:</strong> {selected.action}</p>
            <p><strong>User:</strong> {selected.username} (ID {selected.userId})</p>
            <p><strong>Time:</strong> {new Date(selected.timestamp).toLocaleString()}</p>
            <p><strong>Entity:</strong> {selected.entityType} #{selected.entityId}</p>
            <p><strong>IP:</strong> {selected.ipAddress || '—'}</p>
            <p><strong>Details:</strong> {selected.details}</p>
            <div>
              <p className="font-semibold">Metadata</p>
              <pre className="bg-slate-100 p-2 rounded max-h-60 overflow-auto text-xs">{(() => {
                try { return JSON.stringify(selected.metadata ? JSON.parse(selected.metadata) : {}, null, 2); } catch { return selected.metadata || '—'; }
              })()}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

