// Apex Task & Schedule Coordinator - Dashboard View Component

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  CheckSquare, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { 
  calculateTeacherTeachingPeriods, 
  getTeacherScheduleAt, 
  DAYS, 
  PERIODS 
} from '../utils/SmartAssigner';

import { Pin, Trash } from 'lucide-react';

export default function DashboardView({ 
  teachers, 
  routine, 
  orders, 
  leaves = [], 
  notices = [], 
  onAddNotice, 
  onRemoveNotice, 
  onNavigate,
  language,
  t
}) {
  // Real-time selector for checking free teachers
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [selectedPeriod, setSelectedPeriod] = useState(1);

  // Pin notice form state
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const [newNoticeCategory, setNewNoticeCategory] = useState("General");

  const handlePinNoticeSubmit = (e) => {
    e.preventDefault();
    if (!newNoticeContent.trim()) return;
    onAddNotice(newNoticeContent, newNoticeCategory);
    setNewNoticeContent("");
  };

  // Set default current day based on local time
  useEffect(() => {
    const todayNum = new Date().getDay(); // 1 = Monday, 5 = Friday
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = daysOfWeek[todayNum];
    if (DAYS.includes(dayName)) {
      setSelectedDay(dayName);
    }
  }, []);

  // Compute metrics
  const activeOrdersCount = orders.filter(o => o.status !== "Completed").length;
  const completedOrdersCount = orders.filter(o => o.status === "Completed").length;
  const totalTeachersCount = teachers.length;
  
  // Calculate average teaching load
  let totalTeachingPeriods = 0;
  teachers.forEach(t => {
    totalTeachingPeriods += calculateTeacherTeachingPeriods(routine, t.id);
  });
  const avgTeachingPeriods = (totalTeachingPeriods / totalTeachersCount).toFixed(1);

  // Identify teachers free at the selected day/period
  const getTeacherAvailability = () => {
    return teachers.map(teacher => {
      const isOnLeaveToday = leaves.some(l => l.teacherId === teacher.id && l.day === selectedDay);
      const schedule = getTeacherScheduleAt(routine, teacher.id, selectedDay, selectedPeriod);
      const activeAdminTasks = orders.filter(o => o.assignedTeacherId === teacher.id && o.status !== "Completed").length;
      return {
        ...teacher,
        isFree: !schedule && !isOnLeaveToday,
        isOnLeave: isOnLeaveToday,
        currentClass: isOnLeaveToday ? "On Leave" : (schedule ? schedule.classId : null),
        currentSubject: isOnLeaveToday ? "" : (schedule ? schedule.subject : null),
        activeAdminTasks
      };
    });
  };

  const availabilityList = getTeacherAvailability();
  const freeTeachersCount = availabilityList.filter(t => t.isFree).length;

  // Sorted upcoming tasks
  const activeTasks = orders
    .filter(o => o.status !== "Completed")
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  // Determine current computer teacher workload details to show personalized highlights
  const computerTeacher = teachers.find(t => t.id === "T1");
  const compActiveTasks = orders.filter(o => o.assignedTeacherId === "T1" && o.status !== "Completed").length;

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-panel welcome-banner-wrap" style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(138, 43, 226, 0.05) 100%)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-cyan)', letterSpacing: '1px', textTransform: 'uppercase' }}>{t('automationPanel')}</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700 }}>{t('welcomeTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            {t('welcomeSubtitle')}
          </p>
        </div>
        
        {/* Personalized Computer Teacher Warning/Status */}
        <div className="glass-panel" style={{ padding: '16px', background: compActiveTasks >= 2 ? 'var(--accent-rose-glow)' : 'rgba(255, 255, 255, 0.02)', borderColor: compActiveTasks >= 2 ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-glass)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {compActiveTasks >= 2 ? (
            <ShieldAlert size={36} color="var(--accent-rose)" />
          ) : (
            <TrendingUp size={36} color="var(--accent-cyan)" />
          )}
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Your Admin Workload</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: compActiveTasks >= 2 ? 'var(--accent-rose)' : 'var(--accent-cyan)' }}>
              {compActiveTasks} Active Tasks
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {compActiveTasks >= 2 ? "Overloaded! Engine shielding you." : "Healthy capacity. Safe to assign."}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-content">
            <h3>Active Admin Orders</h3>
            <div className="kpi-number">{activeOrdersCount}</div>
            <span className="kpi-badge">
              <FileText size={12} color="var(--accent-cyan)" /> BRC / DEO Office
            </span>
          </div>
          <div className="kpi-icon-container cyan">
            <FileText size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-content">
            <h3>{language === 'hi' ? 'सक्रिय शिक्षक' : 'Active Teachers'}</h3>
            <div className="kpi-number">{totalTeachersCount}</div>
            <span className="kpi-badge">
              <Users size={12} color="var(--accent-purple)" strokeWidth={1.5} /> {language === 'hi' ? 'शिक्षण स्टाफ' : 'Academic Staff'}
            </span>
          </div>
          <div className="kpi-icon-container purple">
            <Users size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-content">
            <h3>{language === 'hi' ? 'औसत कार्यभार' : 'Avg Teaching Load'}</h3>
            <div className="kpi-number">{avgTeachingPeriods} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{language === 'hi' ? 'घंटी' : 'hrs'}</span></div>
            <span className="kpi-badge">
              <BookOpen size={12} color="var(--accent-emerald)" strokeWidth={1.5} /> {t('periodsWk')}
            </span>
          </div>
          <div className="kpi-icon-container emerald">
            <BookOpen size={24} />
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-content">
            <h3>{language === 'hi' ? 'पूर्ण रिपोर्ट' : 'Completed Reports'}</h3>
            <div className="kpi-number">{completedOrdersCount}</div>
            <span className="kpi-badge">
              <CheckSquare size={12} color="var(--accent-amber)" strokeWidth={1.5} /> {language === 'hi' ? 'अभिलेख लॉग' : 'Logs Archive'}
            </span>
          </div>
          <div className="kpi-icon-container amber">
            <CheckSquare size={24} />
          </div>
        </div>
      </div>

      {/* Dashboard Details Row */}
      <div className="dashboard-layout">
        
        {/* Left Column: Real-Time Availability & Upcoming Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Real-Time Teacher Scheduler Search */}
          <div className="glass-panel section-card">
            <div className="section-header">
              <div className="section-title">
                <Clock size={20} color="var(--accent-cyan)" />
                {language === 'hi' ? 'शिक्षक उपलब्धता जांच' : 'Real-Time Teacher Availability Checker'}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select 
                  className="form-select" 
                  value={selectedDay} 
                  onChange={(e) => setSelectedDay(e.target.value)}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select 
                  className="form-select" 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {PERIODS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ padding: '8px 12px', background: 'rgba(0, 240, 255, 0.03)', border: '1px dashed rgba(0, 240, 255, 0.2)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{t('selectDay')}: <strong>{selectedDay}</strong> | {language === 'hi' ? 'समय' : 'Time'}: <strong>{PERIODS.find(p => p.id === selectedPeriod)?.time}</strong></span>
              <span>{language === 'hi' ? 'उपलब्ध शिक्षक' : 'Available Teachers'}: <strong>{freeTeachersCount} of {totalTeachersCount}</strong></span>
            </div>

            <div className="free-now-grid">
              {availabilityList.map(teacher => {
                const avatarChar = teacher.name.split(" ")[1]?.charAt(0) || "T";
                return (
                  <div 
                    key={teacher.id} 
                    className="free-now-chip" 
                    style={{ 
                      borderColor: teacher.isOnLeave ? 'rgba(239, 68, 68, 0.3)' : (teacher.isFree ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-glass)'),
                      background: teacher.isOnLeave ? 'var(--accent-rose-glow)' : (teacher.isFree ? 'rgba(34, 197, 94, 0.02)' : 'rgba(255, 255, 255, 0.01)')
                    }}
                  >
                    <div 
                      className="free-now-avatar" 
                      style={{ 
                        background: `${teacher.color}15`, 
                        color: teacher.color,
                        border: `1px solid ${teacher.color}`
                      }}
                    >
                      {avatarChar}
                    </div>
                    <div className="free-now-name" style={{ color: teacher.isOnLeave ? 'var(--accent-rose)' : (teacher.isFree ? 'var(--text-primary)' : 'var(--text-muted)') }}>{teacher.name}</div>
                    <div className="free-now-subject">{teacher.subject}</div>
                    
                    {teacher.isOnLeave ? (
                      <span className="badge priority-high" style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>{language === 'hi' ? 'अवकाश' : 'On Leave'}</span>
                    ) : teacher.isFree ? (
                      <span className="badge status-completed" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>{language === 'hi' ? 'उपलब्ध' : 'Available'}</span>
                    ) : (
                      <span className="badge priority-high" style={{ fontSize: '0.6rem', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'कक्षा' : 'In'} {teacher.currentClass}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming BRC/DEO Orders Deadlines */}
          <div className="glass-panel section-card">
            <div className="section-header">
              <div className="section-title">
                <Calendar size={20} color="var(--accent-purple)" />
                {t('recentDirectives')}
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                onClick={() => onNavigate('orders')}
              >
                {language === 'hi' ? 'सभी आदेश देखें' : 'Manage All Orders'} <ArrowRight size={12} />
              </button>
            </div>

            <div className="orders-quick-list">
              {activeTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px' }}>
                  <p>{t('noDirectives')}</p>
                </div>
              ) : (
                activeTasks.map(order => {
                  const assignedTeacher = teachers.find(t => t.id === order.assignedTeacherId);
                  return (
                    <div key={order.id} className="order-quick-card">
                      <div className="order-info">
                        <div className="order-title-text">{order.title}</div>
                        <div className="order-meta-text">
                          <span>{language === 'hi' ? 'कार्यालय' : 'Authority'}: <strong>{order.authority}</strong></span>
                          <span>{t('deadline')}: <strong style={{ color: 'var(--accent-rose)' }}>{order.deadline}</strong></span>
                          {order.eventTime && (
                            <span className="badge status-inprogress" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                              {language === 'hi' ? 'समय-विशिष्ट गतिविधि' : 'Time-Specific Activity'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <span className={`badge priority-${order.priority.toLowerCase()}`}>
                          {order.priority === 'High' ? t('high') : order.priority === 'Medium' ? t('medium') : t('low')}
                        </span>
                        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{t('assignedStaffCol')}:</span>
                          <span 
                            style={{ 
                              fontWeight: 600, 
                              color: assignedTeacher ? assignedTeacher.color : 'var(--accent-rose)' 
                            }}
                          >
                            {assignedTeacher ? assignedTeacher.name.split(" ")[1] : "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Notice Board & Workload Balancer Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Digital Notice Board */}
          <div className="glass-panel section-card">
            <div className="section-header">
              <div className="section-title" style={{ color: 'var(--accent-amber)' }}>
                <Pin size={20} /> {t('noticeBoardTitle')}
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t('noticeBoardSubtitle')}
            </p>

            {/* Pin New Notice Form (Admin View) */}
            <form onSubmit={handlePinNoticeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
              <textarea 
                className="form-input" 
                rows={2} 
                value={newNoticeContent}
                onChange={(e) => setNewNoticeContent(e.target.value)}
                placeholder={t('enterNoticePlaceholder')}
                required
                style={{ fontSize: '0.8rem', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <select 
                  className="form-select"
                  value={newNoticeCategory}
                  onChange={(e) => setNewNoticeCategory(e.target.value)}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', width: '120px' }}
                >
                  <option value="General">{t('categoryGeneral')}</option>
                  <option value="Official">{t('categoryOfficial')}</option>
                  <option value="Urgent">{language === 'hi' ? 'उच्च' : 'Urgent'}</option>
                </select>
                <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  {t('pinNoticeBtn')}
                </button>
              </div>
            </form>

            {/* Notices List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {notices.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                  📌 {t('noNotices')}
                </div>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span 
                          className={`badge ${
                            notice.category === 'Urgent' 
                              ? 'priority-high' 
                              : notice.category === 'Official' 
                                ? 'status-inprogress' 
                                : 'priority-low'
                          }`}
                          style={{ fontSize: '0.6rem', padding: '1px 5px' }}
                        >
                          {notice.category === 'Official' ? t('categoryOfficial') : notice.category === 'General' ? t('categoryGeneral') : (language === 'hi' ? 'उच्च' : 'Urgent')}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{notice.datePinned}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{notice.content}</p>
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => onRemoveNotice(notice.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                      title="Unpin announcement"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

           {/* Workload Balancer Analytics */}
          <div className="glass-panel section-card">
          <div className="section-header">
            <div className="section-title">
              <Users size={20} color="var(--accent-purple)" />
              {t('loadStatus')}
            </div>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
              onClick={() => onNavigate('teachers')}
            >
              {t('teachers')}
            </button>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {t('staffDirectoryDesc')}
          </p>

          <div className="workload-list">
            {teachers.map(t => {
              const teachingHrs = calculateTeacherTeachingPeriods(routine, t.id);
              const activeAdmin = orders.filter(o => o.assignedTeacherId === t.id && o.status !== "Completed").length;
              
              // Load metrics: teaching load max 24 periods, admin load max 3 tasks
              const teachingPercentage = Math.round((teachingHrs / 24) * 100);
              const totalBurdenIndex = activeAdmin; // Visual count of letters

              return (
                <div key={t.id} className="workload-item">
                  <div className="workload-header">
                    <span className="teacher-name" style={{ color: t.color }}>{t.name}</span>
                    <span className="teacher-stats">
                      <strong>{teachingHrs}</strong> Periods | <strong>{activeAdmin}</strong> Admin Tasks
                    </span>
                  </div>
                  
                  {/* Teaching Load Bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                      <span>{language === 'hi' ? 'समय-सारणी कार्यभार' : 'Timetable Workload'}</span>
                      <span>{teachingPercentage}% {language === 'hi' ? 'क्षमता' : 'Capacity'}</span>
                    </div>
                    <div className="gauge-track">
                      <div 
                        className="gauge-fill" 
                        style={{ 
                          width: `${Math.min(100, teachingPercentage)}%`,
                          background: `linear-gradient(90deg, ${t.color}90 0%, ${t.color} 100%)`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Admin Tasks Blocks */}
                  {totalBurdenIndex > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                      <div style={{ fontSize: '0.65rem', display: 'flex', justifyContent: 'space-between', color: 'var(--accent-purple)' }}>
                        <span>{language === 'hi' ? 'प्रशासनिक बोझ' : 'Administrative Burden'}</span>
                        <span>{activeAdmin} {language === 'hi' ? 'सक्रिय कार्य' : 'active tasks'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: activeAdmin }).map((_, i) => (
                          <div 
                            key={i} 
                            style={{ 
                              height: '6px', 
                              flexGrow: 1, 
                              borderRadius: '2px', 
                              background: 'var(--accent-purple)',
                              boxShadow: '0 0 8px var(--accent-purple-glow)' 
                            }}
                          ></div>
                        ))}
                        {/* Warnings for heavy load */}
                        {activeAdmin >= 2 && (
                          <AlertTriangle 
                            size={12} 
                            color="var(--accent-rose)" 
                            style={{ marginLeft: '4px', alignSelf: 'center' }} 
                            title="Heavy administrative burden!"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
