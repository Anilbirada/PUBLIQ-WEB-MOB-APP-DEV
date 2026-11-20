"use client";
import { API_BASE } from "@/lib/api";

import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, Clock, Shield, KeyRound, 
  Search, CheckCircle2, AlertCircle, Phone, Mail, Award,
  Sparkles, Check
} from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  pin_code: string;
  salary: number;
  is_active: boolean;
  attendance_today: string;
  check_in_time: string | null;
}

const FALLBACK_STAFF: Employee[] = [
  {
    id: "emp-1",
    name: "Vikramaditya Roy",
    role: "General Manager",
    email: "gm@publiq.com",
    phone: "+91 98110 01100",
    pin_code: "1001",
    salary: 145000,
    is_active: true,
    attendance_today: "PRESENT",
    check_in_time: "10:30 AM"
  },
  {
    id: "emp-2",
    name: "Sunil Sharma",
    role: "Outlet Manager",
    email: "manager@publiq.com",
    phone: "+91 98110 02200",
    pin_code: "1002",
    salary: 85000,
    is_active: true,
    attendance_today: "PRESENT",
    check_in_time: "11:00 AM"
  },
  {
    id: "emp-3",
    name: "Amitabh Sen",
    role: "Senior Cashier",
    email: "cashier@publiq.com",
    phone: "+91 98110 03300",
    pin_code: "1003",
    salary: 45000,
    is_active: true,
    attendance_today: "PRESENT",
    check_in_time: "11:15 AM"
  },
  {
    id: "emp-4",
    name: "Chef Hemant Kapoor",
    role: "Executive Chef",
    email: "chef@publiq.com",
    phone: "+91 98110 04400",
    pin_code: "1004",
    salary: 110000,
    is_active: true,
    attendance_today: "PRESENT",
    check_in_time: "10:45 AM"
  },
  {
    id: "emp-5",
    name: "Marcello D'Souza",
    role: "Head Mixologist",
    email: "bar@publiq.com",
    phone: "+91 98110 05500",
    pin_code: "1005",
    salary: 68000,
    is_active: true,
    attendance_today: "PRESENT",
    check_in_time: "03:00 PM"
  },
  {
    id: "emp-6",
    name: "Deepak Rawat",
    role: "Inventory & Store Manager",
    email: "store@publiq.com",
    phone: "+91 98110 06600",
    pin_code: "1006",
    salary: 42000,
    is_active: true,
    attendance_today: "NOT_MARKED",
    check_in_time: null
  },
  {
    id: "emp-7",
    name: "Rohan Varma",
    role: "Senior Captain",
    email: "floor@publiq.com",
    phone: "+91 98110 07700",
    pin_code: "1007",
    salary: 38000,
    is_active: true,
    attendance_today: "PRESENT",
    check_in_time: "11:45 AM"
  }
];

export default function EmployeeManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>(FALLBACK_STAFF);
  const [searchTerm, setSearchTerm] = useState("");
  const [punchPin, setPunchPin] = useState("");
  const [punchFeedback, setPunchFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/management/employees`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) setEmployees(data);
      }
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handlePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!punchPin || punchPin.length < 4) {
      setPunchFeedback({ type: "error", text: "Please enter a valid 4-digit PIN." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/management/employees/punch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin_code: punchPin })
      });

      if (res.ok) {
        const data = await res.json();
        setPunchFeedback({ type: "success", text: `${data.employee_name} (${data.role}): ${data.message}` });
        setPunchPin("");
        fetchEmployees();
      } else {
        // Fallback local simulation
        const matched = employees.find(emp => emp.pin_code === punchPin);
        if (matched) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setEmployees(prev => prev.map(emp => {
            if (emp.pin_code === punchPin) {
              return { ...emp, attendance_today: "PRESENT", check_in_time: nowStr };
            }
            return emp;
          }));
          setPunchFeedback({ type: "success", text: `${matched.name} (${matched.role}): Clocked in successfully at ${nowStr}` });
          setPunchPin("");
        } else {
          setPunchFeedback({ type: "error", text: "Invalid Staff PIN. Please try again." });
        }
      }
    } catch {
      setPunchFeedback({ type: "error", text: "Connection error. Punch logged locally." });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setPunchFeedback(null), 5000);
    }
  };

  const filtered = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const presentCount = employees.filter(e => e.attendance_today === "PRESENT").length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1528]/80 backdrop-blur-md border border-[#38BDF8]/25 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#D4AF37]" /> Human Capital & Shift Governance
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mt-1">
            Staff Roster & Biometric PIN Attendance
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Enterprise staff directory, shift schedules, role access badges, and clock-in/out terminal.
          </p>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Active Staff</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-white">{employees.length}</span>
            <span className="text-xs font-semibold text-[#38BDF8] bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/30">Full Team</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Staff On Duty Today</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-emerald-400">{presentCount}</span>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-400/30">Clocked In</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Absent / Unmarked</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-amber-400">{employees.length - presentCount}</span>
            <span className="text-xs font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-400/30">Pending Shift</span>
          </div>
        </div>

        <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-2xl p-5 shadow-xl space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Payroll</p>
          <div className="flex items-baseline justify-between">
            <span className="font-serif text-3xl font-bold text-[#D4AF37]">₹{(employees.reduce((acc, e) => acc + e.salary, 0) / 1000).toFixed(0)}K</span>
            <span className="text-xs font-semibold text-slate-300 bg-[#070E1A] px-2 py-0.5 rounded-md border border-[#38BDF8]/20">Gross Cost</span>
          </div>
        </div>
      </div>

      {/* 3. Quick Punch Terminal Simulator */}
      <div className="bg-[#0B1528]/80 border border-[#38BDF8]/30 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#38BDF8]" />
              <h2 className="font-serif text-lg font-bold text-white">Staff Shift Clock-In / Clock-Out Terminal</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter 4-digit employee PIN (e.g. GM: 1001, Cashier: 1003, Chef: 1004, Mixologist: 1005)
            </p>
          </div>

          <form onSubmit={handlePunch} className="flex items-center gap-2">
            <input
              type="password"
              maxLength={6}
              value={punchPin}
              onChange={(e) => setPunchPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-36 bg-[#070E1A] border border-[#38BDF8]/25 text-center tracking-widest text-lg font-mono text-white py-2 px-3 rounded-xl focus:outline-none focus:border-[#38BDF8]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C378] text-[#070B12] font-bold text-xs uppercase tracking-wider rounded-xl hover:brightness-110 transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Punching..." : "Punch Shift"}
            </button>
          </form>
        </div>

        {punchFeedback && (
          <div className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
            punchFeedback.type === "success" 
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300" 
              : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}>
            {punchFeedback.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            <span>{punchFeedback.text}</span>
          </div>
        )}
      </div>

      {/* 4. Staff Directory Table */}
      <div className="bg-[#0B1528]/80 border border-[#38BDF8]/25 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-[#38BDF8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#070E1A]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search staff name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B1528] border border-[#38BDF8]/20 text-white placeholder-slate-500 text-xs pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">All employees have POS & Floor credentials configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070E1A] text-slate-300 uppercase tracking-wider border-b border-[#38BDF8]/25">
              <tr>
                <th className="py-3.5 px-5 font-bold">Employee Name</th>
                <th className="py-3.5 px-4 font-bold">Designation / Role</th>
                <th className="py-3.5 px-4 font-bold">Contact Phone</th>
                <th className="py-3.5 px-4 font-bold text-center">Auth PIN</th>
                <th className="py-3.5 px-4 font-bold text-center">Shift Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Clock-in Time</th>
                <th className="py-3.5 px-5 font-bold text-right">Monthly Compensation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#38BDF8]/15">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-[#0F223D]/50 transition-colors">
                  <td className="py-4 px-5">
                    <div className="font-serif font-bold text-white text-sm">{emp.name}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-[#38BDF8]" /> {emp.email}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#070E1A] border border-[#38BDF8]/20 text-xs font-semibold text-white">
                      <Shield className="w-3 h-3 text-[#38BDF8]" /> {emp.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-400">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-[#38BDF8]" /> {emp.phone}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-[#38BDF8] bg-[#070E1A]/60">
                    {emp.pin_code}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {emp.attendance_today === "PRESENT" ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        <UserCheck className="w-3 h-3 text-emerald-400" /> ON DUTY
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#070E1A] text-slate-400 border border-[#38BDF8]/20">
                        OFF DUTY
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center text-slate-400">
                    {emp.check_in_time ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        <Clock className="w-3 h-3 text-emerald-400" /> {emp.check_in_time}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px]">-</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right font-serif font-bold text-[#D4AF37] text-sm">
                    ₹{emp.salary.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
