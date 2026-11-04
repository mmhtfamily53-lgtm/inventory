import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  ShieldCheck, 
  UserCheck, 
  LogIn, 
  Lock, 
  KeyRound, 
  Trash2, 
  Edit3, 
  PowerOff, 
  Power,
  X,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { StaffMember, AttendanceRecord, LeaveRequest, UserRole } from '../types';
import { store } from '../services/store';

interface StaffManagementProps {
  currentRole: UserRole;
  onOpenChangePin?: () => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ currentRole, onOpenChangePin }) => {
  const currentUser = store.getCurrentUser();
  const [staff, setStaff] = useState<StaffMember[]>(store.getStaff());
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(store.getAttendance());
  const [leaves, setLeaves] = useState<LeaveRequest[]>(store.getLeaves());

  // In Worker mode, lock the selection strictly to themselves
  const myStaffRecord = staff.find(s => s.id === currentUser.id) || staff[0];
  const [selectedStaffId, setSelectedStaffId] = useState<string>(myStaffRecord?.id || '');
  const [shiftNote, setShiftNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Leave request form
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState(myStaffRecord?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Add staff modal state (Admin only)
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('WORKER');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffShift, setNewStaffShift] = useState<'MORNING' | 'EVENING' | 'FULL_DAY'>('MORNING');

  // Edit / Reset PIN modal state
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editPin, setEditPin] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('WORKER');
  const [editShift, setEditShift] = useState<'MORNING' | 'EVENING' | 'FULL_DAY'>('MORNING');

  // Reveal PIN toggle map
  const [revealedPins, setRevealedPins] = useState<{ [id: string]: boolean }>({});

  const todayStr = new Date().toISOString().split('T')[0];

  const handleClockAction = (status: AttendanceRecord['status'] = 'PRESENT') => {
    const targetId = currentRole === 'WORKER' ? currentUser.id : selectedStaffId;
    if (!targetId) return;
    const rec = store.clockInOut(targetId, status, shiftNote);
    setAttendance(store.getAttendance());
    setStatusMessage(`Shift Logged: ${rec.staffName} clocked ${rec.clockOutTime ? 'OUT at ' + rec.clockOutTime : 'IN at ' + rec.clockInTime}`);
    setShiftNote('');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = currentRole === 'WORKER' ? currentUser.id : leaveStaffId;
    if (!targetId || !startDate || !endDate) return;

    store.submitLeaveRequest({
      staffId: targetId,
      startDate,
      endDate,
      reason: leaveReason || 'Personal / Agricultural Harvest Season',
    });

    setLeaves(store.getLeaves());
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  const handleUpdateLeave = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    store.updateLeaveStatus(id, newStatus);
    setLeaves(store.getLeaves());
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName || !newStaffPin) return;

    store.addStaffMember({
      name: newStaffName,
      role: newStaffRole,
      phone: newStaffPhone || '',
      email: newStaffEmail || '',
      pin: newStaffPin,
      shift: newStaffShift,
      status: 'ACTIVE',
    });

    setStaff(store.getStaff());
    setIsAddStaffOpen(false);
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffEmail('');
    setNewStaffPin('');
    setStatusMessage(`Created employee account for ${newStaffName} with PIN ${newStaffPin}.`);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleToggleStatus = (member: StaffMember) => {
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      store.updateStaffCredentials(member.id, { status: newStatus });
      setStaff(store.getStaff());
      setStatusMessage(`Account for ${member.name} is now ${newStatus === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED (Locked Out)'}.`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Action prohibited');
    }
  };

  const handleDeleteStaff = (member: StaffMember) => {
    if (confirm(`Permanently delete ${member.name}? Their phone login will be revoked immediately.`)) {
      try {
        store.deleteStaffMember(member.id);
        setStaff(store.getStaff());
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setEditPin(member.pin || '');
    setEditRole(member.role);
    setEditShift(member.shift);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !editPin) return;

    store.updateStaffCredentials(editingStaff.id, {
      pin: editPin,
      role: editRole,
      shift: editShift,
    });

    setStaff(store.getStaff());
    setEditingStaff(null);
    setStatusMessage(`Updated credentials and PIN for ${editingStaff.name}.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Filter attendance and leaves
  const visibleAttendance = currentRole === 'WORKER'
    ? attendance.filter(a => a.staffId === currentUser.id)
    : attendance;

  const visibleLeaves = currentRole === 'WORKER'
    ? leaves.filter(l => l.staffId === currentUser.id)
    : leaves;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentRole === 'ADMIN' ? 'Staff Credentials & Access Control' : 'My Shift & Attendance Terminal'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {currentRole === 'ADMIN' 
              ? 'Manage worker phone accounts, set 4-digit PINs, toggle active/inactive status, and revoke device access.'
              : 'Log shift start and end times, track personal attendance, and submit leave requests.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === 'ADMIN' ? (
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Staff Account &amp; PIN</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Worker Session Active</span>
            </div>
          )}

          {onOpenChangePin && (
            <button
              onClick={onOpenChangePin}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Change My PIN</span>
            </button>
          )}

          <button
            onClick={() => {
              setLeaveStaffId(currentUser.id);
              setIsLeaveModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Admin Staff Credentials & Account Management Table (Strictly Admin Only) */}
      {currentRole === 'ADMIN' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Worker Accounts, PINs &amp; Device Authentication
                </h2>
                <p className="text-xs text-slate-500">
                  Staff log in with their Phone/Email + PIN. Disabled accounts are logged out immediately.
                </p>
              </div>
            </div>

            <span className="text-xs font-semibold text-slate-500 font-mono">
              {staff.length} registered accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3 font-semibold">Staff Member</th>
                  <th className="py-2.5 px-3 font-semibold">Login Identifier (Phone / Email)</th>
                  <th className="py-2.5 px-3 font-semibold">Security PIN</th>
                  <th className="py-2.5 px-3 font-semibold">Assigned Role</th>
                  <th className="py-2.5 px-3 font-semibold">Shift</th>
                  <th className="py-2.5 px-3 font-semibold">Account Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map(member => {
                  const isDeactivated = member.status === 'INACTIVE';
                  const isRevealed = !!revealedPins[member.id];

                  return (
                    <tr key={member.id} className={`hover:bg-slate-50 transition-colors ${
                      isDeactivated ? 'opacity-60 bg-slate-50/50' : ''
                    }`}>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {member.name}
                        {member.lastLoginAt && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            Last Active: {member.lastLoginAt}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700">
                        {member.phone || member.email || 'admin'}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {isRevealed ? member.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPins({ ...revealedPins, [member.id]: !isRevealed })}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title={isRevealed ? 'Hide PIN' : 'View PIN'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {member.role === 'ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {member.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                        {member.shift}
                      </td>

                      <td className="py-3 px-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDeactivated ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isDeactivated ? 'DEACTIVATED (Locked)' : 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit / Reset PIN */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 text-slate-600 hover:bg-slate-200 rounded transition-colors"
                            title="Edit Role & Reset PIN"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          {member.id !== 'staff-owner-001' && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(member)}
                              className={`p-1.5 rounded transition-colors ${
                                isDeactivated 
                                  ? 'text-emerald-700 hover:bg-emerald-100' 
                                  : 'text-amber-700 hover:bg-amber-100'
                              }`}
                              title={isDeactivated ? 'Re-activate Account' : 'Deactivate & Lock Out'}
                            >
                              {isDeactivated ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Delete Account */}
                          {member.id !== 'staff-owner-001' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(member)}
                              className="p-1.5 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                              title="Delete Account Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clock-In / Clock-Out Terminal */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Shift Clock Terminal ({todayStr})
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">Live Counter 1</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {currentRole === 'ADMIN' ? (
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full sm:w-64 text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 font-semibold text-slate-800 focus:outline-none"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role} · {s.shift} Shift)
                </option>
              ))}
            </select>
          ) : (
            <div className="w-full sm:w-64 px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 border border-slate-200">
              {currentUser.name} (Worker Session)
            </div>
          )}

          <input
            type="text"
            placeholder="Optional shift notes (e.g. Counter handover / opening register balance)..."
            value={shiftNote}
            onChange={(e) => setShiftNote(e.target.value)}
            className="w-full sm:flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleClockAction('PRESENT')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Clock In / Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column: Attendance Log & Leave Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Attendance Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            {currentRole === 'ADMIN' ? 'All Staff Attendance & Shift Log' : 'My Shift History'}
          </h3>

          {visibleAttendance.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No shift logs recorded today yet. Use the Clock In / Out terminal above to log work hours.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3 font-semibold">Staff Member</th>
                    <th className="py-2 px-3 font-semibold">Date</th>
                    <th className="py-2 px-3 font-semibold">Clock In / Out</th>
                    <th className="py-2 px-3 font-semibold">Status</th>
                    <th className="py-2 px-3 font-semibold">Shift Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleAttendance.map(att => (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {att.staffName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {att.date}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {att.clockInTime} {att.clockOutTime ? `→ ${att.clockOutTime}` : '(Active)'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {att.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[120px]">
                        {att.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leave / Holiday Requests */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {currentRole === 'ADMIN' ? 'Staff Leave & Holiday Applications' : 'My Leave Requests'}
            </h3>
            <span className="text-xs text-slate-400">
              {visibleLeaves.length} Applications
            </span>
          </div>

          {visibleLeaves.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              No leave requests currently logged.
            </div>
          ) : (
            <div className="space-y-3">
              {visibleLeaves.map(l => (
                <div key={l.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{l.staffName}</span>
                      <span className="text-[11px] text-slate-500 font-mono block">
                        {l.startDate} to {l.endDate}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      l.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {l.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                    "{l.reason}"
                  </p>

                  {currentRole === 'ADMIN' && l.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleUpdateLeave(l.id, 'APPROVED')}
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateLeave(l.id, 'REJECTED')}
                        className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px]"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Add Staff Account Modal */}
      {isAddStaffOpen && currentRole === 'ADMIN' && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Create Staff Login &amp; Role</h3>
              <button onClick={() => setIsAddStaffOpen(false)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Mobile Login Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">4-Digit Login PIN *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 5521"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold tracking-widest text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">System Role *</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="WORKER">Worker / Cashier (Restricted)</option>
                    <option value="ADMIN">Admin / Owner (Full Access)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Assigned Shift</label>
                  <select
                    value={newStaffShift}
                    onChange={(e) => setNewStaffShift(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="FULL_DAY">Full Day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="cashier@shop.local"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Credentials / Reset PIN Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Edit Credentials: {editingStaff.name}
              </h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">New 4-Digit Security PIN *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold tracking-widest text-emerald-800"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Staff member will use this PIN to log in on their device.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="WORKER">Worker (Restricted)</option>
                    <option value="ADMIN">Admin (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Shift</label>
                  <select
                    value={editShift}
                    onChange={(e) => setEditShift(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="MORNING">Morning Shift</option>
                    <option value="EVENING">Evening Shift</option>
                    <option value="FULL_DAY">Full Day</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
