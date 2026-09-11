import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FolderKanban,
  FolderGit2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Crown,
  Lock,
  ArrowRight,
  ArrowLeft,
  FileText,
  Eye,
  Download,
  Calendar,
  Sparkles,
  Search,
  Check,
  Percent,
  RefreshCw,
  FileCode,
  ShieldAlert,
  Info,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  FileCheck2,
  Tag,
  Plus,
  Minus,
  MoreVertical,
  Send,
  MessageSquare,
  CheckCheck,
  X
} from 'lucide-react';
import { TaskItem, ProjectGroup } from '../types';
import { useApp } from '../../../context/AppContext';
import { taskApiService } from '../services/taskService';
import { DocumentPreviewModal } from '../../../components/common/DocumentPreviewModal';

interface TaskProgressMouseControlProps {
  task: any;
  currentProgress: number;
  isUpdating: boolean;
  onUpdate: (task: any, newProgress: number) => void;
}

const TaskProgressMouseControl: React.FC<TaskProgressMouseControlProps> = ({
  task,
  currentProgress,
  isUpdating,
  onUpdate
}) => {
  const [localVal, setLocalVal] = useState<number>(currentProgress);

  useEffect(() => {
    setLocalVal(currentProgress);
  }, [currentProgress]);

  const handleStep = (delta: number) => {
    const next = Math.max(0, Math.min(100, localVal + delta));
    setLocalVal(next);
    onUpdate(task, next);
  };

  const handleSliderChange = (val: number) => {
    setLocalVal(val);
  };

  const handleCommit = (val: number) => {
    if (val !== currentProgress) {
      onUpdate(task, val);
    }
  };

  const isDone = localVal === 100;

  return (
    <div className="space-y-3 pt-3 border-t border-slate-100">
      {/* Header Row: Label, Status, and Mouse Stepper Controls */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="text-xs font-bold text-slate-700 block">Progress</span>
          <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-600' : 'text-blue-600'}`}>
            {isDone ? '✓ Completed' : localVal > 0 ? 'In Progress' : 'Not Started'}
          </span>
        </div>

        {/* Mouse Increment / Decrement Stepper */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            disabled={isUpdating || localVal <= 0}
            onClick={() => handleStep(-5)}
            title="Decrement by 5%"
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center font-bold text-xs shadow-2xs border border-slate-200 cursor-pointer transition active:scale-90"
          >
            <Minus size={13} />
          </button>

          <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-md min-w-[46px] text-center ${
            isDone ? 'text-emerald-700 bg-emerald-50' : 'text-blue-700 bg-blue-50'
          }`}>
            {localVal}%
          </span>

          <button
            type="button"
            disabled={isUpdating || localVal >= 100}
            onClick={() => handleStep(5)}
            title="Increment by 5%"
            className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 text-slate-700 disabled:opacity-40 disabled:hover:bg-white flex items-center justify-center font-bold text-xs shadow-2xs border border-slate-200 cursor-pointer transition active:scale-90"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* Mouse Draggable Range Slider */}
      <div className="space-y-1">
        <div className="relative flex items-center w-full">
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={localVal}
            disabled={isUpdating}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            onMouseUp={(e) => handleCommit(Number((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => handleCommit(Number((e.target as HTMLInputElement).value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            style={{
              background: `linear-gradient(to right, ${isDone ? '#10b981' : '#2563eb'} 0%, ${isDone ? '#059669' : '#4f46e5'} ${localVal}%, #e2e8f0 ${localVal}%, #e2e8f0 100%)`
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
          <span>0%</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {isUpdating && (
        <div className="text-[10px] text-blue-600 font-semibold flex items-center justify-center gap-1.5 animate-pulse pt-1">
          <RefreshCw size={11} className="animate-spin" />
          <span>Saving to database & recalculating...</span>
        </div>
      )}
    </div>
  );
};

interface MyTasksViewProps {
  tasks?: TaskItem[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onSelectTask?: (task: TaskItem) => void;
  employeeId?: string;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  tasks = [],
  isLoading = false,
  onRefresh,
  onSelectTask,
  employeeId
}) => {
  const { employees = [], userProfile } = useApp();

  // Active employee identity (defaults to prop employeeId, logged-in profile, or EMP-003)
  const [selectedEmpId, setSelectedEmpId] = useState<string>(() => {
    if (employeeId) return employeeId;
    const match = employees.find(
      e => e.name === userProfile?.name || e.empCode === (userProfile as any)?.empCode || e.id === userProfile?.id
    );
    return match?.empCode || match?.id || (userProfile as any)?.emp_code || (userProfile as any)?.empCode || (userProfile as any)?.id || 'EMP-003';
  });

  useEffect(() => {
    if (employeeId) {
      setSelectedEmpId(employeeId);
    } else if (userProfile) {
      const match = employees.find(
        e => e.name === userProfile?.name || e.empCode === (userProfile as any)?.empCode || e.id === userProfile?.id
      );
      const resolved = match?.empCode || match?.id || (userProfile as any)?.emp_code || (userProfile as any)?.empCode || (userProfile as any)?.id;
      if (resolved && resolved !== selectedEmpId) {
        setSelectedEmpId(resolved);
      }
    }
  }, [employeeId, userProfile, employees]);

  // Level 1 vs Level 2 view state
  const [assignedGroups, setAssignedGroups] = useState<any[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState<boolean>(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeGroupDetails, setActiveGroupDetails] = useState<any | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<'ALL' | 'MY_TASKS' | 'ALL_MODULES'>('ALL');

  // Updating progress tracking
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{
    fileName: string;
    fileUrl?: string | null;
    taskTitle?: string;
    projectName?: string;
  } | null>(null);

  // Direct Chat Box state for Team Roster members
  const [chatTargetMember, setChatTargetMember] = useState<any | null>(null);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    text: string;
    timestamp: string;
    isMe: boolean;
  }>>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  // Overall Team Group Chat state (Slide-out drawer on side of screen)
  const [isGroupChatOpen, setIsGroupChatOpen] = useState<boolean>(false);
  const [groupChatMessages, setGroupChatMessages] = useState<Array<{
    id: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    text: string;
    timestamp: string;
    isMe: boolean;
  }>>([]);
  const [groupChatInputText, setGroupChatInputText] = useState<string>('');
  const groupMessagesEndRef = useRef<HTMLDivElement>(null);

  // Poll unread message counts for current logged in employee (both direct and group)
  const fetchUnreadCounts = async () => {
    try {
      const gId = selectedGroupId || (assignedGroups[0]?.id || 'grp_crm_core_01');
      const res = await fetch(`/api/groups/messages?employeeId=${selectedEmpId}&groupId=${gId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.unreadCounts) {
          setUnreadCounts(json.data.unreadCounts);
        }
      }
    } catch (e) {
      // fallback
    }
  };

  useEffect(() => {
    fetchUnreadCounts();
    const timer = setInterval(fetchUnreadCounts, 2500);
    return () => clearInterval(timer);
  }, [selectedEmpId, selectedGroupId, assignedGroups]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat feed to bottom when messages update
  useEffect(() => {
    if (chatTargetMember && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatTargetMember]);

  // Auto-scroll group chat feed to bottom when messages update
  useEffect(() => {
    if (isGroupChatOpen && groupMessagesEndRef.current) {
      groupMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupChatMessages, isGroupChatOpen]);

  // Fetch group messages from backend
  const fetchGroupChatMessages = async () => {
    const gId = selectedGroupId || (assignedGroups[0]?.id || 'grp_crm_core_01');
    try {
      const res = await fetch(`/api/groups/messages?groupId=${gId}&targetId=GROUP`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.messages)) {
          const formatted = json.data.messages.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            receiverId: m.receiver_id,
            receiverName: m.receiver_name,
            text: m.message,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: m.sender_id === selectedEmpId
          }));
          setGroupChatMessages(formatted);
        }
      }
    } catch (e) {
      // silent
    }
  };

  // Live polling for group chat while open
  useEffect(() => {
    if (!isGroupChatOpen) return;
    fetchGroupChatMessages();
    const interval = setInterval(fetchGroupChatMessages, 2000);
    return () => clearInterval(interval);
  }, [isGroupChatOpen, selectedGroupId, selectedEmpId, assignedGroups]);

  // Live polling when chat modal is open
  useEffect(() => {
    if (!chatTargetMember) return;
    const targetEmpId = chatTargetMember.employee_id || chatTargetMember.employeeId || chatTargetMember.id;

    const pollChat = async () => {
      try {
        const res = await fetch(`/api/groups/messages?employeeId=${selectedEmpId}&targetId=${targetEmpId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.messages)) {
            const formatted = json.data.messages.map((m: any) => ({
              id: m.id,
              senderId: m.sender_id,
              senderName: m.sender_name,
              receiverId: m.receiver_id,
              receiverName: m.receiver_name,
              text: m.message,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: m.sender_id === selectedEmpId
            }));
            setChatMessages(formatted);

            // If there were any unread messages from target, mark them as read
            const hasUnread = json.data.messages.some((m: any) => m.sender_id === targetEmpId && !m.is_read);
            if (hasUnread) {
              fetch('/api/groups/messages/read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderId: targetEmpId, receiverId: selectedEmpId })
              }).catch(() => {});
              setUnreadCounts(prev => ({ ...prev, [targetEmpId]: 0 }));
            }
          }
        }
      } catch (err) {
        // silent
      }
    };

    const interval = setInterval(pollChat, 2000);
    return () => clearInterval(interval);
  }, [chatTargetMember, selectedEmpId]);

  const handleOpenChatWithMember = async (member: any) => {
    setChatTargetMember(member);
    setChatInputText('');

    const targetEmpId = member.employee_id || member.employeeId || member.id;
    const targetName = member.name || member.employee_name || member.employeeName || 'Team Member';

    // 1. Fetch live messages from backend API
    try {
      const res = await fetch(`/api/groups/messages?employeeId=${selectedEmpId}&targetId=${targetEmpId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.messages)) {
          const formatted = json.data.messages.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            senderName: m.sender_name,
            receiverId: m.receiver_id,
            receiverName: m.receiver_name,
            text: m.message,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: m.sender_id === selectedEmpId
          }));
          setChatMessages(formatted);

          // Mark messages as read on backend
          await fetch('/api/groups/messages/read', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: targetEmpId, receiverId: selectedEmpId })
          });

          // Clear local unread badge for this member immediately
          setUnreadCounts(prev => ({ ...prev, [targetEmpId]: 0 }));
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat from server, using local cache:', e);
    }

    // Fallback: localStorage
    const convKey = `crm_chat_${[selectedEmpId, targetEmpId].sort().join('_')}`;
    const saved = localStorage.getItem(convKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChatMessages(parsed.map((m: any) => ({ ...m, isMe: m.senderId === selectedEmpId })));
        setUnreadCounts(prev => ({ ...prev, [targetEmpId]: 0 }));
        return;
      } catch (e) {
        // silent
      }
    }

    setChatMessages([]);
  };

  const handleSendChatMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInputText).trim();
    if (!text || !chatTargetMember) return;

    const targetEmpId = chatTargetMember.employee_id || chatTargetMember.employeeId || chatTargetMember.id;
    const targetName = chatTargetMember.name || chatTargetMember.employee_name || chatTargetMember.employeeName || 'Team Member';

    const tempId = `msg_${Date.now()}`;
    const newMsg = {
      id: tempId,
      senderId: selectedEmpId,
      senderName: currentEmployee.name,
      receiverId: targetEmpId,
      receiverName: targetName,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInputText('');

    // Persist to localStorage
    const convKey = `crm_chat_${[selectedEmpId, targetEmpId].sort().join('_')}`;
    const existing = JSON.parse(localStorage.getItem(convKey) || '[]');
    localStorage.setItem(convKey, JSON.stringify([...existing, newMsg]));

    // Send to backend DB
    try {
      await fetch('/api/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: selectedGroupId,
          senderId: selectedEmpId,
          senderName: currentEmployee.name,
          receiverId: targetEmpId,
          receiverName: targetName,
          message: text
        })
      });
    } catch (e) {
      console.warn('Failed to persist message to DB:', e);
    }

    setActionSuccessMsg(`Message sent to ${targetName}!`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const renderChatModal = () => {
    if (!chatTargetMember) return null;

    const targetName = chatTargetMember.name || chatTargetMember.employee_name || chatTargetMember.employeeName || 'Team Member';
    const targetEmpId = chatTargetMember.employee_id || chatTargetMember.employeeId || chatTargetMember.id;
    const targetRole = chatTargetMember.role || (chatTargetMember.is_team_head ? 'Team Head' : 'Member');
    const targetModules = chatTargetMember.assigned_modules || 'General';

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
        onClick={() => setChatTargetMember(null)}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-sm text-white shadow-md">
                  {targetName.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" title="Active in Project" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white truncate">{targetName}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-purple-200">
                    {targetRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate font-mono">
                  {targetEmpId} • {chatTargetMember.designation || 'Engineer'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setChatTargetMember(null)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Module & Context Banner */}
          <div className="px-4 py-2 bg-purple-50/80 border-b border-purple-100 flex items-center justify-between text-xs">
            <span className="text-purple-800 font-medium flex items-center gap-1.5">
              <MessageSquare size={13} className="text-purple-600" />
              <span>Assigned Module: <strong>{targetModules}</strong></span>
            </span>
            <span className="text-[10px] text-purple-600 font-bold bg-purple-100/70 px-2 py-0.5 rounded-md">
              Progress: {chatTargetMember.progress || 0}%
            </span>
          </div>

          {/* Message Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 min-h-[260px] max-h-[360px]">
            <div className="text-center my-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 bg-white border border-slate-200 shadow-2xs">
                Today — Direct Team Chat
              </span>
            </div>

            {chatMessages.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare size={28} className="mx-auto text-purple-300 stroke-[1.5]" />
                <p className="font-semibold text-slate-600">No conversation history yet with {targetName}</p>
                <p className="text-[11px] text-slate-400">Send a message below or use a quick prompt to start collaborating.</p>
              </div>
            )}

            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} gap-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium px-1">
                  <span>{msg.senderName}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-2xs ${
                    msg.isMe
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                {msg.isMe && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 pr-1">
                    <CheckCheck size={12} className="text-blue-600" />
                    <span>Delivered</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 pt-2.5 pb-1 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <button
              type="button"
              onClick={() => handleSendChatMessage('Can you please share an update on your module progress?')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition shrink-0 cursor-pointer font-medium text-[10px]"
            >
              "Share module update?"
            </button>
            <button
              type="button"
              onClick={() => handleSendChatMessage('Please review the latest code changes in GitHub repository.')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition shrink-0 cursor-pointer font-medium text-[10px]"
            >
              "Check GitHub code"
            </button>
            <button
              type="button"
              onClick={() => handleSendChatMessage('Let us sync on today’s deliverables.')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition shrink-0 cursor-pointer font-medium text-[10px]"
            >
              "Sync on deliverables"
            </button>
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChatMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInputText}
              onChange={(e) => setChatInputText(e.target.value)}
              placeholder={`Write a message to ${targetName}...`}
              className="flex-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={!chatInputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
            >
              <span>Send</span>
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  const handleOpenGroupChat = () => {
    setIsGroupChatOpen(true);
    fetchGroupChatMessages();
    const gId = selectedGroupId || (assignedGroups[0]?.id || 'grp_crm_core_01');
    fetch('/api/groups/messages/read', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: 'GROUP', groupId: gId })
    }).catch(() => {});
    setUnreadCounts(prev => ({ ...prev, GROUP: 0 }));
  };

  const handleSendGroupMessage = async (textToSend?: string) => {
    const text = (textToSend || groupChatInputText).trim();
    if (!text) return;

    const gId = selectedGroupId || (assignedGroups[0]?.id || 'grp_crm_core_01');
    const tempId = `msg_grp_${Date.now()}`;
    const newMsg = {
      id: tempId,
      senderId: selectedEmpId,
      senderName: currentEmployee.name,
      receiverId: 'GROUP',
      receiverName: 'Whole Team',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setGroupChatMessages(prev => [...prev, newMsg]);
    setGroupChatInputText('');

    try {
      await fetch('/api/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: gId,
          senderId: selectedEmpId,
          senderName: currentEmployee.name,
          receiverId: 'GROUP',
          receiverName: 'Whole Team',
          message: text
        })
      });
    } catch (err) {
      console.warn('Failed to persist group message to DB:', err);
    }

    setActionSuccessMsg('Broadcast sent to all group members!');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const renderGroupChatDrawer = () => {
    if (!isGroupChatOpen) return null;

    const groupTitle = activeGroupDetails?.name || activeGroupDetails?.project?.name || assignedGroups[0]?.name || 'CMS Project Team';
    const groupMembers = activeGroupDetails?.members || assignedGroups[0]?.members || [];

    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Dark Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity animate-fade-in cursor-pointer"
          onClick={() => setIsGroupChatOpen(false)}
        />

        {/* Slide-out Drawer Panel on Side of Screen */}
        <div
          className="relative w-full sm:w-[460px] max-w-full bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 animate-slide-left overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                  <Users size={18} />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" title="Channel Active" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white truncate">Overall Team Chat</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 text-purple-200">
                    Group Channel
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {groupTitle} • {groupMembers.length || 4} Members
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsGroupChatOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              title="Close Team Chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Members Strip & Broadcast Info Banner */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 shrink-0">Team:</span>
              <div className="flex items-center -space-x-1.5 overflow-hidden">
                {groupMembers.slice(0, 5).map((m: any, idx: number) => (
                  <div
                    key={m.employee_id || m.employeeId || idx}
                    className="w-6 h-6 rounded-full bg-white border border-purple-200 text-purple-800 text-[10px] font-bold flex items-center justify-center shadow-xs"
                    title={m.name || m.employee_name || m.employeeName}
                  >
                    {(m.name || m.employee_name || m.employeeName || 'E').charAt(0)}
                  </div>
                ))}
              </div>
              {groupMembers.length > 5 && (
                <span className="text-[10px] font-semibold text-purple-700">+{groupMembers.length - 5}</span>
              )}
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-200/60 text-purple-900 shrink-0">
              Posting as: {currentEmployee.name.split(' ')[0]}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/60">
            <div className="text-center my-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 bg-white border border-slate-200 shadow-2xs">
                📢 Project Group Discussion Feed
              </span>
            </div>

            {groupChatMessages.length === 0 && (
              <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                <Users size={32} className="mx-auto text-purple-300 stroke-[1.5]" />
                <p className="font-semibold text-slate-700">No group messages yet</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Post a message below to broadcast updates, deliverables, and queries to all team members in this group!
                </p>
              </div>
            )}

            {groupChatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} gap-1`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium px-1">
                  {!msg.isMe && (
                    <div className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 font-bold text-[8px] flex items-center justify-center">
                      {msg.senderName.charAt(0)}
                    </div>
                  )}
                  <span className="font-bold text-slate-700">{msg.isMe ? 'You' : msg.senderName}</span>
                  <span>•</span>
                  <span className="text-slate-400">{msg.timestamp}</span>
                </div>

                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-2xs ${
                    msg.isMe
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.isMe && (
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 pr-1">
                    <CheckCheck size={12} className="text-blue-600" />
                    <span>Sent to whole team</span>
                  </div>
                )}
              </div>
            ))}
            <div ref={groupMessagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 pt-2.5 pb-1.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => handleSendGroupMessage('📢 Sharing team standup update: all deliverables are progressing on track.')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition shrink-0 cursor-pointer font-medium text-[10px]"
            >
              "Standup update"
            </button>
            <button
              type="button"
              onClick={() => handleSendGroupMessage('🚀 Please review the latest module commit pushed to GitHub.')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition shrink-0 cursor-pointer font-medium text-[10px]"
            >
              "Review GitHub commit"
            </button>
            <button
              type="button"
              onClick={() => handleSendGroupMessage('⚡ Let us sync on the Attendance, Leave, and Payroll integration.')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition shrink-0 cursor-pointer font-medium text-[10px]"
            >
              "Sync integration"
            </button>
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendGroupMessage();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={groupChatInputText}
              onChange={(e) => setGroupChatInputText(e.target.value)}
              placeholder={`Message whole team as ${currentEmployee.name}...`}
              className="flex-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={!groupChatInputText.trim()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
            >
              <span>Broadcast</span>
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Current logged in employee object
  const currentEmployee = useMemo(() => {
    return employees.find(e => (e.empCode || e.id) === selectedEmpId) || {
      id: selectedEmpId,
      empCode: selectedEmpId,
      name: selectedEmpId === 'EMP-008' ? 'Ramesh' : selectedEmpId === 'EMP-005' ? 'Vishnu Vardhan' : 'Assigned Employee',
      designation: 'Specialist',
      department: 'Engineering'
    };
  }, [employees, selectedEmpId]);

  // 1. Fetch assigned groups for the current employee (Level 1)
  const fetchEmployeeGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const data = await taskApiService.getGroups(undefined, selectedEmpId);
      setAssignedGroups(data);
    } catch (err: any) {
      console.error('Error fetching employee groups:', err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchEmployeeGroups();
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  }, [selectedEmpId]);

  const renderEmployeeSwitcher = () => (
    <div className="flex items-center gap-2.5 bg-white px-3.5 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs shrink-0">
        {currentEmployee.name?.charAt(0) || 'U'}
      </div>
      <div className="flex flex-col">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Active Employee View</span>
        <select
          value={selectedEmpId}
          onChange={(e) => {
            setSelectedEmpId(e.target.value);
            setChatTargetMember(null);
          }}
          className="text-xs font-extrabold text-slate-800 bg-transparent outline-none cursor-pointer pr-1 leading-tight hover:text-purple-700 transition"
        >
          <option value="EMP-005">Vishnu Vardhan (EMP-005 • Team Head)</option>
          <option value="EMP-003">Priya Sharma (EMP-003 • Member)</option>
          <option value="EMP-008">Ramesh (EMP-008 • Specialist)</option>
          {employees
            .filter(e => !['EMP-003', 'EMP-005', 'EMP-008'].includes(e.empCode || e.id))
            .map(e => (
              <option key={e.empCode || e.id} value={e.empCode || e.id}>
                {e.name} ({e.empCode || e.id})
              </option>
            ))}
        </select>
      </div>
    </div>
  );

  // 2. Fetch complete project details when a group is selected (Level 2)
  const fetchGroupDetails = async (groupId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await taskApiService.getGroupById(groupId, selectedEmpId);
      setActiveGroupDetails(res);
    } catch (err: any) {
      console.error('Error fetching group details:', err);
      setErrorMessage(err.message || 'Failed to load project details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenProject = (groupId: string) => {
    setSelectedGroupId(groupId);
    fetchGroupDetails(groupId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToProjects = () => {
    setSelectedGroupId(null);
    setActiveGroupDetails(null);
    fetchEmployeeGroups();
  };

  // 3. Employee updates progress of their own task
  const handleUpdateTaskProgress = async (task: any, newProgress: number) => {
    setUpdatingTaskId(task.id);
    setErrorMessage(null);
    try {
      let nextStatus = newProgress === 100 ? 'COMPLETED' : newProgress > 0 ? 'IN_PROGRESS' : 'PENDING';
      const updated = await taskApiService.updateProgress(
        task.id,
        {
          progressPercent: newProgress,
          status: nextStatus,
          employeeId: selectedEmpId
        },
        selectedEmpId
      );

      setActionSuccessMsg(`Updated "${task.title}" to ${newProgress}%. Overall progress recalculated.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);

      // Refresh group details to reflect recalculated progress immediately
      if (selectedGroupId) {
        await fetchGroupDetails(selectedGroupId);
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to update progress:', err);
      setErrorMessage(err.message || 'Permission denied or update failed');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // Helper date formatter
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '30 Sep 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr).split('T')[0];
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '1.8 MB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // =========================================================================
  // LEVEL 2: COMPLETE PROJECT DETAILS WORKSPACE
  // =========================================================================
  if (selectedGroupId && activeGroupDetails) {
    const details = activeGroupDetails;
    const project = details.project || {};
    const teamHead = details.team_head || {};
    const members = details.members || [];
    const moduleResponsibilities = details.module_responsibilities || [];
    const allTasks = details.tasks || [];
    const documents = details.documents || project.documents || [];

    // Filter tasks belonging specifically to logged-in employee + their module
    const myTasks = allTasks.filter(
      (t: any) => t.assigned_to === selectedEmpId || t.assigned_to_employee_id === selectedEmpId
    );

    // Find logged in employee's assigned module and progress in this project dynamically
    const myMemberInfo = members.find((m: any) => m.employee_id === selectedEmpId);
    const myModuleResp = moduleResponsibilities.find((mod: any) => mod.assigned_to_id === selectedEmpId);
    const myModuleName = myTasks[0]?.module_name || myModuleResp?.module_name || myMemberInfo?.assigned_modules || 'Core Deliverables';
    const myModuleProgress = myTasks.length > 0
      ? Math.round(myTasks.reduce((acc: number, t: any) => acc + Number(t.progress_percent || 0), 0) / myTasks.length)
      : (myModuleResp?.progress ?? myMemberInfo?.progress ?? 0);



    const overallProgress = Number(details.overall_progress || project.overall_progress || 0);

    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-fade-in text-slate-800">
        {/* Toast Notification */}
        {actionSuccessMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up text-xs font-semibold">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
            <span>{actionSuccessMsg}</span>
            <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* Error Toast Notification */}
        {errorMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-rose-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-rose-700 animate-shake text-xs font-semibold">
            <ShieldAlert size={16} className="text-rose-300 shrink-0" />
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-300 hover:text-white ml-2 cursor-pointer">✕</button>
          </div>
        )}

        {/* Top Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToProjects}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to My Projects</span>
            </button>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <span className="text-xs font-semibold text-slate-500">Project Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            {renderEmployeeSwitcher()}
          </div>
        </div>

        {/* =========================================================================
            SECTION 2 & 3: PROJECT INFORMATION & PROGRESS KPI
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white uppercase tracking-wider">
                  {project.code || 'PRJ-CMS'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {project.status || 'In Progress'}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {details.name || 'CMS Project Development Team'}
              </h1>
              <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
                {project.description || details.description || 'Core cross-functional delivery group for CMS Project'}
              </p>
            </div>

            {/* Overall Progress Widget */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 min-w-[220px] text-center md:text-right space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Progress</span>
                <span className="text-2xl font-black text-blue-600">{overallProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Calculated from actual module tasks</p>
            </div>
          </div>

          {/* Key Project Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Project Name</span>
              <span className="font-bold text-slate-900 block text-sm">{project.name || 'CMS Project'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Start Date</span>
              <span className="font-bold text-slate-900 block text-sm">{formatDate(project.start_date)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Project Deadline</span>
              <span className="font-bold text-rose-600 block text-sm">{formatDate(project.deadline || details.deadline)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-400 font-medium block">Team Size</span>
              <span className="font-bold text-slate-900 block text-sm">{members.length} Members</span>
            </div>
          </div>

          {/* GitHub Repository Banner (Accessible to all project employees) */}
          {(details.repository_url || project.repository_url) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center font-bold shrink-0">
                  <FolderGit2 size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300">GITHUB REPOSITORY</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-semibold">Active Codebase</span>
                  </div>
                  <a
                    href={details.repository_url || project.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs font-bold text-white hover:text-blue-300 underline mt-0.5 block truncate"
                  >
                    {details.repository_url || project.repository_url}
                  </a>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Clone this repository to implement project deliverables, develop assigned modules, and push commits.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`git clone ${details.repository_url || project.repository_url}`);
                    setActionSuccessMsg('Copied "git clone" command to clipboard!');
                    setTimeout(() => setActionSuccessMsg(null), 3000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy git clone command"
                >
                  <FileCode size={13} />
                  <span>Copy Clone</span>
                </button>
                <a
                  href={details.repository_url || project.repository_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <span>Open GitHub</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            SECTION 4: REAL PROJECT DOCUMENTS
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 lg:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Project Documents</h2>
                <p className="text-xs text-slate-500">Real specifications, requirements, and designs attached to this project</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              {documents.length} File{documents.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {documents.map((doc: any, idx: number) => {
              const fileName = doc.name || doc.fileName || `Document_${idx + 1}.pdf`;
              const fileType = (doc.fileType || (fileName.endsWith('.docx') ? 'docx' : 'pdf')).toUpperCase();
              const isPdf = fileType === 'PDF';
              const fileUrl = doc.fileUrl || `/uploads/documents/${fileName}`;

              return (
                <div
                  key={doc.id || idx}
                  className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/20 transition flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isPdf ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {fileType}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition">
                        {fileName}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                        <span>By: {doc.uploadedBy || 'Project Team'}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedDate || doc.created_at)}</span>
                        <span>•</span>
                        <span className="font-mono text-[10px]">{formatFileSize(doc.fileSize)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc({
                        fileName,
                        fileUrl,
                        taskTitle: fileName,
                        projectName: project.name || 'CMS Project'
                      })}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>
                    <a
                      href={fileUrl}
                      download={fileName}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                      title="Download document"
                    >
                      <Download size={13} />
                    </a>
                  </div>
                </div>
              );
            })}

            {documents.length === 0 && (
              <div className="col-span-2 py-8 text-center text-slate-400 text-xs italic">
                No requirement documents attached to this project.
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            SECTION 5: TEAM INFORMATION (TEAM HEAD + ALL MEMBERS)
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Users size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Project Team & Roster</h2>
                <p className="text-xs text-slate-500">Cross-functional team head and member progress distribution</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {/* Overall Team Chat Button on Left Side of Full Team Visibility */}
              <button
                type="button"
                onClick={handleOpenGroupChat}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-bold shadow-sm hover:shadow-md transition cursor-pointer group"
                title="Open Overall Team Group Chat"
              >
                <MessageSquare size={13} className="group-hover:scale-110 transition" />
                <span>Overall Team Chat</span>
                {(unreadCounts['GROUP'] || 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse shadow-xs">
                    {unreadCounts['GROUP']} new
                  </span>
                )}
              </button>

              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Full Team Visibility
              </span>
            </div>
          </div>

          {/* Team Head Highlight Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-orange-50/30 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-sm shrink-0">
                <Crown size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-base text-slate-900">{teamHead.name || details.team_head_name}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    TEAM HEAD
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-mono font-bold text-slate-800">{teamHead.emp_code || teamHead.id}</span> • {teamHead.designation || 'Lead Backend Architect'} • {teamHead.department || 'Engineering'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-medium text-slate-500 block">Assigned Lead Modules</span>
              <span className="text-xs font-bold text-amber-950">Attendance, Leave, Payroll</span>
            </div>
          </div>

          {/* Team Members List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Team Member</th>
                  <th className="pb-3 px-2">Role</th>
                  <th className="pb-3 px-2">Assigned Module(s)</th>
                  <th className="pb-3 px-2 min-w-[150px]">Individual Progress</th>
                  <th className="pb-3 px-2 text-right">Edit Permission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m: any, idx: number) => {
                  const isMe = m.employee_id === selectedEmpId;
                  const prog = Number(m.progress || 0);

                  return (
                    <tr
                      key={m.employee_id || idx}
                      className={`hover:bg-slate-50/80 transition ${isMe ? 'bg-blue-50/40 font-semibold' : ''}`}
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            m.is_team_head || m.role === 'Team Head' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.name?.[0] || m.employee_name?.[0] || 'E'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{m.name || m.employee_name}</span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-600 text-white">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {m.employee_id} • {m.designation || 'Engineer'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.is_team_head || m.role === 'Team Head'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {m.role || 'Member'}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <span className="font-medium text-slate-800">
                          {m.assigned_modules || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-2">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-slate-700">{prog}%</span>
                            <span className="text-[10px] text-slate-400">
                              {m.task_count || 1} task{m.task_count === 1 ? '' : 's'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                prog === 100 ? 'bg-emerald-500' : prog >= 60 ? 'bg-blue-600' : 'bg-amber-500'
                              }`}
                              style={{ width: `${prog}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isMe ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={11} />
                              <span>Can Edit Tasks</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-500">
                              <Lock size={11} />
                              <span>View Only</span>
                            </span>
                          )}

                          {/* Unread message count badge for this member */}
                          {!isMe && (unreadCounts[m.employee_id || m.id] || 0) > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs animate-pulse">
                              <MessageSquare size={10} />
                              <span>{unreadCounts[m.employee_id || m.id]} new</span>
                            </span>
                          )}

                          {/* 3 Dots Menu Button -> Opens Chat Box with that person */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChatWithMember(m);
                            }}
                            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer border shadow-2xs group/dot ${
                              !isMe && (unreadCounts[m.employee_id || m.id] || 0) > 0
                                ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100 shadow-sm ring-2 ring-rose-300/60'
                                : 'bg-slate-100 hover:bg-purple-100 text-slate-500 hover:text-purple-700 border-slate-200/80'
                            }`}
                            title={`Chat with ${m.name || m.employee_name}`}
                          >
                            <MoreVertical size={14} className="group-hover/dot:scale-110 transition" />
                            {!isMe && (unreadCounts[m.employee_id || m.id] || 0) > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-md animate-bounce">
                                {unreadCounts[m.employee_id || m.id]}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* =========================================================================
            SECTION 7 & 8: EMPLOYEE-SPECIFIC SECTION ("MY ASSIGNED WORK")
            ========================================================================= */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-blue-800 rounded-3xl p-6 lg:p-8 text-white shadow-lg space-y-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/20 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white font-black text-xs uppercase tracking-wider backdrop-blur-xs">
                <Sparkles size={13} />
                <span>MY ASSIGNED WORK</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">{currentEmployee.name}</h2>
              <p className="text-xs text-blue-100">
                Employee ID: <span className="font-mono font-bold text-white">{selectedEmpId}</span> • {currentEmployee.designation || 'Engineer'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/15 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/20 text-right">
                <span className="text-[11px] text-blue-100 block">Your Module Progress</span>
                <span className="text-2xl font-black text-white">{myModuleProgress}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
              <span className="text-blue-200 block text-[11px]">Assigned Module</span>
              <span className="font-black text-sm text-white block">{myModuleName}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
              <span className="text-blue-200 block text-[11px]">Assigned By</span>
              <span className="font-black text-sm text-white block">{teamHead.name || 'Vishnu Vardhan'}</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
              <span className="text-blue-200 block text-[11px]">Status</span>
              <span className="font-black text-sm text-white block">In Progress</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 border border-white/15 space-y-1">
              <span className="text-blue-200 block text-[11px]">Deadline</span>
              <span className="font-black text-sm text-white block">{formatDate(project.deadline)}</span>
            </div>
          </div>

          <div className="p-3 bg-white/10 rounded-2xl border border-white/15 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-blue-200 shrink-0" />
              <span>
                This is the <strong>ONLY section</strong> where you can update task progress. All updates automatically synchronize to the database and recalculate Admin reporting.
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 8: MY TASKS (INTERACTIVE EDITABLE CONTROLS)
            ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 lg:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  My Tasks — <span className="text-blue-600 font-mono">{myModuleName}</span>
                </h2>
                <p className="text-xs text-slate-500">Tasks assigned to you. Select or adjust progress below to save directly to DB.</p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Editable Controls Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {myTasks.map((t: any) => {
              const p = Number(t.progress_percent || 0);
              const isUpdating = updatingTaskId === t.id;

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-400 p-5 shadow-xs flex flex-col justify-between gap-4 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{t.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{t.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                  </div>

                  {/* Interactive Mouse Driven Progress Control (Stepper, Drag Slider, Quick Preset Chips — NO DROPDOWN) */}
                  <TaskProgressMouseControl
                    task={t}
                    currentProgress={p}
                    isUpdating={isUpdating}
                    onUpdate={handleUpdateTaskProgress}
                  />

                  {/* Same Git Repository Box as shown in project card */}
                  {(t.repository_url || details.repository_url || project.repository_url) && (
                    <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                          <FolderGit2 size={13} />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300 block leading-tight">GitHub Repository</span>
                          <a
                            href={t.repository_url || details.repository_url || project.repository_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="font-mono text-[11px] font-bold text-white hover:text-blue-300 underline truncate block leading-tight"
                          >
                            {(t.repository_url || details.repository_url || project.repository_url).replace('https://', '')}
                          </a>
                        </div>
                      </div>
                      <a
                        href={t.repository_url || details.repository_url || project.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition shrink-0"
                      >
                        <span>Code</span>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}

            {myTasks.length === 0 && (
              <div className="col-span-3 py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No specific individual tasks found under {myModuleName} for {selectedEmpId}.
              </div>
            )}
          </div>
        </div>



        {/* Document Preview Modal */}
        {previewDoc && (
          <DocumentPreviewModal
            isOpen={Boolean(previewDoc)}
            onClose={() => setPreviewDoc(null)}
            fileName={previewDoc.fileName}
            fileUrl={previewDoc.fileUrl}
            taskTitle={previewDoc.taskTitle}
            projectName={previewDoc.projectName}
          />
        )}

        {/* Direct Team Member Chat Modal */}
        {renderChatModal()}

        {/* Overall Team Group Chat Drawer (Side of Screen) */}
        {renderGroupChatDrawer()}
      </div>
    );
  }

  // =========================================================================
  // LEVEL 1: PROJECT / GROUP CARDS (FIRST VIEW)
  // =========================================================================
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in text-slate-800">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up text-xs font-semibold">
          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
          <span>{actionSuccessMsg}</span>
          <button onClick={() => setActionSuccessMsg(null)} className="text-slate-400 hover:text-white ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Header Bar with Persona Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              My Tasks
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Assigned Projects
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Select an assigned project/group card below to inspect complete details, documents, team roster, and update module tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {renderEmployeeSwitcher()}
        </div>
      </div>

      {/* Project / Group Cards Grid */}
      {isLoadingGroups ? (
        <div className="py-24 text-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading your assigned project groups...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5 max-w-6xl">
          {assignedGroups.map((grp: any) => {
            const overallP = Number(grp.overall_progress || 0);
            const myP = Number(grp.my_progress || 0);

            return (
              <div
                key={grp.id}
                className="bg-white rounded-2xl border border-slate-200/90 hover:border-purple-300 shadow-2xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col justify-between gap-3 group max-w-md w-full"
              >
                {/* Header & Badges */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/80">
                      <FolderGit2 size={12} />
                      <span className="truncate max-w-[170px]">{grp.project_name || 'CMS Project'}</span>
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      {grp.members?.length || grp.member_count || 4} Members
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-purple-800 group-hover:text-purple-900 transition leading-snug">
                      {grp.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {grp.description || `Core cross-functional delivery group for ${grp.project_name || 'CMS Project'}`}
                    </p>
                  </div>
                </div>

                {/* GitHub Repository Bar */}
                {grp.repository_url && (
                  <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0">
                        <FolderGit2 size={13} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-300 block leading-tight">GitHub Repository</span>
                        <a
                          href={grp.repository_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="font-mono text-[11px] font-bold text-white hover:text-blue-300 underline truncate block leading-tight"
                        >
                          {grp.repository_url.replace('https://', '')}
                        </a>
                      </div>
                    </div>
                    <a
                      href={grp.repository_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-xs transition shrink-0"
                    >
                      <span>Code</span>
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                {/* Designated Lead Box */}
                <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                      {(grp.team_head_name || 'V').charAt(0)}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="flex items-center gap-1">
                        <Crown size={11} className="text-amber-600 shrink-0" />
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900">DESIGNATED LEAD</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {grp.team_head_name || 'Vishnu Vardhan'}
                      </p>
                      <p className="text-[9px] font-mono text-slate-500">
                        {grp.team_head_id || 'EMP-005'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overall Team Progress Bar */}
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 flex items-center gap-1">
                      <TrendingUp size={12} className="text-purple-600" />
                      <span>Overall Progress:</span>
                    </span>
                    <span className="font-bold text-purple-700 text-xs">
                      {overallP}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, overallP))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-medium">
                    <span>{grp.completed_count || 2} of {grp.task_count || 6} deliverables done</span>
                    <span>{grp.task_count ? `${Math.round(((grp.completed_count || 0) / grp.task_count) * 100)}% velocity` : '33% velocity'}</span>
                  </div>
                </div>

                {/* Members Avatars & Roster Preview */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                    <span>Team Roster:</span>
                    <button
                      type="button"
                      onClick={() => handleOpenProject(grp.id)}
                      className="text-purple-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[115px] overflow-y-auto pr-0.5">
                    {(grp.members || []).slice(0, 4).map((m: any) => (
                      <div
                        key={m.employeeId || m.id}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 text-xs border border-slate-100"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                            {(m.name || m.employeeName || 'E').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 text-[10px] block truncate leading-tight">
                              {m.name || m.employeeName}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono block leading-tight">
                              {m.employeeId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            m.isTeamHead || m.employeeId === grp.team_head_id
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {m.isTeamHead || m.employeeId === grp.team_head_id ? 'Team Head' : (m.role || 'Member')}
                          </span>

                          {/* Level 1 Unread badge */}
                          {(() => {
                            const memId = m.employeeId || m.id || m.employee_id;
                            const count = memId !== selectedEmpId ? (unreadCounts[memId] || 0) : 0;
                            if (count <= 0) return null;
                            return (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white animate-pulse shadow-xs">
                                {count} new
                              </span>
                            );
                          })()}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenChatWithMember({
                                name: m.name || m.employeeName,
                                employee_id: m.employeeId || m.id,
                                role: m.isTeamHead || m.employeeId === grp.team_head_id ? 'Team Head' : (m.role || 'Member'),
                                assigned_modules: grp.name
                              });
                            }}
                            className={`relative w-5 h-5 rounded flex items-center justify-center transition cursor-pointer ${
                              (unreadCounts[m.employeeId || m.id || m.employee_id] || 0) > 0 && (m.employeeId || m.id || m.employee_id) !== selectedEmpId
                                ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold'
                                : 'hover:bg-slate-200 text-slate-400 hover:text-purple-600'
                            }`}
                            title={`Chat with ${m.name || m.employeeName}`}
                          >
                            <MoreVertical size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personalized Employee Assignment Strip & Actions */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs bg-blue-50/60 px-3 py-2 rounded-xl border border-blue-100">
                    <div>
                      <span className="text-slate-400 font-medium text-[9px] uppercase tracking-wider block leading-tight">Your Assigned Module</span>
                      <span className="font-bold text-blue-700 font-mono text-[11px]">{grp.my_module || 'MOD-BACKEND'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 font-medium text-[9px] uppercase tracking-wider block leading-tight">Your Progress</span>
                      <span className="font-black text-blue-700 text-xs">{myP}%</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenProject(grp.id)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <span>Open Project Workspace & Tasks</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {assignedGroups.length === 0 && (
            <div className="col-span-2 py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-dashed border-slate-300 space-y-2">
              <FolderKanban size={36} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-600 text-sm">No project teams found for {currentEmployee.name}</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                You are currently not assigned to any project groups. Switch persona above to test other accounts (e.g. Ramesh EMP-008).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Direct Team Member Chat Modal */}
      {renderChatModal()}

      {/* Overall Team Group Chat Drawer (Side of Screen) */}
      {renderGroupChatDrawer()}
    </div>
  );
};
