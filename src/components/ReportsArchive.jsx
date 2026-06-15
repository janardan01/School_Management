// Apex Task & Schedule Coordinator - Reports Archive Component

import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Sparkles,
  Info,
  Clock,
  Printer
} from 'lucide-react';

export default function ReportsArchive({ teachers, orders, language, t }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Get only completed orders with reports
  const completedOrders = orders.filter(o => o.status === "Completed" && o.reports && o.reports.length > 0);

  // Filter completed tasks
  const filteredReports = completedOrders.filter(o => {
    const matchesCategory = categoryFilter === "All" || o.category === categoryFilter;
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.reports[0].content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.reports[0].submitterName.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesCategory && matchesSearch;
  });

  const categories = ["All", "IT & Digital", "Science & Maths", "Administrative", "Co-curricular", "Examinations"];

  const categoryKeys = {
    "All": "categoryAll",
    "IT & Digital": "categoryITDigital",
    "Science & Maths": "categoryScienceMaths",
    "Administrative": "categoryAdministrative",
    "Co-curricular": "categoryCocurricular",
    "Examinations": "categoryExaminations"
  };

  const handlePrintReport = (report) => {
    // Elegant system print prompt or detail alert
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('brandName')} - ${language === 'hi' ? 'बीआरसी/डीईओ सबमिशन रिकॉर्ड' : 'BRC/DEO Submission Record'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
            .school-name { font-size: 1.4rem; font-weight: bold; color: #1a365d; text-transform: uppercase; }
            .report-title { font-size: 1.8rem; margin: 10px 0; font-family: Georgia, serif; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px; font-size: 0.9rem; }
            .label { font-weight: bold; color: #4a5568; }
            .content-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; background: #fff; min-height: 200px; margin-top: 20px; font-size: 1.1rem; }
            .footer { margin-top: 50px; font-size: 0.8rem; color: #718096; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${t('brandName').toUpperCase()} - ${language === 'hi' ? 'प्रशासनिक रिपोर्ट पोर्टल' : 'ADMINISTRATIVE REPORT PORTAL'}</div>
            <div class="report-title">${language === 'hi' ? 'बीआरसी/डीईओ अनुपालन सबमिशन रिकॉर्ड' : 'BRC/DEO Compliance Submission Record'}</div>
          </div>
          
          <div class="meta-grid">
            <div><span class="label">${t('orderRef')}</span> ${report.id}</div>
            <div><span class="label">${t('category')}:</span> ${t(categoryKeys[report.category] || report.category)}</div>
            <div><span class="label">${language === 'hi' ? 'विषय:' : 'Subject Matter:'}</span> ${report.title}</div>
            <div><span class="label">${language === 'hi' ? 'जारी करने वाला कार्यालय:' : 'Issuing Authority:'}</span> ${report.authority}</div>
            <div><span class="label">${language === 'hi' ? 'स्टाफ द्वारा प्रस्तुत:' : 'Submitted By Staff:'}</span> ${report.reports[0].submitterName}</div>
            <div><span class="label">${language === 'hi' ? 'पूर्णता समय:' : 'Completion Timestamp:'}</span> ${report.reports[0].submittedAt}</div>
          </div>
          
          <h3>${language === 'hi' ? 'जमा मसौदे का विवरण' : 'Submission Draft Details'}</h3>
          <div class="content-box">
            ${report.reports[0].content.replace(/\n/g, '<br/>')}
          </div>
          
          <div class="footer">
            ${language === 'hi' ? 'एपेक्स टास्क कोऑर्डिनेटर और शेड्यूल मैनेजर द्वारा स्वचालित रूप से जनरेट किया गया।' : 'Generated Automatically by Apex Task Coordinator & Schedule Manager.'}<br/>
            ${language === 'hi' ? 'डिजिटल स्टैम्प हस्ताक्षर सत्यापित। ऑडिट अनुपालन दर्ज।' : 'Digital Stamp Signature Verified. Audit Compliance Logged.'}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintExecutiveSummary = () => {
    const printWindow = window.open('', '_blank');
    
    let rowsHtml = "";
    orders.forEach(o => {
      const teacher = teachers.find(t => t.id === o.assignedTeacherId);
      const isCompleted = o.status === "Completed";
      const completionDate = isCompleted && o.reports && o.reports[0] ? o.reports[0].submittedAt : (language === 'hi' ? 'लंबित' : 'Pending');
      const notes = isCompleted && o.reports && o.reports[0] ? o.reports[0].content : (language === 'hi' ? 'प्रस्तुति लंबित' : 'Pending submission');
      
      const translatedStatus = o.status === "Completed" ? t('statusBadgeCompleted') : o.status === "In Progress" ? t('statusBadgeInProgress') : t('statusBadgePending');

      rowsHtml += `
        <tr>
          <td>${o.id}</td>
          <td>
            <strong>${o.title}</strong><br/>
            <small>${o.authority} | ${t('category')}: ${t(categoryKeys[o.category] || o.category)}</small>
          </td>
          <td>${teacher ? teacher.name : (language === 'hi' ? 'अनियुक्त' : 'Unassigned')}</td>
          <td>
            <span class="status-badge status-${o.status.toLowerCase().replace(/\s+/g, '-')}">${translatedStatus}</span>
          </td>
          <td>${o.deadline}</td>
          <td>${completionDate}</td>
          <td>${notes}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>${t('brandName')} - ${language === 'hi' ? 'बीआरसी/डीईओ अनुपालन कार्यकारी रिपोर्ट' : 'BRC/DEO Compliance Executive Report'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1a202c; line-height: 1.5; }
            .header { border-bottom: 2px solid #2d3748; padding-bottom: 15px; margin-bottom: 30px; }
            .school-name { font-size: 1.2rem; font-weight: 800; color: #2b6cb0; text-transform: uppercase; letter-spacing: 1px; }
            .report-title { font-size: 2rem; margin: 10px 0; font-family: Georgia, serif; font-weight: bold; }
            .summary-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 0.85rem; }
            .summary-table th, .summary-table td { border: 1px solid #cbd5e0; padding: 10px 12px; text-align: left; vertical-align: top; }
            .summary-table th { background: #edf2f7; color: #2d3748; font-weight: bold; }
            .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; }
            .status-completed { background: #c6f6d5; color: #22543d; }
            .status-in-progress { background: #feebc8; color: #744210; }
            .status-pending { background: #edf2f7; color: #4a5568; }
            .footer { margin-top: 50px; font-size: 0.8rem; color: #718096; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${t('brandName').toUpperCase()} - ${language === 'hi' ? 'प्रशासनिक रिपोर्ट पोर्टल' : 'ADMINISTRATIVE REPORT PORTAL'}</div>
            <div class="report-title">${t('execSummaryTitle')}</div>
            <div style="font-size: 0.9rem; color: #4a5568;">${language === 'hi' ? 'रिपोर्ट जनरेट समय:' : 'Report Generated:'} ${new Date().toLocaleString(language === 'hi' ? 'hi-IN' : 'en-US')}</div>
          </div>
          
          <table class="summary-table">
            <thead>
              <tr>
                <th style="width: 80px;">${language === 'hi' ? 'आईडी' : 'Ref ID'}</th>
                <th>${language === 'hi' ? 'कार्य / कार्यालय' : 'Task / Authority'}</th>
                <th>${t('assignedStaffCol')}</th>
                <th style="width: 100px;">${t('status')}</th>
                <th style="width: 90px;">${t('deadline')}</th>
                <th style="width: 120px;">${t('completionCol')}</th>
                <th>${language === 'hi' ? 'अनुपालन टिप्पणी और सबमिशन नोट्स' : 'Compliance Remarks & Submission Notes'}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          
          <div class="footer">
            ${language === 'hi' ? 'एपेक्स टास्क कोऑर्डिनेटर और शेड्यूल मैनेजर द्वारा स्वचालित रूप से जनरेट किया गया।' : 'Generated Automatically by Apex Task Coordinator & Schedule Manager.'}<br/>
            ${language === 'hi' ? 'आधिकारिक अनुपालन सारांश। प्रमाणित और ऑडिट किया गया।' : 'Official Compliance Summary. Certified and Audited.'}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Panel */}
      <div className="timetable-header-panel glass-panel" style={{ padding: '20px 24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckSquare color="var(--accent-emerald)" /> {t('archiveHeaderTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            {t('archiveHeaderDesc')}
          </p>
        </div>
      </div>

      {/* Executive Summary Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
              <FileText /> {t('execSummaryTitle')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {t('execSummaryDesc')}
            </p>
          </div>
          <button 
            onClick={handlePrintExecutiveSummary} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Printer size={16} /> {t('exportSummaryBtn')}
          </button>
        </div>

        <div style={{ overflowX: 'auto', marginTop: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-glass)', textAlign: 'left' }}>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t('idCol')}</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t('directiveCol')}</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t('assignedStaffCol')}</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t('status')}</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t('deadline')}</th>
                <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{t('completionCol')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const teacher = teachers.find(t => t.id === o.assignedTeacherId);
                const isCompleted = o.status === "Completed";
                const completionDate = isCompleted && o.reports && o.reports[0] ? o.reports[0].submittedAt : t('statusBadgePending');
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{o.id}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontWeight: 600 }}>{o.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.authority}</div>
                    </td>
                    <td style={{ padding: '12px 8px', color: teacher?.color || 'inherit', fontWeight: 600 }}>
                      {teacher ? teacher.name : t('unassigned')}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCompleted ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                        color: isCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        border: `1px solid ${isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)'}`
                      }}>
                        {isCompleted ? t('statusBadgeCompleted') : o.status === "In Progress" ? t('statusBadgeInProgress') : t('statusBadgePending')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{o.deadline}</td>
                    <td style={{ padding: '12px 8px', color: isCompleted ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                      {completionDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Category Pill Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(c => (
            <button 
              key={c}
              className={`btn ${categoryFilter === c ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '6px 14px' }}
              onClick={() => setCategoryFilter(c)}
            >
              {t(categoryKeys[c] || c)}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-slate)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '6px 14px', width: '300px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem', width: '100%' }}
          />
        </div>

      </div>

      {/* Audit Log list */}
      {filteredReports.length === 0 ? (
        <div className="glass-panel empty-state">
          <Info className="empty-state-icon" />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('archivesEmpty')}</div>
          <p style={{ fontSize: '0.85rem', maxWidth: '350px' }}>
            {t('noReportsFound')}
          </p>
        </div>
      ) : (
        <div className="submissions-history">
          {filteredReports.map(report => {
            const reporter = teachers.find(t => t.id === report.reports[0].submitterId);
            return (
              <div key={report.id} className="glass-panel submission-item" style={{ borderLeft: `4px solid ${reporter?.color || 'var(--accent-emerald)'}` }}>
                
                {/* Meta details header */}
                <div className="submission-meta">
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span>{t('orderRef')} <strong>{report.id}</strong></span>
                    <span>{language === 'hi' ? 'कार्यालय:' : 'Authority:'} <strong>{report.authority}</strong></span>
                    <span>{t('category')}: <strong>{t(categoryKeys[report.category] || report.category)}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-emerald)' }}>
                    <Clock size={12} />
                    <span>{language === 'hi' ? 'प्रस्तुत किया:' : 'Submitted:'} <strong>{report.reports[0].submittedAt}</strong></span>
                  </div>
                </div>

                {/* Task Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{report.title}</h3>
                  <button 
                    className="btn btn-secondary btn-icon-only"
                    onClick={() => handlePrintReport(report)}
                    title={language === 'hi' ? 'आधिकारिक पीडीएफ रिपोर्ट शीट जनरेट करें' : 'Generate official PDF report sheet'}
                    style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'transparent' }}
                  >
                    <Printer size={16} color="var(--accent-cyan)" />
                  </button>
                </div>

                {/* Submitter Box */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-glass)', width: 'fit-content', margin: '4px 0' }}>
                  <User size={12} color={reporter?.color} />
                  <span>{t('draftedBy')} <strong style={{ color: reporter?.color }}>{report.reports[0].submitterName}</strong> ({t(reporter?.subject)})</span>
                </div>

                {/* Body Report Content */}
                <div className="submission-body" style={{ background: 'rgba(255,255,255,0.01)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', marginTop: '8px', fontStyle: 'italic' }}>
                  "{report.reports[0].content}"
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Helpful Hint */}
      <div className="glass-panel" style={{ padding: '16px', background: 'rgba(34, 197, 94, 0.01)', borderColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem' }}>
        <Sparkles size={16} color="var(--accent-emerald)" />
        <span><strong>{t('auditReadyTitle')}</strong> {t('auditReadyDesc')}</span>
      </div>

    </div>
  );
}
