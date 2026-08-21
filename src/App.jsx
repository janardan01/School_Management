// Apex Task & Schedule Coordinator - Main App Component

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import TimetableGrid from './components/TimetableGrid';
import TeachersView from './components/TeachersView';
import OrdersManager from './components/OrdersManager';
import ReportsArchive from './components/ReportsArchive';
import StaffPortalView from './components/StaffPortalView';
import { Menu } from 'lucide-react';
import { translations } from './utils/i18n';
import { supabase, isSupabaseConfigured } from './utils/supabaseClient';

import { 
  DEFAULT_TEACHERS, 
  generateDefaultRoutine, 
  DEFAULT_ORDERS,
  PERIODS
} from './utils/SmartAssigner';

// Helper functions for initial data loading with fallback
const getInitialTeachers = () => {
  const stored = localStorage.getItem('apex_teachers_watson_dayshift');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  localStorage.setItem('apex_teachers_watson_dayshift', JSON.stringify(DEFAULT_TEACHERS));
  return DEFAULT_TEACHERS;
};

const getInitialRoutine = () => {
  const stored = localStorage.getItem('apex_routine_watson_dayshift');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  const initial = generateDefaultRoutine();
  localStorage.setItem('apex_routine_watson_dayshift', JSON.stringify(initial));
  return initial;
};

const getInitialOrders = () => {
  const stored = localStorage.getItem('apex_orders_watson_dayshift');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(DEFAULT_ORDERS));
  return DEFAULT_ORDERS;
};

const getInitialLeaves = () => {
  const stored = localStorage.getItem('apex_leaves_watson_dayshift');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
};

const getInitialNotices = () => {
  const stored = localStorage.getItem('apex_bulletin_notices');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // ignore
    }
  }
  const defaultNotices = [
    { id: "NT-001", content: "DEO Office Order: Complete U-DISE+ student profile submissions urgently by Friday.", category: "Official", datePinned: new Date().toISOString().split('T')[0] },
    { id: "NT-002", content: "Weekly Staff Meeting on Saturday at 4:15 PM in Staff Room.", category: "General", datePinned: new Date().toISOString().split('T')[0] }
  ];
  localStorage.setItem('apex_bulletin_notices', JSON.stringify(defaultNotices));
  return defaultNotices;
};

const getInitialProxies = () => {
  const stored = localStorage.getItem('apex_proxy_records');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  return [];
};

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [teachers, setTeachers] = useState(getInitialTeachers);
  const [routine, setRoutine] = useState(getInitialRoutine);
  const [orders, setOrders] = useState(getInitialOrders);
  const [leaves, setLeaves] = useState(getInitialLeaves);
  const [notices, setNotices] = useState(getInitialNotices);
  const [proxyRecords, setProxyRecords] = useState(getInitialProxies);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState('connecting'); // 'online' | 'offline' | 'connecting'
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('apex_portal_lang') || 'en';
  });

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const handleToggleLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('apex_portal_lang', lang);
  };

  const fetchDataFromSupabase = async () => {
    try {
      // 1. Fetch Teachers
      const { data: dbTeachers, error: tErr } = await supabase.from('teachers').select('*').order('id');
      if (tErr) throw tErr;
      if (dbTeachers && dbTeachers.length > 0) {
        setTeachers(dbTeachers);
        localStorage.setItem('apex_teachers_watson_dayshift', JSON.stringify(dbTeachers));
      } else if (dbTeachers && dbTeachers.length === 0) {
        // Table exists but is empty, seed with default teachers
        await supabase.from('teachers').insert(DEFAULT_TEACHERS);
      }

      // 2. Fetch Routine
      const { data: slots, error: rErr } = await supabase.from('routine_slots').select('*');
      if (rErr) throw rErr;
      if (slots && slots.length > 0) {
        const initialRoutine = generateDefaultRoutine();
        slots.forEach(slot => {
          if (initialRoutine[slot.class_id] && initialRoutine[slot.class_id][slot.day]) {
            initialRoutine[slot.class_id][slot.day][slot.period_id] = {
              teacherId: slot.teacher_id || "",
              subject: slot.subject || ""
            };
          }
        });
        setRoutine(initialRoutine);
        localStorage.setItem('apex_routine_watson_dayshift', JSON.stringify(initialRoutine));
      }

      // 3. Fetch Orders
      const { data: dbOrders, error: oErr } = await supabase.from('orders').select('*').order('id');
      if (oErr) throw oErr;
      if (dbOrders && dbOrders.length > 0) {
        setOrders(dbOrders);
        localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(dbOrders));
      } else if (dbOrders && dbOrders.length === 0) {
        await supabase.from('orders').insert(DEFAULT_ORDERS);
      }

      // 4. Fetch Leaves
      const { data: dbLeaves, error: lErr } = await supabase.from('leaves').select('*');
      if (lErr) throw lErr;
      if (dbLeaves) {
        const mappedLeaves = dbLeaves.map(l => ({
          id: l.id,
          teacherId: l.teacherId,
          day: l.day
        }));
        setLeaves(mappedLeaves);
        localStorage.setItem('apex_leaves_watson_dayshift', JSON.stringify(mappedLeaves));
      }

      // 5. Fetch Notices
      const { data: dbNotices, error: nErr } = await supabase.from('notices').select('*').order('id', { ascending: false });
      if (nErr) throw nErr;
      if (dbNotices && dbNotices.length > 0) {
        setNotices(dbNotices);
        localStorage.setItem('apex_bulletin_notices', JSON.stringify(dbNotices));
      }

      // 6. Fetch Proxy Records
      const { data: dbProxies, error: pErr } = await supabase.from('proxy_records').select('*').order('id', { ascending: false });
      if (pErr) throw pErr;
      if (dbProxies) {
        const mappedProxies = dbProxies.map(p => ({
          id: p.id,
          absentTeacherId: p.absentTeacherId,
          substituteTeacherId: p.substituteTeacherId,
          day: p.day,
          periodId: p.periodId,
          classId: p.classId,
          date: p.date
        }));
        setProxyRecords(mappedProxies);
        localStorage.setItem('apex_proxy_records', JSON.stringify(mappedProxies));
      }

      setDbStatus('online');
    } catch (err) {
      console.warn("Supabase unreachable or paused. Operating in LocalStorage offline mode:", err);
      setDbStatus('offline');
    }
  };

  // Load and seed database on initialization
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchDataFromSupabase();

      // Realtime subscription setup
      try {
        const channel = supabase.channel('schema-db-changes')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            fetchDataFromSupabase();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setDbStatus('online');
            }
          });

        return () => {
          supabase.removeChannel(channel);
        };
      } catch (e) {
        console.warn("Realtime subscription failed:", e);
      }
    } else {
      setDbStatus('offline');
    }
  }, []);

  // Handler to edit a class routine slot
  const handleUpdateRoutine = async (classId, day, periodId, { teacherId, subject }) => {
    const updatedRoutine = { ...routine };
    if (!updatedRoutine[classId]) updatedRoutine[classId] = {};
    if (!updatedRoutine[classId][day]) updatedRoutine[classId][day] = {};
    
    updatedRoutine[classId][day][periodId] = { teacherId, subject };
    setRoutine(updatedRoutine);
    localStorage.setItem('apex_routine_watson_dayshift', JSON.stringify(updatedRoutine));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('routine_slots').upsert({
          class_id: classId,
          day: day,
          period_id: periodId,
          teacher_id: teacherId || null,
          subject: subject || null
        });
      } catch (err) {
        console.error("Error updating routine in Supabase:", err);
      }
    }
  };

  const handleAddLeave = async (teacherId, day) => {
    if (leaves.some(l => l.teacherId === teacherId && l.day === day)) return;
    const newLeave = { id: `LV-${Date.now()}`, teacherId, day };
    const newLeaves = [...leaves, newLeave];
    setLeaves(newLeaves);
    localStorage.setItem('apex_leaves_watson_dayshift', JSON.stringify(newLeaves));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('leaves').insert({
          id: newLeave.id,
          teacherId: newLeave.teacherId,
          day: newLeave.day
        });
      } catch (err) {
        console.error("Error adding leave to Supabase:", err);
      }
    }
  };

  const handleRemoveLeave = async (leaveId) => {
    const newLeaves = leaves.filter(l => l.id !== leaveId);
    setLeaves(newLeaves);
    localStorage.setItem('apex_leaves_watson_dayshift', JSON.stringify(newLeaves));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('leaves').delete().eq('id', leaveId);
      } catch (err) {
        console.error("Error removing leave from Supabase:", err);
      }
    }
  };

  const handleAddNotice = async (content, category) => {
    const newNotice = {
      id: `NT-${Date.now()}`,
      content,
      category,
      datePinned: new Date().toISOString().split('T')[0]
    };
    const updatedNotices = [newNotice, ...notices];
    setNotices(updatedNotices);
    localStorage.setItem('apex_bulletin_notices', JSON.stringify(updatedNotices));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notices').insert({
          id: newNotice.id,
          content: newNotice.content,
          category: newNotice.category,
          datePinned: newNotice.datePinned
        });
      } catch (err) {
        console.error("Error adding notice to Supabase:", err);
      }
    }
  };

  const handleRemoveNotice = async (noticeId) => {
    const updatedNotices = notices.filter(n => n.id !== noticeId);
    setNotices(updatedNotices);
    localStorage.setItem('apex_bulletin_notices', JSON.stringify(updatedNotices));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notices').delete().eq('id', noticeId);
      } catch (err) {
        console.error("Error removing notice from Supabase:", err);
      }
    }
  };

  // Handler to update teacher details (preferences, etc.)
  const handleUpdateTeacher = async (teacherId, updatedFields) => {
    const updatedTeachers = teachers.map(t => {
      if (t.id === teacherId) {
        return { ...t, ...updatedFields };
      }
      return t;
    });
    setTeachers(updatedTeachers);
    localStorage.setItem('apex_teachers_watson_dayshift', JSON.stringify(updatedTeachers));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('teachers').update(updatedFields).eq('id', teacherId);
      } catch (err) {
        console.error("Error updating teacher in Supabase:", err);
      }
    }
  };

  // Handler to log new substitution
  const handleAddProxyRecord = async (absentTeacherId, substituteTeacherId, day, periodId, classId) => {
    const newRecord = {
      id: `PX-${Date.now()}`,
      absentTeacherId,
      substituteTeacherId,
      day,
      periodId,
      classId,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newRecord, ...proxyRecords];
    setProxyRecords(updated);
    localStorage.setItem('apex_proxy_records', JSON.stringify(updated));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('proxy_records').insert({
          id: newRecord.id,
          absentTeacherId: newRecord.absentTeacherId,
          substituteTeacherId: newRecord.substituteTeacherId,
          day: newRecord.day,
          periodId: newRecord.periodId,
          classId: newRecord.classId,
          date: newRecord.date
        });
      } catch (err) {
        console.error("Error adding proxy record to Supabase:", err);
      }
    }
  };

  // Handler to log new BRC/DEO letters
  const handleAddOrder = async (orderData) => {
    const newId = `ORD-0${orders.length + 1}`;
    const today = new Date().toISOString().split('T')[0];

    const newOrder = {
      id: newId,
      title: orderData.title,
      authority: orderData.authority,
      dateReceived: today,
      deadline: orderData.deadline,
      eventTime: orderData.eventTime || "",
      duration: orderData.duration || 0,
      description: orderData.description,
      category: orderData.category,
      assignedTeacherId: null, // Initialized unassigned
      status: "Pending",
      priority: orderData.priority,
      reports: []
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(updatedOrders));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').insert({
          id: newOrder.id,
          title: newOrder.title,
          authority: newOrder.authority,
          dateReceived: newOrder.dateReceived,
          deadline: newOrder.deadline,
          eventTime: newOrder.eventTime,
          duration: newOrder.duration,
          description: newOrder.description,
          category: newOrder.category,
          assignedTeacherId: null,
          status: newOrder.status,
          priority: newOrder.priority,
          reports: []
        });
      } catch (err) {
        console.error("Error adding order to Supabase:", err);
      }
    }
  };

  // Handler to assign teacher to order
  const handleAssignTeacher = async (orderId, teacherId) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return { 
          ...o, 
          assignedTeacherId: teacherId, 
          status: "In Progress" 
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(updatedOrders));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          assignedTeacherId: teacherId,
          status: "In Progress"
        }).eq('id', orderId);
      } catch (err) {
        console.error("Error assigning teacher in Supabase:", err);
      }
    }
  };

  // Handler to submit completion report
  const handleSubmitReport = async (orderId, submitterId, content) => {
    const submitter = teachers.find(t => t.id === submitterId);
    
    // Create timestamp
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    const newReport = {
      submitterId,
      submitterName: submitter ? submitter.name : "Unknown Staff",
      submittedAt: formattedDate,
      content
    };

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "Completed",
          reports: [newReport]
        };
      }
      return o;
    });

    setOrders(updatedOrders);
    localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(updatedOrders));

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          status: "Completed",
          reports: [newReport]
        }).eq('id', orderId);
      } catch (err) {
        console.error("Error submitting report in Supabase:", err);
      }
    }
  };

  // Quick helper to fetch title content dynamically
  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return { 
          title: t('dashboard') + " - " + t('brandName'), 
          subtitle: t('welcomeSubtitle') 
        };
      case 'timetable':
        return { 
          title: t('classRoutinePlanner'), 
          subtitle: t('classRoutinePlannerDesc') 
        };
      case 'teachers':
        return { 
          title: t('staffDirectoryTitle'), 
          subtitle: t('staffDirectoryDesc') 
        };
      case 'orders':
        return { 
          title: t('ordersManagerTitle'), 
          subtitle: t('ordersManagerDesc') 
        };
      case 'reports':
        return { 
          title: t('archiveHeaderTitle'), 
          subtitle: t('archiveHeaderDesc') 
        };
      case 'staff-portal':
        return { 
          title: t('staffPortalDeskTitle'), 
          subtitle: t('staffPortalDeskDesc') 
        };
      default:
        return { title: "", subtitle: "" };
    }
  };

  const headerInfo = getViewTitle();

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        teachers={teachers} 
        orders={orders} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        language={language}
        t={t}
      />

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Main Panel Content Area */}
      <main className="main-content">
        <header className="header">
          <div className="header-brand-group">
            <button 
              className="mobile-menu-toggle" 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>
            <div>
              <h1 className="page-title">{headerInfo.title}</h1>
              <p className="page-subtitle">{headerInfo.subtitle}</p>
            </div>
          </div>
          <div className="header-meta-group">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t('selectLanguage')}:</span>
              <button 
                onClick={() => handleToggleLanguage('en')} 
                style={{ 
                  background: language === 'en' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.03)', 
                  color: language === 'en' ? 'var(--bg-dark)' : 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                English
              </button>
              <button 
                onClick={() => handleToggleLanguage('hi')} 
                style={{ 
                  background: language === 'hi' ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.03)', 
                  color: language === 'hi' ? 'var(--bg-dark)' : 'var(--text-primary)',
                  border: '1px solid var(--border-glass)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                हिंदी
              </button>
            </div>
            <div>{t('today')} <strong>{new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
            <div style={{ color: 'var(--accent-cyan)', marginTop: '2px', fontWeight: 600 }}>{t('schoolStatus')}</div>
          </div>
        </header>

        {/* View Router switches rendering based on active view selection */}
        {activeView === 'dashboard' && (
          <DashboardView 
            teachers={teachers} 
            routine={routine} 
            orders={orders} 
            leaves={leaves}
            notices={notices}
            onAddNotice={handleAddNotice}
            onRemoveNotice={handleRemoveNotice}
            onNavigate={setActiveView} 
            language={language}
            t={t}
          />
        )}

        {activeView === 'timetable' && (
          <TimetableGrid 
            teachers={teachers} 
            routine={routine} 
            orders={orders} 
            leaves={leaves}
            proxyRecords={proxyRecords}
            onAddProxyRecord={handleAddProxyRecord}
            onUpdateRoutine={handleUpdateRoutine} 
            language={language}
            t={t}
          />
        )}

        {activeView === 'teachers' && (
          <TeachersView 
            teachers={teachers} 
            routine={routine} 
            orders={orders} 
            leaves={leaves}
            proxyRecords={proxyRecords}
            onAddLeave={handleAddLeave}
            onRemoveLeave={handleRemoveLeave}
            onUpdateTeacher={handleUpdateTeacher}
            language={language}
            t={t}
          />
        )}

        {activeView === 'orders' && (
          <OrdersManager 
            teachers={teachers} 
            routine={routine} 
            orders={orders} 
            leaves={leaves}
            onAddOrder={handleAddOrder} 
            onAssignTeacher={handleAssignTeacher} 
            onSubmitReport={handleSubmitReport} 
            language={language}
            t={t}
          />
        )}

        {activeView === 'reports' && (
          <ReportsArchive 
            teachers={teachers} 
            orders={orders} 
            language={language}
            t={t}
          />
        )}

        {activeView === 'staff-portal' && (
          <StaffPortalView 
            teachers={teachers} 
            routine={routine} 
            orders={orders} 
            leaves={leaves}
            notices={notices}
            onSubmitReport={handleSubmitReport} 
            language={language}
            t={t}
          />
        )}
      </main>
    </div>
  );
}
