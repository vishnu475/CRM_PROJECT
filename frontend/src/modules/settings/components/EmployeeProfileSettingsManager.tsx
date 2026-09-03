import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { User, Mail, Phone, Briefcase, Building2, MapPin, Clock, Award, Shield, Save, CheckCircle2, RefreshCw, UserCheck, Sparkles } from 'lucide-react';
import { EmployeeProfileSetting } from '../types';

export const EmployeeProfileSettingsManager: React.FC = () => {
  const { userProfile, setUserProfile, employees, reloadEmployeesFromDB } = useApp();

  // Selected employee ID to inspect/edit (defaults to current logged-in employee)
  const [selectedEmpId, setSelectedEmpId] = useState<string>(userProfile.empCode || userProfile.id || 'EMP-006');
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // Form State
  const [profileData, setProfileData] = useState<EmployeeProfileSetting>({
    id: userProfile.id || 'EMP-006',
    empCode: userProfile.empCode || 'EMP-006',
    name: userProfile.name || 'Ashok',
    email: userProfile.email || 'ashok@democompany.com',
    phone: userProfile.phone || '+91 98765 43210',
    designation: userProfile.roleTitle || 'Senior Full Stack Engineer',
    department: userProfile.department || 'Engineering',
    role: userProfile.role || 'Executive',
    branch: userProfile.branch || 'Headquarters (HQ)',
    avatar: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'Ashok')}&background=2563eb&color=fff`,
    status: 'ACTIVE',
    shift: 'General Day Shift (09:00 AM - 06:00 PM)',
    workHoursDaily: 8,
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'System Architecture'],
    timezone: 'Asia/Kolkata (IST, UTC+05:30)'
  });

  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Load employee details whenever selected employee dropdown changes
  useEffect(() => {
    const foundEmp = employees.find(e => e.empCode === selectedEmpId || e.id === selectedEmpId);
    if (foundEmp) {
      setProfileData({
        id: foundEmp.id,
        empCode: foundEmp.empCode || foundEmp.id,
        name: foundEmp.name,
        email: foundEmp.email || `${foundEmp.name.toLowerCase().replace(/\s+/g, '.')}@democompany.com`,
        phone: foundEmp.phone || '+91 98765 00000',
        designation: foundEmp.designation || 'Specialist',
        department: foundEmp.department || 'Engineering',
        role: (foundEmp as any).role || 'Employee',
        branch: (foundEmp as any).branch || 'Headquarters (HQ)',
        avatar: (foundEmp as any).avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundEmp.name)}&background=2563eb&color=fff`,
        status: foundEmp.status || 'ACTIVE',
        shift: (foundEmp as any).shift || 'General Day Shift (09:00 AM - 06:00 PM)',
        workHoursDaily: 8,
        skills: (foundEmp as any).skills || ['Full Stack', 'Enterprise Operations', 'Database Management'],
        timezone: 'Asia/Kolkata (IST, UTC+05:30)'
      });
    } else if (selectedEmpId === userProfile.empCode || selectedEmpId === userProfile.id) {
      setProfileData(prev => ({
        ...prev,
        empCode: userProfile.empCode || 'EMP-006',
        name: userProfile.name || 'Ashok',
        email: userProfile.email || 'ashok@democompany.com',
        designation: userProfile.roleTitle || 'Senior Full Stack Engineer',
        role: userProfile.role || 'Executive',
        branch: userProfile.branch || 'Headquarters (HQ)',
        avatar: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'Ashok')}&background=2563eb&color=fff`
      }));
    }
  }, [selectedEmpId, employees, userProfile]);

  // Handle Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    // If updating current active user
    if (selectedEmpId === userProfile.empCode || selectedEmpId === userProfile.id || selectedEmpId === profileData.empCode) {
      setUserProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        roleTitle: profileData.designation,
        role: profileData.role as any,
        branch: profileData.branch,
        avatar: profileData.avatar,
        empCode: profileData.empCode
      });
    }

    // Save to localStorage
    localStorage.setItem(`crm_emp_setting_${profileData.empCode}`, JSON.stringify(profileData));

    setSaveSuccessToast(`Profile & settings for ${profileData.name} (${profileData.empCode}) saved successfully!`);
    setTimeout(() => setSaveSuccessToast(null), 4000);
  };

  const handleAddSkill = () => {
    if (!newSkillInput.trim()) return;
    if (!profileData.skills.includes(newSkillInput.trim())) {
      setProfileData({ ...profileData, skills: [...profileData.skills, newSkillInput.trim()] });
    }
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfileData({ ...profileData, skills: profileData.skills.filter(s => s !== skillToRemove) });
  };

  const handleRegenerateAvatar = () => {
    const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData.name)}&background=2563eb&color=fff&size=200`;
    setProfileData({ ...profileData, avatar: newAvatar });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {saveSuccessToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{saveSuccessToast}</span>
          </div>
          <button onClick={() => setSaveSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header card with Employee Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-900">Employee Profile & Personnel Settings</h2>
          </div>
          <p className="text-xs text-slate-500 pl-10">
            Configure employee identity, corporate designation, department, contact info, and shift preferences.
          </p>
        </div>

        {/* Dynamic Employee Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Active Record:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value={userProfile.empCode || 'EMP-006'}>
              ⭐ Current User: {userProfile.name} ({userProfile.empCode || 'EMP-006'})
            </option>
            {employees.filter(e => e.empCode !== userProfile.empCode && e.id !== userProfile.id).map(emp => (
              <option key={emp.id} value={emp.empCode || emp.id}>
                {emp.name} ({emp.empCode || emp.id}) — {emp.department || 'Staff'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card Banner */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 shadow-xs"
              />
              <button
                type="button"
                onClick={handleRegenerateAvatar}
                title="Regenerate Avatar"
                className="absolute -bottom-1.5 -right-1.5 bg-white border border-slate-200 text-slate-700 hover:text-blue-600 p-1 rounded-lg shadow-xs transition cursor-pointer"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900">{profileData.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200">
                  {profileData.empCode}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                  {profileData.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">{profileData.designation}</p>
              <p className="text-[11px] text-slate-400">
                {profileData.department} • {profileData.branch}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save size={14} /> Save Profile Settings
            </button>
          </div>
        </div>

        {/* 1. PERSONAL & CONTACT DETAILS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Personal & Contact Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Full Name</label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Phone Number</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-[11px] font-semibold text-slate-600 block">Profile Photo URL</label>
              <input
                type="text"
                value={profileData.avatar}
                onChange={(e) => setProfileData({ ...profileData, avatar: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. CORPORATE & ROLE ASSIGNMENTS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Briefcase size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Corporate Designation & Department Assignment</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Employee Code / ID</label>
              <input
                type="text"
                value={profileData.empCode}
                onChange={(e) => setProfileData({ ...profileData, empCode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Official Designation</label>
              <input
                type="text"
                value={profileData.designation}
                onChange={(e) => setProfileData({ ...profileData, designation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Department</label>
              <select
                value={profileData.department}
                onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="QA">QA</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">System Access Role</label>
              <select
                value={profileData.role}
                onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="Executive">Executive (Full ERP & Admin Access)</option>
                <option value="Manager">Manager (Departmental Approvals)</option>
                <option value="Employee">Employee (ESS & Task Management)</option>
                <option value="HR Manager">HR Manager (HRMS & Payroll Administration)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Assigned Branch / Location</label>
              <input
                type="text"
                value={profileData.branch}
                onChange={(e) => setProfileData({ ...profileData, branch: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 block">Work Shift Schedule</label>
              <select
                value={profileData.shift}
                onChange={(e) => setProfileData({ ...profileData, shift: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
              >
                <option value="General Day Shift (09:00 AM - 06:00 PM)">General Day Shift (09:00 AM - 06:00 PM)</option>
                <option value="Morning Shift (07:00 AM - 04:00 PM)">Morning Shift (07:00 AM - 04:00 PM)</option>
                <option value="Evening Shift (02:00 PM - 11:00 PM)">Evening Shift (02:00 PM - 11:00 PM)</option>
                <option value="Flexible Remote Shift">Flexible Remote Shift</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. SKILLS & SPECIALIZATIONS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award size={16} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Skills, Expertise & Specializations</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold flex items-center gap-1.5 border border-slate-200"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-600 transition text-[11px]"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 max-w-md pt-1">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                placeholder="Add new skill or specialization (e.g. Next.js, Financial Audit)..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Save size={15} /> Save Employee Data & Synchronize System
          </button>
        </div>
      </form>
    </div>
  );
};
