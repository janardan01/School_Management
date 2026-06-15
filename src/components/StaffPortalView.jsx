// Apex Task & Schedule Coordinator - Staff Personal Desk Component
import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  FileText, 
  Check, 
  LogOut, 
  BookOpen, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Send
} from 'lucide-react';
import { calculateTeacherTeachingPeriods, getTeacherScheduleAt, DAYS, PERIODS, CLASSES } from '../utils/SmartAssigner';

export default function StaffPortalView({ teachers, routine, orders, leaves = [], notices = [], onSubmitReport, language, t }) {
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [reportContent, setReportContent] = useState("");
  const [reportingOrderId, setReportingOrderId] = useState("");
  
  const currentTeacher = teachers.find(t => t.id === selectedTeacherId);

  // Get active admin assignments for the logged-in teacher
  const getTeacherTasks = () => {
    return orders.filter(o => o.assignedTeacherId === selectedTeacherId);
  };

  // Get classes for a specific day
  const getDaySchedule = (day) => {
    const slots = [];
    PERIODS.forEach(p => {
      const schedule = getTeacherScheduleAt(routine, selectedTeacherId, day, p.id);
      if (schedule) {
        slots.push({ period: p, ...schedule });
      }
    });
    return slots;
  };

  const handleSelectTeacher = (id) => {
    setSelectedTeacherId(id);
    setReportingOrderId("");
    setReportContent("");
  };

  const handleReportFormSubmit = (e) => {
    e.preventDefault();
    if (!reportingOrderId || !reportContent.trim()) return;
    
    onSubmitReport(reportingOrderId, selectedTeacherId, reportContent);
    setReportingOrderId("");
    setReportContent("");
  };

  const translateClass = (clsName) => {
    return language === 'hi' ? clsName.replace("Grade", "वर्ग") : clsName;
  };

  if (!selectedTeacherId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="timetable-header-panel glass-panel" style={{ padding: '20px 24px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User color="var(--accent-cyan)" /> {t('staffPortalAccessTitle')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
              {t('staffPortalAccessDesc')}
            </p>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '24px' }}>{t('whoAccessingDesk')}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {teachers.map(tTeacher => (
              <div 
                key={tTeacher.id} 
                className="glass-panel glass-card-interactive" 
                style={{ padding: '20px', borderLeft: `4px solid ${tTeacher.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
                onClick={() => handleSelectTeacher(tTeacher.id)}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `${tTeacher.color}15`, color: tTeacher.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {tTeacher.name.split(" ")[1]?.charAt(0) || "T"}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{tTeacher.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{t(tTeacher.subject)} {t('subjectSpecialist')}</div>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{language === 'hi' ? 'डेस्क में प्रवेश करें' : 'Access Desk'} &rarr;</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const teacherTasks = getTeacherTasks();
  const activeTasks = teacherTasks.filter(tTask => tTask.status !== "Completed");
  const completedTasks = teacherTasks.filter(tTask => tTask.status === "Completed");
  const weeklyPeriods = calculateTeacherTeachingPeriods(routine, selectedTeacherId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Personalized Header Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.05) 0%, rgba(138, 43, 226, 0.05) 100%)', border: '1px solid rgba(0, 240, 255, 0.2)', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: `2px solid ${currentTeacher.color}`, color: currentTeacher.color, background: `${currentTeacher.color}05`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.4rem' }}>
            {currentTeacher.name.split(" ")[1]?.charAt(0) || "T"}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-cyan)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{t('teacherDeskActive')}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>{language === 'hi' ? 'नमस्ते,' : 'Namaste,'} {currentTeacher.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t(currentTeacher.subject)} {language === 'hi' ? 'विभाग | विशेष डेस्क पहुंच सक्षम।' : 'Faculty | Special desk access enabled.'}</p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={() => setSelectedTeacherId("")} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={16} /> {t('exitDesk')}
        </button>
      </div>

      {/* Leave Status Alert */}
      {(() => {
        const myLeaves = leaves.filter(l => l.teacherId === selectedTeacherId);
        if (myLeaves.length === 0) return null;
        return (
          <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent-rose)', background: 'var(--accent-rose-glow)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle color="var(--accent-rose)" />
            <div style={{ fontSize: '0.85rem', textAlign: 'left' }}>
              <strong>{t('leaveStatusAlert')}</strong> {t('leaveStatusAlertDesc')} <strong>{myLeaves.map(l => t(l.day)).join(", ")}</strong>{t('leaveStatusAlertSuffix')}
            </div>
          </div>
        );
      })()}

      {/* Metric Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{language === 'hi' ? 'साप्ताहिक शिक्षण कार्यभार' : 'Weekly Teaching Load'}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>{weeklyPeriods} {language === 'hi' ? 'घंटी' : 'Periods'}</div>
          </div>
          <BookOpen size={28} color="var(--accent-cyan)" style={{ opacity: 0.8 }} />
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{language === 'hi' ? 'सक्रिय प्रशासनिक कर्तव्य' : 'Active Admin Duties'}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-purple)', marginTop: '4px' }}>{activeTasks.length} {t('statusBadgePending')}</div>
          </div>
          <FileText size={28} color="var(--accent-purple)" style={{ opacity: 0.8 }} />
        </div>
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{language === 'hi' ? 'पूर्ण प्रशासनिक कर्तव्य' : 'Duties Completed'}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>{completedTasks.length} {language === 'hi' ? 'रिपोर्ट' : 'Reports'}</div>
          </div>
          <CheckCircle2 size={28} color="var(--accent-emerald)" style={{ opacity: 0.8 }} />
        </div>
      </div>

      {/* Main Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }} className="dashboard-layout">
        
        {/* Left Side: Timetable Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar color="var(--accent-cyan)" /> {t('myPersonalWeeklySchedule')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{t('personalScheduleDesc')}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              {DAYS.map(day => {
                const daySlots = getDaySchedule(day);
                return (
                  <div key={day} style={{ display: 'flex', border: '1px solid var(--border-glass)', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255, 255, 255, 0.01)' }}>
                    <div style={{ width: '110px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', borderRight: '1px solid var(--border-glass)', textAlign: 'center' }}>
                      {t(day)}
                    </div>
                    <div style={{ flexGrow: 1, padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-start' }}>
                      {daySlots.length === 0 ? (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{t('noCommitmentsFree')}</span>
                      ) : (
                        daySlots.map((s, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              background: 'rgba(255, 255, 255, 0.03)', 
                              border: `1px solid ${currentTeacher.color}30`, 
                              borderRadius: '8px', 
                              padding: '8px 12px', 
                              fontSize: '0.8rem',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              minWidth: '150px',
                              textAlign: 'left'
                            }}
                          >
                            <span style={{ fontWeight: 700, color: currentTeacher.color }}>{language === 'hi' ? s.period.name.replace("Period", "घंटी") : s.period.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.period.time}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', marginTop: '2px' }}>{t(s.subject)} ({translateClass(s.classId)})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Assigned Admin Work & Submission Forms */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Digital Notice Board */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)' }}>
              <Sparkles size={18} color="var(--accent-amber)" /> {t('schoolNoticeBoard')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notices.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', border: '1px dashed var(--border-glass)', borderRadius: '8px' }}>
                  {t('noPinnedNotices')}
                </div>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
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
                        {notice.category === 'Official' ? t('categoryOfficial') : notice.category === 'General' ? t('categoryGeneral') : notice.category === 'Urgent' ? (language === 'hi' ? 'अति आवश्यक' : 'Urgent') : notice.category}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{notice.datePinned}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: '1.4' }}>{notice.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Admin Duties */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
              <FileText /> {t('myOfficialAdminDuties')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeTasks.length === 0 ? (
                <div style={{ padding: '24px', border: '1px dashed var(--border-glass)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {t('noPendingAdminDuties')}
                </div>
              ) : (
                activeTasks.map(task => (
                  <div key={task.id} className="glass-panel" style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', textAlign: 'left' }}>{task.title}</span>
                      <span className={`badge priority-${task.priority.toLowerCase()}`}>{task.priority === "High" ? t('high') : task.priority === "Medium" ? t('medium') : t('low')}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: '1.4' }}>{task.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '8px', marginTop: '4px' }}>
                      <span>{language === 'hi' ? 'अंतिम तिथि:' : 'Deadline:'} <strong>{task.deadline}</strong></span>
                      <span>{language === 'hi' ? 'कार्यालय:' : 'From:'} {task.authority}</span>
                    </div>

                    <button 
                      className="btn btn-secondary w-full" 
                      style={{ fontSize: '0.75rem', padding: '6px 12px', marginTop: '6px' }}
                      onClick={() => {
                        setReportingOrderId(task.id);
                        setReportContent("");
                      }}
                    >
                      {t('submitComplianceReport')}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Compliance Report Submission Box */}
          {reportingOrderId && (
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--accent-emerald)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check /> {t('fileComplianceReport')}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                {t('reportingFor')} <strong>{orders.find(o => o.id === reportingOrderId)?.title}</strong>
              </p>

              <form onSubmit={handleReportFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem', textAlign: 'left' }}>{t('submissionReportDetails')}</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4} 
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder={t('enterComplianceDetailsPlaceholder')}
                    required
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => setReportingOrderId("")}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--accent-emerald)', color: 'var(--bg-dark)' }}>
                    <Send size={12} /> {t('submit')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
