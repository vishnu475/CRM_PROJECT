/**
 * Validation utilities for the 6-Step Intern Onboarding Wizard
 * Comprehensive, accessible, user-friendly field and step validation.
 */

export interface InternFormData {
  // Step 1: Personal
  internId: string;
  fullName: string;
  profilePhoto?: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;

  // Step 2: Academic
  college: string;
  degree: string;
  branch: string;
  graduationYear: string;
  rollNumber: string;
  cgpa: string;
  resumeName: string;

  // Step 3: Internship Setup
  internshipType: string;
  department: string;
  designation: string;
  startDate: string;
  endDate: string;
  duration: string;
  workMode: string;
  location: string;
  stipend: string;
  reportingManager: string;
  reportingManagerId?: string;
  mentor: string;
  mentorId?: string;

  // Step 4: Documents
  documents: Array<{ name: string; type: string; status: string; size?: number }>;

  // Step 5: Access & Assets
  companyEmail: string;
  systemAccess: boolean;
  attendanceAccess: boolean;
  assignedDevice: string;
  idCardIssued: boolean;
  checklist: Array<{ task: string; completed: boolean }>;
}

export type StepErrors = Record<string, string>;

export interface StepValidationResult {
  isValid: boolean;
  errors: StepErrors;
  firstInvalidField?: string;
}

export interface AllStepsValidationResult {
  isValid: boolean;
  stepErrors: Record<number, StepErrors>;
  totalErrors: number;
  firstInvalidStep: number | null;
  firstInvalidField: string | null;
}

// -------------------------------------------------------------
// Helper Format & Range Checkers
// -------------------------------------------------------------

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const NAME_REGEX = /^[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/;
export const ROLL_NUMBER_REGEX = /^[a-zA-Z0-9\/-]{2,30}$/;
export const ALLOWED_DOC_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.doc'];
export const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * Validates Phone number: phone number must be 10 digits only
 */
export function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null; // optional

  // Check for disallowed characters
  if (/[^0-9+\s\-]/.test(trimmed)) {
    return 'Phone number must be 10 digits only.';
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  // If user entered +91 country prefix
  if (trimmed.startsWith('+91') || (digitsOnly.length === 12 && digitsOnly.startsWith('91'))) {
    const local = digitsOnly.slice(-10);
    if (digitsOnly.length !== 12 || local.length !== 10) {
      return 'Phone number must be 10 digits only.';
    }
    return null;
  }

  // Strictly 10 digits
  if (digitsOnly.length !== 10) {
    return 'Phone number must be 10 digits only.';
  }

  return null;
}

/**
 * Validates Date of Birth: must be a valid date, not future, age >= 16 and <= 75
 */
export function validateDob(dob: string): string | null {
  const trimmed = dob.trim();
  if (!trimmed) return 'Date of birth is required.';

  const timestamp = Date.parse(trimmed);
  if (isNaN(timestamp)) {
    return 'Please enter a valid calendar date (YYYY-MM-DD).';
  }

  const dobDate = new Date(trimmed);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dobDate > today) {
    return 'Date of birth cannot be in the future.';
  }

  // Calculate age accurately
  let age = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }

  if (age < 16) {
    return `Intern must be at least 16 years old. Calculated age is ${age}.`;
  }
  if (age > 75) {
    return 'Please enter a valid date of birth (maximum age limit is 75 years).';
  }

  return null;
}

/**
 * Validates CGPA / Percentage
 */
export function validateCgpa(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null; // optional

  // Extract numeric component
  const match = trimmed.match(/^-?[\d.]+/);
  if (!match) {
    return 'Please enter a numeric CGPA (e.g. 8.5) or Percentage (e.g. 85%).';
  }

  const num = parseFloat(match[0]);
  if (isNaN(num)) {
    return 'Invalid academic score format.';
  }

  if (num < 0) {
    return 'Academic score cannot be negative.';
  }

  const lower = trimmed.toLowerCase();
  const isExplicitCgpa = lower.includes('cgpa') || lower.includes('gpa');
  const isPercent = trimmed.includes('%');

  if (isExplicitCgpa) {
    if (num > 10.0) {
      return 'CGPA on a 10-point scale cannot exceed 10.0.';
    }
  } else if (isPercent) {
    if (num > 100.0) {
      return 'Percentage cannot exceed 100%.';
    }
  } else {
    // Unspecified scale: if > 10, assumed percentage up to 100
    if (num > 100.0) {
      return 'Academic score cannot exceed 100% or 10.0 CGPA.';
    }
  }

  return null;
}

/**
 * Validates File Name extensions
 */
export function validateFileName(fileName: string): string | null {
  const trimmed = fileName.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const hasValidExt = ALLOWED_DOC_EXTENSIONS.some(ext => lower.endsWith(ext));
  if (!hasValidExt) {
    return `File must be one of: ${ALLOWED_DOC_EXTENSIONS.join(', ')}`;
  }
  return null;
}

// -------------------------------------------------------------
// STEP-SPECIFIC VALIDATORS
// -------------------------------------------------------------

/**
 * Step 1 — Personal Information Validation
 */
export function validateStep1(data: Partial<InternFormData>): StepValidationResult {
  const errors: StepErrors = {};

  // Full Legal Name
  const fullName = (data.fullName || '').trim();
  if (!fullName) {
    errors.fullName = 'Full legal name is required.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Full legal name must be at least 2 characters.';
  } else if (fullName.length > 100) {
    errors.fullName = 'Full legal name cannot exceed 100 characters.';
  } else if (!NAME_REGEX.test(fullName)) {
    errors.fullName = 'Full legal name should only contain letters, spaces, hyphens, and apostrophes.';
  }

  // Personal Email
  const email = (data.email || '').trim();
  if (!email) {
    errors.email = 'Personal email address is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid personal email address (e.g., intern@example.com).';
  }

  // Intern ID (Optional)
  const internId = (data.internId || '').trim();
  if (internId) {
    if (internId.length < 3 || internId.length > 25) {
      errors.internId = 'Intern ID must be between 3 and 25 characters.';
    } else if (!/^[A-Za-z0-9\-_]+$/.test(internId)) {
      errors.internId = 'Intern ID must contain only alphanumeric characters, hyphens, or underscores (e.g. INT-105).';
    }
  }

  // Phone Number
  if (data.phone) {
    const phoneErr = validatePhone(data.phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  // Date of Birth
  if (data.dob) {
    const dobErr = validateDob(data.dob);
    if (dobErr) errors.dob = dobErr;
  } else {
    errors.dob = 'Date of birth is required.';
  }

  // Gender
  const gender = (data.gender || '').trim();
  if (!gender) {
    errors.gender = 'Gender selection is required.';
  } else if (!['Male', 'Female', 'Other'].includes(gender)) {
    errors.gender = 'Please select a valid gender option (Male, Female, Other).';
  }

  // Residential Address
  const address = (data.address || '').trim();
  if (address) {
    if (address.length < 5) {
      errors.address = 'Residential address must be at least 5 characters.';
    } else if (address.length > 255) {
      errors.address = 'Residential address cannot exceed 255 characters.';
    }
  }

  // Emergency Contact
  const emergencyContact = (data.emergencyContact || '').trim();
  if (emergencyContact) {
    if (emergencyContact.length < 5) {
      errors.emergencyContact = 'Emergency contact must include contact name and phone number.';
    } else if (emergencyContact.length > 150) {
      errors.emergencyContact = 'Emergency contact cannot exceed 150 characters.';
    }
  }

  const fieldKeys = Object.keys(errors);
  return {
    isValid: fieldKeys.length === 0,
    errors,
    firstInvalidField: fieldKeys[0]
  };
}

/**
 * Step 2 — Academic Details Validation
 */
export function validateStep2(data: Partial<InternFormData>): StepValidationResult {
  const errors: StepErrors = {};

  // College / University Name
  const college = (data.college || '').trim();
  if (!college) {
    errors.college = 'College / University name is required.';
  } else if (college.length < 3) {
    errors.college = 'College / University name must be at least 3 characters.';
  } else if (college.length > 150) {
    errors.college = 'College / University name cannot exceed 150 characters.';
  }

  // Degree Program
  const degree = (data.degree || '').trim();
  const validDegrees = [
    'B.Tech / B.E.', 'M.Tech / M.E.', 'BCA / MCA', 'B.Sc / M.Sc',
    'BBA / MBA', 'Diploma', 'Other'
  ];
  if (!degree) {
    errors.degree = 'Degree program selection is required.';
  } else if (!validDegrees.includes(degree)) {
    errors.degree = 'Please select a valid degree program.';
  }

  // Branch / Specialization
  const branch = (data.branch || '').trim();
  if (!branch) {
    errors.branch = 'Branch / Specialization is required.';
  } else if (branch.length < 2) {
    errors.branch = 'Branch must be at least 2 characters.';
  } else if (branch.length > 100) {
    errors.branch = 'Branch cannot exceed 100 characters.';
  }

  // Graduation Year
  const graduationYear = (data.graduationYear || '').trim();
  if (!graduationYear) {
    errors.graduationYear = 'Graduation year is required.';
  } else {
    const yearNum = parseInt(graduationYear, 10);
    const curYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < curYear - 10 || yearNum > curYear + 10) {
      errors.graduationYear = `Graduation year must be between ${curYear - 10} and ${curYear + 10}.`;
    }
  }

  // Roll Number (Optional)
  const rollNumber = (data.rollNumber || '').trim();
  if (rollNumber) {
    if (!ROLL_NUMBER_REGEX.test(rollNumber)) {
      errors.rollNumber = 'Roll number must be 2 to 30 alphanumeric characters, hyphens, or slashes.';
    }
  }

  // CGPA / Percentage
  if (data.cgpa) {
    const cgpaErr = validateCgpa(data.cgpa);
    if (cgpaErr) errors.cgpa = cgpaErr;
  }

  // Resume File Name
  if (data.resumeName) {
    const fileErr = validateFileName(data.resumeName);
    if (fileErr) errors.resumeName = fileErr;
  }

  const fieldKeys = Object.keys(errors);
  return {
    isValid: fieldKeys.length === 0,
    errors,
    firstInvalidField: fieldKeys[0]
  };
}

/**
 * Step 3 — Internship Setup Validation
 */
export function validateStep3(data: Partial<InternFormData>): StepValidationResult {
  const errors: StepErrors = {};

  // Internship Type
  const internshipType = (data.internshipType || '').trim();
  const validTypes = ['Technical', 'AI / ML', 'Full Stack', 'Cloud', 'Data Science', 'HR', 'Finance', 'Marketing', 'Other'];
  if (!internshipType) {
    errors.internshipType = 'Internship track/type is required.';
  } else if (!validTypes.includes(internshipType)) {
    errors.internshipType = 'Please select a valid internship type.';
  }

  // Department
  const department = (data.department || '').trim();
  const validDepts = ['Engineering', 'Product & Design', 'HR', 'Finance', 'Marketing', 'Operations'];
  if (!department) {
    errors.department = 'Department is required.';
  } else if (!validDepts.includes(department)) {
    errors.department = 'Please select a valid department.';
  }

  // Designation / Role
  const designation = (data.designation || '').trim();
  if (!designation) {
    errors.designation = 'Internship role / designation is required.';
  } else if (designation.length < 2) {
    errors.designation = 'Designation must be at least 2 characters.';
  } else if (designation.length > 100) {
    errors.designation = 'Designation cannot exceed 100 characters.';
  }

  // Work Mode
  const workMode = (data.workMode || '').trim();
  if (!workMode) {
    errors.workMode = 'Work mode selection is required.';
  } else if (!['Hybrid', 'On-site', 'Remote'].includes(workMode)) {
    errors.workMode = 'Work mode must be Hybrid, On-site, or Remote.';
  }

  // Start Date
  const startDate = (data.startDate || '').trim();
  if (!startDate) {
    errors.startDate = 'Internship start date is required.';
  } else if (isNaN(Date.parse(startDate))) {
    errors.startDate = 'Please enter a valid start date (YYYY-MM-DD).';
  }

  // End Date
  const endDate = (data.endDate || '').trim();
  if (!endDate) {
    errors.endDate = 'Internship end date is required.';
  } else if (isNaN(Date.parse(endDate))) {
    errors.endDate = 'Please enter a valid end date (YYYY-MM-DD).';
  } else if (startDate && !isNaN(Date.parse(startDate))) {
    if (new Date(endDate) <= new Date(startDate)) {
      errors.endDate = 'Internship end date must be strictly after the start date.';
    }
  }

  // Duration
  const duration = (data.duration || '').trim();
  const validDurations = ['1 Month', '2 Months', '3 Months', '6 Months', '1 Year'];
  if (!duration) {
    errors.duration = 'Internship duration is required.';
  } else if (!validDurations.includes(duration)) {
    errors.duration = 'Please select a valid duration.';
  }

  // Monthly Stipend
  const stipendStr = String(data.stipend ?? '').trim();
  if (stipendStr === '') {
    errors.stipend = 'Monthly stipend is required (enter 0 if unpaid).';
  } else {
    const stipendNum = Number(stipendStr);
    if (isNaN(stipendNum)) {
      errors.stipend = 'Stipend must be a valid number.';
    } else if (stipendNum < 0) {
      errors.stipend = 'Stipend cannot be negative.';
    } else if (stipendNum > 500000) {
      errors.stipend = 'Stipend cannot exceed ₹5,00,000 per month.';
    }
  }

  // Location
  const location = (data.location || '').trim();
  if (!location) {
    errors.location = 'Location / Branch is required.';
  } else if (location.length < 2) {
    errors.location = 'Location must be at least 2 characters.';
  } else if (location.length > 100) {
    errors.location = 'Location cannot exceed 100 characters.';
  }

  // Mentor Name
  const mentor = (data.mentor || '').trim();
  if (!mentor) {
    errors.mentor = 'Assigned mentor name is required.';
  } else if (mentor.length < 2) {
    errors.mentor = 'Mentor name must be at least 2 characters.';
  } else if (mentor.length > 100) {
    errors.mentor = 'Mentor name cannot exceed 100 characters.';
  } else if (!NAME_REGEX.test(mentor)) {
    errors.mentor = 'Mentor name should only contain letters, spaces, hyphens, and apostrophes.';
  }

  // Reporting Manager (Optional, but validate format if entered)
  const reportingManager = (data.reportingManager || '').trim();
  if (reportingManager) {
    if (reportingManager.length < 2) {
      errors.reportingManager = 'Reporting manager name must be at least 2 characters.';
    } else if (!NAME_REGEX.test(reportingManager)) {
      errors.reportingManager = 'Manager name should only contain letters, spaces, hyphens, and apostrophes.';
    }
  }

  const fieldKeys = Object.keys(errors);
  return {
    isValid: fieldKeys.length === 0,
    errors,
    firstInvalidField: fieldKeys[0]
  };
}

/**
 * Step 4 — Documents Validation
 */
export function validateStep4(data: Partial<InternFormData>): StepValidationResult {
  const errors: StepErrors = {};
  const docs = data.documents || [];

  if (docs.length === 0) {
    errors.documents = 'At least one onboarding document (such as Resume) must be attached.';
  } else {
    // Check if Resume is present
    const hasResume = docs.some(d =>
      d.type.toLowerCase().includes('resume') ||
      d.name.toLowerCase().includes('resume')
    );
    if (!hasResume) {
      errors.documents = 'Candidate Resume is a mandatory document.';
    }

    // Validate each document's file name extension and status
    for (const doc of docs) {
      const extErr = validateFileName(doc.name);
      if (extErr) {
        errors.documents = `Document "${doc.name}" has an invalid extension. Supported: ${ALLOWED_DOC_EXTENSIONS.join(', ')}`;
        break;
      }
      if (doc.size && doc.size > MAX_DOC_SIZE_BYTES) {
        errors.documents = `Document "${doc.name}" exceeds the maximum 10MB limit.`;
        break;
      }
    }
  }

  const fieldKeys = Object.keys(errors);
  return {
    isValid: fieldKeys.length === 0,
    errors,
    firstInvalidField: fieldKeys[0]
  };
}

/**
 * Step 5 — Access & Assets Validation
 */
export function validateStep5(data: Partial<InternFormData>): StepValidationResult {
  const errors: StepErrors = {};

  // Company Email (Optional, auto-generated if blank, but if entered must be valid email format)
  const companyEmail = (data.companyEmail || '').trim();
  if (companyEmail && !EMAIL_REGEX.test(companyEmail)) {
    errors.companyEmail = 'Please enter a valid corporate email format (e.g. name@company.com).';
  }

  // Assigned Device / Asset (Optional, but if entered check length)
  const assignedDevice = (data.assignedDevice || '').trim();
  if (assignedDevice) {
    if (assignedDevice.length < 3) {
      errors.assignedDevice = 'Assigned device tag must be at least 3 characters.';
    } else if (assignedDevice.length > 100) {
      errors.assignedDevice = 'Assigned device tag cannot exceed 100 characters.';
    }
  }

  const fieldKeys = Object.keys(errors);
  return {
    isValid: fieldKeys.length === 0,
    errors,
    firstInvalidField: fieldKeys[0]
  };
}

/**
 * Validate all steps 1-5 for Step 6 Review & Confirmation
 */
export function validateAllSteps(data: InternFormData): AllStepsValidationResult {
  const step1 = validateStep1(data);
  const step2 = validateStep2(data);
  const step3 = validateStep3(data);
  const step4 = validateStep4(data);
  const step5 = validateStep5(data);

  const stepErrors: Record<number, StepErrors> = {
    1: step1.errors,
    2: step2.errors,
    3: step3.errors,
    4: step4.errors,
    5: step5.errors,
  };

  const totalErrors =
    Object.keys(step1.errors).length +
    Object.keys(step2.errors).length +
    Object.keys(step3.errors).length +
    Object.keys(step4.errors).length +
    Object.keys(step5.errors).length;

  let firstInvalidStep: number | null = null;
  let firstInvalidField: string | null = null;

  if (!step1.isValid) {
    firstInvalidStep = 1;
    firstInvalidField = step1.firstInvalidField || null;
  } else if (!step2.isValid) {
    firstInvalidStep = 2;
    firstInvalidField = step2.firstInvalidField || null;
  } else if (!step3.isValid) {
    firstInvalidStep = 3;
    firstInvalidField = step3.firstInvalidField || null;
  } else if (!step4.isValid) {
    firstInvalidStep = 4;
    firstInvalidField = step4.firstInvalidField || null;
  } else if (!step5.isValid) {
    firstInvalidStep = 5;
    firstInvalidField = step5.firstInvalidField || null;
  }

  return {
    isValid: totalErrors === 0,
    stepErrors,
    totalErrors,
    firstInvalidStep,
    firstInvalidField
  };
}

/**
 * Save as Draft Validation:
 * Minimal requirements for a draft:
 * - Must have intern full name
 * - If email, phone, stipend, or dates are provided, their syntax/values must be valid
 */
export function validateDraft(data: Partial<InternFormData>): StepValidationResult {
  const errors: StepErrors = {};

  const fullName = (data.fullName || '').trim();
  if (!fullName) {
    errors.fullName = 'Full legal name is required to save a draft.';
  } else if (fullName.length < 2) {
    errors.fullName = 'Full legal name must be at least 2 characters.';
  }

  const email = (data.email || '').trim();
  if (email && !EMAIL_REGEX.test(email)) {
    errors.email = 'Personal email format is invalid.';
  }

  if (data.phone) {
    const phoneErr = validatePhone(data.phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  if (data.dob) {
    const dobErr = validateDob(data.dob);
    if (dobErr) errors.dob = dobErr;
  }

  if (data.cgpa) {
    const cgpaErr = validateCgpa(data.cgpa);
    if (cgpaErr) errors.cgpa = cgpaErr;
  }

  if (data.startDate && data.endDate) {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      errors.endDate = 'End date must be after start date.';
    }
  }

  if (data.stipend !== undefined && String(data.stipend).trim() !== '') {
    const stipendNum = Number(data.stipend);
    if (isNaN(stipendNum) || stipendNum < 0) {
      errors.stipend = 'Stipend cannot be negative.';
    }
  }

  const fieldKeys = Object.keys(errors);
  return {
    isValid: fieldKeys.length === 0,
    errors,
    firstInvalidField: fieldKeys[0]
  };
}
