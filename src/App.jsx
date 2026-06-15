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

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [teachers, setTeachers] = useState([]);
  const [routine, setRoutine] = useState({});
  const [orders, setOrders] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [notices, setNotices] = useState([]);
  const [proxyRecords, setProxyRecords] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      if (dbTeachers) setTeachers(dbTeachers);

      // 2. Fetch Routine
      const { data: slots, error: rErr } = await supabase.from('routine_slots').select('*');
      if (rErr) throw rErr;
      const initialRoutine = generateDefaultRoutine();
      if (slots) {
        slots.forEach(slot => {
          if (initialRoutine[slot.class_id] && initialRoutine[slot.class_id][slot.day]) {
            initialRoutine[slot.class_id][slot.day][slot.period_id] = {
              teacherId: slot.teacher_id || "",
              subject: slot.subject || ""
            };
          }
        });
      }
      setRoutine(initialRoutine);

      // 3. Fetch Orders
      const { data: dbOrders, error: oErr } = await supabase.from('orders').select('*').order('id');
      if (oErr) throw oErr;
      if (dbOrders) setOrders(dbOrders);

      // 4. Fetch Leaves
      const { data: dbLeaves, error: lErr } = await supabase.from('leaves').select('*');
      if (lErr) throw lErr;
      if (dbLeaves) {
        setLeaves(dbLeaves.map(l => ({
          id: l.id,
          teacherId: l.teacherId,
          day: l.day
        })));
      }

      // 5. Fetch Notices
      const { data: dbNotices, error: nErr } = await supabase.from('notices').select('*').order('id', { ascending: false });
      if (nErr) throw nErr;
      if (dbNotices) setNotices(dbNotices);

      // 6. Fetch Proxy Records
      const { data: dbProxies, error: pErr } = await supabase.from('proxy_records').select('*').order('id', { ascending: false });
      if (pErr) throw pErr;
      if (dbProxies) {
        setProxyRecords(dbProxies.map(p => ({
          id: p.id,
          absentTeacherId: p.absentTeacherId,
          substituteTeacherId: p.substituteTeacherId,
          day: p.day,
          periodId: p.periodId,
          classId: p.classId,
          date: p.date
        })));
      }
    } catch (err) {
      console.error("Error loading data from Supabase:", err);
    }
  };

  // Load and seed database on initialization
  useEffect(() => {
    if (isSupabaseConfigured) {
      fetchDataFromSupabase();

      // Realtime subscription setup
      const channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          fetchDataFromSupabase();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      // 1. Teachers
      const storedTeachers = localStorage.getItem('apex_teachers_watson_dayshift');
      if (storedTeachers) {
        const parsedTeachers = JSON.parse(storedTeachers);
        let migrated = false;
        const updated = parsedTeachers.map(t => {
          if (t.id === "T6" && t.subject !== "Social Science") {
            migrated = true;
            return { ...t, subject: "Social Science", email: "ajay.social@school.edu" };
          }
          if (t.id === "T9" && t.subject !== "Social Science") {
            migrated = true;
            return { ...t, subject: "Social Science", email: "ravi.social@school.edu" };
          }
          return t;
        });

        if (migrated) {
          localStorage.setItem('apex_teachers_watson_dayshift', JSON.stringify(updated));
          setTeachers(updated);
        } else {
          setTeachers(parsedTeachers);
        }
      } else {
        localStorage.setItem('apex_teachers_watson_dayshift', JSON.stringify(DEFAULT_TEACHERS));
        setTeachers(DEFAULT_TEACHERS);
      }

      // 2. Routine Schedule
      const storedRoutine = localStorage.getItem('apex_routine_watson_dayshift');
      if (storedRoutine) {
        const parsedRoutine = JSON.parse(storedRoutine);
        let migrated = false;
        Object.keys(parsedRoutine).forEach(cls => {
          if (!parsedRoutine[cls]["Saturday"]) {
            migrated = true;
            parsedRoutine[cls]["Saturday"] = {};
            PERIODS.forEach(p => {
              parsedRoutine[cls]["Saturday"][p.id] = { teacherId: "", subject: "" };
            });
          }
        });

        if (migrated) {
          localStorage.setItem('apex_routine_watson_dayshift', JSON.stringify(parsedRoutine));
          setRoutine(parsedRoutine);
        } else {
          setRoutine(parsedRoutine);
        }
      } else {
        const initialRoutine = generateDefaultRoutine();
        localStorage.setItem('apex_routine_watson_dayshift', JSON.stringify(initialRoutine));
        setRoutine(initialRoutine);
      }

      // 3. Official Orders
      const storedOrders = localStorage.getItem('apex_orders_watson_dayshift');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      } else {
        localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(DEFAULT_ORDERS));
        setOrders(DEFAULT_ORDERS);
      }

      // 4. Leaves database
      const storedLeaves = localStorage.getItem('apex_leaves_watson_dayshift');
      if (storedLeaves) {
        setLeaves(JSON.parse(storedLeaves));
      } else {
        localStorage.setItem('apex_leaves_watson_dayshift', JSON.stringify([]));
        setLeaves([]);
      }

      // 5. Notices (Bulletin Board)
      const storedNotices = localStorage.getItem('apex_bulletin_notices');
      if (storedNotices) {
        setNotices(JSON.parse(storedNotices));
      } else {
        const defaultNotices = [
          { id: "NT-001", content: "DEO Office Order: Complete U-DISE+ student profile submissions urgently by Friday.", category: "Official", datePinned: new Date().toISOString().split('T')[0] },
          { id: "NT-002", content: "Weekly Staff Meeting on Saturday at 4:15 PM in Staff Room.", category: "General", datePinned: new Date().toISOString().split('T')[0] }
        ];
        localStorage.setItem('apex_bulletin_notices', JSON.stringify(defaultNotices));
        setNotices(defaultNotices);
      }

      // 6. Proxy records
      const storedProxies = localStorage.getItem('apex_proxy_records');
      if (storedProxies) {
        setProxyRecords(JSON.parse(storedProxies));
      } else {
        localStorage.setItem('apex_proxy_records', JSON.stringify([]));
        setProxyRecords([]);
      }
    }
  }, []);

  // Handler to edit a class routine slot
  const handleUpdateRoutine = async (classId, day, periodId, { teacherId, subject }) => {
    const updatedRoutine = { ...routine };
    if (!updatedRoutine[classId]) updatedRoutine[classId] = {};
    if (!updatedRoutine[classId][day]) updatedRoutine[classId][day] = {};
    
    updatedRoutine[classId][day][periodId] = { teacherId, subject };
    setRoutine(updatedRoutine);

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
    } else {
      localStorage.setItem('apex_routine_watson_dayshift', JSON.stringify(updatedRoutine));
    }
  };

  const handleAddLeave = async (teacherId, day) => {
    if (leaves.some(l => l.teacherId === teacherId && l.day === day)) return;
    const newLeave = { id: `LV-${Date.now()}`, teacherId, day };
    const newLeaves = [...leaves, newLeave];
    setLeaves(newLeaves);

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
    } else {
      localStorage.setItem('apex_leaves_watson_dayshift', JSON.stringify(newLeaves));
    }
  };

  const handleRemoveLeave = async (leaveId) => {
    const newLeaves = leaves.filter(l => l.id !== leaveId);
    setLeaves(newLeaves);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('leaves').delete().eq('id', leaveId);
      } catch (err) {
        console.error("Error removing leave from Supabase:", err);
      }
    } else {
      localStorage.setItem('apex_leaves_watson_dayshift', JSON.stringify(newLeaves));
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
    } else {
      localStorage.setItem('apex_bulletin_notices', JSON.stringify(updatedNotices));
    }
  };

  const handleRemoveNotice = async (noticeId) => {
    const updatedNotices = notices.filter(n => n.id !== noticeId);
    setNotices(updatedNotices);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notices').delete().eq('id', noticeId);
      } catch (err) {
        console.error("Error removing notice from Supabase:", err);
      }
    } else {
      localStorage.setItem('apex_bulletin_notices', JSON.stringify(updatedNotices));
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('teachers').update(updatedFields).eq('id', teacherId);
      } catch (err) {
        console.error("Error updating teacher in Supabase:", err);
      }
    } else {
      localStorage.setItem('apex_teachers_watson_dayshift', JSON.stringify(updatedTeachers));
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
    } else {
      localStorage.setItem('apex_proxy_records', JSON.stringify(updated));
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
    } else {
      localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(updatedOrders));
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          assignedTeacherId: teacherId,
          status: "In Progress"
        }).eq('id', orderId);
      } catch (err) {
        console.error("Error assigning teacher in Supabase:", err);
      }
    } else {
      localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(updatedOrders));
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

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          status: "Completed",
          reports: [newReport]
        }).eq('id', orderId);
      } catch (err) {
        console.error("Error submitting report in Supabase:", err);
      }
    } else {
      localStorage.setItem('apex_orders_watson_dayshift', JSON.stringify(updatedOrders));
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
