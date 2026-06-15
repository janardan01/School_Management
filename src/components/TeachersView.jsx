// Apex Task & Schedule Coordinator - Teachers Directory View Component

import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  Phone, 
  BookOpen, 
  FileText, 
  AlertTriangle,
  Award,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { calculateTeacherTeachingPeriods, DAYS, PERIODS } from '../utils/SmartAssigner';

import { Trash2, ShieldAlert } from 'lucide-react';

export default function TeachersView({ teachers, routine, orders, leaves = [], proxyRecords = [], onAddLeave, onRemoveLeave, onUpdateTeacher, language, t }) {
  const [selectedTeacher, setSelectedTeacher] = useState(null); // Detailed view drawer/modal
  const [leaveTeacherId, setLeaveTeacherId] = useState("");
  const [leaveDay, setLeaveDay] = useState("Monday");

  // Handle logging a leave
  const handleLogLeave = (e) => {
    e.preventDefault();
    if (!leaveTeacherId) return;
    onAddLeave(leaveTeacherId, leaveDay);
    setLeaveTeacherId("");
  };

  // Handle viewing detailed workload analysis
  const handleInspectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
  };

  // Get active admin assignments for a teacher
  const getTeacherAdminTasks = (teacherId) => {
    return orders.filter(o => o.assignedTeacherId === teacherId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Panel */}
      <div className="timetable-header-panel glass-panel" style={{ padding: '20px 24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users color="var(--accent-purple)" /> Staff Directory & Workload Center
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Monitor teaching timetables, active administrative duties, and balance task distribution among your peers.
          </p>
        </div>
      </div>

      {/* Leave & Absence Management Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
          <ShieldAlert /> {t('leavesPlannerTitle')}
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }} className="dashboard-layout">
          {/* Add Leave Form */}
          <form onSubmit={handleLogLeave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid var(--border-glass)', paddingRight: '24px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('logNewLeave')}</div>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'hi' ? 'शिक्षक चुनें' : 'Select Teacher'}</label>
              <select 
                className="form-select"
                value={leaveTeacherId}
                onChange={(e) => setLeaveTeacherId(e.target.value)}
                required
              >
                <option value="">{t('chooseTeacherOpt')}</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.75rem' }}>{language === 'hi' ? 'अवकाश का दिन चुनें' : 'Select Leave Day'}</label>
              <select 
                className="form-select"
                value={leaveDay}
                onChange={(e) => setLeaveDay(e.target.value)}
                required
              >
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '10px', fontSize: '0.8rem', background: 'var(--accent-rose)', color: 'var(--bg-dark)' }}>
              {t('markAbsentBtn')}
            </button>
          </form>

          {/* Active Leaves List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('loggedLeavesList')}</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px' }}>
              {leaves.length === 0 ? (
                <div style={{ padding: '24px', border: '1px dashed var(--border-glass)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  {t('allPresent')}
                </div>
              ) : (
                leaves.map(leave => {
                  const teacher = teachers.find(t => t.id === leave.teacherId);
                  return (
                    <div 
                      key={leave.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        background: 'rgba(255, 255, 255, 0.01)', 
                        border: '1px solid var(--border-glass)', 
                        padding: '8px 16px', 
                        borderRadius: '8px' 
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-rose)' }} />
                        <strong>{teacher?.name}</strong>
                        <span style={{ color: 'var(--text-secondary)' }}>{language === 'hi' ? 'अवकाश पर' : 'on Leave'} ({leave.day})</span>
                      </div>
                      <button 
                        type="button"
                        className="btn btn-secondary btn-icon-only" 
                        onClick={() => onRemoveLeave(leave.id)} 
                        style={{ width: '28px', height: '28px', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}
                        title="Remove Leave"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Teachers */}
      <div className="teacher-grid">
        {teachers.map(teacher => {
          const teachingPeriods = calculateTeacherTeachingPeriods(routine, teacher.id);
          const teacherTasks = getTeacherAdminTasks(teacher.id);
          const activeTasks = teacherTasks.filter(t => t.status !== "Completed");
          const avatarChar = teacher.name.split(" ")[1]?.charAt(0) || "T";

          return (
            <div 
              key={teacher.id} 
              className="glass-panel teacher-card"
              style={{ '--accent-color': teacher.color }}
            >
              <div className="teacher-profile-header">
                <div 
                  className="teacher-card-avatar"
                  style={{ 
                    '--avatar-bg': `${teacher.color}12`, 
                    '--accent-color': teacher.color,
                    color: teacher.color
                  }}
                >
                  {avatarChar}
                </div>
                <div className="teacher-card-title">
                  <span className="teacher-card-name">{teacher.name}</span>
                  <span className="teacher-card-sub">{teacher.subject} {language === 'hi' ? 'विशेषज्ञ' : 'Specialist'}</span>
                </div>
              </div>

              <div className="teacher-metric-row">
                <div className="teacher-metric" style={{ flex: 1 }}>
                  <div className="teacher-metric-val">{teachingPeriods}</div>
                  <div className="teacher-metric-lbl">{t('periodsWk')}</div>
                </div>
                <div className="teacher-metric" style={{ borderLeft: '1px solid var(--border-glass)', flex: 1 }}>
                  <div className="teacher-metric-val" style={{ color: activeTasks.length > 0 ? 'var(--accent-purple)' : 'var(--text-primary)' }}>
                    {activeTasks.length}
                  </div>
                  <div className="teacher-metric-lbl">{language === 'hi' ? 'सक्रिय कार्य' : 'Active Tasks'}</div>
                </div>
                <div className="teacher-metric" style={{ borderLeft: '1px solid var(--border-glass)', flex: 1 }}>
                  <div className="teacher-metric-val" style={{ color: 'var(--accent-cyan)' }}>
                    {proxyRecords.filter(px => px.substituteTeacherId === teacher.id).length}
                  </div>
                  <div className="teacher-metric-lbl">{t('proxiesCovered')}</div>
                </div>
              </div>

              {/* Status Indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{language === 'hi' ? 'कार्यभार संतुलन:' : 'Workload Balance:'}</span>
                  {activeTasks.length >= 2 ? (
                    <span style={{ color: 'var(--accent-rose)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={12} /> {t('overburdened')}
                    </span>
                  ) : teachingPeriods >= 22 ? (
                    <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{t('timetableDense')}</span>
                  ) : (
                    <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{t('balanced')}</span>
                  )}
                </div>
                <div className="gauge-track">
                  <div 
                    className="gauge-fill"
                    style={{ 
                      width: `${Math.min(100, ((teachingPeriods + activeTasks.length * 4) / 28) * 100)}%`,
                      background: activeTasks.length >= 2 
                        ? 'var(--accent-rose)' 
                        : teachingPeriods >= 22 
                          ? 'var(--accent-amber)' 
                          : 'var(--accent-emerald)'
                    }}
                  ></div>
                </div>
              </div>

              {/* Quick Contacts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '2px' }}>{t('quickContacts')}:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={12} /> <span>{teacher.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={12} /> <span>+91 {teacher.phone}</span>
                </div>
              </div>

              {/* Action Button */}
              <button 
                className="btn btn-secondary w-full"
                style={{ fontSize: '0.8rem', padding: '8px' }}
                onClick={() => handleInspectTeacher(teacher)}
              >
                {t('inspectWorkloadBtn')} <ArrowRight size={12} />
              </button>

            </div>
          );
        })}
      </div>

      {/* Teacher Detailed Modal */}
      {selectedTeacher && (
        <div className="modal-overlay" onClick={() => setSelectedTeacher(null)}>
          <div className="modal-container glass-panel" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  className="avatar" 
                  style={{ 
                    border: `1px solid ${selectedTeacher.color}`, 
                    color: selectedTeacher.color,
                    boxShadow: `0 0 10px ${selectedTeacher.color}30`,
                    background: `${selectedTeacher.color}05`
                  }}
                >
                  {selectedTeacher.name.split(" ")[1]?.charAt(0) || "T"}
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedTeacher.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedTeacher.subject} Specialization</div>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedTeacher(null)}>&times;</button>
            </div>

            {/* Teaching Schedule Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                  <BookOpen size={16} /> {t('routineAnalysisTitle')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {language === 'hi' ? (
                    <>सांकेतिक गणना: साप्ताहिक <strong>{calculateTeacherTeachingPeriods(routine, selectedTeacher.id)} घंटी</strong> आवंटित की गई हैं (अधिकतम अनुशंसित सीमा 18 में से)।</>
                  ) : (
                    <>Calculated weekly: <strong>{calculateTeacherTeachingPeriods(routine, selectedTeacher.id)} periods</strong> assigned out of maximum recommended weekly limit of 18.</>
                  )}
                </p>

                {/* Day by Day Teaching Slots */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {DAYS.map(day => {
                    const daySlots = [];
                    PERIODS.forEach(p => {
                      const schedule = getTeacherScheduleAt(routine, selectedTeacher.id, day, p.id);
                      if (schedule) {
                        daySlots.push({ periodName: p.name, time: p.time, ...schedule });
                      }
                    });

                    return (
                      <div key={day} style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.8rem', gap: '12px' }}>
                        <span style={{ fontWeight: 700, width: '90px', color: 'var(--text-primary)' }}>
                          {language === 'hi' 
                            ? (day === "Monday" ? "सोमवार" : day === "Tuesday" ? "मंगलवार" : day === "Wednesday" ? "बुधवार" : day === "Thursday" ? "गुरुवार" : day === "Friday" ? "शुक्रवार" : day === "Saturday" ? "शनिवार" : "रविवार") 
                            : day}:
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flexGrow: 1 }}>
                          {daySlots.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>{language === 'hi' ? 'आज कोई घंटी नहीं (पूरी तरह खाली)' : 'No teaching commitments today (Fully Free)'}</span>
                          ) : (
                            daySlots.map((s, idx) => (
                              <span key={idx} style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-glass)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem' }}>
                                <strong>{language === 'hi' ? s.periodName.replace("Period", "घंटी") : s.periodName}</strong>: {s.subject} ({s.classId})
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Administrative Tasks Details */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
                  <FileText size={16} /> {t('dutyListTitle')}
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  {getTeacherAdminTasks(selectedTeacher.id).length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border-glass)', borderRadius: '8px', textAlign: 'center' }}>
                      {t('noDutiesLogged')}
                    </div>
                  ) : (
                    getTeacherAdminTasks(selectedTeacher.id).map(o => (
                      <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{o.title}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {t('deadline')}: {o.deadline} | {language === 'hi' ? 'स्रोत' : 'Source'}: {o.authority}
                          </div>
                        </div>
                        <div>
                          <span className={`badge status-${o.status.toLowerCase().replace(" ", "")}`}>
                            {o.status === 'Completed' ? t('completed') : o.status === 'In Progress' ? t('inProgress') : t('pending')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Proxy Substitution History */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                  <Clock size={16} /> {t('proxyHistoryTitle')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {t('proxyCoveredPeriods')} <strong>{proxyRecords.filter(px => px.substituteTeacherId === selectedTeacher.id).length} {language === 'hi' ? 'घंटी' : 'periods'}</strong>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', maxHeight: '120px', overflowY: 'auto' }}>
                  {proxyRecords.filter(px => px.substituteTeacherId === selectedTeacher.id).length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      {t('noSubstitutions')}
                    </div>
                  ) : (
                    proxyRecords.filter(px => px.substituteTeacherId === selectedTeacher.id).map(px => (
                      <div key={px.id} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '6px 10px', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Class <strong>{px.classId}</strong> for <strong>{teachers.find(t => t.id === px.absentTeacherId)?.name?.split(" ").slice(1).join(" ") || "Absent Staff"}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>{language === 'hi' ? (px.day === "Monday" ? "सोमवार" : px.day === "Tuesday" ? "मंगलवार" : px.day === "Wednesday" ? "बुधवार" : px.day === "Thursday" ? "गुरुवार" : px.day === "Friday" ? "शुक्रवार" : px.day === "Saturday" ? "शनिवार" : "रविवार") : px.day}, Period {px.periodId}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Availability & Wishlist Preferences Editor */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                  <Sparkles size={16} /> {t('preferencesTitle')}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t('preferredDay')}</label>
                    <select
                      value={selectedTeacher.preferredDay || "Monday"}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateTeacher(selectedTeacher.id, { preferredDay: val });
                        setSelectedTeacher(prev => ({ ...prev, preferredDay: val }));
                      }}
                      style={{ background: 'var(--bg-slate)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                    >
                      {DAYS.map(d => <option key={d} value={d}>{language === 'hi' ? (d === "Monday" ? "सोमवार" : d === "Tuesday" ? "मंगलवार" : d === "Wednesday" ? "बुधवार" : d === "Thursday" ? "गुरुवार" : d === "Friday" ? "शुक्रवार" : d === "Saturday" ? "शनिवार" : "रविवार") : d}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t('preferredPeriod')}</label>
                    <select
                      value={selectedTeacher.preferredPeriodId || 1}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onUpdateTeacher(selectedTeacher.id, { preferredPeriodId: val });
                        setSelectedTeacher(prev => ({ ...prev, preferredPeriodId: val }));
                      }}
                      style={{ background: 'var(--bg-slate)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                    >
                      {PERIODS.map(p => <option key={p.id} value={p.id}>{language === 'hi' ? p.name.replace("Period", "घंटी") : p.name}</option>)}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{t('maxWeeklyLoad')}</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={selectedTeacher.maxWeeklyLoad || 18}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 18;
                        onUpdateTeacher(selectedTeacher.id, { maxWeeklyLoad: val });
                        setSelectedTeacher(prev => ({ ...prev, maxWeeklyLoad: val }));
                      }}
                      style={{ background: 'var(--bg-slate)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Close Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setSelectedTeacher(null)}>
                  {language === 'hi' ? 'प्रोफ़ाइल बंद करें' : 'Close Profile'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
