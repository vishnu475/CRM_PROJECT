import React, { useState } from 'react';
import {
  GraduationCap, User, BookOpen, Briefcase, FileText, ShieldCheck,
  CheckCircle2, ArrowLeft, ArrowRight, Save, Upload, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';

interface InternOnboardingPageProps {
  onBack: () => void;
  onInternCreated: (internId: string) => void;
}

export const InternOnboardingPage: React.FC<InternOnboardingPageProps> = ({
  onBack,
  onInternCreated
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1 — Personal Information
  const [internId, setInternId] = useState<string>(''); // Auto-generated if left blank
  const [fullName, setFullName] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [dob, setDob] = useState<string>('2003-05-15');
  const [gender, setGender] = useState<string>('Male');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [emergencyContact, setEmergencyContact] = useState<string>('');

  // STEP 2 — Academic Information
  const [college, setCollege] = useState<string>('');
  const [degree, setDegree] = useState<string>('B.Tech / B.E.');
  const [branch, setBranch] = useState<string>('Computer Science & Engineering');
  const [graduationYear, setGraduationYear] = useState<string>('2025');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [cgpa, setCgpa] = useState<string>('8.5 CGPA');
  const [resumeName, setResumeName] = useState<string>('resume_candidate.pdf');

  // STEP 3 — Internship Information
  const [internshipType, setInternshipType] = useState<string>('Full Stack');
  const [department, setDepartment] = useState<string>('Engineering');
  const [designation, setDesignation] = useState<string>('Software Engineering Intern');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]
  );
  const [duration, setDuration] = useState<string>('6 Months');
  const [workMode, setWorkMode] = useState<string>('Hybrid');
  const [location, setLocation] = useState<string>('Bengaluru HQ');
  const [stipend, setStipend] = useState<string>('25000');
  const [reportingManager, setReportingManager] = useState<string>('Sarah Jenkins');
  const [reportingManagerId, setReportingManagerId] = useState<string>('EMP-001');
  const [mentor, setMentor] = useState<string>('Rahul Verma');
  const [mentorId, setMentorId] = useState<string>('EMP-004');

  // STEP 4 — Documents
  const [documents, setDocuments] = useState<Array<{ name: string; type: string; status: string }>>([
    { name: 'Candidate_Resume.pdf', type: 'Resume', status: 'Uploaded' },
    { name: 'College_ID_Card.jpg', type: 'College ID', status: 'Uploaded' },
    { name: 'Aadhaar_Govt_ID.pdf', type: 'Government ID', status: 'Uploaded' },
    { name: 'Internship_Offer_Letter.pdf', type: 'Offer / Internship Letter', status: 'Generated' },
  ]);

  // STEP 5 — Access & Onboarding
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [systemAccess, setSystemAccess] = useState<boolean>(true);
  const [attendanceAccess, setAttendanceAccess] = useState<boolean>(true);
  const [assignedDevice, setAssignedDevice] = useState<string>('MacBook Air M2 (INT-DEV-Asset)');
  const [idCardIssued, setIdCardIssued] = useState<boolean>(true);
  const [checklist, setChecklist] = useState<Array<{ task: string; completed: boolean }>>([
    { task: 'ID Badge Issued', completed: true },
    { task: 'Laptop Allocated', completed: true },
    { task: 'Repository Access Granted', completed: true },
    { task: 'Mentor Assigned', completed: true },
    { task: 'NDAs & IP Agreement Signed', completed: true },
  ]);

  const toggleChecklistItem = (idx: number) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, completed: !item.completed } : item));
  };

  const steps = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Academic Details', icon: BookOpen },
    { num: 3, title: 'Internship Setup', icon: Briefcase },
    { num: 4, title: 'Documents', icon: FileText },
    { num: 5, title: 'Access & Assets', icon: ShieldCheck },
    { num: 6, title: 'Review & Confirm', icon: CheckCircle2 },
  ];

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter the intern full name.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Please enter a valid personal email.');
        return;
      }
      if (!companyEmail) {
        setCompanyEmail(`${fullName.toLowerCase().replace(/\s+/g, '.')}@company.com`);
      }
    }
    if (currentStep < 6) {
      setCurrentStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };

  const handleSaveDraft = async () => {
    await handleConfirm(true);
  };

  const handleConfirm = async (isDraft = false) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        internCode: internId || undefined,
        name: fullName,
        email: email,
        phone,
        dob,
        gender,
        address,
        emergencyContact,
        profilePhoto: profilePhoto || null,
        college,
        degree,
        branch,
        branchSpecialization: branch,
        graduationYear,
        rollNumber,
        cgpaPercentage: cgpa,
        resumeUrl: resumeName,
        internshipType,
        department,
        designation,
        startDate,
        endDate,
        duration,
        workMode,
        location,
        stipend: parseFloat(stipend) || 20000,
        reportingManagerName: reportingManager,
        reportingManagerId,
        mentorName: mentor,
        mentorId,
        status: isDraft ? 'Upcoming' : (startDate > new Date().toISOString().split('T')[0] ? 'Upcoming' : 'Active'),
        companyEmail: companyEmail || `${fullName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
        systemAccess,
        attendanceAccess,
        assignedDevice,
        idCardIssued,
        joiningChecklist: checklist,
        documents: documents
      };

      const res = await fetch('/api/interns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.data) {
        const createdId = data.data.id || data.data.intern_id || data.data.intern_code;
        onInternCreated(createdId);
      } else {
        setErrorMsg(data.message || 'Failed to create intern record.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while saving intern record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} /> Back to Intern Directory
          </button>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="text-purple-600" size={24} />
            Intern Onboarding
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Structured 6-step lifecycle wizard: Personal, Academic, Internship Setup, Documents, Access & Verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSubmitting || !fullName}
            className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50 flex items-center gap-1.5"
          >
            <Save size={14} /> Save as Draft
          </Button>
        </div>
      </div>

      {/* Step Indicator Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.num;
            const isActive = currentStep === step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (fullName || step.num < currentStep) setCurrentStep(step.num);
                }}
                className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-purple-50 border border-purple-300 text-purple-700 shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border border-slate-100 text-slate-400'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted ? <CheckCircle2 size={15} /> : <Icon size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">Step {step.num}</p>
                  <p className="text-xs font-bold truncate">{step.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">

        {/* STEP 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User size={16} className="text-purple-600" />
                STEP 1 — Personal Information
              </h2>
              <p className="text-xs text-slate-500">Provide legal identification and contact details for the intern candidate.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Intern ID (Optional - Auto generated if left blank)"
                placeholder="e.g. INT-105"
                value={internId}
                onChange={(e) => setInternId(e.target.value)}
              />
              <Input
                label="Full Legal Name *"
                placeholder="e.g. Riya Sen"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Personal Email *"
                type="email"
                placeholder="riya.sen@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Phone Number"
                placeholder="+91 98765 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <div className="md:col-span-2">
                <Input
                  label="Residential Address"
                  placeholder="Street, City, State, Pincode"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Emergency Contact (Name, Relationship, Phone)"
                  placeholder="e.g. Ramesh Sen (Father) — +91 98765 43210"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Academic Information */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BookOpen size={16} className="text-purple-600" />
                STEP 2 — Academic Information
              </h2>
              <p className="text-xs text-slate-500">Record university credentials, degree program, and graduation status.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="College / University Name *"
                  placeholder="e.g. National Institute of Technology Karnataka (NITK)"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>
              <Select
                label="Degree Program"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                options={[
                  { value: 'B.Tech / B.E.', label: 'B.Tech / B.E.' },
                  { value: 'M.Tech / M.E.', label: 'M.Tech / M.E.' },
                  { value: 'BCA / MCA', label: 'BCA / MCA' },
                  { value: 'B.Sc / M.Sc', label: 'B.Sc / M.Sc' },
                  { value: 'BBA / MBA', label: 'BBA / MBA' },
                  { value: 'Diploma', label: 'Diploma' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <Input
                label="Branch / Specialization"
                placeholder="e.g. Computer Science, Artificial Intelligence, Data Science"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
              <Select
                label="Graduation Year"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                options={[
                  { value: '2024', label: '2024 (Graduated)' },
                  { value: '2025', label: '2025 (Final Year)' },
                  { value: '2026', label: '2026 (Pre-final Year)' },
                  { value: '2027', label: '2027' },
                ]}
              />
              <Input
                label="Registration / Roll Number"
                placeholder="e.g. 21CS089"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
              />
              <Input
                label="Academic Percentage / CGPA"
                placeholder="e.g. 8.92 CGPA or 85%"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
              />
              <Input
                label="Resume File Name / URL"
                placeholder="e.g. Riya_Sen_Resume_2025.pdf"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Internship Information */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={16} className="text-purple-600" />
                STEP 3 — Internship Setup & Mentorship
              </h2>
              <p className="text-xs text-slate-500">Define internship track, duration, compensation, and supervisory reporting.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Internship Type *"
                value={internshipType}
                onChange={(e) => setInternshipType(e.target.value)}
                options={[
                  { value: 'Technical', label: 'Technical' },
                  { value: 'AI / ML', label: 'AI / ML' },
                  { value: 'Full Stack', label: 'Full Stack' },
                  { value: 'Cloud', label: 'Cloud' },
                  { value: 'Data Science', label: 'Data Science' },
                  { value: 'HR', label: 'HR' },
                  { value: 'Finance', label: 'Finance' },
                  { value: 'Marketing', label: 'Marketing' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <Select
                label="Department *"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: 'Engineering', label: 'Engineering' },
                  { value: 'Product & Design', label: 'Product & Design' },
                  { value: 'HR', label: 'HR & People Operations' },
                  { value: 'Finance', label: 'Finance & Accounts' },
                  { value: 'Marketing', label: 'Marketing & Sales' },
                  { value: 'Operations', label: 'Operations' },
                ]}
              />
              <Input
                label="Internship Role / Designation *"
                placeholder="e.g. AI Research Intern, Software Engineer Intern"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
              />
              <Select
                label="Work Mode"
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                options={[
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'On-site', label: 'On-site (Office)' },
                  { value: 'Remote', label: 'Remote' },
                ]}
              />
              <Input
                label="Start Date *"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date *"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Select
                label="Internship Duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                options={[
                  { value: '1 Month', label: '1 Month' },
                  { value: '2 Months', label: '2 Months' },
                  { value: '3 Months', label: '3 Months' },
                  { value: '6 Months', label: '6 Months' },
                  { value: '1 Year', label: '1 Year' },
                ]}
              />
              <Input
                label="Monthly Stipend (₹)"
                type="number"
                placeholder="25000"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
              />
              <Input
                label="Location / Branch"
                placeholder="e.g. Bengaluru HQ"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                label="Reporting Manager Name"
                placeholder="e.g. Sarah Jenkins"
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
              />
              <Input
                label="Assigned Mentor Name *"
                placeholder="e.g. Rahul Verma"
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 4: Documents */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-purple-600" />
                STEP 4 — Documents & Statutory Records
              </h2>
              <p className="text-xs text-slate-500">Collect resume, college verification, national ID, and internship agreement.</p>
            </div>

            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                      <p className="text-[11px] text-slate-500">{doc.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      {doc.status}
                    </span>
                    <button
                      type="button"
                      className="p-1.5 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-slate-200 text-xs"
                      title="Upload New Version"
                    >
                      <Upload size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-purple-300 transition-colors cursor-pointer bg-slate-50/50">
                <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                <p className="text-xs font-semibold text-slate-700">Click to upload additional document</p>
                <p className="text-[10px] text-slate-400">Supports PDF, PNG, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Access & Onboarding */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-600" />
                STEP 5 — Access & IT Onboarding
              </h2>
              <p className="text-xs text-slate-500">Configure corporate identity, biometric kiosk attendance access, and asset provisioning.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Company Email Address"
                placeholder="riya.sen@company.com"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
              <Input
                label="Assigned Laptop / Workstation Asset"
                placeholder="MacBook Air M2 (INT-DEV-01)"
                value={assignedDevice}
                onChange={(e) => setAssignedDevice(e.target.value)}
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">System Permissions & Badging</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemAccess}
                    onChange={(e) => setSystemAccess(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">ERP & CRM System Access</p>
                    <p className="text-[10px] text-slate-500">Allow intern to view assigned modules and tasks</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attendanceAccess}
                    onChange={(e) => setAttendanceAccess(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Kiosk & Attendance Access</p>
                    <p className="text-[10px] text-slate-500">Enable check-in / check-out on HRMS</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idCardIssued}
                    onChange={(e) => setIdCardIssued(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Physical ID Card Printed</p>
                    <p className="text-[10px] text-slate-500">Mark office access badge as issued</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Joining Checklist */}
            <div className="space-y-2 pt-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Joining Verification Checklist</p>
              <div className="space-y-1.5">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleChecklistItem(idx)}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => {}}
                      className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                    />
                    <span className={item.completed ? 'text-slate-800 font-medium' : 'text-slate-400'}>
                      {item.task}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Review & Confirm */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-purple-600" />
                STEP 6 — Review & Confirm Internship
              </h2>
              <p className="text-xs text-slate-500">Verify all information before permanently committing this intern record to the database.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Summary Card 1: Personal */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={13} /> Personal Information
                </h3>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Name:</span> <strong className="text-slate-900">{fullName}</strong></p>
                  <p><span className="text-slate-400">Email:</span> {email}</p>
                  <p><span className="text-slate-400">Phone:</span> {phone || 'Not provided'}</p>
                  <p><span className="text-slate-400">Gender / DOB:</span> {gender} • {dob}</p>
                  <p><span className="text-slate-400">Address:</span> {address || 'Bengaluru'}</p>
                </div>
              </div>

              {/* Summary Card 2: Academic */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen size={13} /> Academic Information
                </h3>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="text-slate-400">College:</span> <strong className="text-slate-900">{college || 'NIT / University'}</strong></p>
                  <p><span className="text-slate-400">Degree:</span> {degree}</p>
                  <p><span className="text-slate-400">Branch:</span> {branch}</p>
                  <p><span className="text-slate-400">Batch:</span> {graduationYear} (Roll: {rollNumber || 'N/A'})</p>
                  <p><span className="text-slate-400">CGPA:</span> {cgpa}</p>
                </div>
              </div>

              {/* Summary Card 3: Internship */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase size={13} /> Internship Setup
                </h3>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Role:</span> <strong className="text-slate-900">{designation}</strong></p>
                  <p><span className="text-slate-400">Track:</span> {internshipType} ({department})</p>
                  <p><span className="text-slate-400">Duration:</span> {duration} ({startDate} to {endDate})</p>
                  <p><span className="text-slate-400">Stipend:</span> ₹{Number(stipend).toLocaleString()} / month</p>
                  <p><span className="text-slate-400">Mentor:</span> {mentor}</p>
                </div>
              </div>
            </div>

            {/* Checklist preview */}
            <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-950">Automated Post-Creation Lifecycle Actions</p>
                <p className="text-[11px] text-purple-700 mt-0.5">
                  Assigns Intern ID, sets initial status to {startDate > new Date().toISOString().split('T')[0] ? 'Upcoming' : 'Active'}, configures attendance, and redirects to 360° Profile.
                </p>
              </div>
              <span className="px-3 py-1 bg-purple-600 text-white font-bold text-xs rounded-lg shadow-sm">
                Ready to Confirm
              </span>
            </div>
          </div>
        )}

        {/* Wizard Bottom Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={currentStep === 1 ? onBack : handlePrev}
            className="text-xs flex items-center gap-1.5 text-slate-600"
          >
            <ArrowLeft size={14} />
            <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSubmitting || !fullName}
              className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              Save as Draft
            </Button>

            {currentStep < 6 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleConfirm(false)}
                disabled={isSubmitting}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles size={14} />
                <span>{isSubmitting ? 'Confirming...' : 'Confirm Internship'}</span>
              </Button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
