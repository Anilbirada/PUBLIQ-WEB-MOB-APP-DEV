"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, Shield, KeyRound, Plus, Edit2, Trash2, 
  Search, CheckCircle2, AlertCircle, Phone, Mail, Award,
  Sparkles, Check, Clock, Calendar, DollarSign, Printer,
  RefreshCw, ChevronDown, Lock, ShieldAlert, Eye, UserX, FileText
} from "lucide-react";
import { API_BASE } from "@/lib/api";

interface Employee {
  id: string;
  employee_code: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  role_id?: string;
  pin_code: string;
  salary_type: "MONTHLY" | "DAILY" | "HOURLY";
  salary: number;
  daily_wage: number;
  hourly_wage: number;
  allowances: number;
  deductions: number;
  is_active: boolean;
  must_change_password: boolean;
  attendance_today: string;
  check_in_time?: string | null;
  check_out_time?: string | null;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  department: string;
  description: string;
  permissions: string[];
  is_system: boolean;
  is_active: boolean;
  employee_count: number;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  role: string;
  department: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "PRESENT" | "ABSENT" | "LEAVE" | "WEEKLY_OFF" | "LATE" | "HALF_DAY";
  working_hours: number;
  late_minutes: number;
  marked_by: string;
  notes?: string;
}

interface PayrollItem {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_code: string;
  role: string;
  department: string;
  month_period: string;
  salary_type: string;
  base_salary: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  hours_worked: number;
  allowances: number;
  deductions: number;
  calculated_payable: number;
  payment_status: "PENDING" | "PAID";
  payment_date?: string | null;
  payment_method?: string | null;
  notes?: string;
}

const AVAILABLE_PERMISSIONS = [
  { code: "orders.view", label: "View Guest & Table Orders" },
  { code: "orders.approve", label: "Approve Orders (Waiter Gate)" },
  { code: "orders.reject", label: "Reject Order Items with Reason" },
  { code: "kds.view", label: "Kitchen Display (KDS) View" },
  { code: "kds.bump", label: "Kitchen KOT Bump / Cook Action" },
  { code: "bar.view", label: "Bar Dispense Station View" },
  { code: "bar.bump", label: "Bar Drinks Bump / Pour Action" },
  { code: "bills.create", label: "Generate Department GST Invoices" },
  { code: "bills.settle", label: "Settle Payments & Release Tables" },
  { code: "tables.manage", label: "Floor & Table Management" },
  { code: "inventory.manage", label: "Inventory & Liquor Cellar" },
  { code: "reports.view", label: "Financial & 5% GST Reports" },
  { code: "staff.manage", label: "Staff, Attendance & Payroll Management" },
];

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<"STAFF" | "ROLES" | "ATTENDANCE" | "PAYROLL">("STAFF");
  
  // Staff Directory State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  
  // Modals State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [employeeFormData, setEmployeeFormData] = useState<any>({
    name: "",
    username: "",
    email: "",
    phone: "",
    department: "FLOOR",
    position: "Waiter",
    role: "WAITER",
    password: "",
    pin_code: "1234",
    salary_type: "MONTHLY",
    salary: 25000,
    daily_wage: 0,
    hourly_wage: 0,
    allowances: 0,
    deductions: 0
  });

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleFormData, setRoleFormData] = useState<{
    id?: string;
    name: string;
    code: string;
    department: string;
    description: string;
    permissions: string[];
  }>({
    name: "",
    code: "",
    department: "ALL",
    description: "",
    permissions: []
  });

  // Clock-in / PIN attendance state
  const [punchPin, setPunchPin] = useState("");
  const [punchFeedback, setPunchFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Manual Attendance Mark Modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [selectedEmpForMark, setSelectedEmpForMark] = useState<Employee | null>(null);
  const [markForm, setMarkForm] = useState({
    status: "PRESENT",
    check_in: "10:00 AM",
    check_out: "07:00 PM",
    working_hours: 8.0,
    late_minutes: 0,
    notes: ""
  });

  // Payroll State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payrollRecords, setPayrollRecords] = useState<PayrollItem[]>([]);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [activePayslip, setActivePayslip] = useState<any | null>(null);

  // Temporary password display modal
  const [tempPasswordModal, setTempPasswordModal] = useState<{ empName: string; tempPass: string } | null>(null);

  // Fetch staff
  const fetchEmployees = async () => {
    setLoadingStaff(true);
    try {
      const res = await fetch(`${API_BASE}/admin/staff/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/staff/roles`);
      if (res.ok) {
        const data = await res.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  // Fetch attendance
  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`${API_BASE}/admin/staff/attendance?date_str=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Fetch payroll
  const fetchPayroll = async () => {
    setLoadingPayroll(true);
    try {
      const res = await fetch(`${API_BASE}/admin/staff/payroll?month_period=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setPayrollRecords(data.payroll_records || []);
      }
    } catch (err) {
      console.error("Failed to fetch payroll:", err);
    } finally {
      setLoadingPayroll(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === "ATTENDANCE") {
      fetchAttendance();
    } else if (activeTab === "PAYROLL") {
      fetchPayroll();
    }
  }, [activeTab, selectedDate, selectedMonth]);

  // Handle Employee Save (Create or Update)
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const res = await fetch(`${API_BASE}/admin/staff/employees/${editingEmployee.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employeeFormData)
        });
        if (res.ok) {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
          fetchEmployees();
        } else {
          const err = await res.json();
          alert(err.detail || "Failed to update employee.");
        }
      } else {
        const res = await fetch(`${API_BASE}/admin/staff/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employeeFormData)
        });
        if (res.ok) {
          setIsEmployeeModalOpen(false);
          fetchEmployees();
        } else {
          const err = await res.json();
          alert(err.detail || "Failed to create employee.");
        }
      }
    } catch (err) {
      alert("Error saving employee profile.");
    }
  };

  // Toggle Staff Active/Inactive
  const handleToggleStatus = async (empId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/staff/employees/${empId}/toggle-status`, {
        method: "POST"
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Reset Employee Password
  const handleResetPassword = async (emp: Employee) => {
    if (!confirm(`Reset login password for ${emp.name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/staff/employees/${emp.id}/reset-password`, {
        method: "POST"
      });
      if (res.ok) {
        const data = await res.json();
        setTempPasswordModal({
          empName: emp.name,
          tempPass: data.temp_password
        });
        fetchEmployees();
      }
    } catch (err) {
      alert("Failed to reset password.");
    }
  };

  // Safe Archive Employee
  const handleArchiveEmployee = async (empId: string, empName: string) => {
    if (!confirm(`Are you sure you want to deactivate and archive ${empName}? All historic transactions will be preserved.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/staff/employees/${empId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchEmployees();
      }
    } catch (err) {
      alert("Error archiving employee.");
    }
  };

  // Handle Dynamic Role Save
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (roleFormData.id) {
        const res = await fetch(`${API_BASE}/admin/staff/roles/${roleFormData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roleFormData)
        });
        if (res.ok) {
          setIsRoleModalOpen(false);
          fetchRoles();
        } else {
          const err = await res.json();
          alert(err.detail || "Failed to update role.");
        }
      } else {
        const res = await fetch(`${API_BASE}/admin/staff/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roleFormData)
        });
        if (res.ok) {
          setIsRoleModalOpen(false);
          fetchRoles();
        } else {
          const err = await res.json();
          alert(err.detail || "Failed to create role.");
        }
      }
    } catch (err) {
      alert("Error saving role.");
    }
  };

  // Biometric PIN Punch Clock-In
  const handlePinPunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchPin || punchPin.length < 4) {
      setPunchFeedback({ type: "error", text: "Please enter a 4-digit PIN." });
      return;
    }
    const matched = employees.find(emp => emp.pin_code === punchPin);
    if (!matched) {
      setPunchFeedback({ type: "error", text: "PIN not recognized. Please check with your supervisor." });
      return;
    }

    try {
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const res = await fetch(`${API_BASE}/admin/staff/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: matched.id,
          date: new Date().toISOString().split("T")[0],
          status: "PRESENT",
          check_in: nowStr,
          working_hours: 8.0,
          marked_by: "Biometric PIN Punch"
        })
      });

      if (res.ok) {
        setPunchFeedback({
          type: "success",
          text: `Clock-In Verified! ${matched.name} (${matched.position}) recorded at ${nowStr}.`
        });
        setPunchPin("");
        fetchEmployees();
        if (activeTab === "ATTENDANCE") fetchAttendance();
      }
    } catch (err) {
      setPunchFeedback({ type: "error", text: "Network error during clock-in." });
    } finally {
      setTimeout(() => setPunchFeedback(null), 6000);
    }
  };

  // Supervisor Mark Attendance
  const handleSupervisorMark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpForMark) return;

    try {
      const res = await fetch(`${API_BASE}/admin/staff/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: selectedEmpForMark.id,
          date: selectedDate,
          status: markForm.status,
          check_in: markForm.check_in,
          check_out: markForm.check_out,
          working_hours: markForm.working_hours,
          late_minutes: markForm.late_minutes,
          notes: markForm.notes,
          marked_by: "Super Admin"
        })
      });

      if (res.ok) {
        setIsMarkModalOpen(false);
        fetchAttendance();
        fetchEmployees();
      } else {
        alert("Failed to mark attendance.");
      }
    } catch (err) {
      alert("Error marking attendance.");
    }
  };

  // Compute Monthly Payroll
  const handleCalculatePayroll = async () => {
    setLoadingPayroll(true);
    try {
      const res = await fetch(`${API_BASE}/admin/staff/payroll/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month_period: selectedMonth, working_days: 26 })
      });
      if (res.ok) {
        fetchPayroll();
      }
    } catch (err) {
      alert("Error calculating payroll.");
    } finally {
      setLoadingPayroll(false);
    }
  };

  // Mark Payroll as Paid
  const handlePayPayroll = async (payrollId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/staff/payroll/${payrollId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: "BANK_TRANSFER", notes: "Disbursed via official payroll account" })
      });
      if (res.ok) {
        fetchPayroll();
      }
    } catch (err) {
      alert("Error recording disbursement.");
    }
  };

  // View Payslip Statement
  const handleViewPayslip = async (payrollId: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/staff/payroll/${payrollId}/statement`);
      if (res.ok) {
        const data = await res.json();
        setActivePayslip(data.payslip);
      }
    } catch (err) {
      alert("Error loading payslip statement.");
    }
  };

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    const matchDept = deptFilter === "ALL" || emp.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* 1. Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Human Capital &amp; Role-Based Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Staff, Dynamic Roles &amp; Payroll Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure personnel, dynamic custom permissions, biometric clock-in, and automated payroll calculations.
            </p>
          </div>

          {/* Biometric Clock-In Widget */}
          <form onSubmit={handlePinPunch} className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <KeyRound className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="password"
              maxLength={6}
              placeholder="Enter Staff PIN"
              value={punchPin}
              onChange={(e) => setPunchPin(e.target.value)}
              className="w-32 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-center font-mono font-bold tracking-widest text-slate-900 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs hover:shadow-blue-500/20 transition-all"
            >
              Clock In
            </button>
          </form>
        </div>

        {/* Punch Notification Feedback */}
        {punchFeedback && (
          <div className={`mb-6 p-4 rounded-2xl border text-xs flex items-center gap-2.5 animate-fadeIn ${
            punchFeedback.type === "success" 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}>
            {punchFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-semibold">{punchFeedback.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-2">
          <button
            onClick={() => setActiveTab("STAFF")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "STAFF"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Staff Directory &amp; Accounts ({employees.length})
          </button>

          <button
            onClick={() => setActiveTab("ROLES")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ROLES"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            Dynamic Roles &amp; Permissions ({roles.length})
          </button>

          <button
            onClick={() => setActiveTab("ATTENDANCE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "ATTENDANCE"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            Shift Attendance &amp; Hours
          </button>

          <button
            onClick={() => setActiveTab("PAYROLL")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === "PAYROLL"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Payroll &amp; Salary Statements
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF DIRECTORY & ACCOUNTS                                         */}
      {/* ========================================================================= */}
      {activeTab === "STAFF" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Action & Filter Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, code, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="BAR">Bar</option>
                <option value="FLOOR">Floor / Service</option>
                <option value="MANAGEMENT">Management</option>
                <option value="ACCOUNTS">Accounts</option>
              </select>

              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEmployeeFormData({
                    name: "",
                    username: "",
                    email: "",
                    phone: "",
                    department: "FLOOR",
                    position: "Service Steward",
                    role: "WAITER",
                    password: "",
                    pin_code: "1234",
                    salary_type: "MONTHLY",
                    salary: 25000,
                    daily_wage: 0,
                    hourly_wage: 0,
                    allowances: 0,
                    deductions: 0
                  });
                  setIsEmployeeModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs hover:shadow-blue-500/20 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Staff Member
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Code &amp; Department</th>
                    <th className="py-3.5 px-4">Role &amp; Credentials</th>
                    <th className="py-3.5 px-4">Salary Structure</th>
                    <th className="py-3.5 px-4 text-center">Today's Shift</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingStaff ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Loading employee roster...
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Name & Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{emp.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" />{emp.email}</span>
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" />{emp.phone}</span>
                          </div>
                        </td>

                        {/* Code & Dept */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                            {emp.employee_code}
                          </span>
                          <div className="text-[11px] font-semibold text-slate-600 mt-1">
                            {emp.department} • {emp.position}
                          </div>
                        </td>

                        {/* Role & Credentials */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                            {emp.role}
                          </span>
                          <div className="text-[11px] text-slate-500 font-mono mt-1">
                            User: <strong>{emp.username}</strong> | PIN: ****
                          </div>
                        </td>

                        {/* Salary */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            ₹{emp.salary.toLocaleString()}
                            <span className="text-[10px] text-slate-400 font-normal ml-1">/ {emp.salary_type.toLowerCase()}</span>
                          </div>
                          {(emp.allowances > 0 || emp.deductions > 0) && (
                            <span className="text-[10px] text-slate-400 block">
                              +₹{emp.allowances} allow. | -₹{emp.deductions} ded.
                            </span>
                          )}
                        </td>

                        {/* Today's Shift */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            emp.attendance_today === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.attendance_today === "PRESENT" ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {emp.attendance_today}
                          </span>
                          {emp.check_in_time && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">{emp.check_in_time}</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(emp.id)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                              emp.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                            }`}
                          >
                            {emp.is_active ? "Active" : "Deactivated"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmployeeFormData({
                                  name: emp.name,
                                  username: emp.username,
                                  email: emp.email,
                                  phone: emp.phone,
                                  department: emp.department,
                                  position: emp.position,
                                  role: emp.role,
                                  pin_code: emp.pin_code,
                                  salary_type: emp.salary_type,
                                  salary: emp.salary,
                                  daily_wage: emp.daily_wage,
                                  hourly_wage: emp.hourly_wage,
                                  allowances: emp.allowances,
                                  deductions: emp.deductions
                                });
                                setIsEmployeeModalOpen(true);
                              }}
                              title="Edit Employee Profile"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleResetPassword(emp)}
                              title="Reset Login Password"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleArchiveEmployee(emp.id, emp.name)}
                              title="Safe Archive Account"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DYNAMIC ROLES & PERMISSIONS                                        */}
      {/* ========================================================================= */}
      {activeTab === "ROLES" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">Custom Dynamic Roles</h2>
              <p className="text-xs text-slate-500">
                Create new job roles and grant granular operation permissions across the application.
              </p>
            </div>
            <button
              onClick={() => {
                setRoleFormData({
                  name: "",
                  code: "",
                  department: "ALL",
                  description: "",
                  permissions: ["orders.view"]
                });
                setIsRoleModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-xs hover:shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      {r.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{r.name}</h3>
                    <span className="text-xs text-slate-400">{r.department} Department</span>
                  </div>

                  {r.is_system ? (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      System Role
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setRoleFormData({
                          id: r.id,
                          name: r.name,
                          code: r.code,
                          department: r.department,
                          description: r.description,
                          permissions: r.permissions || []
                        });
                        setIsRoleModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {r.description || "Custom operational role."}
                </p>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Granted Permissions ({r.permissions?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions?.slice(0, 5).map((p, idx) => (
                      <span key={idx} className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                    {(r.permissions?.length || 0) > 5 && (
                      <span className="text-[10px] text-slate-400 font-semibold px-1 py-0.5">
                        +{r.permissions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-100">
                  <span>Assigned Personnel:</span>
                  <span className="font-bold text-slate-800">{r.employee_count} staff</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SHIFT ATTENDANCE & HOURS                                           */}
      {/* ========================================================================= */}
      {activeTab === "ATTENDANCE" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-medium">Daily Roster View</span>
            </div>

            <button
              onClick={fetchAttendance}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendance ? "animate-spin text-blue-600" : ""}`} />
              Refresh Attendance
            </button>
          </div>

          {/* Attendance Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Department &amp; Role</th>
                    <th className="py-3.5 px-4">Check-In Time</th>
                    <th className="py-3.5 px-4">Check-Out Time</th>
                    <th className="py-3.5 px-4 text-center">Working Hours</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Supervisor Override</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingAttendance ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        Loading daily attendance log...
                      </td>
                    </tr>
                  ) : attendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No attendance records logged for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    attendanceRecords.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{att.employee_name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{att.employee_code}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{att.department}</span>
                          <span className="text-[11px] text-slate-400 block">{att.role}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                          {att.check_in || "—"}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                          {att.check_out || "—"}
                        </td>

                        <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                          {att.working_hours} hrs
                          {att.late_minutes > 0 && (
                            <span className="text-[10px] text-rose-600 block">({att.late_minutes}m late)</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : att.status === "LATE"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : att.status === "HALF_DAY"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-rose-100 text-rose-800 border border-rose-200"
                          }`}>
                            {att.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              const emp = employees.find(e => e.id === att.employee_id) || null;
                              setSelectedEmpForMark(emp);
                              setMarkForm({
                                status: att.status,
                                check_in: att.check_in || "10:00 AM",
                                check_out: att.check_out || "07:00 PM",
                                working_hours: att.working_hours,
                                late_minutes: att.late_minutes,
                                notes: att.notes || ""
                              });
                              setIsMarkModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px]"
                          >
                            Edit Log &rarr;
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PAYROLL & SALARY STATEMENTS                                        */}
      {/* ========================================================================= */}
      {activeTab === "PAYROLL" && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
              />
              <span className="text-xs text-slate-500 font-medium">Payroll Cycle</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCalculatePayroll}
                disabled={loadingPayroll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-xs hover:shadow-emerald-500/20 transition-all"
              >
                <DollarSign className="w-4 h-4" />
                Compute Monthly Payroll
              </button>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Role &amp; Type</th>
                    <th className="py-3.5 px-4 text-right">Base Salary</th>
                    <th className="py-3.5 px-4 text-center">Days Worked</th>
                    <th className="py-3.5 px-4 text-right">Allowances</th>
                    <th className="py-3.5 px-4 text-right">Deductions</th>
                    <th className="py-3.5 px-4 text-right">Net Payable</th>
                    <th className="py-3.5 px-4 text-center">Disbursement</th>
                    <th className="py-3.5 px-4 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loadingPayroll ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        Calculating payroll disbursements...
                      </td>
                    </tr>
                  ) : payrollRecords.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center text-slate-400">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        No payroll computed for {selectedMonth}. Click "Compute Monthly Payroll" above.
                      </td>
                    </tr>
                  ) : (
                    payrollRecords.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{pr.employee_name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{pr.employee_code}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">{pr.role}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {pr.salary_type}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                          ₹{pr.base_salary.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-slate-900">{pr.present_days} days</span>
                          <span className="text-[10px] text-slate-400 block">({pr.hours_worked} hrs)</span>
                        </td>

                        <td className="py-3.5 px-4 text-right text-emerald-700 font-semibold">
                          +₹{pr.allowances}
                        </td>

                        <td className="py-3.5 px-4 text-right text-rose-700 font-semibold">
                          -₹{pr.deductions}
                        </td>

                        <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                          ₹{pr.calculated_payable.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {pr.payment_status === "PAID" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              PAID
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePayPayroll(pr.id)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition-colors"
                            >
                              Mark Disbursed
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleViewPayslip(pr.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                            title="View / Print Formal Payslip"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT EMPLOYEE                                              */}
      {/* ========================================================================= */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Personnel Directory</span>
                <h3 className="text-xl font-bold text-slate-900">
                  {editingEmployee ? `Edit ${editingEmployee.name}` : "Register New Staff Member"}
                </h3>
              </div>
              <button
                onClick={() => setIsEmployeeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. Ramesh Kumar"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.username}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, username: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="e.g. ramesh_waiter"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={employeeFormData.email}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="ramesh@publiq.com"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={employeeFormData.phone}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                    placeholder="+91 98110 00000"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Department *</label>
                  <select
                    value={employeeFormData.department}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  >
                    <option value="FLOOR">Floor / Service</option>
                    <option value="KITCHEN">Kitchen / Culinary</option>
                    <option value="BAR">Bar &amp; Mixology</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="ACCOUNTS">Accounts &amp; Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Job Designation *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.position}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                    placeholder="e.g. Senior Mixologist"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">System Role *</label>
                  <select
                    value={employeeFormData.role}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.code}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">4-Digit Biometric PIN *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={employeeFormData.pin_code}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, pin_code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 text-center font-mono font-bold tracking-widest focus:outline-none"
                    placeholder="1234"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Salary Type *</label>
                  <select
                    value={employeeFormData.salary_type}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary_type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly Fixed</option>
                    <option value="DAILY">Daily Wage</option>
                    <option value="HOURLY">Hourly Rate</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Pay / Salary (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={employeeFormData.salary}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Allowances (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={employeeFormData.allowances}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, allowances: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Deductions (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={employeeFormData.deductions}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, deductions: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Password (Default: publiq123)</label>
                  <input
                    type="password"
                    value={employeeFormData.password}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                    placeholder="Leave empty for publiq123"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs hover:shadow-blue-500/20"
                >
                  {editingEmployee ? "Update Profile" : "Register Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DYNAMIC ROLE CREATE / EDIT                                       */}
      {/* ========================================================================= */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Security &amp; Permissions</span>
                <h3 className="text-xl font-bold text-slate-900">
                  {roleFormData.id ? `Edit Role: ${roleFormData.name}` : "Create Custom Dynamic Role"}
                </h3>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  placeholder="e.g. Beverage Sommelier"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role Code (Unique Uppercase) *</label>
                <input
                  type="text"
                  required
                  disabled={!!roleFormData.id}
                  value={roleFormData.code}
                  onChange={(e) => setRoleFormData({ ...roleFormData, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono focus:outline-none"
                  placeholder="e.g. SOMMELIER"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Department</label>
                <select
                  value={roleFormData.department}
                  onChange={(e) => setRoleFormData({ ...roleFormData, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                >
                  <option value="ALL">All Departments</option>
                  <option value="KITCHEN">Kitchen</option>
                  <option value="BAR">Bar</option>
                  <option value="FLOOR">Floor</option>
                  <option value="MANAGEMENT">Management</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={roleFormData.description}
                  onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  placeholder="Brief description of role responsibilities..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-2">Granted Functional Permissions</label>
                <div className="space-y-2 border border-slate-100 rounded-2xl p-3 bg-slate-50/50 max-h-48 overflow-y-auto">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = roleFormData.permissions.includes(perm.code);
                    return (
                      <label key={perm.code} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoleFormData({ ...roleFormData, permissions: [...roleFormData.permissions, perm.code] });
                            } else {
                              setRoleFormData({ ...roleFormData, permissions: roleFormData.permissions.filter(p => p !== perm.code) });
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800">{perm.label}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">{perm.code}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-xs hover:shadow-blue-500/20"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SUPERVISOR ATTENDANCE OVERRIDE                                   */}
      {/* ========================================================================= */}
      {isMarkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Attendance Correction</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedEmpForMark ? selectedEmpForMark.name : "Employee"}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{selectedDate}</span>
              </div>
              <button
                onClick={() => setIsMarkModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSupervisorMark} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Attendance Status *</label>
                <select
                  value={markForm.status}
                  onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="HALF_DAY">HALF DAY</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LEAVE">APPROVED LEAVE</option>
                  <option value="WEEKLY_OFF">WEEKLY OFF</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Check-In</label>
                  <input
                    type="text"
                    value={markForm.check_in}
                    onChange={(e) => setMarkForm({ ...markForm, check_in: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono focus:outline-none"
                    placeholder="10:00 AM"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Check-Out</label>
                  <input
                    type="text"
                    value={markForm.check_out}
                    onChange={(e) => setMarkForm({ ...markForm, check_out: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono focus:outline-none"
                    placeholder="07:00 PM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={markForm.working_hours}
                    onChange={(e) => setMarkForm({ ...markForm, working_hours: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Late Minutes</label>
                  <input
                    type="number"
                    value={markForm.late_minutes}
                    onChange={(e) => setMarkForm({ ...markForm, late_minutes: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Reason</label>
                <input
                  type="text"
                  value={markForm.notes}
                  onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  placeholder="Supervisor remarks..."
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsMarkModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700"
                >
                  Save Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: TEMPORARY PASSWORD DISPLAY                                       */}
      {/* ========================================================================= */}
      {tempPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Reset Successful</h3>
            <p className="text-xs text-slate-500 mt-1">
              Temporary password generated for <strong>{tempPasswordModal.empName}</strong>:
            </p>
            <div className="my-4 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-base text-blue-700 tracking-wider">
              {tempPasswordModal.tempPass}
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              The user will be required to change their password immediately upon next login.
            </p>
            <button
              onClick={() => setTempPasswordModal(null)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              Done &amp; Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: FORMAL PAYSLIP STATEMENT                                         */}
      {/* ========================================================================= */}
      {activePayslip && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Formal Salary Statement</span>
                <h3 className="text-lg font-serif font-bold text-slate-900">PUBLIQ Haragadde</h3>
                <p className="text-xs text-slate-400">Statement ID: {activePayslip.statement_id?.slice(-8)}</p>
              </div>
              <button
                onClick={() => setActivePayslip(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Employee Name:</span>
                  <span className="font-bold text-slate-900">{activePayslip.employee_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Employee Code:</span>
                  <span className="font-mono font-bold text-slate-900">{activePayslip.employee_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Designation:</span>
                  <span className="font-medium text-slate-800">{activePayslip.designation}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Month Period:</span>
                  <span className="font-bold text-blue-700">{activePayslip.month_period}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-3">
                <span className="font-bold text-slate-800 block mb-2">Earnings &amp; Gross Pay</span>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Base Wage / Salary:</span>
                  <span className="font-mono">₹{activePayslip.earnings?.base_salary?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Allowances:</span>
                  <span className="font-mono">+₹{activePayslip.earnings?.allowances?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-100 font-bold text-slate-900">
                  <span>Gross Earnings:</span>
                  <span className="font-mono">₹{activePayslip.earnings?.gross_earnings?.toFixed(2)}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-3">
                <span className="font-bold text-slate-800 block mb-2">Deductions</span>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Unpaid Absence Deductions:</span>
                  <span className="font-mono text-rose-600">-₹{activePayslip.deductions?.unpaid_absence_deduction?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 text-slate-600">
                  <span>Other Deductions:</span>
                  <span className="font-mono text-rose-600">-₹{activePayslip.deductions?.other_deductions?.toFixed(2)}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Net Take-Home Payable</span>
                  <span className="text-xs text-emerald-700 font-medium">Disbursed via official payroll bank transfer</span>
                </div>
                <span className="text-xl font-black text-emerald-950 font-mono">
                  ₹{activePayslip.net_payable?.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print Formal Payslip
              </button>
              <button
                onClick={() => setActivePayslip(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
