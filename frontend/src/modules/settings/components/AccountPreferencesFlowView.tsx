import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import {
  User,
  Lock,
  CheckCircle2,
  Camera,
  Key,
  Shield,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  Save,
  X,
  Edit2
} from 'lucide-react';

export const AccountPreferencesFlowView: React.FC = () => {
  const { userProfile, setUserProfile, employees } = useApp();

  // Profile State (initialized from active employee)
  const [fullName, setFullName] = useState<string>(userProfile.name || 'Vishnu Vardhan');
  const [employeeId, setEmployeeId] = useState<string>(userProfile.empCode || 'EMP001');
  const [department, setDepartment] = useState<string>(userProfile.department || 'Development');
  const [email, setEmail] = useState<string>(userProfile.email || 'vishnu.vardhan@democompany.com');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'Vishnu Vardhan')}&background=2563eb&color=fff&size=200`
  );

  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Security Toggles & Modals
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(() => {
    return localStorage.getItem('crm_pref_2fa') === 'true';
  });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isActiveSessionsModalOpen, setIsActiveSessionsModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    leaveUpdates: true,
    payrollNotifications: true,
    attendanceAlerts: true
  });

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUserProfile({
      name: fullName,
      email: email,
      empCode: employeeId,
      department: department,
      avatar: avatarUrl
    });
    setIsEditingProfile(false);
    showToast('Profile information updated and saved successfully!');
  };

  const toggle2FA = () => {
    const nextState = !twoFactorAuth;
    setTwoFactorAuth(nextState);
    localStorage.setItem('crm_pref_2fa', String(nextState));
    showToast(`Two-Factor Authentication turned ${nextState ? 'ON' : 'OFF'}.`);
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('crm_notifications_flow', JSON.stringify(updated));
      return updated;
    });
    showToast(`Notification setting updated.`);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    setPasswordError(null);
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Password changed successfully!');
  };

  return (
    <div className="w-full space-y-6 animate-fade-in pb-16">
      {/* Toast Feedback */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-xs text-slate-500">Manage your account and preferences</p>
      </div>

      {/* CARD 1: 👤 PROFILE SETTINGS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <User size={15} />
            </div>
            <h2 className="text-sm font-bold text-slate-900">Profile Settings</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              if (isEditingProfile) {
                handleSaveProfile();
              } else {
                setIsEditingProfile(true);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isEditingProfile
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {isEditingProfile ? (
              <>
                <Save size={13} /> Save Profile
              </>
            ) : (
              <>
                <Edit2 size={12} /> Edit Details
              </>
            )}
          </button>
        </div>

        {/* Profile Photo Row */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100/80">
          <div className="flex items-center gap-3.5">
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-slate-900 block">Profile Photo</span>
              <span className="text-[11px] text-slate-400">JPG, PNG or Avatar URL</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPhotoModalOpen(true)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            [ Change ]
          </button>
        </div>

        {/* Form / View Rows */}
        <div className="space-y-3.5 text-xs">
          {/* Full Name */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100/60 gap-1.5">
            <span className="text-slate-500 font-medium sm:w-1/3">Full Name</span>
            {isEditingProfile ? (
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-2/3"
              />
            ) : (
              <span className="text-slate-900 font-bold sm:w-2/3">{fullName}</span>
            )}
          </div>

          {/* Employee ID */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100/60 gap-1.5">
            <span className="text-slate-500 font-medium sm:w-1/3">Employee ID</span>
            {isEditingProfile ? (
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-2/3"
              />
            ) : (
              <span className="text-slate-900 font-mono font-bold sm:w-2/3">{employeeId}</span>
            )}
          </div>

          {/* Department */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-100/60 gap-1.5">
            <span className="text-slate-500 font-medium sm:w-1/3">Department</span>
            {isEditingProfile ? (
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer sm:w-2/3"
              >
                <option value="Development">Development</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="QA">QA</option>
                <option value="Operations">Operations</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
              </select>
            ) : (
              <span className="text-slate-900 font-semibold sm:w-2/3">{department}</span>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1.5">
            <span className="text-slate-500 font-medium sm:w-1/3">Email</span>
            {isEditingProfile ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-2/3"
              />
            ) : (
              <span className="text-slate-900 font-semibold sm:w-2/3">{email}</span>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: 🔐 SECURITY */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Lock size={15} />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Security</h2>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {/* Change Password */}
          <div className="flex items-center justify-between py-3">
            <div>
              <span className="font-semibold text-slate-800 block">Change Password</span>
              <span className="text-[11px] text-slate-400">Update your account login credentials</span>
            </div>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              [ Change ]
            </button>
          </div>

          {/* Two-Factor Auth */}
          <div className="flex items-center justify-between py-3">
            <div>
              <span className="font-semibold text-slate-800 block">Two-Factor Auth</span>
              <span className="text-[11px] text-slate-400">Extra layer of security with mobile/email OTP</span>
            </div>
            <button
              type="button"
              onClick={toggle2FA}
              className={`w-20 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                twoFactorAuth
                  ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              [ {twoFactorAuth ? 'ON' : 'OFF'} ]
            </button>
          </div>

          {/* Active Sessions */}
          <div className="flex items-center justify-between py-3">
            <div>
              <span className="font-semibold text-slate-800 block">Active Sessions</span>
              <span className="text-[11px] text-slate-400">Manage logged-in devices and browser access</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActiveSessionsModalOpen(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              [ View ]
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- MODAL: CHANGE PHOTO ----------------- */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera size={16} className="text-blue-600" /> Change Profile Photo
              </h3>
              <button onClick={() => setIsPhotoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-center py-2">
                <img src={avatarUrl} alt={fullName} className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm" />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">Avatar / Image URL</label>
                <input
                  type="text"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const randomAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=2563eb&color=fff&size=200`;
                    setAvatarUrl(randomAvatar);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex-1 transition cursor-pointer"
                >
                  Generate Avatar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleSaveProfile();
                    setIsPhotoModalOpen(false);
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex-1 transition cursor-pointer"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: CHANGE PASSWORD ----------------- */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Key size={16} className="text-amber-600" /> Change Account Password
              </h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-semibold">
                  {passwordError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: ACTIVE SESSIONS ----------------- */}
      {isActiveSessionsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Laptop size={16} className="text-blue-600" /> Active Device Sessions
              </h3>
              <button onClick={() => setIsActiveSessionsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Laptop size={14} className="text-emerald-600" /> Windows PC • Chrome Browser
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Current Active Session
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  IP: 192.168.1.45 • Bengaluru, India • Last Active: Just now
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-slate-500" /> Android Device • Mobile Browser
                  </span>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  IP: 103.21.124.8 • Bengaluru, India
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsActiveSessionsModalOpen(false);
                    showToast('All other device sessions logged out successfully.');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Log Out Other Sessions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
