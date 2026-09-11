import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ClipboardList,
  UserPlus,
  Users,
  Search,
  Calendar,
  Clock,
  Paperclip,
  Plus,
  Trash2,
  Eye,
  Sparkles,
  ArrowLeft,
  Check,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Layers,
  ChevronDown,
  Link2,
  Video,
  ExternalLink,
  FolderGit2,
  Crown,
  ShieldCheck,
  Building2,
  Info,
  Percent,
  Edit3,
  Loader2
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { taskApiService } from '../services/taskService';
import { TaskPriority, ProjectGroup } from '../types';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';

interface AssignTaskViewProps {
  onBack?: () => void;
  onSuccess?: () => void;
}

interface SubtaskItem {
  id: string;
  label: string;
  completed: boolean;
}

interface AttachedFileItem {
  name: string;
  file?: File;
  dataUrl?: string;
}

export const AssignTaskView: React.FC<AssignTaskViewProps> = ({ onBack, onSuccess }) => {
  const { employees = [] } = useApp();

  // Fresh active HRMS employees loaded directly from /api/employees
  const [hrmsEmployees, setHrmsEmployees] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchHrmsEmployees = async () => {
      try {
        const res = await fetch('/api/employees');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          if (isMounted) setHrmsEmployees(json.data);
        }
      } catch (err) {
        console.warn('Failed to load HRMS employees:', err);
      }
    };
    fetchHrmsEmployees();
    return () => { isMounted = false; };
  }, []);

  // Dynamic Master Projects state
  const [masterProjects, setMasterProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('PRJ-CMS');

  // Searchable Master Project Dropdown state
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Groups state
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // Edit Group Modal & Roster customization state (Redesigned 3-Section Workflow)
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState('');
  const [editingGroupName, setEditingGroupName] = useState('');
  const [editingGroupDesc, setEditingGroupDesc] = useState('');
  const [editingGroupRepoUrl, setEditingGroupRepoUrl] = useState('');
  const [editingTeamHeadId, setEditingTeamHeadId] = useState('');
  const [targetTeamCount, setTargetTeamCount] = useState<number>(4);
  const [editingMembers, setEditingMembers] = useState<Array<{
    employeeId: string;
    name: string;
    designation?: string;
    department?: string;
    role?: string;
  }>>([]);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Section 2: Single Employee Lookup & Module Assignment
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [isSearchingEmp, setIsSearchingEmp] = useState(false);
  const [searchedCandidate, setSearchedCandidate] = useState<any | null>(null);
  const [empSearchError, setEmpSearchError] = useState<string | null>(null);
  const [configuringEmployee, setConfiguringEmployee] = useState<any | null>(null);
  const [isEditingExistingMember, setIsEditingExistingMember] = useState(false);

  // Dynamic Module Assignment states (Fetched dynamically from database - zero hardcoding)
  const [selectedAssignedModules, setSelectedAssignedModules] = useState<Array<{
    id: string;
    code: string;
    name: string;
    category?: string;
  }>>([]);
  const [moduleSearchInput, setModuleSearchInput] = useState('');
  const [moduleSuggestions, setModuleSuggestions] = useState<Array<{
    id: string;
    code: string;
    name: string;
    category?: string;
  }>>([]);
  const [isSearchingModules, setIsSearchingModules] = useState(false);
  const [isLoadingEmployeeModules, setIsLoadingEmployeeModules] = useState(false);
  const [isSavingAssignedModules, setIsSavingAssignedModules] = useState(false);
  const [memberAssignedModulesMap, setMemberAssignedModulesMap] = useState<Record<string, Array<{
    id: string;
    code: string;
    name: string;
    category?: string;
  }>>>({});

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignmentType, setAssignmentType] = useState<'INDIVIDUAL' | 'GROUP'>('GROUP');
  const [taskWeightage, setTaskWeightage] = useState<number>(25);
  const [priority, setPriority] = useState<TaskPriority>('HIGH');
  const [dueDate, setDueDate] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<string>('16');
  const [repositoryUrl, setRepositoryUrl] = useState<string>('');
  const [moduleName, setModuleName] = useState('Core API & Database');
  const [deliverableType, setDeliverableType] = useState('Full-Stack Implementation');
  const [referenceLink, setReferenceLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<AttachedFileItem[]>([]);
  const [previewModalDoc, setPreviewModalDoc] = useState<{ fileName: string; fileUrl?: string } | null>(null);
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Employee selection states (for INDIVIDUAL)
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Project existing tasks & weightage balance
  const [existingTasks, setExistingTasks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Automatically populate form fields gathering information from the selected project module
  const applyProjectDataToForm = (proj: any) => {
    if (!proj) return;

    // 1. Title
    setTitle(`${proj.name || proj.title || 'Project'} - Core Deliverables`);

    // 2. Description ("desctipion" - gathering requirements from project module)
    const desc = proj.project_requirement || proj.description || proj.project_notes ||
      `Scope of Work: Core deliverables, module architecture, and verification for ${proj.name}. Adhere to project technical guidelines and submit deliverables for review.`;
    setDescription(desc);

    // 3. Priority ("priport")
    const projPriority = (proj.priority as TaskPriority) || 'HIGH';
    setPriority(projPriority);

    // 4. Deadline ("deadline" - due date from project end_date)
    if (proj.end_date) {
      try {
        const d = new Date(proj.end_date);
        if (!isNaN(d.getTime())) {
          setDueDate(d.toISOString().split('T')[0]);
        } else {
          setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
        }
      } catch {
        setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
      }
    } else {
      setDueDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    }

    // 5. Documentation & Target Module ("dociention")
    const modName = `${proj.code || proj.name || 'System'} Core Architecture & API`;
    setModuleName(modName);
    setDeliverableType('Full-Stack Implementation & API');

    // 6. Repository URL
    if (proj.repository_url) {
      setRepositoryUrl(proj.repository_url);
    } else if (proj.code) {
      setRepositoryUrl(`https://github.com/company/${proj.code.toLowerCase()}`);
    }

    // 7. Attached Files ("attenced file" - gathering documentation from project module)
    const projectDocs: AttachedFileItem[] = [];
    if (Array.isArray(proj.requirement_documents) && proj.requirement_documents.length > 0) {
      proj.requirement_documents.forEach((d: any) => {
        projectDocs.push({
          name: d.name || d.fileName || d.file_name || `${proj.code || 'PRJ'}_Requirement_Doc.pdf`,
          dataUrl: d.fileUrl || d.file_url || d.dataUrl || undefined
        });
      });
    }
    if (projectDocs.length === 0) {
      projectDocs.push({
        name: `${(proj.code || proj.id || 'PRJ').toUpperCase()}_Requirements_Specification.pdf`,
        dataUrl: undefined
      });
    }
    setAttachedFiles(projectDocs);

    // 8. Subtasks / Checklist
    setSubtasks([
      { id: '1', label: `Review ${proj.name} functional requirements and documentation`, completed: false },
      { id: '2', label: `Implement ${proj.code || 'core'} modules with automated test coverage`, completed: false },
      { id: '3', label: `Prepare demo video recording and submit deliverables for review`, completed: false }
    ]);
  };

  // Handle selecting a project from the searchable dropdown
  const handleSelectProject = (proj: any) => {
    const projId = proj.id || proj.code;
    setSelectedProjectId(projId);
    applyProjectDataToForm(proj);
    setProjectSearchQuery('');
    setIsProjectDropdownOpen(false);
    setStatusMessage({
      type: 'success',
      text: `Gathered details from ${proj.name}: Description, deadline, priority, module & attached spec auto-populated!`
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic debounced search for active modules from database
  useEffect(() => {
    const query = moduleSearchInput.trim();
    if (!query) {
      setModuleSuggestions([]);
      setIsSearchingModules(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingModules(true);
    const timer = setTimeout(async () => {
      try {
        const results = await taskApiService.searchModules(query);
        if (isCurrent) {
          setModuleSuggestions(results);
        }
      } catch (err) {
        console.error('Failed to search database modules:', err);
        if (isCurrent) setModuleSuggestions([]);
      } finally {
        if (isCurrent) setIsSearchingModules(false);
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [moduleSearchInput]);

  // 1. Fetch Master Projects dynamically & initial autofill
  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      setIsLoadingProjects(true);
      try {
        const res = await fetch('/api/projects');
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          if (isMounted) {
            setMasterProjects(json.data);
            const initialProj = json.data.find((p: any) => p.id === selectedProjectId || p.code === selectedProjectId) || json.data[0];
            setSelectedProjectId(initialProj.id || initialProj.code);
            applyProjectDataToForm(initialProj);
          }
        }
      } catch (e) {
        console.warn('Failed to load dynamic projects:', e);
      } finally {
        if (isMounted) setIsLoadingProjects(false);
      }
    };
    fetchProjects();
    return () => { isMounted = false; };
  }, []);

  // Filtered projects for the searchable dropdown
  const filteredProjects = useMemo(() => {
    if (!projectSearchQuery.trim()) return masterProjects;
    const q = projectSearchQuery.toLowerCase();
    return masterProjects.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.code && p.code.toLowerCase().includes(q)) ||
      (p.client && p.client.toLowerCase().includes(q)) ||
      (p.project_manager && p.project_manager.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    );
  }, [masterProjects, projectSearchQuery]);

  // 2. Resolve Current Project Object
  const currentProject = useMemo(() => {
    if (!masterProjects.length) {
      return {
        id: 'PRJ-CMS',
        code: 'CMS',
        name: 'CMS Project',
        client: 'Media & Publishing Corp',
        project_manager: 'Sarah Jenkins',
        start_date: '2026-09-01',
        end_date: '2026-09-30',
        weightage: 100.0,
        repository_url: 'https://github.com/company/cms',
        project_requirement: 'Enterprise Headless Content Management System with multi-tenant API, markdown rendering, media management, and role-based publishing workflows.'
      };
    }
    const found = masterProjects.find(
      p => p.id === selectedProjectId || p.code === selectedProjectId || p.name === selectedProjectId
    );
    return found || masterProjects[0];
  }, [masterProjects, selectedProjectId]);

  // Sync default repositoryUrl from project
  useEffect(() => {
    if (currentProject?.repository_url && !repositoryUrl) {
      setRepositoryUrl(currentProject.repository_url);
    }
  }, [currentProject]);

  // 3. Fetch Groups for Selected Project
  useEffect(() => {
    let isMounted = true;
    const fetchGroups = async () => {
      if (!currentProject) return;
      setIsLoadingGroups(true);
      try {
        const pId = currentProject.id || currentProject.code;
        const groups = await taskApiService.getGroups(pId);
        if (isMounted) {
          setProjectGroups(groups);
          if (groups.length > 0) {
            setSelectedGroupId(groups[0].id);
          } else {
            setSelectedGroupId('');
          }
        }
      } catch (err) {
        console.warn('Failed to load groups for project:', err);
      } finally {
        if (isMounted) setIsLoadingGroups(false);
      }
    };
    fetchGroups();
    return () => { isMounted = false; };
  }, [currentProject]);

  // 4. Fetch Existing Tasks to calculate Project Weightage Balance
  useEffect(() => {
    let isMounted = true;
    const fetchProjectTasks = async () => {
      if (!currentProject) return;
      try {
        const pId = currentProject.id || currentProject.code;
        const tasks = await taskApiService.getTasks({ projectId: pId });
        if (isMounted) {
          setExistingTasks(tasks);
        }
      } catch (e) {
        console.warn('Failed to load project tasks for weightage balance:', e);
      }
    };
    fetchProjectTasks();
    return () => { isMounted = false; };
  }, [currentProject]);

  // Calculate Weightage Balance
  const weightageSummary = useMemo(() => {
    const totalAllocated = existingTasks.reduce((sum, t) => sum + (Number(t.task_weightage) || 0), 0);
    const remaining = Math.max(0, 100 - totalAllocated);
    const exceeds = (totalAllocated + Number(taskWeightage)) > 100;
    return {
      totalAllocated,
      remaining,
      exceeds,
      afterAllocation: Math.min(100, totalAllocated + Number(taskWeightage))
    };
  }, [existingTasks, taskWeightage]);

  // 5-Day Review Rule calculation
  const reviewTargetDate = useMemo(() => {
    if (!dueDate) return null;
    try {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) return null;
      d.setDate(d.getDate() - 5);
      return d.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }, [dueDate]);

  // List of active employees available in HRMS (strictly active/confirmed/probation/joined, no duplicates)
  const availableEmployeesList = useMemo(() => {
    const rawList = hrmsEmployees.length > 0 ? hrmsEmployees : employees;
    const uniqueMap = new Map<string, {
      id: string;
      empCode: string;
      name: string;
      designation: string;
      department: string;
      avatar: string;
    }>();

    rawList.forEach(e => {
      const s = String(e.status || e.onboarding_stage || '').trim().toLowerCase();
      if (s === 'exited' || s === 'terminated' || s === 'inactive' || s === 'relieved') return;

      const code = String(e.emp_code || e.empCode || e.id || '').trim();
      if (!code) return;
      const lowerCode = code.toLowerCase();

      // Exclude admin logins & system accounts
      if (lowerCode === 'admin-001' || lowerCode === 'emp-000') return;
      const dept = String(e.department || '').trim().toLowerCase();
      if (dept === 'administration' || dept === 'management') return;

      if (!uniqueMap.has(lowerCode)) {
        uniqueMap.set(lowerCode, {
          id: code,
          empCode: code,
          name: e.name || 'Employee',
          designation: e.designation || 'Specialist',
          department: e.department || 'Engineering',
          avatar:
            e.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name || 'EM')}&background=1e40af&color=fff`
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [hrmsEmployees, employees]);

  // Selected Group Details (Strictly sanitized for active HRMS employees only, no duplicates)
  const selectedGroup = useMemo(() => {
    const grp = projectGroups.find(g => g.id === selectedGroupId) || projectGroups[0] || null;
    if (!grp) return null;

    const hrmsMap = new Map<string, any>();
    availableEmployeesList.forEach(e => {
      hrmsMap.set(e.id.toLowerCase(), e);
      hrmsMap.set(e.empCode.toLowerCase(), e);
    });

    const seenCodes = new Set<string>();
    const cleanMembers: any[] = [];

    (grp.members || []).forEach((m: any) => {
      const rawId = String(m.employeeId || m.employee_id || '').trim();
      if (!rawId) return;
      const lower = rawId.toLowerCase();
      const hrmsEmp = hrmsMap.get(lower);

      // ONLY include member if they are available in HRMS and not duplicate
      if (hrmsEmp && !seenCodes.has(hrmsEmp.empCode.toLowerCase())) {
        seenCodes.add(hrmsEmp.empCode.toLowerCase());
        cleanMembers.push({
          ...m,
          employeeId: hrmsEmp.empCode,
          name: hrmsEmp.name,
          employeeName: hrmsEmp.name,
          designation: hrmsEmp.designation,
          department: hrmsEmp.department,
          isTeamHead: String(hrmsEmp.empCode).toLowerCase() === String(grp.team_head_id || '').trim().toLowerCase()
        });
      }
    });

    // Resolve team head from HRMS
    const headEmp = hrmsMap.get(String(grp.team_head_id || '').trim().toLowerCase());
    const cleanHeadId = headEmp ? headEmp.empCode : (cleanMembers[0]?.employeeId || grp.team_head_id);
    const cleanHeadName = headEmp ? headEmp.name : (cleanMembers[0]?.name || grp.team_head_name);

    return {
      ...grp,
      team_head_id: cleanHeadId,
      team_head_name: cleanHeadName,
      members: cleanMembers,
      memberCount: cleanMembers.length
    };
  }, [projectGroups, selectedGroupId, availableEmployeesList]);

  // Employees available to add to the team in edit modal (strictly active HRMS employees not currently in team)
  const availableToAddEmployees = useMemo(() => {
    const currentMemberIds = new Set(
      editingMembers.map(m => String(m.employeeId).trim().toLowerCase())
    );
    return availableEmployeesList.filter(
      e =>
        !currentMemberIds.has(String(e.id).trim().toLowerCase()) &&
        !currentMemberIds.has(String(e.empCode).trim().toLowerCase())
    );
  }, [availableEmployeesList, editingMembers]);

  // Open Edit Group modal (Strictly active HRMS employees only, deduplicated)
  const handleOpenEditGroupModal = () => {
    if (!selectedGroup) return;
    setEditingGroupId(selectedGroup.id);
    setEditingGroupName(selectedGroup.name || '');
    setEditingGroupDesc(selectedGroup.description || '');
    setEditingGroupRepoUrl(selectedGroup.repository_url || (selectedGroup as any).repositoryUrl || currentProject?.repository_url || repositoryUrl || '');

    const hrmsMap = new Map<string, any>();
    availableEmployeesList.forEach(e => {
      hrmsMap.set(e.id.toLowerCase(), e);
      hrmsMap.set(e.empCode.toLowerCase(), e);
    });

    const seen = new Set<string>();
    const validMembers: Array<{
      employeeId: string;
      name: string;
      designation?: string;
      department?: string;
      role?: string;
    }> = [];

    (selectedGroup.members || []).forEach((m: any) => {
      const rawId = String(m.employeeId || m.employee_id || '').trim();
      if (!rawId) return;
      const lower = rawId.toLowerCase();
      const hrmsEmp = hrmsMap.get(lower);

      if (hrmsEmp && !seen.has(hrmsEmp.empCode.toLowerCase())) {
        seen.add(hrmsEmp.empCode.toLowerCase());
        validMembers.push({
          employeeId: hrmsEmp.empCode,
          name: hrmsEmp.name,
          designation: hrmsEmp.designation,
          department: hrmsEmp.department,
          role: m.role || 'Member'
        });
      }
    });

    let headId = String(selectedGroup.team_head_id || '').trim();
    const headEmp = hrmsMap.get(headId.toLowerCase());
    if (headEmp) {
      headId = headEmp.empCode;
    } else if (validMembers.length > 0) {
      headId = validMembers[0].employeeId;
    } else if (availableEmployeesList.length > 0) {
      headId = availableEmployeesList[0].empCode;
    }

    // Ensure Team Head is placed at index 0 and has role "Team Head"
    const headIdx = validMembers.findIndex(m => m.employeeId.toLowerCase() === headId.toLowerCase());
    if (headIdx >= 0) {
      const [headItem] = validMembers.splice(headIdx, 1);
      headItem.role = 'Team Head';
      validMembers.unshift(headItem);
    } else {
      const headObj = hrmsMap.get(headId.toLowerCase()) || availableEmployeesList[0];
      if (headObj) {
        validMembers.unshift({
          employeeId: headObj.empCode,
          name: headObj.name,
          designation: headObj.designation,
          department: headObj.department,
          role: 'Team Head'
        });
      }
    }

    setEditingTeamHeadId(headId);
    setEditingMembers(validMembers);
    setTargetTeamCount(Math.max(4, validMembers.length));

    // Reset single employee configuration states
    setEmpSearchQuery('');
    setIsSearchingEmp(false);
    setSearchedCandidate(null);
    setEmpSearchError(null);
    setConfiguringEmployee(null);
    setIsEditingExistingMember(false);
    setSelectedAssignedModules([]);
    setModuleSearchInput('');
    setModuleSuggestions([]);

    // Fetch existing group member modules from database
    taskApiService.getGroupModules(selectedGroup.id)
      .then(groupModMap => {
        if (groupModMap && Object.keys(groupModMap).length > 0) {
          setMemberAssignedModulesMap(groupModMap);
        }
      })
      .catch(err => console.warn('Could not fetch group modules:', err));

    setIsEditGroupModalOpen(true);
  };

  // Set designated Team Head
  const handleSelectTeamHead = (headEmpId: string) => {
    if (!headEmpId) return;
    const cleanId = headEmpId.trim();
    setEditingTeamHeadId(cleanId);
    const lower = cleanId.toLowerCase();

    const emp = availableEmployeesList.find(
      e => e.id.toLowerCase() === lower || e.empCode.toLowerCase() === lower
    );
    if (!emp) return;

    setEditingMembers(prev => {
      const withoutHead = prev.filter(m => m.employeeId.toLowerCase() !== lower);
      const updatedWithout = withoutHead.map(m =>
        m.role === 'Team Head' ? { ...m, role: 'Member' } : m
      );
      const newHeadItem = {
        employeeId: emp.empCode || emp.id,
        name: emp.name,
        designation: emp.designation || 'Specialist',
        department: emp.department || 'Engineering',
        role: 'Team Head'
      };
      const result = [newHeadItem, ...updatedWithout];
      if (targetTeamCount < result.length) {
        setTargetTeamCount(result.length);
      }
      return result;
    });

    if (configuringEmployee && (configuringEmployee.employeeId?.toLowerCase() === lower || configuringEmployee.empCode?.toLowerCase() === lower)) {
      setConfiguringEmployee(null);
      setSearchedCandidate(null);
      setSelectedAssignedModules([]);
    }
  };

  // Search Employee strictly by Employee ID from existing HRMS database
  const handleSearchEmployeeId = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setEmpSearchError(null);
    setSearchedCandidate(null);

    const query = empSearchQuery.trim();
    if (!query) {
      setEmpSearchError('Please enter an Employee ID (e.g. EMP-006)');
      return;
    }

    const lowerQuery = query.toLowerCase();

    // Validation 1: Cannot add the Team Head again as a normal member
    if (lowerQuery === editingTeamHeadId.toLowerCase()) {
      setEmpSearchError(`${query.toUpperCase()} is already designated as the Team Head. Team Head cannot be added again.`);
      return;
    }

    // Validation 2: Cannot add more employees than Team Count
    if (editingMembers.length >= targetTeamCount) {
      setEmpSearchError(`Team limit of ${targetTeamCount} members reached. Increase Total Team Count to add more.`);
      return;
    }

    // Validation 3: Cannot add the same employee twice
    if (editingMembers.some(m => m.employeeId.toLowerCase() === lowerQuery)) {
      setEmpSearchError(`Employee ${query.toUpperCase()} is already in this team.`);
      return;
    }

    setIsSearchingEmp(true);
    try {
      // 1. Check local HRMS employee directory first
      const localEmp = availableEmployeesList.find(
        emp => emp.empCode.toLowerCase() === lowerQuery || emp.id.toLowerCase() === lowerQuery
      );

      if (localEmp) {
        setSearchedCandidate({
          id: localEmp.id,
          empCode: localEmp.empCode,
          name: localEmp.name,
          designation: localEmp.designation,
          department: localEmp.department,
          avatar: localEmp.avatar
        });
        return;
      }

      // 2. Query database API: GET /api/employees/:id
      const fetchedEmp = await taskApiService.getEmployeeById(query);
      if (fetchedEmp) {
        const s = String(fetchedEmp.status || fetchedEmp.onboarding_stage || '').toLowerCase();
        if (s === 'exited' || s === 'terminated' || s === 'inactive' || s === 'relieved') {
          setEmpSearchError(`Employee ${query.toUpperCase()} is inactive or exited in HRMS.`);
          return;
        }

        const code = String(fetchedEmp.emp_code || fetchedEmp.id).trim();
        if (code.toLowerCase() === editingTeamHeadId.toLowerCase()) {
          setEmpSearchError(`${code} is designated as the Team Head and cannot be added again.`);
          return;
        }
        if (editingMembers.some(m => m.employeeId.toLowerCase() === code.toLowerCase())) {
          setEmpSearchError(`Employee ${code} is already in this team.`);
          return;
        }

        setSearchedCandidate({
          id: code,
          empCode: code,
          name: fetchedEmp.name || 'Employee',
          designation: fetchedEmp.designation || 'Specialist',
          department: fetchedEmp.department || 'Engineering',
          avatar: fetchedEmp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fetchedEmp.name || 'EM')}&background=1e40af&color=fff`
        });
      } else {
        setEmpSearchError(`Employee "${query}" not found in HRMS database.`);
      }
    } catch (err: any) {
      setEmpSearchError(err.message || `Employee "${query}" not found in HRMS database.`);
    } finally {
      setIsSearchingEmp(false);
    }
  };

  // Admin clicks [Select] on searched candidate card to open Module Assignment area
  const handleSelectCandidateToConfigure = async (candidate: any) => {
    setConfiguringEmployee(candidate);
    setIsEditingExistingMember(false);
    setSearchedCandidate(null);
    setEmpSearchError(null);
    setModuleSearchInput('');
    setModuleSuggestions([]);
    setIsLoadingEmployeeModules(true);

    const empId = candidate.empCode || candidate.employeeId || candidate.id;
    try {
      const existing = await taskApiService.getEmployeeModules(empId);
      setSelectedAssignedModules(existing);
    } catch {
      setSelectedAssignedModules([]);
    } finally {
      setIsLoadingEmployeeModules(false);
    }
  };

  // Admin clicks [Edit] on saved employee card to update assignment
  const handleOpenEditExistingEmployee = async (member: {
    employeeId: string;
    name: string;
    designation?: string;
    department?: string;
    role?: string;
  }) => {
    setConfiguringEmployee(member);
    setIsEditingExistingMember(true);
    setSearchedCandidate(null);
    setEmpSearchError(null);
    setModuleSearchInput('');
    setModuleSuggestions([]);
    setIsLoadingEmployeeModules(true);

    try {
      const existing = await taskApiService.getEmployeeModules(member.employeeId);
      setSelectedAssignedModules(existing);
      setMemberAssignedModulesMap(prev => ({ ...prev, [member.employeeId]: existing }));
    } catch {
      setSelectedAssignedModules(memberAssignedModulesMap[member.employeeId] || []);
    } finally {
      setIsLoadingEmployeeModules(false);
    }
  };

  // Add module from database suggestions to selected chips (avoids duplicates)
  const handleAddModuleToSelection = (moduleItem: {
    id: string;
    code: string;
    name: string;
    category?: string;
  }) => {
    if (!moduleItem) return;
    if (selectedAssignedModules.some(m => m.id === moduleItem.id)) {
      setModuleSearchInput('');
      setModuleSuggestions([]);
      return;
    }
    setSelectedAssignedModules(prev => [...prev, moduleItem]);
    setModuleSearchInput('');
    setModuleSuggestions([]);
  };

  // Allocate whatever module name the user entered (e.g. "ui page")
  const handleAllocateCustomModuleName = (rawName: string) => {
    const clean = rawName.trim();
    if (!clean) return;

    // Check if it matches an existing suggestion from the database
    const existing = moduleSuggestions.find(
      m => m.name.toLowerCase() === clean.toLowerCase() || m.code.toLowerCase() === clean.toLowerCase()
    );
    if (existing) {
      handleAddModuleToSelection(existing);
      return;
    }

    // Check if already in selected chips
    if (selectedAssignedModules.some(m => m.name.toLowerCase() === clean.toLowerCase())) {
      setModuleSearchInput('');
      setModuleSuggestions([]);
      return;
    }

    // Format module name properly (e.g. "ui page" -> "UI Page")
    const code = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'mod';
    const tempId = `MOD-${code.toUpperCase()}`;
    const formattedName = clean.length <= 3 ? clean.toUpperCase() : clean.replace(/\b\w/g, l => l.toUpperCase());

    const newModuleItem = {
      id: tempId,
      code: code,
      name: formattedName,
      category: 'Allocated'
    };

    setSelectedAssignedModules(prev => [...prev, newModuleItem]);
    setModuleSearchInput('');
    setModuleSuggestions([]);
  };

  // Remove module chip
  const handleRemoveModuleFromSelection = (moduleId: string) => {
    setSelectedAssignedModules(prev => prev.filter(m => m.id !== moduleId));
  };

  // Save employee assignment: Team ID, Employee ID, Employee Role, Module IDs in database
  const handleSaveEmployeeAssignment = async () => {
    if (!configuringEmployee) return;
    const empId = configuringEmployee.empCode || configuringEmployee.employeeId || configuringEmployee.id;
    const role = configuringEmployee.role || 'Member';
    const moduleIds = selectedAssignedModules.map(m => m.id);

    setIsSavingAssignedModules(true);
    try {
      await taskApiService.assignEmployeeModules(empId, moduleIds, editingGroupId, role);

      setMemberAssignedModulesMap(prev => ({
        ...prev,
        [empId]: [...selectedAssignedModules]
      }));

      // If not already in editingMembers, add them now
      setEditingMembers(prev => {
        const idx = prev.findIndex(m => m.employeeId.toLowerCase() === empId.toLowerCase());
        if (idx >= 0) {
          return prev.map((m, i) => (i === idx ? { ...m, role } : m));
        } else {
          return [
            ...prev,
            {
              employeeId: empId,
              name: configuringEmployee.name,
              designation: configuringEmployee.designation || 'Specialist',
              department: configuringEmployee.department || 'Engineering',
              role: role
            }
          ];
        }
      });

      setStatusMessage({
        type: 'success',
        text: `Assigned ${selectedAssignedModules.length} module(s) to ${configuringEmployee.name} (${empId})!`
      });
      setTimeout(() => setStatusMessage(null), 3000);

      // Close configuration area and return to search for next employee
      setConfiguringEmployee(null);
      setIsEditingExistingMember(false);
      setSearchedCandidate(null);
      setEmpSearchQuery('');
      setEmpSearchError(null);
      setSelectedAssignedModules([]);
    } catch (err: any) {
      console.error('Failed to save employee assignment:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save employee assignment.'
      });
    } finally {
      setIsSavingAssignedModules(false);
    }
  };

  // Remove saved employee from team
  const handleRemoveSavedEmployee = (empId: string) => {
    if (empId.toLowerCase() === editingTeamHeadId.toLowerCase()) {
      setStatusMessage({ type: 'error', text: 'Cannot remove Team Head. Please select another Team Head first.' });
      return;
    }
    setEditingMembers(prev => prev.filter(m => m.employeeId.toLowerCase() !== empId.toLowerCase()));
    if (
      configuringEmployee &&
      (configuringEmployee.employeeId?.toLowerCase() === empId.toLowerCase() ||
        configuringEmployee.empCode?.toLowerCase() === empId.toLowerCase())
    ) {
      setConfiguringEmployee(null);
      setIsEditingExistingMember(false);
      setSelectedAssignedModules([]);
    }
  };

  // Quick inline set lead
  const handleQuickSetLead = async (memberId: string) => {
    if (!selectedGroup) return;
    try {
      const emp =
        availableEmployeesList.find(e => e.id === memberId || e.empCode === memberId) ||
        selectedGroup.members?.find((m: any) => (m.employeeId || m.employee_id) === memberId);
      const leadName = emp?.name || memberId;

      const updated = await taskApiService.updateGroup(selectedGroup.id, {
        teamHeadId: memberId,
        teamHeadName: leadName
      });
      setProjectGroups(prev =>
        prev.map(g => (g.id === selectedGroup.id ? updated : g))
      );
      setStatusMessage({
        type: 'success',
        text: `Designated Team Head updated to ${updated.team_head_name}!`
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update Team Head.'
      });
    }
  };

  // Quick inline remove member
  const handleQuickRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    const currentMembers = selectedGroup.members || [];
    if (currentMembers.length <= 1) {
      setStatusMessage({ type: 'error', text: 'Team must maintain at least 1 member.' });
      return;
    }
    try {
      const remaining = currentMembers.filter(
        (m: any) => (m.employeeId || m.employee_id) !== memberId
      );
      let newLeadId = selectedGroup.team_head_id;
      let newLeadName = selectedGroup.team_head_name;
      if (selectedGroup.team_head_id === memberId) {
        newLeadId = remaining[0].employeeId || (remaining[0] as any).employee_id;
        newLeadName = remaining[0].name || (remaining[0] as any).employeeName;
      }

      const updated = await taskApiService.updateGroup(selectedGroup.id, {
        teamHeadId: newLeadId,
        teamHeadName: newLeadName,
        members: remaining.map((m: any) => ({
          employeeId: m.employeeId || m.employee_id,
          role: (m.employeeId || m.employee_id) === newLeadId ? 'Team Head' : (m.role || 'Member'),
          name: m.name || m.employeeName
        }))
      });

      setProjectGroups(prev =>
        prev.map(g => (g.id === selectedGroup.id ? updated : g))
      );
      setStatusMessage({
        type: 'success',
        text: `Removed member. Team count is now ${updated.members?.length || 0}.`
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to remove member.'
      });
    }
  };

  // Save changes from modal
  const handleSaveGroupChanges = async () => {
    if (!editingGroupId) return;
    if (editingMembers.length === 0) {
      setStatusMessage({ type: 'error', text: 'Team must have at least one member.' });
      return;
    }
    if (!editingTeamHeadId) {
      setStatusMessage({ type: 'error', text: 'Please select a Designated Team Head.' });
      return;
    }

    setIsSavingGroup(true);
    try {
      const headEmp =
        availableEmployeesList.find(e => e.id === editingTeamHeadId || e.empCode === editingTeamHeadId) ||
        editingMembers.find(m => m.employeeId === editingTeamHeadId);
      const headName = headEmp?.name || 'Team Head';

      const payload = {
        name: editingGroupName.trim() || selectedGroup?.name,
        description: editingGroupDesc.trim(),
        teamHeadId: editingTeamHeadId,
        teamHeadName: headName,
        repositoryUrl: editingGroupRepoUrl.trim(),
        members: editingMembers.map(m => ({
          employeeId: m.employeeId,
          role: m.employeeId === editingTeamHeadId ? 'Team Head' : (m.role || 'Member'),
          name: m.name
        }))
      };

      const updatedGroup = await taskApiService.updateGroup(editingGroupId, payload);

      if (editingGroupRepoUrl.trim()) {
        setRepositoryUrl(editingGroupRepoUrl.trim());
      }

      setProjectGroups(prev =>
        prev.map(g => (g.id === editingGroupId ? updatedGroup : g))
      );
      setIsEditGroupModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: `Team saved! Lead: ${updatedGroup.team_head_name}, Count: ${updatedGroup.members?.length || 0} members.`
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update group:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update project group.'
      });
    } finally {
      setIsSavingGroup(false);
    }
  };

  // Filtered employees for search
  const filteredEmployees = useMemo(() => {
    if (!searchEmployeeQuery.trim()) return availableEmployeesList;
    const q = searchEmployeeQuery.toLowerCase();
    return availableEmployeesList.filter(
      emp =>
        emp.name.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.empCode.toLowerCase().includes(q)
    );
  }, [availableEmployeesList, searchEmployeeQuery]);

  const selectedEmployees = useMemo(() => {
    return availableEmployeesList.filter(e => selectedEmployeeIds.includes(e.id) || selectedEmployeeIds.includes(e.empCode));
  }, [availableEmployeesList, selectedEmployeeIds]);

  const handleToggleEmployee = (id: string) => {
    setSelectedEmployeeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearAllEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { id: `st-${Date.now()}`, label: newSubtaskText.trim(), completed: false }
    ]);
    setNewSubtaskText('');
    setIsAddingSubtask(false);
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(prev =>
      prev.map(st => (st.id === id ? { ...st, completed: !st.completed } : st))
    );
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(st => st.id !== id));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const items: AttachedFileItem[] = [];
      for (const file of newFiles) {
        const dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });
        items.push({ name: file.name, file, dataUrl });
      }
      setAttachedFiles(prev => [...prev, ...items]);
    }
  };

  // AI Auto Plan
  const handleAiAutoPlan = async () => {
    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Enter a task title first so AI can generate the plan.' });
      return;
    }
    setIsAiGenerating(true);
    try {
      const plan = await taskApiService.generateAITaskPlan({
        title,
        department: currentProject?.name || 'Engineering',
        projectName: currentProject?.name,
        moduleName
      });
      if (plan.description && !description) setDescription(plan.description);
      if (plan.moduleName) setModuleName(plan.moduleName);
      if (plan.deliverableType) setDeliverableType(plan.deliverableType);
      if (plan.dueDate && !dueDate) setDueDate(plan.dueDate);
      if (plan.priority) setPriority(plan.priority);
      if (plan.estimatedHours) setEstimatedHours(String(plan.estimatedHours));
      if (plan.checklist && Array.isArray(plan.checklist) && subtasks.length === 0) {
        setSubtasks(plan.checklist);
      }
      setStatusMessage({ type: 'success', text: 'AI generated task work order & plan!' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'AI planning encountered an issue.' });
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Submit Handler
  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setStatusMessage({ type: 'error', text: 'Task Title is required.' });
      return;
    }
    if (!dueDate) {
      setStatusMessage({ type: 'error', text: 'Task Due Date is required.' });
      return;
    }
    if (assignmentType === 'GROUP' && !selectedGroupId) {
      setStatusMessage({ type: 'error', text: 'Please select a Project Group.' });
      return;
    }
    if (assignmentType === 'INDIVIDUAL' && selectedEmployeeIds.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one employee for Individual assignment.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        projectId: currentProject.id || currentProject.code,
        projectName: currentProject.name,
        assignmentType,
        groupId: assignmentType === 'GROUP' ? selectedGroupId : null,
        assignedTo: assignmentType === 'INDIVIDUAL' ? selectedEmployeeIds : null,
        taskWeightage: Number(taskWeightage) || 25,
        reviewTargetDate: reviewTargetDate,
        repositoryUrl: repositoryUrl.trim() || currentProject.repository_url || null,
        moduleName: moduleName.trim() || 'Core Module',
        deliverableType: deliverableType.trim() || 'Full-Stack Implementation',
        referenceLink: referenceLink.trim() || null,
        videoUrl: videoUrl.trim() || null,
        priority,
        dueDate,
        estimatedHours: Number(estimatedHours) || 16.0,
        checklist: subtasks,
        pdfAttachmentName: attachedFiles[0]?.name || null,
        pdfAttachmentUrl: attachedFiles[0]?.dataUrl || null
      };

      await taskApiService.createTask(payload);

      setStatusMessage({
        type: 'success',
        text: assignmentType === 'GROUP'
          ? `Group task created for "${selectedGroup?.name}"! All members can now view and collaborate.`
          : `Task successfully assigned to ${selectedEmployeeIds.length} employee${selectedEmployeeIds.length === 1 ? '' : 's'}!`
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        else if (onBack) onBack();
      }, 1400);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to assign task. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border text-xs animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-700'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span onClick={onBack} className="hover:text-slate-700 cursor-pointer transition">
          Tasks
        </span>
        <span>›</span>
        <span className="text-slate-700 font-semibold">Assign Task</span>
      </div>

      {/* 2. Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Assign Task to Group / Employee</span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Master Project Source
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Dynamic Project → Group/Employee → Task → Review Workflow with 5-Day Review Rule
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Tasks
        </button>
      </div>

      {/* 3. Search Bar Dropdown for Master Projects (Replaces dark banner) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs relative" ref={projectDropdownRef}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <label className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <FolderGit2 size={16} className="text-blue-600" />
              <span>Select Master Project (Searchable Dropdown)</span>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Dynamic Project Module Source
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mt-1">
              Select any project from the dropdown below to automatically gather &amp; populate requirements, description, priority, deadline, module &amp; attached files.
            </p>
          </div>

          {currentProject && (
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold">{currentProject.name}</span>
                <span className="font-mono text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                  {currentProject.code || currentProject.id}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <div
            onClick={() => setIsProjectDropdownOpen(prev => !prev)}
            className={`flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100/70 border ${
              isProjectDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white' : 'border-slate-200'
            } rounded-xl cursor-pointer transition shadow-2xs`}
          >
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={projectSearchQuery}
              onChange={e => {
                setProjectSearchQuery(e.target.value);
                if (!isProjectDropdownOpen) setIsProjectDropdownOpen(true);
              }}
              onFocus={() => setIsProjectDropdownOpen(true)}
              onClick={e => e.stopPropagation()}
              placeholder={currentProject ? `Active: ${currentProject.name} (${currentProject.code || currentProject.id}) — Type to search project list...` : "Search project by name, code, client, or manager..."}
              className="w-full bg-transparent border-none outline-none text-xs text-slate-800 placeholder-slate-400 font-medium"
            />
            {projectSearchQuery && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setProjectSearchQuery('');
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 p-0.5 transition shrink-0"
            >
              <ChevronDown size={16} className={`transition-transform duration-200 ${isProjectDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Floating Dropdown Menu with Master Projects List */}
          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                <span>Master Projects List ({filteredProjects.length})</span>
                <span className="text-[10px] text-blue-600 font-medium">⚡ Click any project to auto-fill form</span>
              </div>

              {filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No projects match &quot;{projectSearchQuery}&quot;
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredProjects.map(proj => {
                    const isSelected = (currentProject?.id === proj.id || currentProject?.code === proj.code);
                    return (
                      <div
                        key={proj.id}
                        onClick={() => handleSelectProject(proj)}
                        className={`p-3.5 flex items-center justify-between gap-3 cursor-pointer transition ${
                          isSelected ? 'bg-blue-50/80 hover:bg-blue-100/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold shrink-0 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {proj.code || proj.id}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                              <span>{proj.name || proj.title}</span>
                              {isSelected && <Check size={13} className="text-blue-600 shrink-0" />}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              Client: <span className="font-medium text-slate-700">{proj.client || 'Enterprise'}</span> • Manager: <span className="font-medium text-slate-700">{proj.project_manager || 'Sarah Jenkins'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-right">
                          <div className="hidden sm:block">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Target Deadline</span>
                            <span className="text-[11px] font-semibold text-slate-700">
                              {proj.end_date ? new Date(proj.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}
                            </span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-2xs ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-600 hover:text-white'
                          }`}>
                            {isSelected ? 'Active' : 'Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compact Metadata & Auto-filled Status Summary */}
        {currentProject && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Manager: <strong className="text-slate-900">{currentProject.project_manager || 'Sarah Jenkins'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                Deadline: <strong className="text-slate-900">{currentProject.end_date ? new Date(currentProject.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Auto-filled: Description, Priority, Deadline, Module &amp; Spec
              </span>
            </div>

            {currentProject.repository_url && (
              <a
                href={currentProject.repository_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-blue-700 rounded-lg border border-slate-200 text-[11px] font-semibold transition"
              >
                <FolderGit2 size={12} />
                <span>{currentProject.repository_url.replace('https://', '')}</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
        )}

        {/* GitHub Repository Link Paste & Sync Bar (Accessible to all group employees) */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FolderGit2 size={14} className="text-blue-600" />
              <span>GitHub Repository Link (Shared Across Entire Project &amp; Groups)</span>
            </label>
            {repositoryUrl && (
              <a
                href={repositoryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono"
              >
                <span>Preview Repository</span>
                <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="url"
                value={repositoryUrl}
                onChange={e => setRepositoryUrl(e.target.value)}
                placeholder="Paste GitHub Repository URL (e.g. https://github.com/organization/project-name)..."
                className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
              />
              {repositoryUrl && (
                <button
                  type="button"
                  onClick={() => setRepositoryUrl('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Clear link"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {selectedGroupId && (
              <button
                type="button"
                onClick={async () => {
                  if (!repositoryUrl.trim()) return;
                  try {
                    const updated = await taskApiService.updateGroup(selectedGroupId, {
                      repositoryUrl: repositoryUrl.trim()
                    });
                    setProjectGroups(prev =>
                      prev.map(g => (g.id === selectedGroupId ? updated : g))
                    );
                    setStatusMessage({
                      type: 'success',
                      text: `Linked repository to "${selectedGroup?.name || 'team'}"! All group employees can now view and access it.`
                    });
                    setTimeout(() => setStatusMessage(null), 3500);
                  } catch (err: any) {
                    setStatusMessage({ type: 'error', text: err.message || 'Failed to sync repository to group.' });
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
              >
                <FolderGit2 size={13} />
                <span>Sync to Group</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 pt-0.5">
            <span>✨ Paste any GitHub repository URL here — all assigned employees in this group will see the link on their dashboard &amp; task cards.</span>
            {repositoryUrl && (
              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                ✓ Ready to assign to team
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Main Form Grid */}
      <form onSubmit={handleSubmitTask} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Task Details & Weightage (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-slate-900">Task Details</h2>
                  <span className="text-[11px] text-slate-500">Configure task scope, priority, and target review date</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAiAutoPlan}
                disabled={isAiGenerating}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles size={13} className={`text-purple-600 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'Generating...' : 'AI Auto-Plan'}</span>
              </button>
            </div>

            {/* Field: Task Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. CMS API Architecture & Endpoints"
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Field: Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description & Deliverable Requirements <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe functional goals, deliverable links, and acceptance criteria..."
                className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y"
                required
              />
            </div>

            {/* Row: Priority, Due Date & 5-Day Review Rule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="HIGH">🔴 High</option>
                  <option value="URGENT">🟣 Urgent</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🟢 Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Due Date (Final Deadline) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            {/* 5-Day Review Rule Indicator Banner */}
            {reviewTargetDate ? (
              <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-900 flex items-start gap-3">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold flex items-center gap-2">
                    <span>⏱️ 5-Day Review Rule Target:</span>
                    <span className="font-mono bg-amber-200/80 px-2 py-0.5 rounded text-amber-950 font-bold">
                      {reviewTargetDate}
                    </span>
                  </p>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Deliverables must be submitted for review at least 5 days prior to final deadline ({dueDate}) for code inspection and sign-off.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
                <Info size={14} className="text-slate-400" />
                <span>Select a Due Date to automatically calculate the 5-Day Review Target deadline.</span>
              </div>
            )}

            {/* Repository URL & Deliverable Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FolderGit2 size={13} className="text-blue-600" />
                  <span>Repository URL</span>
                </label>
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={e => setRepositoryUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Estimated Hours
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={estimatedHours}
                  onChange={e => setEstimatedHours(e.target.value)}
                  placeholder="16"
                  className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>


            {/* Attachments */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Specification / Requirement Attachments
              </label>
              <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-hidden flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-2xs"
                  >
                    <Paperclip size={13} />
                    <span>Choose Files</span>
                  </button>

                  {attachedFiles.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {attachedFiles.map((file, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs"
                        >
                          <span
                            onClick={() => setPreviewModalDoc({ fileName: file.name, fileUrl: file.dataUrl })}
                            className="cursor-pointer hover:text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Eye size={12} className="text-blue-600" />
                            <span className="max-w-[130px] truncate">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-500 p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">No file chosen (PDF, Docs, PNG)</span>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.webm"
                  />
                </div>
              </div>
            </div>

            {/* Checklist / Subtasks */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Subtask Milestones & Checklist</label>
                <button
                  type="button"
                  onClick={() => setIsAddingSubtask(true)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg flex items-center gap-1 shadow-2xs transition cursor-pointer"
                >
                  <Plus size={13} /> Add Subtask
                </button>
              </div>

              {isAddingSubtask && (
                <div className="flex items-center gap-2 p-2 bg-blue-50/50 border border-blue-100 rounded-xl">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={e => setNewSubtaskText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    placeholder="Enter milestone..."
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingSubtask(false); setNewSubtaskText(''); }}
                    className="px-2 py-1.5 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="border border-slate-200/80 rounded-xl p-3 bg-slate-50/40 min-h-[60px]">
                {subtasks.length === 0 ? (
                  <div className="py-2 text-center text-xs text-slate-400">No subtasks added yet</div>
                ) : (
                  <div className="space-y-1.5">
                    {subtasks.map(st => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 shadow-2xs group"
                      >
                        <div
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => handleToggleSubtask(st.id)}
                        >
                          <input
                            type="checkbox"
                            checked={st.completed}
                            onChange={() => handleToggleSubtask(st.id)}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className={`text-xs ${st.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {st.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(st.id)}
                          className="text-slate-300 hover:text-rose-500 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Assignment Type & Roster Display (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Assignment Type Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-5">
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-900">Assignment Scope</h2>
              <span className="text-[11px] text-slate-500">Choose between assigning to an entire team group or a specific individual</span>
            </div>

            {/* Segmented Radio Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAssignmentType('GROUP')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  assignmentType === 'GROUP'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={15} />
                <span>Project Group</span>
              </button>

              <button
                type="button"
                onClick={() => setAssignmentType('INDIVIDUAL')}
                className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  assignmentType === 'INDIVIDUAL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus size={15} />
                <span>Individual</span>
              </button>
            </div>

            {/* --- GROUP ASSIGNMENT MODE --- */}
            {assignmentType === 'GROUP' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Select Project Group</span>
                    <span className="text-[10px] text-blue-600 font-semibold">{projectGroups.length} available</span>
                  </label>

                  {projectGroups.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      No project groups found for {currentProject.name}. Please select another project or switch to Individual assignment.
                    </div>
                  ) : (
                    <select
                      value={selectedGroupId}
                      onChange={e => setSelectedGroupId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {projectGroups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Group Details & Roster Card */}
                {selectedGroup && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-slate-900">{selectedGroup.name}</h3>
                        <p className="text-[11px] text-slate-500">{selectedGroup.description || 'Full development roster'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          {selectedGroup.members?.length || 0} Members
                        </span>
                        <button
                          type="button"
                          onClick={handleOpenEditGroupModal}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-lg shadow-2xs transition-all cursor-pointer"
                          title="Edit Team Lead and Team Count"
                        >
                          <Edit3 size={12} className="text-blue-600" />
                          <span>Edit Team</span>
                        </button>
                      </div>
                    </div>

                    {/* Team Head Highlight */}
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown size={15} className="text-amber-600" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Designated Team Head</span>
                          <p className="text-xs font-bold text-slate-900">
                            {selectedGroup.team_head_name}
                            <span className="ml-1.5 font-mono text-[10px] text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                              {selectedGroup.team_head_id}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleOpenEditGroupModal}
                          className="text-[10px] font-semibold text-amber-800 hover:text-amber-900 bg-white hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                          title="Change Designated Team Lead"
                        >
                          <Crown size={11} className="text-amber-600" />
                          <span>Change Lead</span>
                        </button>
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                          Lead Reviewer
                        </span>
                      </div>
                    </div>

                    {/* Roster of Members */}
                    <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                      <div className="flex items-center justify-between pb-0.5">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Group Members Roster:</span>
                        <button
                          type="button"
                          onClick={handleOpenEditGroupModal}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={11} /> Add / Manage Count
                        </button>
                      </div>

                      {selectedGroup.members?.map(m => {
                        const mEmpId = m.employeeId || (m as any).employee_id;
                        const isHead = mEmpId === selectedGroup.team_head_id || m.isTeamHead;
                        return (
                          <div
                            key={mEmpId}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs transition-colors group ${
                              isHead
                                ? 'bg-amber-50/50 border-amber-200/90'
                                : 'bg-white border-slate-200/80 hover:border-blue-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full font-bold text-[10px] flex items-center justify-center ${
                                  isHead ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'
                                }`}
                              >
                                {m.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>{m.name}</span>
                                  {isHead && (
                                    <span
                                      title="Team Head"
                                      className="flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1 py-0.2 rounded"
                                    >
                                      <Crown size={10} className="text-amber-600" />
                                      Lead
                                    </span>
                                  )}
                                </p>
                                <span className="font-mono text-[10px] text-slate-400">{mEmpId}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-[10px] font-medium text-slate-600 block">
                                  {m.role || (isHead ? 'Team Head' : 'Member')}
                                </span>
                                <span className="text-[9px] text-slate-400 block">{m.department || 'Engineering'}</span>
                              </div>

                              {/* Action buttons: Change lead or remove member */}
                              <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                {!isHead && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickSetLead(mEmpId)}
                                    title={`Designate ${m.name} as Team Lead`}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                  >
                                    <Crown size={13} />
                                  </button>
                                )}
                                {(selectedGroup.members?.length || 0) > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickRemoveMember(mEmpId)}
                                    title={`Remove ${m.name} from group`}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                      <ShieldCheck size={14} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        All <strong>{selectedGroup.members?.length || 0} members</strong> will automatically receive this task in their personal dashboard and will contribute to the task progress.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- INDIVIDUAL ASSIGNMENT MODE --- */}
            {assignmentType === 'INDIVIDUAL' && (
              <div className="space-y-3 animate-fade-in">
                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchEmployeeQuery}
                    onChange={e => setSearchEmployeeQuery(e.target.value)}
                    placeholder="Search employees by name, ID, department..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {filteredEmployees.map(emp => {
                    const isSelected = selectedEmployeeIds.includes(emp.id) || selectedEmployeeIds.includes(emp.empCode);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => handleToggleEmployee(emp.id)}
                        className={`p-2 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/50 border-blue-300 shadow-2xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {emp.name} <span className="text-[10px] font-mono text-blue-600 font-bold">({emp.empCode || emp.id})</span>
                            </p>
                            <p className="text-[10px] text-slate-500">{emp.designation}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {emp.department}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="font-semibold text-blue-600">
                    {selectedEmployeeIds.length} employee{selectedEmployeeIds.length === 1 ? '' : 's'} selected
                  </span>
                  {selectedEmployeeIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllEmployees}
                      className="font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card: Live Task Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 md:p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Eye size={16} className="text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Live Task Preview</h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Project</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">{currentProject.name}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Scope Type</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  assignmentType === 'GROUP'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {assignmentType === 'GROUP' ? `👥 Group: ${selectedGroup?.name || 'Selected'}` : `👤 Individual (${selectedEmployeeIds.length})`}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Task Weightage</span>
                <span className="font-bold text-blue-600">{taskWeightage}% of Project</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Review Target (5-Day Rule)</span>
                <span className="font-bold text-amber-700">{reviewTargetDate || 'Set due date'}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Final Due Date</span>
                <span className="font-bold text-slate-800">{dueDate || 'Not set'}</span>
              </div>

              {repositoryUrl && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Repository</span>
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:underline truncate max-w-[180px] text-[10px]"
                  >
                    {repositoryUrl.replace('https://', '')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTIONS BAR */}
        <div className="lg:col-span-12 flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <UserPlus size={15} />
            <span>
              {isSubmitting
                ? 'Assigning Task...'
                : assignmentType === 'GROUP'
                ? `Assign Task to ${selectedGroup?.name || 'Group'}`
                : 'Assign Task to Employee'}
            </span>
          </button>
        </div>
      </form>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewModalDoc)}
        onClose={() => setPreviewModalDoc(null)}
        fileName={previewModalDoc?.fileName}
        fileUrl={previewModalDoc?.fileUrl}
        taskTitle={title || 'Task Document'}
        projectName={currentProject.name}
        scopeOfWork={description}
      />

      {/* ================= REDESIGNED CUSTOMIZE PROJECT TEAM MODAL ================= */}
      {isEditGroupModalOpen && (() => {
        const teamHeadEmp =
          editingMembers.find(m => m.employeeId.toLowerCase() === editingTeamHeadId.toLowerCase()) ||
          availableEmployeesList.find(e => e.empCode.toLowerCase() === editingTeamHeadId.toLowerCase() || e.id.toLowerCase() === editingTeamHeadId.toLowerCase());

        const requiredEmployeesCount = Math.max(0, targetTeamCount - 1);
        const savedEmployees = editingMembers.filter(m => m.employeeId.toLowerCase() !== editingTeamHeadId.toLowerCase());
        const configuredEmployeesCount = savedEmployees.length;
        const isTeamComplete = editingMembers.length >= targetTeamCount;
        const canSaveAndApply = editingMembers.length === targetTeamCount && !configuringEmployee;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">Customize Project Team</h2>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {targetTeamCount} Members
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Configure designated Team Head, team count, employee ID &amp; module assignments
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditGroupModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">

                {/* ================= ① TEAM SETUP ================= */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs">
                        1
                      </span>
                      <span>TEAM SETUP</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Team Head is Member #1 of {targetTeamCount}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                    {/* Team Head Dropdown */}
                    <div className="sm:col-span-7 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        TEAM HEAD
                      </label>
                      <select
                        value={editingTeamHeadId}
                        onChange={e => handleSelectTeamHead(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                      >
                        <option value="">[ Search/Select Team Head ]</option>
                        {availableEmployeesList.map(emp => (
                          <option key={emp.empCode || emp.id} value={emp.empCode || emp.id}>
                            👑 {emp.name} • {emp.empCode || emp.id} • {emp.designation || 'Team Head'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Team Count Stepper */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        TEAM COUNT
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={targetTeamCount <= Math.max(1, editingMembers.length)}
                          onClick={() => setTargetTeamCount(prev => Math.max(Math.max(1, editingMembers.length), prev - 1))}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-800 text-base transition cursor-pointer shadow-2xs"
                          title="Decrease Team Count"
                        >
                          −
                        </button>
                        <div className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-xl font-extrabold text-xs text-slate-900 text-center shadow-2xs">
                          {targetTeamCount} Members
                        </div>
                        <button
                          type="button"
                          onClick={() => setTargetTeamCount(prev => prev + 1)}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-base transition cursor-pointer shadow-2xs"
                          title="Increase Team Count"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Selected Team Head Card */}
                  {teamHeadEmp && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200 flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                          👑
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{teamHeadEmp.name}</span>
                            <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded">
                              {(teamHeadEmp as any).empCode || (teamHeadEmp as any).employeeId || (teamHeadEmp as any).id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {teamHeadEmp.designation || 'Lead Architect'} • {teamHeadEmp.department || 'Engineering'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-2xs tracking-wider">
                        TEAM HEAD
                      </span>
                    </div>
                  )}
                </div>

                {/* ================= ② ADD / CONFIGURE MEMBERS ================= */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs">
                        2
                      </span>
                      <span>ADD / CONFIGURE TEAM MEMBERS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        {requiredEmployeesCount} Employees Required
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        configuredEmployeesCount === requiredEmployeesCount
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {configuredEmployeesCount} / {requiredEmployeesCount} Configured
                      </span>
                    </div>
                  </div>

                  {/* Team Complete State (When all required employees are configured and no active editor) */}
                  {isTeamComplete && !configuringEmployee ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
                      <div className="flex items-center gap-2.5 text-emerald-950">
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Check size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900">
                            Team Complete ({editingMembers.length} / {targetTeamCount} Members Configured)
                          </p>
                          <p className="text-[11px] text-emerald-700">
                            All {requiredEmployeesCount} employees configured. Use [Edit] or [Remove] below, or click [+] to increase team count.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTargetTeamCount(prev => prev + 1)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0"
                      >
                        <Plus size={13} /> Add More
                      </button>
                    </div>
                  ) : configuringEmployee ? (
                    /* Active Module Assignment Area for ONLY this single employee */
                    <div className="p-4 rounded-xl bg-white border border-blue-300 shadow-2xs space-y-3.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                            {configuringEmployee.name.charAt(0)}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                              <span>{configuringEmployee.name}</span>
                              <span className="font-mono text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-semibold">
                                {configuringEmployee.empCode || configuringEmployee.employeeId || configuringEmployee.id}
                              </span>
                              {isEditingExistingMember && (
                                <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                  Updating
                                </span>
                              )}
                            </h5>
                            <p className="text-[11px] text-slate-500">
                              {configuringEmployee.designation || 'Specialist'} • {configuringEmployee.department || 'Engineering'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfiguringEmployee(null);
                            setIsEditingExistingMember(false);
                            setSearchedCandidate(null);
                            setEmpSearchQuery('');
                            setSelectedAssignedModules([]);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg cursor-pointer transition"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Searchable Module Input (Dynamic DB - zero hardcoding) */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          ASSIGN MODULES
                        </label>
                        <div className="relative">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1 flex items-center">
                              <Search size={14} className="absolute left-3.5 text-slate-400" />
                              <input
                                type="text"
                                value={moduleSearchInput}
                                onChange={e => setModuleSearchInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAllocateCustomModuleName(moduleSearchInput);
                                  }
                                }}
                                placeholder="Enter module name (e.g. Attendance, Leave, UI Page)..."
                                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
                              />
                              {moduleSearchInput && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModuleSearchInput('');
                                    setModuleSuggestions([]);
                                  }}
                                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                >
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={!moduleSearchInput.trim()}
                              onClick={() => handleAllocateCustomModuleName(moduleSearchInput)}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
                            >
                              <Plus size={13} /> Allocate
                            </button>
                          </div>

                          {/* Dynamic DB suggestions dropdown */}
                          {moduleSearchInput.trim().length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto animate-in fade-in duration-100">
                              <div
                                onClick={() => handleAllocateCustomModuleName(moduleSearchInput)}
                                className="px-3.5 py-2 bg-blue-50/90 hover:bg-blue-100 border-b border-blue-100 flex items-center justify-between text-xs font-bold text-blue-700 cursor-pointer transition"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">+</span>
                                  <span>Allocate <strong className="text-blue-950">&quot;{moduleSearchInput.trim()}&quot;</strong></span>
                                </div>
                                <span className="text-[10px] bg-white text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs">Press Enter</span>
                              </div>
                              {isSearchingModules && (
                                <div className="p-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                                  <Loader2 size={12} className="animate-spin text-blue-600" /> Searching database...
                                </div>
                              )}
                              {moduleSuggestions.map(mod => {
                                const isSelected = selectedAssignedModules.some(m => m.id === mod.id);
                                return (
                                  <div
                                    key={mod.id}
                                    onClick={() => !isSelected && handleAddModuleToSelection(mod)}
                                    className={`px-3.5 py-2 flex items-center justify-between text-xs transition cursor-pointer border-b border-slate-50 last:border-0 ${
                                      isSelected ? 'bg-slate-50 opacity-50 cursor-not-allowed' : 'hover:bg-blue-50/80'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800">{mod.name}</span>
                                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">{mod.id}</span>
                                      {mod.category && (
                                        <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium">{mod.category}</span>
                                      )}
                                    </div>
                                    {isSelected ? (
                                      <span className="text-[10px] text-slate-400 flex items-center gap-1"><Check size={11} /> Selected</span>
                                    ) : (
                                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5"><Plus size={11} /> Add Module</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Module Removable Chips */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                            Selected Modules ({selectedAssignedModules.length})
                          </span>
                          {selectedAssignedModules.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedAssignedModules([])}
                              className="text-[10px] font-semibold text-rose-600 hover:underline cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        {selectedAssignedModules.length === 0 ? (
                          <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                            {isLoadingEmployeeModules
                              ? 'Loading employee assigned modules from database...'
                              : 'No modules assigned yet. Type a module name above to search and select.'}
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50/70 border border-slate-200 rounded-xl min-h-[42px]">
                            {selectedAssignedModules.map(mod => (
                              <span
                                key={mod.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 text-blue-900 rounded-lg text-xs font-semibold shadow-2xs animate-in fade-in duration-100"
                              >
                                <span>{mod.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveModuleFromSelection(mod.id)}
                                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded p-0.5 transition cursor-pointer"
                                  title={`Remove ${mod.name}`}
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Save Employee Assignment Button */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400">
                          Saves proper Employee ID → Module ID relationships in DB
                        </span>
                        <button
                          type="button"
                          disabled={isSavingAssignedModules}
                          onClick={handleSaveEmployeeAssignment}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          {isSavingAssignedModules ? (
                            <>
                              <Loader2 size={13} className="animate-spin" /> Saving...
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              <span>{isEditingExistingMember ? '✓ Update Assignment' : '✓ Save Employee Assignment'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Search ONLY by Employee ID (NO all-employee dropdown!) */
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                          🔍 ENTER EMPLOYEE ID
                        </label>
                        <form onSubmit={handleSearchEmployeeId} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={empSearchQuery}
                              onChange={e => {
                                setEmpSearchQuery(e.target.value);
                                if (empSearchError) setEmpSearchError(null);
                              }}
                              placeholder="Enter Employee ID (e.g. EMP-006)"
                              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isSearchingEmp || !empSearchQuery.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                          >
                            {isSearchingEmp ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
                            <span>Search</span>
                          </button>
                        </form>

                        {empSearchError && (
                          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5 animate-in fade-in duration-150">
                            <AlertCircle size={14} className="shrink-0 text-rose-600" />
                            <span>{empSearchError}</span>
                          </div>
                        )}
                      </div>

                      {/* Display Fetched Candidate Card with Select Button */}
                      {searchedCandidate && (
                        <div className="p-3.5 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 shadow-2xs flex items-center justify-between animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                              {searchedCandidate.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{searchedCandidate.name}</span>
                                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                                  {searchedCandidate.empCode || searchedCandidate.id}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium">
                                {searchedCandidate.designation || 'Specialist'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {searchedCandidate.department || 'Engineering'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectCandidateToConfigure(searchedCandidate)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1 transition"
                          >
                            <span>Select</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ================= ③ SAVED TEAM MEMBERS ================= */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs">
                        3
                      </span>
                      <span>SAVED TEAM MEMBERS</span>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {editingMembers.length} / {targetTeamCount} Members
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {/* Item 1: Team Head */}
                    {teamHeadEmp && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/40 border border-amber-200 flex items-center justify-between text-xs shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="font-mono font-bold text-amber-700 text-xs w-4 text-center shrink-0">1</span>
                          <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            👑
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{teamHeadEmp.name}</span>
                              <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">
                                {(teamHeadEmp as any).empCode || (teamHeadEmp as any).employeeId || (teamHeadEmp as any).id}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {teamHeadEmp.designation || 'Lead Architect'} • {teamHeadEmp.department || 'Engineering'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500 text-white shadow-2xs tracking-wider shrink-0 ml-2">
                          TEAM HEAD
                        </span>
                      </div>
                    )}

                    {/* Items 2..N: Configured Employees */}
                    {savedEmployees.map((m, idx) => {
                      const assignedMods = memberAssignedModulesMap[m.employeeId] || [];
                      const isCurrentlyConfiguring = configuringEmployee && (configuringEmployee.employeeId?.toLowerCase() === m.employeeId.toLowerCase() || configuringEmployee.empCode?.toLowerCase() === m.employeeId.toLowerCase());

                      return (
                        <div
                          key={m.employeeId}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                            isCurrentlyConfiguring
                              ? 'bg-blue-50/50 border-blue-400 ring-1 ring-blue-400 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="font-mono font-bold text-slate-400 text-xs w-4 text-center shrink-0">
                              {idx + 2}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {m.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{m.name}</span>
                                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {m.employeeId}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {m.designation || 'Specialist'} • {m.department || 'Engineering'}
                              </span>
                              {/* Dynamic Modules preview */}
                              {assignedMods.length > 0 ? (
                                <div className="flex flex-wrap items-center gap-1 mt-1">
                                  <span className="text-[10px] font-semibold text-slate-500">Modules:</span>
                                  {assignedMods.map((mod, modIdx) => (
                                    <span
                                      key={mod.id || modIdx}
                                      className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded"
                                    >
                                      {mod.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-600 italic mt-0.5 block">
                                  No modules saved yet — click Edit to assign
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditExistingEmployee(m)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSavedEmployee(m.employeeId)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Remove employee from team"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {savedEmployees.length === 0 && (
                      <div className="p-4 bg-white border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400">
                        No team members added yet. Search by Employee ID above to configure and add {requiredEmployeesCount} employees.
                      </div>
                    )}
                  </div>
                </div>

                {/* Team Metadata (Unobtrusive Name, Description & GitHub Repository Link) */}
                <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Team / Group Name
                      </label>
                      <input
                        type="text"
                        value={editingGroupName}
                        onChange={e => setEditingGroupName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        placeholder="Team Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={editingGroupDesc}
                        onChange={e => setEditingGroupDesc(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 shadow-2xs"
                        placeholder="Short description"
                      />
                    </div>
                  </div>

                  {/* GitHub Repository Link Input */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] uppercase font-extrabold text-blue-900 flex items-center gap-1.5">
                        <FolderGit2 size={13} className="text-blue-600" />
                        <span>GitHub Repository Link (Shared with all group employees)</span>
                      </label>
                      {editingGroupRepoUrl && (
                        <a
                          href={editingGroupRepoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-mono font-bold"
                        >
                          <span>Open in GitHub</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="url"
                        value={editingGroupRepoUrl}
                        onChange={e => setEditingGroupRepoUrl(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-2xs transition"
                        placeholder="https://github.com/organization/repository-name"
                      />
                      {editingGroupRepoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingGroupRepoUrl('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Clear URL"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Employees in this group can access this repository link from their tasks page to clone, build, and submit deliverables.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center flex-wrap gap-1.5">
                  <span>Team Size: <strong className="text-slate-800">{targetTeamCount} Members</strong></span>
                  <span>• Lead: <strong className="text-amber-800">{teamHeadEmp?.name || 'None'}</strong></span>
                  <span>• Employees: <strong className={configuredEmployeesCount === requiredEmployeesCount ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                    {configuredEmployeesCount} / {requiredEmployeesCount} Configured
                  </strong></span>
                  {isTeamComplete && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full ml-1">
                      <Check size={10} /> Complete
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setIsEditGroupModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canSaveAndApply || isSavingGroup}
                    onClick={handleSaveGroupChanges}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
                    title={
                      !isTeamComplete
                        ? `Please configure all ${requiredEmployeesCount} employees (${configuredEmployeesCount}/${requiredEmployeesCount} configured)`
                        : configuringEmployee
                        ? 'Please save the active employee assignment first'
                        : 'Save & Apply Changes'
                    }
                  >
                    {isSavingGroup ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Save &amp; Apply Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
