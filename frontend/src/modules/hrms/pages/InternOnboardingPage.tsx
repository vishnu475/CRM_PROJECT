import React, { useState, useRef } from 'react';
import {
  GraduationCap, User, BookOpen, Briefcase, FileText, ShieldCheck,
  CheckCircle2, ArrowLeft, ArrowRight, Save, Upload, Sparkles, AlertCircle,
  Trash2, Plus, ExternalLink
} from 'lucide-react';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { Select } from '../../../components/common/Select';
import {
  InternFormData,
  StepValidationResult,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
  validateAllSteps,
  validateDraft,
  validatePhone,
  validateDob,
  validateCgpa,
  validateFileName,
  ALLOWED_DOC_EXTENSIONS,
  MAX_DOC_SIZE_BYTES
} from '../utils/internOnboardingValidation';

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newDocType, setNewDocType] = useState<string>('Other Document');

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
  const [documents, setDocuments] = useState<Array<{ name: string; type: string; status: string; size?: number }>>([
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

  const getFormData = (): InternFormData => ({
    internId,
    fullName,
    profilePhoto,
    dob,
    gender,
    email,
    phone,
    address,
    emergencyContact,
    college,
    degree,
    branch,
    graduationYear,
    rollNumber,
    cgpa,
    resumeName,
    internshipType,
    department,
    designation,
    startDate,
    endDate,
    duration,
    workMode,
    location,
    stipend,
    reportingManager,
    reportingManagerId,
    mentor,
    mentorId,
    documents,
    companyEmail,
    systemAccess,
    attendanceAccess,
    assignedDevice,
    idCardIssued,
    checklist
  });

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleBlurField = async (field: string, val: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));

    // Real-time backend uniqueness check for email on blur
    if (field === 'email' && val.trim()) {
      try {
        const res = await fetch(`/api/interns/check-uniqueness?email=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        if (data.success && !data.emailUnique) {
          setFieldErrors(prev => ({ ...prev, email: data.emailError || 'This email address is already in use.' }));
          return;
        }
      } catch {
        // Ignore network errors on background check
      }
    }

    // Uniqueness check for intern ID
    if (field === 'internId' && val.trim()) {
      try {
        const res = await fetch(`/api/interns/check-uniqueness?internId=${encodeURIComponent(val.trim())}`);
        const data = await res.json();
        if (data.success && !data.idUnique) {
          setFieldErrors(prev => ({ ...prev, internId: data.idError || 'Intern ID is already in use.' }));
          return;
        }
      } catch {
        // Ignore network errors
      }
    }
  };

  const steps = [
    { num: 1, title: 'Personal Info', icon: User },
    { num: 2, title: 'Academic Details', icon: BookOpen },
    { num: 3, title: 'Internship Setup', icon: Briefcase },
    { num: 4, title: 'Documents', icon: FileText },
    { num: 5, title: 'Access & Assets', icon: ShieldCheck },
    { num: 6, title: 'Review & Confirm', icon: CheckCircle2 },
  ];

  const focusField = (fieldName: string) => {
    setTimeout(() => {
      const el = document.getElementById(`field-${fieldName}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 60);
  };

  const jumpToStepAndField = (stepNum: number, fieldName?: string) => {
    setCurrentStep(stepNum);
    if (fieldName) {
      focusField(fieldName);
    }
  };

  const handleNext = () => {
    setErrorMsg(null);
    const data = getFormData();
    let res: StepValidationResult;

    if (currentStep === 1) {
      res = validateStep1(data);
      if (res.isValid && !companyEmail) {
        setCompanyEmail(`${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@company.com`);
      }
    } else if (currentStep === 2) {
      res = validateStep2(data);
    } else if (currentStep === 3) {
      res = validateStep3(data);
    } else if (currentStep === 4) {
      res = validateStep4(data);
    } else if (currentStep === 5) {
      res = validateStep5(data);
    } else {
      res = { isValid: true, errors: {} };
    }

    if (!res.isValid) {
      setFieldErrors(prev => ({ ...prev, ...res.errors }));
      const errorCount = Object.keys(res.errors).length;
      setErrorMsg(`Please resolve the ${errorCount} highlighted issue${errorCount > 1 ? 's' : ''} in Step ${currentStep} before continuing.`);
      if (res.firstInvalidField) {
        focusField(res.firstInvalidField);
      }
      return;
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
    setErrorMsg(null);
    const data = getFormData();
    const draftValidation = validateDraft(data);

    if (!draftValidation.isValid) {
      setFieldErrors(prev => ({ ...prev, ...draftValidation.errors }));
      setErrorMsg('Cannot save draft: Please provide a valid intern full name and correct any malformed fields.');
      if (draftValidation.firstInvalidField) {
        focusField(draftValidation.firstInvalidField);
      }
      return;
    }

    await handleConfirm(true);
  };

  const handleConfirm = async (isDraft = false) => {
    const data = getFormData();

    if (!isDraft) {
      const allValidation = validateAllSteps(data);
      if (!allValidation.isValid) {
        const stepNum = allValidation.firstInvalidStep || 1;
        setFieldErrors(allValidation.stepErrors[stepNum] || {});
        setErrorMsg(`Cannot submit internship: Found ${allValidation.totalErrors} incomplete or invalid field${allValidation.totalErrors > 1 ? 's' : ''}. Please resolve them to proceed.`);
        jumpToStepAndField(stepNum, allValidation.firstInvalidField || undefined);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        internCode: internId.trim() || undefined,
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        dob,
        gender,
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        profilePhoto: profilePhoto || null,
        college: college.trim(),
        degree,
        branch: branch.trim(),
        branchSpecialization: branch.trim(),
        graduationYear,
        rollNumber: rollNumber.trim(),
        cgpaPercentage: cgpa.trim(),
        resumeUrl: resumeName.trim(),
        internshipType,
        department,
        designation: designation.trim(),
        startDate,
        endDate,
        duration,
        workMode,
        location: location.trim(),
        stipend: parseFloat(stipend) || 0,
        reportingManagerName: reportingManager.trim(),
        reportingManagerId,
        mentorName: mentor.trim(),
        mentorId,
        isDraft,
        status: isDraft ? 'Upcoming' : (startDate > new Date().toISOString().split('T')[0] ? 'Upcoming' : 'Active'),
        companyEmail: companyEmail.trim() || `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@company.com`,
        systemAccess,
        attendanceAccess,
        assignedDevice: assignedDevice.trim(),
        idCardIssued,
        joiningChecklist: checklist,
        documents: documents
      };

      const res = await fetch('/api/interns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (resData.success && resData.data) {
        const createdId = resData.data.id || resData.data.intern_id || resData.data.intern_code;
        onInternCreated(createdId);
      } else {
        if (resData.errors && typeof resData.errors === 'object') {
          setFieldErrors(prev => ({ ...prev, ...resData.errors }));
          setErrorMsg(resData.message || 'Server rejected submission due to invalid fields.');
          if (resData.errors.email || resData.errors.internId || resData.errors.fullName) {
            setCurrentStep(1);
          } else if (resData.errors.college || resData.errors.branch || resData.errors.degree) {
            setCurrentStep(2);
          } else if (resData.errors.department || resData.errors.designation || resData.errors.mentor || resData.errors.endDate) {
            setCurrentStep(3);
          }
        } else {
          setErrorMsg(resData.message || 'Failed to create intern record.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while saving intern record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Document management handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extErr = validateFileName(file.name);
    if (extErr) {
      setFieldErrors(prev => ({ ...prev, documents: `File "${file.name}" is not supported. Use: ${ALLOWED_DOC_EXTENSIONS.join(', ')}` }));
      return;
    }

    if (file.size > MAX_DOC_SIZE_BYTES) {
      setFieldErrors(prev => ({ ...prev, documents: `File "${file.name}" exceeds the 10MB limit.` }));
      return;
    }

    clearFieldError('documents');
    setDocuments(prev => [
      ...prev,
      {
        name: file.name,
        type: newDocType,
        status: 'Uploaded',
        size: file.size
      }
    ]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveDoc = (index: number) => {
    setDocuments(prev => {
      const updated = prev.filter((_, i) => i !== index);
      const res = validateStep4({ documents: updated });
      if (!res.isValid) {
        setFieldErrors(e => ({ ...e, ...res.errors }));
      } else {
        clearFieldError('documents');
      }
      return updated;
    });
  };

  const allValidation = validateAllSteps(getFormData());

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
            Structured 6-step lifecycle wizard with automated validation: Personal, Academic, Internship Setup, Documents, Access & Verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} disabled={isSubmitting} className="text-xs">
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={isSubmitting || !fullName.trim()}
            className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50 flex items-center gap-1.5"
          >
            <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save as Draft'}
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
            const hasErrors = allValidation.stepErrors[step.num] && Object.keys(allValidation.stepErrors[step.num]).length > 0;

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
                    : hasErrors && isCompleted
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : isCompleted
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border border-slate-100 text-slate-400'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : hasErrors && isCompleted
                    ? 'bg-rose-600 text-white'
                    : isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {isCompleted && !hasErrors ? <CheckCircle2 size={15} /> : (hasErrors && isCompleted ? <AlertCircle size={15} /> : <Icon size={14} />)}
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

      {/* Global Page Error Banner */}
      {errorMsg && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
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
                id="field-internId"
                label="Intern ID (Optional - Auto generated if left blank)"
                placeholder="e.g. INT-105"
                value={internId}
                error={fieldErrors.internId}
                onChange={(e) => {
                  setInternId(e.target.value);
                  clearFieldError('internId');
                }}
                onBlur={(e) => handleBlurField('internId', e.target.value)}
              />
              <Input
                id="field-fullName"
                label="Full Legal Name *"
                placeholder="e.g. Riya Sen"
                value={fullName}
                error={fieldErrors.fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearFieldError('fullName');
                }}
                onBlur={() => {
                  const res = validateStep1({ fullName });
                  if (res.errors.fullName) {
                    setFieldErrors(p => ({ ...p, fullName: res.errors.fullName }));
                  }
                }}
                required
              />
              <Input
                id="field-email"
                label="Personal Email *"
                type="email"
                placeholder="riya.sen@college.edu"
                value={email}
                error={fieldErrors.email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                onBlur={(e) => {
                  const res = validateStep1({ email });
                  if (res.errors.email) {
                    setFieldErrors(p => ({ ...p, email: res.errors.email }));
                  } else {
                    handleBlurField('email', e.target.value);
                  }
                }}
                required
              />
              <Input
                id="field-phone"
                label="Phone Number"
                placeholder="10-digit mobile number (e.g. 9876543210)"
                value={phone}
                error={fieldErrors.phone}
                onChange={(e) => {
                  const val = e.target.value;
                  setPhone(val);
                  if (fieldErrors.phone) {
                    const err = validatePhone(val);
                    if (err) {
                      setFieldErrors(p => ({ ...p, phone: err }));
                    } else {
                      clearFieldError('phone');
                    }
                  }
                }}
                onBlur={() => {
                  if (phone) {
                    const err = validatePhone(phone);
                    if (err) setFieldErrors(p => ({ ...p, phone: err }));
                  }
                }}
              />
              <Input
                id="field-dob"
                label="Date of Birth *"
                type="date"
                value={dob}
                error={fieldErrors.dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  clearFieldError('dob');
                }}
                onBlur={() => {
                  const err = validateDob(dob);
                  if (err) setFieldErrors(p => ({ ...p, dob: err }));
                }}
                required
              />
              <Select
                id="field-gender"
                label="Gender *"
                value={gender}
                error={fieldErrors.gender}
                onChange={(e) => {
                  setGender(e.target.value);
                  clearFieldError('gender');
                }}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
              <div className="md:col-span-2">
                <Input
                  id="field-address"
                  label="Residential Address"
                  placeholder="Street, City, State, Pincode"
                  value={address}
                  error={fieldErrors.address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    clearFieldError('address');
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  id="field-emergencyContact"
                  label="Emergency Contact (Name, Relationship, Phone)"
                  placeholder="e.g. Ramesh Sen (Father) — +91 98765 43210"
                  value={emergencyContact}
                  error={fieldErrors.emergencyContact}
                  onChange={(e) => {
                    setEmergencyContact(e.target.value);
                    clearFieldError('emergencyContact');
                  }}
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
                  id="field-college"
                  label="College / University Name *"
                  placeholder="e.g. National Institute of Technology Karnataka (NITK)"
                  value={college}
                  error={fieldErrors.college}
                  onChange={(e) => {
                    setCollege(e.target.value);
                    clearFieldError('college');
                  }}
                  onBlur={() => {
                    if (!college.trim()) {
                      setFieldErrors(p => ({ ...p, college: 'College / University name is required.' }));
                    } else if (college.trim().length < 3) {
                      setFieldErrors(p => ({ ...p, college: 'College name must be at least 3 characters.' }));
                    }
                  }}
                  required
                />
              </div>
              <Select
                id="field-degree"
                label="Degree Program *"
                value={degree}
                error={fieldErrors.degree}
                onChange={(e) => {
                  setDegree(e.target.value);
                  clearFieldError('degree');
                }}
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
                id="field-branch"
                label="Branch / Specialization *"
                placeholder="e.g. Computer Science, Artificial Intelligence, Data Science"
                value={branch}
                error={fieldErrors.branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  clearFieldError('branch');
                }}
                onBlur={() => {
                  if (!branch.trim()) {
                    setFieldErrors(p => ({ ...p, branch: 'Branch / Specialization is required.' }));
                  }
                }}
                required
              />
              <Select
                id="field-graduationYear"
                label="Graduation Year *"
                value={graduationYear}
                error={fieldErrors.graduationYear}
                onChange={(e) => {
                  setGraduationYear(e.target.value);
                  clearFieldError('graduationYear');
                }}
                options={[
                  { value: '2023', label: '2023' },
                  { value: '2024', label: '2024 (Graduated)' },
                  { value: '2025', label: '2025 (Final Year)' },
                  { value: '2026', label: '2026 (Pre-final Year)' },
                  { value: '2027', label: '2027' },
                  { value: '2028', label: '2028' },
                ]}
              />
              <Input
                id="field-rollNumber"
                label="Registration / Roll Number"
                placeholder="e.g. 21CS089"
                value={rollNumber}
                error={fieldErrors.rollNumber}
                onChange={(e) => {
                  setRollNumber(e.target.value);
                  clearFieldError('rollNumber');
                }}
              />
              <Input
                id="field-cgpa"
                label="Academic Percentage / CGPA"
                placeholder="e.g. 8.92 CGPA or 85%"
                value={cgpa}
                error={fieldErrors.cgpa}
                onChange={(e) => {
                  setCgpa(e.target.value);
                  clearFieldError('cgpa');
                }}
                onBlur={() => {
                  if (cgpa) {
                    const err = validateCgpa(cgpa);
                    if (err) setFieldErrors(p => ({ ...p, cgpa: err }));
                  }
                }}
              />
              <Input
                id="field-resumeName"
                label="Resume File Name / URL"
                placeholder="e.g. Riya_Sen_Resume_2025.pdf"
                value={resumeName}
                error={fieldErrors.resumeName}
                onChange={(e) => {
                  setResumeName(e.target.value);
                  clearFieldError('resumeName');
                }}
                onBlur={() => {
                  if (resumeName) {
                    const err = validateFileName(resumeName);
                    if (err) setFieldErrors(p => ({ ...p, resumeName: err }));
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Internship Setup */}
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
                id="field-internshipType"
                label="Internship Track / Type *"
                value={internshipType}
                error={fieldErrors.internshipType}
                onChange={(e) => {
                  setInternshipType(e.target.value);
                  clearFieldError('internshipType');
                }}
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
                id="field-department"
                label="Department *"
                value={department}
                error={fieldErrors.department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  clearFieldError('department');
                }}
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
                id="field-designation"
                label="Internship Role / Designation *"
                placeholder="e.g. AI Research Intern, Software Engineer Intern"
                value={designation}
                error={fieldErrors.designation}
                onChange={(e) => {
                  setDesignation(e.target.value);
                  clearFieldError('designation');
                }}
                required
              />
              <Select
                id="field-workMode"
                label="Work Mode *"
                value={workMode}
                error={fieldErrors.workMode}
                onChange={(e) => {
                  setWorkMode(e.target.value);
                  clearFieldError('workMode');
                }}
                options={[
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'On-site', label: 'On-site (Office)' },
                  { value: 'Remote', label: 'Remote' },
                ]}
              />
              <Input
                id="field-startDate"
                label="Start Date *"
                type="date"
                value={startDate}
                error={fieldErrors.startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  clearFieldError('startDate');
                  if (endDate && new Date(endDate) <= new Date(e.target.value)) {
                    setFieldErrors(p => ({ ...p, endDate: 'End date must be after start date.' }));
                  } else {
                    clearFieldError('endDate');
                  }
                }}
                required
              />
              <Input
                id="field-endDate"
                label="End Date *"
                type="date"
                value={endDate}
                error={fieldErrors.endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (startDate && new Date(e.target.value) <= new Date(startDate)) {
                    setFieldErrors(p => ({ ...p, endDate: 'End date must be strictly after start date.' }));
                  } else {
                    clearFieldError('endDate');
                  }
                }}
                required
              />
              <Select
                id="field-duration"
                label="Internship Duration *"
                value={duration}
                error={fieldErrors.duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  clearFieldError('duration');
                }}
                options={[
                  { value: '1 Month', label: '1 Month' },
                  { value: '2 Months', label: '2 Months' },
                  { value: '3 Months', label: '3 Months' },
                  { value: '6 Months', label: '6 Months' },
                  { value: '1 Year', label: '1 Year' },
                ]}
              />
              <Input
                id="field-stipend"
                label="Monthly Stipend (₹) *"
                type="number"
                placeholder="25000"
                value={stipend}
                error={fieldErrors.stipend}
                onChange={(e) => {
                  setStipend(e.target.value);
                  clearFieldError('stipend');
                }}
                onBlur={() => {
                  const num = Number(stipend);
                  if (isNaN(num) || num < 0) {
                    setFieldErrors(p => ({ ...p, stipend: 'Monthly stipend cannot be negative.' }));
                  } else if (num > 500000) {
                    setFieldErrors(p => ({ ...p, stipend: 'Monthly stipend cannot exceed ₹5,00,000.' }));
                  }
                }}
                required
              />
              <Input
                id="field-location"
                label="Location / Branch *"
                placeholder="e.g. Bengaluru HQ"
                value={location}
                error={fieldErrors.location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  clearFieldError('location');
                }}
                required
              />
              <Input
                id="field-reportingManager"
                label="Reporting Manager Name"
                placeholder="e.g. Sarah Jenkins"
                value={reportingManager}
                error={fieldErrors.reportingManager}
                onChange={(e) => {
                  setReportingManager(e.target.value);
                  clearFieldError('reportingManager');
                }}
              />
              <div className="md:col-span-2">
                <Input
                  id="field-mentor"
                  label="Assigned Mentor Name *"
                  placeholder="e.g. Rahul Verma"
                  value={mentor}
                  error={fieldErrors.mentor}
                  onChange={(e) => {
                    setMentor(e.target.value);
                    clearFieldError('mentor');
                  }}
                  required
                />
              </div>
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
              <p className="text-xs text-slate-500">Collect candidate resume, college identification, and national IDs.</p>
            </div>

            {fieldErrors.documents && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{fieldErrors.documents}</span>
              </div>
            )}

            <div className="space-y-3">
              {documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
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
                      onClick={() => handleRemoveDoc(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 text-xs transition-colors"
                      title="Remove Document"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Upload control */}
              <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-100 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:w-1/3">
                    <Select
                      label="Document Category"
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      options={[
                        { value: 'Resume', label: 'Resume' },
                        { value: 'College ID', label: 'College ID' },
                        { value: 'Government ID', label: 'Government ID (Aadhaar / Passport)' },
                        { value: 'Offer Letter', label: 'Internship Offer Letter' },
                        { value: 'NOC / University Clearance', label: 'NOC / University Clearance' },
                        { value: 'Other Document', label: 'Other Document' },
                      ]}
                    />
                  </div>
                  <div className="w-full sm:w-2/3 flex items-end">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg,.docx,.doc"
                      className="hidden"
                      id="upload-doc-input"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-dashed border-2 border-purple-300 hover:border-purple-500 text-purple-700 hover:bg-purple-50 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold"
                    >
                      <Upload size={14} /> Choose File to Attach (.PDF, .PNG, .JPG up to 10MB)
                    </Button>
                  </div>
                </div>
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
                id="field-companyEmail"
                label="Company Email Address (Optional — Auto Generated)"
                placeholder="riya.sen@company.com"
                value={companyEmail}
                error={fieldErrors.companyEmail}
                onChange={(e) => {
                  setCompanyEmail(e.target.value);
                  clearFieldError('companyEmail');
                }}
              />
              <Input
                id="field-assignedDevice"
                label="Assigned Laptop / Workstation Asset Tag"
                placeholder="MacBook Air M2 (INT-DEV-01)"
                value={assignedDevice}
                error={fieldErrors.assignedDevice}
                onChange={(e) => {
                  setAssignedDevice(e.target.value);
                  clearFieldError('assignedDevice');
                }}
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

            {/* Error Summary Box if any step is invalid */}
            {!allValidation.isValid ? (
              <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <AlertCircle size={16} className="text-rose-600" />
                  <span>Validation Incomplete: {allValidation.totalErrors} field{allValidation.totalErrors > 1 ? 's' : ''} require attention before submission</span>
                </div>
                <div className="space-y-2 text-xs">
                  {[1, 2, 3, 4, 5].map((sNum) => {
                    const errorsForStep = allValidation.stepErrors[sNum];
                    if (!errorsForStep || Object.keys(errorsForStep).length === 0) return null;
                    const stepTitle = steps.find(s => s.num === sNum)?.title || `Step ${sNum}`;
                    return (
                      <div key={sNum} className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-white/80 rounded-lg border border-rose-100 gap-2">
                        <div>
                          <span className="font-bold text-rose-900 mr-2">Step {sNum} ({stepTitle}):</span>
                          <span className="text-rose-700">
                            {Object.values(errorsForStep).join(' • ')}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => jumpToStepAndField(sNum, Object.keys(errorsForStep)[0])}
                          className="text-xs text-rose-700 border-rose-200 hover:bg-rose-100 self-start sm:self-auto shrink-0 flex items-center gap-1"
                        >
                          <span>Fix in Step {sNum}</span>
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>All 5 onboarding sections verified. Candidate profile is ready for creation.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Summary Card 1: Personal */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                    <User size={13} /> Personal Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => jumpToStepAndField(1)}
                    className="text-[11px] text-purple-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Intern ID:</span> <strong className="text-slate-900">{internId || '(Auto Generate)'}</strong></p>
                  <p><span className="text-slate-400">Name:</span> <strong className="text-slate-900">{fullName || '—'}</strong></p>
                  <p><span className="text-slate-400">Email:</span> {email || '—'}</p>
                  <p><span className="text-slate-400">Phone:</span> {phone || 'Not provided'}</p>
                  <p><span className="text-slate-400">Gender / DOB:</span> {gender} • {dob}</p>
                  <p><span className="text-slate-400">Address:</span> {address || 'Not provided'}</p>
                </div>
              </div>

              {/* Summary Card 2: Academic */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen size={13} /> Academic Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => jumpToStepAndField(2)}
                    className="text-[11px] text-purple-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="text-slate-400">College:</span> <strong className="text-slate-900">{college || '—'}</strong></p>
                  <p><span className="text-slate-400">Degree:</span> {degree}</p>
                  <p><span className="text-slate-400">Branch:</span> {branch || '—'}</p>
                  <p><span className="text-slate-400">Batch:</span> {graduationYear} {rollNumber ? `(Roll: ${rollNumber})` : ''}</p>
                  <p><span className="text-slate-400">CGPA:</span> {cgpa || '—'}</p>
                </div>
              </div>

              {/* Summary Card 3: Internship */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Briefcase size={13} /> Internship Setup
                  </h3>
                  <button
                    type="button"
                    onClick={() => jumpToStepAndField(3)}
                    className="text-[11px] text-purple-600 hover:underline font-semibold"
                  >
                    Edit
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-700">
                  <p><span className="text-slate-400">Role:</span> <strong className="text-slate-900">{designation}</strong></p>
                  <p><span className="text-slate-400">Track:</span> {internshipType} ({department})</p>
                  <p><span className="text-slate-400">Dates:</span> {startDate} to {endDate} ({duration})</p>
                  <p><span className="text-slate-400">Stipend:</span> ₹{Number(stipend || 0).toLocaleString()} / month</p>
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
              <span className={`px-3 py-1 font-bold text-xs rounded-lg shadow-sm ${allValidation.isValid ? 'bg-purple-600 text-white' : 'bg-slate-300 text-slate-600'}`}>
                {allValidation.isValid ? 'Ready to Confirm' : 'Requires Review'}
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
            disabled={isSubmitting}
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
              disabled={isSubmitting || !fullName.trim()}
              className="text-xs text-purple-700 border-purple-200 hover:bg-purple-50"
            >
              {isSubmitting ? 'Saving...' : 'Save as Draft'}
            </Button>

            {currentStep < 6 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                disabled={isSubmitting}
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
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
