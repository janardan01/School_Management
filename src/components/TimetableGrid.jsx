// Apex Task & Schedule Coordinator - Timetable Grid Component

import React, { useState } from 'react';
import { 
  Calendar, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Plus, 
  Check, 
  BookOpen, 
  HelpCircle,
  AlertCircle,
  Printer,
  Share2,
  FileDown,
  FileUp
} from 'lucide-react';
import { DAYS, PERIODS, CLASSES, CLASS_METADATA, calculateTeacherTeachingPeriods } from '../utils/SmartAssigner';

export default function TimetableGrid({ teachers, routine, orders = [], leaves = [], proxyRecords = [], onAddProxyRecord, onUpdateRoutine, language, t }) {
  const [selectedClass, setSelectedClass] = useState("Grade 9");
  const [editingSlot, setEditingSlot] = useState(null); // { day, periodId }
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [collisionWarning, setCollisionWarning] = useState("");
  const [selectedProxyDay, setSelectedProxyDay] = useState("Monday");

  const translateDay = (dayStr) => {
    const dayMap = {
      "Monday": "सोमवार",
      "Tuesday": "मंगलवार",
      "Wednesday": "बुधवार",
      "Thursday": "गुरुवार",
      "Friday": "शुक्रवार",
      "Saturday": "शनिवार",
      "Sunday": "रविवार"
    };
    return language === 'hi' ? dayMap[dayStr] || dayStr : dayStr;
  };

  const translatePeriod = (pName) => {
    return language === 'hi' ? pName.replace("Period", "घंटी") : pName;
  };

  // Get active workload warnings
  const getWorkloadWarnings = () => {
    const warnings = [];
    teachers.forEach(t => {
      // 1. Total weekly load limit (> 18 periods)
      const weeklyPeriods = calculateTeacherTeachingPeriods(routine, t.id);
      if (weeklyPeriods > 18) {
        warnings.push({
          teacherId: t.id,
          teacherName: t.name,
          type: "total_load",
          message: `⚠️ Overloaded: ${t.name} has ${weeklyPeriods} teaching periods this week (exceeds recommended limit of 18).`
        });
      }

      // 2. Consecutive teaching slots check (back-to-back > 2 periods)
      DAYS.forEach(day => {
        let consecutiveCount = 0;
        let consecutivePeriodsList = [];
        
        PERIODS.forEach(p => {
          let isTeaching = false;
          CLASSES.forEach(cls => {
            if (routine[cls]?.[day]?.[p.id]?.teacherId === t.id) {
              isTeaching = true;
            }
          });

          if (isTeaching) {
            consecutiveCount++;
            consecutivePeriodsList.push(p.name);
          } else {
            if (consecutiveCount > 2) {
              warnings.push({
                teacherId: t.id,
                teacherName: t.name,
                type: "consecutive",
                day,
                message: `⚠️ Back-to-Back teaching: ${t.name} teaches ${consecutiveCount} periods consecutively on ${day} (${consecutivePeriodsList.join(", ")}).`
              });
            }
            consecutiveCount = 0;
            consecutivePeriodsList = [];
          }
        });

        if (consecutiveCount > 2) {
          warnings.push({
            teacherId: t.id,
            teacherName: t.name,
            type: "consecutive",
            day,
            message: `⚠️ Back-to-Back teaching: ${t.name} teaches ${consecutiveCount} periods consecutively on ${day} (${consecutivePeriodsList.join(", ")}).`
          });
        }
      });
    });
    return warnings;
  };

  // Generate and copy formatted daily proxy adjustments WhatsApp alert
  const handleCopyProxyAlert = () => {
    const absentTeachersOnDay = leaves.filter(l => l.day === selectedProxyDay).map(l => teachers.find(t => t.id === l.teacherId)).filter(Boolean);
    if (absentTeachersOnDay.length === 0) {
      alert(`No leaves logged for ${selectedProxyDay}. Everything is normal!`);
      return;
    }

    let text = `* Uchh Madhyamik Vidyalay Kanhauli Daily Proxy Alert *\n`;
    text += `Date: ${selectedProxyDay}\n`;
    text += `--------------------------------------\n`;
    text += `*Absent Faculty:*\n`;
    absentTeachersOnDay.forEach(t => {
      text += `- ${t.name} (${t.subject})\n`;
    });
    
    text += `\n*Class Adjustments:*\n`;
    let adjustmentsCount = 0;
    
    CLASSES.forEach(cls => {
      DAYS.forEach(day => {
        if (day !== selectedProxyDay) return;
        PERIODS.forEach(p => {
          const slot = routine[cls]?.[day]?.[p.id];
          if (slot && slot.teacherId && absentTeachersOnDay.some(t => t.id === slot.teacherId)) {
            const absentTeacher = absentTeachersOnDay.find(t => t.id === slot.teacherId);
            const freeTeachers = teachers.filter(t => {
              if (t.id === absentTeacher.id) return false;
              let isTeachingAny = false;
              CLASSES.forEach(cId => {
                if (routine[cId]?.[day]?.[p.id]?.teacherId === t.id) isTeachingAny = true;
              });
              const onLeave = leaves.some(l => l.teacherId === t.id && l.day === day);
              return !isTeachingAny && !onLeave;
            });
            const suggestion = freeTeachers.length > 0 
              ? freeTeachers.map(t => t.name.split(" ").slice(1).join(" ")).slice(0, 2).join(" / ")
              : "Proxy Required";
            text += `* ${cls}, ${p.name}: ${slot.subject} -> Suggest: ${suggestion}\n`;
            adjustmentsCount++;
          }
        });
      });
    });

    if (adjustmentsCount === 0) {
      text += `No scheduled classes affected by leaves today.\n`;
    }
    
    text += `--------------------------------------\n`;
    text += `🌐 Managed by U.M.V. Kanhauli School Management Portal`;

    navigator.clipboard.writeText(text)
      .then(() => alert("Proxy Alert copied to clipboard! You can now paste it in the WhatsApp Group."))
      .catch(err => {
        console.error("Failed to copy", err);
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, "_blank");
      });
  };

  // Print timetable
  const handlePrint = () => {
    window.print();
  };

  // Export timetable as CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Day,Period,Time,Subject,TeacherName\n";
    DAYS.forEach(day => {
      PERIODS.forEach(p => {
        const slot = routine[selectedClass]?.[day]?.[p.id] || { teacherId: "", subject: "" };
        const teacher = teachers.find(t => t.id === slot.teacherId);
        const row = `"${day}","${p.name}","${p.time}","${slot.subject || ''}","${teacher ? teacher.name : ''}"\n`;
        csvContent += row;
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `timetable_${selectedClass.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import timetable from CSV
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length < 5) continue;
        const day = parts[0];
        const periodName = parts[1];
        const subject = parts[3];
        const teacherName = parts[4];

        const period = PERIODS.find(p => p.name.toLowerCase() === periodName.toLowerCase());
        if (!DAYS.includes(day) || !period) continue;

        let matchedTeacherId = "";
        if (teacherName) {
          const teacher = teachers.find(t => 
            t.name.toLowerCase().includes(teacherName.toLowerCase()) || 
            teacherName.toLowerCase().includes(t.name.toLowerCase())
          );
          if (teacher) matchedTeacherId = teacher.id;
        }

        onUpdateRoutine(selectedClass, day, period.id, {
          teacherId: matchedTeacherId,
          subject: matchedTeacherId ? subject : ""
        });
      }
      alert("Timetable imported successfully!");
    };
    reader.readAsText(file);
  };

  // Share routine on WhatsApp
  const handleShareWhatsApp = () => {
    let text = `*${selectedClass} Class Routine*\n-------------------------\n`;
    DAYS.forEach(day => {
      const activeSlots = [];
      PERIODS.forEach(p => {
        const slot = routine[selectedClass]?.[day]?.[p.id];
        if (slot && slot.teacherId) {
          const teacher = teachers.find(t => t.id === slot.teacherId);
          activeSlots.push({ period: p, slot, teacher });
        }
      });

      if (activeSlots.length > 0) {
        text += `\n*${day}:*\n`;
        activeSlots.forEach(item => {
          text += `* _${item.period.name}_ (${item.period.time}): *${item.slot.subject}* by ${item.teacher ? item.teacher.name : 'Unknown'}\n`;
        });
      }
    });
    
    text += `\n🌐 Powered by Uchh Madhyamik Vidyalay Kanhauli School Manager`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const getSlotAlert = (day, periodId, teacherId) => {
    if (!teacherId || !orders) return null;
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return null;

    // 0. Leave Check
    const isOnLeaveToday = leaves.some(l => l.teacherId === teacherId && l.day === day);
    if (isOnLeaveToday) {
      return {
        type: "critical",
        message: `🚨 ABSENT: ${teacher.name} is on Leave on ${day}! Proxies recommended.`,
        task: { title: "Teacher Absence (On Leave)" }
      };
    }

    const activeTasks = orders.filter(o => o.assignedTeacherId === teacherId && o.status !== "Completed");

    // 1. Direct Event Collision Check
    const directEventClash = activeTasks.find(task => {
      if (!task.eventTime) return false;
      try {
        const date = new Date(task.eventTime);
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const eventDay = daysOfWeek[date.getDay()];
        if (eventDay !== day) return false;

        const hours = date.getHours();
        const timeInMinutes = hours * 60 + date.getMinutes();
        let eventPeriods = [];
        
        // Day Shift: 12:00 PM - 05:00 PM
        if (timeInMinutes >= 720 && timeInMinutes < 765) eventPeriods = [1];
        else if (timeInMinutes >= 765 && timeInMinutes < 810) eventPeriods = [2];
        else if (timeInMinutes >= 810 && timeInMinutes < 855) eventPeriods = [3];
        else if (timeInMinutes >= 885 && timeInMinutes < 930) eventPeriods = [4];
        else if (timeInMinutes >= 930 && timeInMinutes < 975) eventPeriods = [5];
        else if (timeInMinutes >= 975 && timeInMinutes < 1020) eventPeriods = [6];
        else if (timeInMinutes >= 855 && timeInMinutes < 885) eventPeriods = [3, 4];

        const duration = task.duration || 1;
        for (let i = 1; i < duration; i++) {
          const nextPeriod = eventPeriods[eventPeriods.length - 1] + 1;
          if (nextPeriod <= 6) eventPeriods.push(nextPeriod);
        }

        return eventPeriods.includes(periodId);
      } catch (e) {
        return false;
      }
    });

    if (directEventClash) {
      return {
        type: "critical",
        message: `🚨 BRC/DEO Duty Clash: ${teacher.name} has official event "${directEventClash.title}" during this period! Substitution recommended.`,
        task: directEventClash
      };
    }

    // 2. Deadline approaching alert (active tasks > 0)
    if (activeTasks.length > 0) {
      return {
        type: "warning",
        message: `⚠️ Active Duty Alert: ${teacher.name} is working on official order "${activeTasks[0].title}".`,
        task: activeTasks[0]
      };
    }

    return null;
  };

  // Open editor for a specific slot
  const handleCellClick = (day, periodId) => {
    const currentSlot = routine[selectedClass]?.[day]?.[periodId] || { teacherId: "", subject: "" };
    setSelectedTeacherId(currentSlot.teacherId);
    setCustomSubject(currentSlot.subject);
    setCollisionWarning("");
    setEditingSlot({ day, periodId });
  };

  // Check for collisions across other classes when a teacher is selected in editor
  const handleTeacherChange = (teacherId) => {
    setSelectedTeacherId(teacherId);
    
    if (!teacherId) {
      setCollisionWarning("");
      setCustomSubject("");
      return;
    }

    // Auto-fill subject based on teacher specialization
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setCustomSubject(teacher.subject);
    }

    // Scan for collisions in other classes
    const collisions = [];
    CLASSES.forEach(cId => {
      if (cId === selectedClass) return; // Ignore current class
      const slot = routine[cId]?.[editingSlot.day]?.[editingSlot.periodId];
      if (slot && slot.teacherId === teacherId) {
        collisions.push({ classId: cId, subject: slot.subject });
      }
    });

    if (collisions.length > 0) {
      setCollisionWarning(
        `CONFLICT WARNING: ${teacher?.name} is already teaching ${collisions[0].subject} in ${collisions[0].classId} during this period (${editingSlot.day}, Period ${editingSlot.periodId}).`
      );
    } else {
      setCollisionWarning("");
    }
  };

  // Save the slot update
  const handleSaveSlot = (e) => {
    e.preventDefault();
    if (!editingSlot) return;

    onUpdateRoutine(selectedClass, editingSlot.day, editingSlot.periodId, {
      teacherId: selectedTeacherId,
      subject: selectedTeacherId ? customSubject : ""
    });

    setEditingSlot(null);
  };

  // Clear slot directly
  const handleClearSlot = (day, periodId) => {
    if (window.confirm(`Are you sure you want to clear the slot for ${day}, Period ${periodId}?`)) {
      onUpdateRoutine(selectedClass, day, periodId, { teacherId: "", subject: "" });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Timetable Header and Class Selector */}
      <div className="timetable-header-panel glass-panel" style={{ padding: '20px 24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar color="var(--accent-cyan)" /> School Timetable Manager
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Select a grade level below to inspect or edit their weekly schedule. Click any period block to adjust the teaching assignment.
          </p>
        </div>

        <div className="timetable-selector-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {CLASSES.map(cls => {
            const meta = CLASS_METADATA[cls];
            return (
              <div 
                key={cls}
                className={`timetable-tab ${selectedClass === cls ? 'active' : ''}`}
                onClick={() => setSelectedClass(cls)}
                style={{ fontSize: '0.8rem', padding: '6px 12px', textAlign: 'center', minWidth: '100px', height: 'fit-content' }}
                title={`${meta?.stream || ''}`}
              >
                <div>{cls}</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>
                  {meta ? `${meta.students} ${language === 'hi' ? 'छात्र' : 'students'}` : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable Utilities Toolbar */}
      <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={handlePrint} style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Printer size={14} /> {t('printPDFBtn')}
          </button>
          
          <button type="button" className="btn btn-secondary" onClick={handleExportCSV} style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileDown size={14} /> {t('exportExcelBtn')}
          </button>

          <label className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <FileUp size={14} /> {t('importExcelBtn')}
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleImportCSV} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>

        <button 
          type="button"
          className="btn" 
          onClick={handleShareWhatsApp} 
          style={{ 
            fontSize: '0.8rem', 
            padding: '8px 16px', 
            background: 'rgba(34, 197, 94, 0.1)', 
            color: '#22c55e', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px' 
          }}
        >
          <Share2 size={14} /> {language === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}
        </button>
      </div>

      {/* Routine Grid Table */}
      <div className="timetable-wrapper glass-panel">
        <table className="timetable-table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>{language === 'hi' ? 'दिन / घंटी' : 'Day / Period'}</th>
              {PERIODS.map(p => (
                <th key={p.id}>
                  <div style={{ fontWeight: 600 }}>{translatePeriod(p.name)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: '2px' }}>{p.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="timetable-day-cell">{translateDay(day)}</td>
                {PERIODS.map(p => {
                  const slot = routine[selectedClass]?.[day]?.[p.id] || { teacherId: "", subject: "" };
                  const teacher = teachers.find(t => t.id === slot.teacherId);
                  const slotAlert = getSlotAlert(day, p.id, slot.teacherId);
                  
                  return (
                    <td 
                      key={p.id} 
                      className="timetable-slot-cell"
                      onClick={() => handleCellClick(day, p.id)}
                    >
                      {teacher ? (
                        <div 
                          className="timetable-slot-card"
                          style={{ 
                            borderLeft: `3px solid ${teacher.color}`,
                            background: `${teacher.color}08`,
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                              {slot.subject}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {slotAlert && (
                                <span 
                                  title={slotAlert.message} 
                                  style={{ 
                                    display: 'inline-flex', 
                                    color: slotAlert.type === 'critical' ? 'var(--accent-rose)' : 'var(--accent-amber)',
                                    cursor: 'help'
                                  }}
                                >
                                  <AlertCircle size={12} />
                                </span>
                              )}
                              <span 
                                style={{ cursor: 'pointer', padding: '2px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClearSlot(day, p.id);
                                }}
                                title="Clear slot"
                              >
                                <Trash2 size={10} color="var(--text-muted)" />
                              </span>
                            </div>
                          </div>
                          <div style={{ color: teacher.color, fontSize: '0.75rem', fontWeight: 500, textAlign: 'left', marginTop: '2px' }}>
                            {teacher.name.split(" ").slice(1).join(" ")} {/* Short name */}
                          </div>
                        </div>
                      ) : (
                        <div className="timetable-slot-empty">
                          <Plus size={10} style={{ margin: '0 auto 4px', display: 'block', opacity: 0.3 }} />
                          Free Period
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {editingSlot && (
        <div className="modal-overlay" onClick={() => setEditingSlot(null)}>
          <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <div className="modal-title">
                Edit Schedule Slot
              </div>
              <button className="close-btn" onClick={() => setEditingSlot(null)}>&times;</button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              Class: <strong>{selectedClass}</strong> | Day: <strong>{editingSlot.day}</strong> | Period: <strong>{PERIODS.find(p => p.id === editingSlot.periodId)?.name}</strong> ({PERIODS.find(p => p.id === editingSlot.periodId)?.time})
            </div>

            <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexParagraphs: 'column', flexDirection: 'column', gap: '20px' }}>
              
              {/* Teacher Dropdown */}
              <div className="form-group">
                <label className="form-label">Assign Teacher</label>
                <select 
                  className="form-select" 
                  value={selectedTeacherId} 
                  onChange={(e) => handleTeacherChange(e.target.value)}
                >
                  <option value="">-- Set as Free Period (No Teacher) --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Text Box */}
              {selectedTeacherId && (
                <div className="form-group">
                  <label className="form-label">Subject Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={customSubject} 
                    onChange={(e) => setCustomSubject(e.target.value)} 
                    placeholder="Enter subject name"
                    required
                  />
                </div>
              )}

              {/* Conflict Alert Box */}
              {collisionWarning && (
                <div className="conflict-warning-box">
                  <AlertCircle size={20} style={{ minWidth: '20px' }} />
                  <span>{collisionWarning}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingSlot(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  <Check size={16} /> Save Assignment
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
      {/* Informative Alert for computer teacher */}
      <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--accent-cyan)', background: 'rgba(0, 240, 255, 0.01)', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <AlertTriangle size={24} color="var(--accent-cyan)" />
        <div style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
          <strong>{t('schedulingAdviceTitle')}</strong> {t('schedulingAdviceDesc')}
        </div>
      </div>

      {/* Active Class Alerts & Substitution Recommendations Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
          <AlertCircle /> {t('activeAlertsTitle')}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {t('activeAlertsDesc')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {/* Loop through all days and periods to accumulate alerts */}
          {(() => {
            const classAlerts = [];
            DAYS.forEach(day => {
              PERIODS.forEach(p => {
                const slot = routine[selectedClass]?.[day]?.[p.id];
                if (slot && slot.teacherId) {
                  const alertInfo = getSlotAlert(day, p.id, slot.teacherId);
                  if (alertInfo) {
                    classAlerts.push({
                      day,
                      period: p,
                      subject: slot.subject,
                      teacher: teachers.find(t => t.id === slot.teacherId),
                      ...alertInfo
                    });
                  }
                }
              });
            });

            if (classAlerts.length === 0) {
              return (
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border-glass)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ✅ {t('noClashes')}
                </div>
              );
            }

            return classAlerts.map((alert, idx) => (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '16px', 
                  borderLeft: `4px solid ${alert.type === 'critical' ? 'var(--accent-rose)' : 'var(--accent-amber)'}`,
                  background: alert.type === 'critical' ? 'var(--accent-rose-glow)' : 'var(--accent-amber-glow)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '80%', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span 
                      style={{ 
                        background: alert.type === 'critical' ? 'var(--accent-rose)' : 'var(--accent-amber)', 
                        color: 'var(--bg-dark)', 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}
                    >
                      {alert.type === 'critical' ? t('directClash') : t('activeDuty')}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {translateDay(alert.day)}, {translatePeriod(alert.period.name)} ({alert.period.time})
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                    {language === 'hi' ? (
                      <>शिक्षक <strong>{alert.teacher?.name}</strong> ({alert.subject} पढ़ा रहे हैं) को बीआरसी/डीईओ अनुपालन कार्य आवंटित किया गया है: </>
                    ) : (
                      <>Teacher <strong>{alert.teacher?.name}</strong> (teaching {alert.subject}) is assigned to BRC/DEO compliance task: </>
                    )}
                    <span style={{ color: 'var(--accent-cyan)' }}> "{alert.task.title}"</span>.
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {alert.type === 'critical' 
                      ? t('clashDetailAdvice')
                      : t('clashDetailInfo')
                    }
                  </div>
                </div>

                {/* Substitution Recommendations */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('suggestedProxies')}</div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(() => {
                      // Find teachers who are FREE during this day and period, and sort by Specialization and workload
                      const freeTeachers = teachers.filter(t => {
                        if (t.id === alert.teacher.id) return false;
                        const busy = routine[selectedClass]?.[alert.day]?.[alert.period.id]?.teacherId === t.id; // already teaching this?
                        // scan if teaching any class
                        let isTeachingAny = false;
                        CLASSES.forEach(cId => {
                          if (routine[cId]?.[alert.day]?.[alert.period.id]?.teacherId === t.id) {
                            isTeachingAny = true;
                          }
                        });
                        // check if they are busy with admin event
                        const hasAdminClash = orders.some(o => {
                          if (o.assignedTeacherId !== t.id || o.status === "Completed" || !o.eventTime) return false;
                          try {
                            const date = new Date(o.eventTime);
                            const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                            const eventDay = daysOfWeek[date.getDay()];
                            if (eventDay !== alert.day) return false;
                            
                            const hours = date.getHours();
                            const timeInMinutes = hours * 60 + date.getMinutes();
                            let eventPeriods = [];
                            if (timeInMinutes >= 720 && timeInMinutes < 765) eventPeriods = [1];
                            else if (timeInMinutes >= 765 && timeInMinutes < 810) eventPeriods = [2];
                            else if (timeInMinutes >= 810 && timeInMinutes < 855) eventPeriods = [3];
                            else if (timeInMinutes >= 885 && timeInMinutes < 930) eventPeriods = [4];
                            else if (timeInMinutes >= 930 && timeInMinutes < 975) eventPeriods = [5];
                            else if (timeInMinutes >= 975 && timeInMinutes < 1020) eventPeriods = [6];
                            
                            return eventPeriods.includes(alert.period.id);
                          } catch (e) {
                            return false;
                          }
                        });

                        // check if on leave on this day
                        const isOnLeaveToday = leaves.some(l => l.teacherId === t.id && l.day === alert.day);

                        return !isTeachingAny && !hasAdminClash && !isOnLeaveToday;
                      });

                      if (freeTeachers.length === 0) {
                        return <span style={{ fontSize: '0.7rem', color: 'var(--accent-rose)' }}>{t('noFreeTeachers')}</span>;
                      }

                      // Sort by subject matching, then by workload
                      const sortedProxies = freeTeachers.map(t => {
                        let rank = 0;
                        if (t.subject.toLowerCase() === alert.teacher.subject.toLowerCase()) rank += 20;
                        return { t, rank };
                      }).sort((a, b) => b.rank - a.rank).slice(0, 2);

                       return sortedProxies.map((pObj, pIdx) => (
                        <button 
                          key={pIdx} 
                          onClick={() => {
                            // Update routine to assign substitute
                            onUpdateRoutine(selectedClass, alert.day, alert.period.id, {
                              teacherId: pObj.t.id,
                              subject: alert.subject
                            });
                            // Log proxy record
                            if (onAddProxyRecord) {
                              onAddProxyRecord(alert.teacher.id, pObj.t.id, alert.day, alert.period.id, selectedClass);
                            }
                            alert(`Assigned ${pObj.t.name} as proxy substitution for ${alert.teacher.name}. Routine updated and proxy logged!`);
                          }}
                          style={{ 
                            fontSize: '0.7rem', 
                            background: 'rgba(255,255,255,0.03)', 
                            border: `1px solid ${pObj.t.color}50`, 
                            padding: '4px 10px', 
                            borderRadius: '6px',
                            color: pObj.t.color,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          title={`Click to assign ${pObj.t.name} (Specialty: ${pObj.t.subject})`}
                        >
                          {pObj.t.name.split(" ").slice(1).join(" ")}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Workload & Consecutive Hour Monitor */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)' }}>
          <AlertTriangle /> {t('workloadMonitorTitle')}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {t('workloadMonitorDesc')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
          {(() => {
            const warnings = getWorkloadWarnings();
            if (warnings.length === 0) {
              return (
                <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border-glass)', borderRadius: '8px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ✅ {t('allBalanced')}
                </div>
              );
            }

            return warnings.map((warning, idx) => (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '12px 16px', 
                  borderLeft: '4px solid var(--accent-amber)',
                  background: 'var(--accent-amber-glow)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ color: 'var(--accent-amber)' }}><AlertCircle size={18} /></div>
                <div>{warning.message}</div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Daily Proxy WhatsApp Alert Generator */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
          <Share2 /> {t('proxyAlertGenTitle')}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {t('proxyAlertGenDesc')}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('selectDay')}</label>
            <select 
              value={selectedProxyDay} 
              onChange={(e) => setSelectedProxyDay(e.target.value)}
              className="select-input"
              style={{
                background: 'var(--bg-slate)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '8px',
                outline: 'none',
                minWidth: '150px'
              }}
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleCopyProxyAlert} 
            className="btn btn-primary"
            style={{ 
              marginTop: '20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'var(--accent-cyan)', 
              color: 'var(--bg-dark)',
              fontWeight: 'bold',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Share2 size={16} /> {t('copyAlertBtn')}
          </button>
        </div>

        {/* Live Preview Box */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('livePreview')}</div>
          <pre 
            style={{ 
              background: 'var(--bg-slate)', 
              border: '1px solid var(--border-glass)', 
              borderRadius: '8px', 
              padding: '16px', 
              fontSize: '0.8rem', 
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '200px',
              overflowY: 'auto',
              textAlign: 'left'
            }}
          >
            {(() => {
              const absentTeachersOnDay = leaves.filter(l => l.day === selectedProxyDay).map(l => teachers.find(t => t.id === l.teacherId)).filter(Boolean);
              if (absentTeachersOnDay.length === 0) {
                return `No leaves logged for ${selectedProxyDay}. Everything is normal!`;
              }

              let text = `* Uchh Madhyamik Vidyalay Kanhauli Daily Proxy Alert *\n`;
              text += `Date: ${selectedProxyDay}\n`;
              text += `--------------------------------------\n`;
              text += `*Absent Faculty:*\n`;
              absentTeachersOnDay.forEach(t => {
                text += `- ${t.name} (${t.subject})\n`;
              });
              
              text += `\n*Class Adjustments:*\n`;
              let adjustmentsCount = 0;
              
              CLASSES.forEach(cls => {
                DAYS.forEach(day => {
                  if (day !== selectedProxyDay) return;
                  PERIODS.forEach(p => {
                    const slot = routine[cls]?.[day]?.[p.id];
                    if (slot && slot.teacherId && absentTeachersOnDay.some(t => t.id === slot.teacherId)) {
                      const absentTeacher = absentTeachersOnDay.find(t => t.id === slot.teacherId);
                      const freeTeachers = teachers.filter(t => {
                        if (t.id === absentTeacher.id) return false;
                        let isTeachingAny = false;
                        CLASSES.forEach(cId => {
                          if (routine[cId]?.[day]?.[p.id]?.teacherId === t.id) isTeachingAny = true;
                        });
                        const onLeave = leaves.some(l => l.teacherId === t.id && l.day === day);
                        return !isTeachingAny && !onLeave;
                      });
                      const suggestion = freeTeachers.length > 0 
                        ? freeTeachers.map(t => t.name.split(" ").slice(1).join(" ")).slice(0, 2).join(" / ")
                        : "Proxy Required";
                      text += `* ${cls}, ${p.name}: ${slot.subject} -> Suggest: ${suggestion}\n`;
                      adjustmentsCount++;
                    }
                  });
                });
              });

              if (adjustmentsCount === 0) {
                text += `No scheduled classes affected by leaves today.\n`;
              }
              
              text += `--------------------------------------\n`;
              text += `🌐 Managed by U.M.V. Kanhauli School Management Portal`;
              return text;
            })()}
          </pre>
        </div>
      </div>

    </div>
  );
}
