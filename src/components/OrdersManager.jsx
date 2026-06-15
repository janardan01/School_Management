// Apex Task & Schedule Coordinator - Orders Manager Component

import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckSquare,
  Bookmark,
  ChevronRight,
  Clock,
  Send
} from 'lucide-react';
import { 
  getRecommendations, 
  DAYS, 
  PERIODS 
} from '../utils/SmartAssigner';

export default function OrdersManager({ 
  teachers, 
  routine, 
  orders, 
  leaves = [],
  onAddOrder, 
  onAssignTeacher, 
  onSubmitReport,
  language,
  t
}) {
  const [activeTab, setActiveTab] = useState("active"); // "active" (Pending + In Progress) | "completed"
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null); // holds the order object to assign
  const [showReportModal, setShowReportModal] = useState(null); // holds the order object to submit report for

  // Add Order Form State
  const [newTitle, setNewTitle] = useState("");
  const [newAuthority, setNewAuthority] = useState("DEO Office");
  const [newDeadline, setNewDeadline] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newDuration, setNewDuration] = useState(1);
  const [newCategory, setNewCategory] = useState("IT & Digital");
  const [newPriority, setNewPriority] = useState("Medium");
  const [newDescription, setNewDescription] = useState("");

  // WhatsApp & PDF Auto Parser States
  const [inputMode, setInputMode] = useState("manual"); // "manual" | "whatsapp" | "pdf"
  const [whatsAppText, setWhatsAppText] = useState("");
  const [parseSuccessBadge, setParseSuccessBadge] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");

  // Report Submission Form State
  const [reportContent, setReportContent] = useState("");

  // Unified Smart Text Parser for both WhatsApp text and PDF text
  const parseExtractedText = (text, sourceName) => {
    if (!text || !text.trim()) return;

    let title = "";
    let authority = "DEO Office";
    let deadline = "";
    let eventTime = "";
    let category = "Administrative";
    let priority = "Medium";
    let description = text.trim();

    // 1. Extract Title
    const subjectMatch = text.match(/(?:Subject|विषय|Sub|विषयांकित)\s*[:]\s*([^\n]+)/i);
    const boldMatch = text.match(/\*([^*]+)\*/);
    if (subjectMatch) {
      title = subjectMatch[1].replace(/[*_]/g, "").trim();
    } else if (boldMatch) {
      title = boldMatch[1].trim();
    } else {
      const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        title = lines[0].substring(0, 80);
      }
    }
    title = title.replace(/^[\s-*•#]+/g, "").trim();

    // 2. Extract Authority
    const lowerText = text.toLowerCase();
    if (lowerText.includes("deo") || lowerText.includes("district education") || lowerText.includes("जिला शिक्षा") || lowerText.includes("शिक्षा अधिकारी")) {
      authority = "DEO Office";
    } else if (lowerText.includes("brc") || lowerText.includes("block resource") || lowerText.includes("ब्लॉक संसाधन") || lowerText.includes("बीआरसी")) {
      authority = "BRC Office";
    } else if (lowerText.includes("smc") || lowerText.includes("school management") || lowerText.includes("प्रबंधन")) {
      authority = "SMC Committee";
    }

    // 3. Extract Category
    if (lowerText.includes("computer") || lowerText.includes("digital") || lowerText.includes("online") || lowerText.includes("portal") || lowerText.includes("website") || lowerText.includes("udise") || lowerText.includes("excel") || lowerText.includes("spreadsheet") || lowerText.includes("it ") || lowerText.includes("तकनीकी")) {
      category = "IT & Digital";
    } else if (lowerText.includes("science") || lowerText.includes("math") || lowerText.includes("exhibition") || lowerText.includes("olympiad") || lowerText.includes("quiz") || lowerText.includes("विज्ञान") || lowerText.includes("गणित")) {
      category = "Science & Maths";
    } else if (lowerText.includes("sports") || lowerText.includes("kho") || lowerText.includes("volleyball") || lowerText.includes("athletics") || lowerText.includes("game") || lowerText.includes("physical") || lowerText.includes("खेल") || lowerText.includes("व्यायाम")) {
      category = "Co-curricular";
    } else if (lowerText.includes("exam") || lowerText.includes("test") || lowerText.includes("board") || lowerText.includes("result") || lowerText.includes("परीक्षा") || lowerText.includes("मूल्यांकन")) {
      category = "Examinations";
    }

    // 4. Extract Priority
    if (lowerText.includes("urgent") || lowerText.includes("immediate") || lowerText.includes("important") || lowerText.includes("शीघ्र") || lowerText.includes("अति आवश्यक") || lowerText.includes("emergency") || lowerText.includes("महत्वपूर्ण")) {
      priority = "High";
    }

    // 5. Extract Deadline Date (DD-MM-YYYY or DD/MM/YYYY)
    const dateRegex = /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, "0");
      const month = dateMatch[2].padStart(2, "0");
      const year = dateMatch[3];
      deadline = `${year}-${month}-${day}`;
    } else {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 4);
      deadline = targetDate.toISOString().split("T")[0];
    }

    // 6. Extract Event Time
    const timeRegex = /\b(\d{1,2})[:](\d{2})\s*(AM|PM|am|pm)?\b/;
    const timeMatch = text.match(timeRegex);
    if (timeMatch && (lowerText.includes("meeting") || lowerText.includes("training") || lowerText.includes("workshop") || lowerText.includes("बैठक") || lowerText.includes("प्रशिक्षण"))) {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      const dateStr = tom.toISOString().split("T")[0];
      
      let hour = parseInt(timeMatch[1]);
      const min = timeMatch[2];
      const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : "";

      if (ampm === "PM" && hour < 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;

      eventTime = `${dateStr}T${String(hour).padStart(2, "0")}:${min}`;
    }

    // Fill react states
    setNewTitle(title);
    setNewAuthority(authority);
    setNewDeadline(deadline);
    setNewEventTime(eventTime);
    setNewCategory(category);
    setNewPriority(priority);
    setNewDescription(description.substring(0, 800)); // Cap description at 800 chars for readability

    setParseSuccessBadge(`✓ Auto-parsed from ${sourceName}! Verify and adjust details below.`);
    setInputMode("manual"); // Switch back to manual form
    setTimeout(() => {
      setParseSuccessBadge("");
    }, 7000);
  };

  // WhatsApp chat text parsing execution
  const handleWhatsAppParse = () => {
    if (!whatsAppText.trim()) return;
    parseExtractedText(whatsAppText, "WhatsApp chat");
    setWhatsAppText(""); // Reset text field
  };

  // Direct client-side PDF document parsing execution
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setPdfError("Unsupported file format. Please upload a PDF (.pdf) file.");
      return;
    }

    setPdfLoading(true);
    setPdfError("");
    setParseSuccessBadge("");

    try {
      // 1. Dynamic PDF.js Loader from CDN (to prevent Vite web worker bundle issues)
      const pdfjsLib = await new Promise((resolve, reject) => {
        if (window.pdfjsLib) {
          resolve(window.pdfjsLib);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
        script.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          resolve(window.pdfjsLib);
        };
        script.onerror = () => reject(new Error("Unable to initialize PDF reader. Check network connection."));
        document.head.appendChild(script);
      });

      // 2. Read array buffer
      const arrayBuffer = await file.arrayBuffer();
      
      // 3. Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let extractedText = "";
      
      // 4. Extract text from pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        extractedText += pageText + "\n";
      }

      if (!extractedText || !extractedText.trim()) {
        throw new Error("This PDF seems to be an image or scanned photocopy. No digital text found. Copy WhatsApp caption instead!");
      }

      // 5. Parse extracted text
      parseExtractedText(extractedText, "PDF Document");

    } catch (err) {
      console.error("PDF Parsing Error:", err);
      setPdfError(err.message || "Failed to parse PDF document.");
    } finally {
      setPdfLoading(false);
      // Reset input element so they can upload same file again if needed
      e.target.value = "";
    }
  };

  // Image clipboard paste and drag-drop OCR states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrError, setOcrError] = useState("");

  // Process selected or pasted image file
  const processImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      setOcrError("Unsupported format. Please select an image file (PNG, JPG).");
      return;
    }
    setImageFile(file);
    setOcrError("");
    setParseSuccessBadge("");

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard paste event listener callback
  const handleImagePaste = (e) => {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image/") !== -1) {
        const file = items[i].getAsFile();
        processImageFile(file);
        e.preventDefault();
        break;
      }
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Run Tesseract OCR in the browser
  const handleOcrRun = async () => {
    if (!imageFile) return;

    setOcrLoading(true);
    setOcrStatus("Loading OCR Models...");
    setOcrProgress(0);
    setOcrError("");

    try {
      // 1. Dynamic Tesseract.js script loader
      const Tesseract = await new Promise((resolve, reject) => {
        if (window.Tesseract) {
          resolve(window.Tesseract);
          return;
        }
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js";
        script.onload = () => resolve(window.Tesseract);
        script.onerror = () => reject(new Error("Unable to initialize OCR engine. Check internet connection."));
        document.head.appendChild(script);
      });

      // 2. Perform OCR (with English and Hindi combined models!)
      const result = await Tesseract.recognize(imageFile, 'eng+hin', {
        logger: m => {
          if (m.status === "recognizing text") {
            setOcrStatus("Extracting characters...");
            setOcrProgress(Math.round(m.progress * 100));
          } else {
            setOcrStatus(m.status);
          }
        }
      });

      const extractedText = result.data.text;

      if (!extractedText || !extractedText.trim()) {
        throw new Error("No characters detected. Make sure the screenshot is high-quality and contains printed text.");
      }

      // 3. Extract form details from OCR text
      parseExtractedText(extractedText, "Pasted Screenshot");

      // 4. Clear state on success
      setImageFile(null);
      setImagePreview(null);

    } catch (err) {
      console.error("OCR Extraction Error:", err);
      setOcrError(err.message || "Failed to process screenshot.");
    } finally {
      setOcrLoading(false);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const isCompleted = o.status === "Completed";
    const matchesTab = activeTab === "active" ? !isCompleted : isCompleted;
    
    const matchesSearch = o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.category.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return matchesTab && matchesSearch;
  });

  // Handle opening Smart Recommendation Panel
  const handleOpenSmartAssign = (order) => {
    setShowAssignModal(order);
  };

  // Handle actual assignment execution
  const handleExecuteAssignment = (orderId, teacherId) => {
    onAssignTeacher(orderId, teacherId);
    setShowAssignModal(null);
  };

  // Handle logging new BRC/DEO Order
  const handleCreateOrder = (e) => {
    e.preventDefault();
    
    // Auto format eventTime if selected
    let formattedEventTime = "";
    if (newEventTime) {
      formattedEventTime = newEventTime.replace("T", " ");
    }

    const orderData = {
      title: newTitle,
      authority: newAuthority,
      deadline: newDeadline,
      eventTime: formattedEventTime,
      duration: newDuration,
      category: newCategory,
      priority: newPriority,
      description: newDescription
    };

    onAddOrder(orderData);

    // Reset Form
    setNewTitle("");
    setNewDeadline("");
    setNewEventTime("");
    setNewDuration(1);
    setNewDescription("");
    setShowAddModal(false);
  };

  // Handle Submit Report Form
  const handleSubmitReportForm = (e) => {
    e.preventDefault();
    if (!reportContent.trim()) return;

    onSubmitReport(showReportModal.id, showReportModal.assignedTeacherId, reportContent);
    setReportContent("");
    setShowReportModal(null);
  };

  return (
    <div className="orders-container">
      
      {/* Header and Add Task Action */}
      <div className="timetable-header-panel glass-panel" style={{ padding: '20px 24px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText color="var(--accent-cyan)" /> {t('ordersManagerTitle')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            {t('ordersManagerDesc')}
          </p>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} /> {t('logDirectiveTitle')}
        </button>
      </div>

      {/* Nav and Search bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            {language === 'hi' ? 'सक्रिय आदेश' : 'Active Orders'} ({orders.filter(o => o.status !== "Completed").length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            {language === 'hi' ? 'पूर्ण रिपोर्ट' : 'Completed Reports'} ({orders.filter(o => o.status === "Completed").length})
          </button>
        </div>

        {/* Search */}
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

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="glass-panel empty-state">
          <FileText className="empty-state-icon" />
          <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{language === 'hi' ? 'कोई आदेश नहीं मिला' : 'No Orders Found'}</div>
          <p style={{ fontSize: '0.85rem', maxWidth: '350px' }}>
            {searchQuery ? (language === 'hi' ? 'खोज से कोई परिणाम नहीं मिला।' : 'No matches found for your search term.') : t('noDirectives')}
          </p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => {
            const assignedTeacher = teachers.find(t => t.id === order.assignedTeacherId);
            
            return (
              <div key={order.id} className="glass-panel order-card">
                
                {/* Order Top Badge row */}
                <div className="order-header">
                  <div className="order-badge-row">
                    <span className={`badge priority-${order.priority.toLowerCase()}`}>
                      {order.priority === 'High' ? t('high') : order.priority === 'Medium' ? t('medium') : t('low')}
                    </span>
                    <span className="badge status-pending" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}>
                      {order.category}
                    </span>
                  </div>
                  <span className={`badge status-${order.status.toLowerCase().replace(" ", "")}`}>
                    {order.status === 'Completed' ? t('completed') : order.status === 'In Progress' ? t('inProgress') : t('pending')}
                  </span>
                </div>

                {/* Title and descriptions */}
                <div>
                  <h3 className="order-title">{order.title}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '12px' }}>
                    <span>{language === 'hi' ? 'कार्यालय' : 'Source'}: <strong>{order.authority}</strong></span>
                    <span>{language === 'hi' ? 'प्राप्त हुआ' : 'Received'}: <strong>{order.dateReceived}</strong></span>
                  </div>
                </div>

                <p className="order-desc">{order.description}</p>

                {/* Conflict indicator if has specific event */}
                {order.eventTime && (
                  <div style={{ fontSize: '0.8rem', padding: '8px 12px', background: 'rgba(138, 43, 226, 0.05)', border: '1px solid rgba(138, 43, 226, 0.2)', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--accent-purple)' }}>
                    <Clock size={14} />
                    <span>{language === 'hi' ? 'गतिविधि का समय' : 'Activity Time'}: <strong>{order.eventTime}</strong> ({order.duration} {language === 'hi' ? 'घंटी' : 'Periods'})</span>
                  </div>
                )}

                {/* Assigner row */}
                <div className="order-footer">
                  <div className="order-assignment">
                    {assignedTeacher ? (
                      <>
                        <div 
                          className="avatar" 
                          style={{ 
                            width: '28px', 
                            height: '28px', 
                            fontSize: '0.75rem', 
                            border: `1px solid ${assignedTeacher.color}`, 
                            color: assignedTeacher.color,
                            boxShadow: `0 0 5px ${assignedTeacher.color}30`,
                            background: 'transparent'
                          }}
                        >
                          {assignedTeacher.name.split(" ")[1]?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{assignedTeacher.name.split(" ").slice(1).join(" ")}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{language === 'hi' ? 'नियुक्त अधिकारी' : 'Assigned Officer'}</div>
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <AlertTriangle size={14} /> {t('unassigned')}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {order.status === "Completed" ? (
                      <button 
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => {
                          alert(`Report Draft:\n\nSubmitted by: ${order.reports[0]?.submitterName} at ${order.reports[0]?.submittedAt}\n\n"${order.reports[0]?.content}"`);
                        }}
                      >
                        {language === 'hi' ? 'रिपोर्ट पढ़ें' : 'Read Report'}
                      </button>
                    ) : assignedTeacher ? (
                      <button 
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                        onClick={() => setShowReportModal(order)}
                      >
                        <CheckSquare size={12} /> {t('submitDraftBtn')}
                      </button>
                    ) : (
                      <button 
                        className="btn btn-primary"
                        style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', color: 'var(--bg-dark)', fontWeight: 700 }}
                        onClick={() => handleOpenSmartAssign(order)}
                      >
                        <Sparkles size={12} /> {language === 'hi' ? 'स्मार्ट नियुक्ति' : 'Smart Assign'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Smart Assignment Modal */}
      {showAssignModal && (() => {
        // Calculate recommendations dynamically
        const recommendations = getRecommendations(teachers, routine, orders, showAssignModal, leaves);
        
        return (
          <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
            <div className="modal-container glass-panel" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
              
              <div className="modal-header">
                <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--accent-cyan)" /> {language === 'hi' ? 'स्मार्ट नियुक्ति अनुशंसा' : 'Smart Assign Recommender'}
                </div>
                <button className="close-btn" onClick={() => setShowAssignModal(null)}>&times;</button>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>{language === 'hi' ? 'विश्लेषण किया गया कार्य' : 'Task Analyzed'}</div>
                <h3 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-display)', fontWeight: 700, marginTop: '4px' }}>{showAssignModal.title}</h3>
                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>{language === 'hi' ? 'कार्यालय' : 'Source'}: <strong>{showAssignModal.authority}</strong></span>
                  <span>{language === 'hi' ? 'श्रेणी' : 'Category'}: <strong>{showAssignModal.category}</strong></span>
                  {showAssignModal.eventTime && (
                    <span style={{ color: 'var(--accent-purple)' }}>{language === 'hi' ? 'कार्यक्रम स्लॉट' : 'Event Slot'}: <strong>{showAssignModal.eventTime}</strong></span>
                  )}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  {language === 'hi' ? 'गतिशील रूप से मूल्यांकित उपयुक्तता (स्टाफ संघर्ष जांच और कार्यभार संतुलन)' : 'Dynamically Scored Suitability (Staff Conflict Checking & Workload Balancing)'}
                </div>

                <div className="recommendations-list">
                  {recommendations.map((reco, idx) => {
                    const avatarChar = reco.name.split(" ")[1]?.charAt(0) || "T";
                    const isTopPick = idx === 0 && !reco.isConflicted;

                    return (
                      <div 
                        key={reco.teacherId} 
                        className={`recommendation-card ${isTopPick ? "top-pick" : ""}`}
                        style={{ opacity: reco.isConflicted ? 0.65 : 1 }}
                      >
                        <div className="recommendation-header">
                          <div className="reco-teacher-info">
                            <div 
                              className="avatar" 
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                border: `1px solid ${reco.color}`, 
                                color: reco.color,
                                background: `${reco.color}05`,
                                boxShadow: `0 0 5px ${reco.color}20` 
                              }}
                            >
                              {avatarChar}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {reco.name}
                                {reco.teacherId === "T1" && (
                                  <span style={{ fontSize: '0.65rem', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '1px 6px', borderRadius: '4px' }}>{language === 'hi' ? 'आप' : 'YOU'}</span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reco.subject} {language === 'hi' ? 'विशेषज्ञ' : 'Expert'} | {reco.weeklyPeriods} {language === 'hi' ? 'रूटीन घंटी' : 'Routine periods'}</div>
                            </div>
                          </div>

                          <div className="reco-score-container">
                            <div 
                              className="reco-score-value"
                              style={{ color: reco.isConflicted ? 'var(--accent-rose)' : reco.score >= 80 ? 'var(--accent-emerald)' : reco.score >= 50 ? 'var(--accent-cyan)' : 'var(--accent-amber)' }}
                            >
                              {reco.isConflicted ? (language === 'hi' ? 'टकराव' : 'Collision') : `${reco.score}%`}
                            </div>
                            <div className="reco-score-lbl">{language === 'hi' ? 'संगतता' : 'Compatibility'}</div>
                          </div>
                        </div>

                        {/* Recommendation Reasoning Details */}
                        <ul className="reco-reasons">
                          {reco.reasons.map((reason, rIdx) => {
                            const isPlus = reason.startsWith("+");
                            const isMinus = reason.startsWith("-");
                            const isCritical = reason.includes("CRITICAL");
                            
                            let color = 'var(--text-secondary)';
                            if (isPlus) color = 'var(--accent-emerald)';
                            if (isMinus) color = 'var(--accent-amber)';
                            if (isCritical) color = 'var(--accent-rose)';

                            return (
                              <li key={rIdx} style={{ color }}>
                                <ChevronRight size={10} style={{ minWidth: '10px', marginTop: '3px' }} />
                                <span>{reason}</span>
                              </li>
                            );
                          })}
                        </ul>

                        {/* Quick Assignment execution */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '8px' }}>
                          {reco.isConflicted ? (
                            <button 
                              className="btn btn-secondary" 
                              style={{ fontSize: '0.7rem', padding: '4px 10px', borderColor: 'var(--accent-rose)', color: 'var(--accent-rose)' }}
                              onClick={() => {
                                if (window.confirm(`FORCE ASSIGN OVERRIDE: ${reco.name} has a direct class routine teaching conflict:\n"${reco.conflictDetails}"\n\nAssigning them will affect their teaching activity. Are you sure you want to force this assignment?`)) {
                                  handleExecuteAssignment(showAssignModal.id, reco.teacherId);
                                }
                              }}
                            >
                              {language === 'hi' ? 'बलपूर्वक आवंटन ओवरराइड' : 'Force Override Assignment'}
                            </button>
                          ) : (
                            <button 
                              className={`btn ${isTopPick ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                              onClick={() => handleExecuteAssignment(showAssignModal.id, reco.teacherId)}
                            >
                              <UserCheck size={12} /> {t('assignTaskBtn')}
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Submit Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(null)}>
          <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                {t('submitDraftBtn')}
              </div>
              <button className="close-btn" onClick={() => setShowReportModal(null)}>&times;</button>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{language === 'hi' ? 'सौंपा गया कार्य' : 'Assigned Task'}</div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{showReportModal.title}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {t('assignedStaffCol')}: <strong>{teachers.find(t => t.id === showReportModal.assignedTeacherId)?.name}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitReportForm} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">{language === 'hi' ? 'कार्य रिपोर्ट मसौदा विवरण' : 'Task Report Draft Details'}</label>
                <textarea 
                  className="form-textarea" 
                  rows={4}
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder={t('complianceProofPlaceholder')}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowReportModal(null)}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  <Send size={14} /> {language === 'hi' ? 'अंतिम रिपोर्ट जमा करें' : 'Submit Finalized Report'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Add Incoming Order Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(null)}>
          <div className="modal-container glass-panel" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--accent-cyan)" /> {t('logDirectiveTitle')}
              </div>
              <button className="close-btn" onClick={() => {
                setShowAddModal(false);
                setParseSuccessBadge("");
              }}>&times;</button>
            </div>

            {/* Input Mode Selector */}
            <div style={{ display: 'flex', gap: '6px', padding: '4px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', marginBottom: '16px' }}>
              <button 
                type="button" 
                className="btn" 
                style={{ flexGrow: 1, padding: '8px 4px', fontSize: '0.7rem', background: inputMode === 'whatsapp' ? 'var(--accent-cyan)' : 'transparent', color: inputMode === 'whatsapp' ? 'var(--bg-dark)' : 'var(--text-secondary)', border: 'none', fontWeight: 700 }}
                onClick={() => { setInputMode('whatsapp'); setPdfError(""); setOcrError(""); }}
              >
                {language === 'hi' ? 'व्हाट्सएप पेस्ट करें' : 'Paste WhatsApp'}
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flexGrow: 1, padding: '8px 4px', fontSize: '0.7rem', background: inputMode === 'pdf' ? 'var(--accent-cyan)' : 'transparent', color: inputMode === 'pdf' ? 'var(--bg-dark)' : 'var(--text-secondary)', border: 'none', fontWeight: 700 }}
                onClick={() => { setInputMode('pdf'); setPdfError(""); setOcrError(""); }}
              >
                {language === 'hi' ? 'पीडीएफ फाइल' : 'PDF File'}
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flexGrow: 1, padding: '8px 4px', fontSize: '0.7rem', background: inputMode === 'image' ? 'var(--accent-cyan)' : 'transparent', color: inputMode === 'image' ? 'var(--bg-dark)' : 'var(--text-secondary)', border: 'none', fontWeight: 700 }}
                onClick={() => { setInputMode('image'); setPdfError(""); setOcrError(""); }}
              >
                {language === 'hi' ? 'स्क्रीनशॉट पेस्ट करें' : 'Paste Screenshot'}
              </button>
              <button 
                type="button" 
                className="btn" 
                style={{ flexGrow: 1, padding: '8px 4px', fontSize: '0.7rem', background: inputMode === 'manual' ? 'var(--accent-cyan)' : 'transparent', color: inputMode === 'manual' ? 'var(--bg-dark)' : 'var(--text-secondary)', border: 'none', fontWeight: 700 }}
                onClick={() => { setInputMode('manual'); setPdfError(""); setOcrError(""); }}
              >
                {language === 'hi' ? 'मैनुअल फॉर्म' : 'Manual Form'}
              </button>
            </div>

            {/* Parse Success Banner */}
            {parseSuccessBadge && (
              <div style={{ background: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span>{parseSuccessBadge}</span>
              </div>
            )}

            {/* PDF Processing Error Banner */}
            {pdfError && (
              <div style={{ background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span>{pdfError}</span>
              </div>
            )}

            {/* OCR Screen Text Error Banner */}
            {ocrError && (
              <div style={{ background: 'var(--accent-rose-glow)', color: 'var(--accent-rose)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span>{ocrError}</span>
              </div>
            )}

            {/* Conditional Rendering based on selected Input Mode */}
            {inputMode === 'whatsapp' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{language === 'hi' ? 'यहाँ व्हाट्सएप चैट फॉरवर्ड पेस्ट करें:' : 'Paste WhatsApp chat forward here:'}</label>
                  <textarea 
                    className="form-textarea" 
                    rows={8}
                    value={whatsAppText}
                    onChange={(e) => setWhatsAppText(e.target.value)}
                    placeholder={`उदाहरण के लिए (e.g.):\n*URGENT DEO MEETING ORDER*\nSubject: U-DISE Student Survey Verification meeting\nDate: 28-05-2026 at 10:30 AM\n\nAll teachers must verify spreadsheet records. Computer teacher to lead digital auditing...`}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <button 
                  type="button" 
                  className="btn btn-primary w-full"
                  onClick={handleWhatsAppParse}
                  disabled={!whatsAppText.trim()}
                >
                  <Sparkles size={16} /> {language === 'hi' ? 'ऑटो-पार्स संदेश और फॉर्म भरें' : 'Auto-Parse Message & Fill Form'}
                </button>
              </div>
            )}

            {inputMode === 'pdf' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">{language === 'hi' ? 'पठनीय पीडीएफ दस्तावेज अपलोड करें:' : 'Upload readable PDF document:'}</label>
                  
                  {pdfLoading ? (
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderStyle: 'dashed', borderColor: 'var(--accent-cyan)' }}>
                      <div style={{ border: '2px solid var(--accent-cyan)', color: 'var(--accent-cyan)', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '1.2rem' }}>
                        ⏳
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{language === 'hi' ? 'डिजिटल टेक्स्ट निकालना और स्मार्ट पार्सर चलाना...' : 'Extracting digital text & running Smart Parser...'}</div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{language === 'hi' ? 'इसमें बस कुछ क्षण लगते हैं।' : 'This takes just a moment in your browser.'}</p>
                    </div>
                  ) : (
                    <div 
                      className="glass-panel" 
                      style={{ 
                        padding: '32px', 
                        textAlign: 'center', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '12px', 
                        borderStyle: 'dashed', 
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => document.getElementById('pdf-file-input').click()}
                    >
                      <span style={{ fontSize: '2.5rem' }}>📄</span>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {language === 'hi' ? 'बीआरसी/डीईओ पीडीएफ पत्र को यहां ड्रैग और ड्रॉप करें' : 'Drag & Drop BRC/DEO PDF Letter Here'}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'hi' ? 'या अपनी फ़ाइलें ब्राउज़ करने के लिए क्लिक करें (टेक्स्ट-आधारित पीडीएफ समर्थित)' : 'or click to browse your files (supports text-based PDF documents)'}
                      </p>
                      <input 
                        id="pdf-file-input"
                        type="file" 
                        accept="application/pdf"
                        onChange={handlePdfUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {inputMode === 'image' && (
              <div 
                style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}
                onPaste={handleImagePaste}
              >
                <div className="form-group">
                  <label className="form-label">{language === 'hi' ? 'क्लिपबोर्ड से स्क्रीनशॉट पेस्ट करें (Cmd+V / Ctrl+V) या फ़ाइल अपलोड करें:' : 'Paste screenshot from clipboard (Cmd+V / Ctrl+V) or upload file:'}</label>
                  
                  {ocrLoading ? (
                    <div className="glass-panel" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderStyle: 'dashed', borderColor: 'var(--accent-cyan)' }}>
                      <div style={{ border: '2px solid var(--accent-cyan)', color: 'var(--accent-cyan)', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '1rem' }}>
                        ⏳
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', fontSize: '0.95rem' }}>{ocrStatus}</div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${ocrProgress}%`, height: '100%', background: 'var(--accent-cyan)', transition: 'width 0.3s ease' }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{ocrProgress}% {language === 'hi' ? 'पूर्ण (हिंदी और अंग्रेजी पाठ का पठन)' : 'complete (Reading English & Hindi text)'}</div>
                    </div>
                  ) : imagePreview ? (
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', border: '1px solid var(--border-glass-hover)', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>{language === 'hi' ? 'स्क्रीनशॉट सफलतापूर्वक लोड हुआ!' : 'Screenshot Captured Successfully!'}</div>
                      <img 
                        src={imagePreview} 
                        alt="Clipboard screenshot caught" 
                        style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid var(--border-glass)', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }} 
                      />
                      <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ flexGrow: 1, padding: '8px', fontSize: '0.8rem' }}
                          onClick={() => { setImageFile(null); setImagePreview(null); }}
                        >
                          {language === 'hi' ? 'छवि साफ करें' : 'Clear Image'}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          style={{ flexGrow: 2, padding: '8px', fontSize: '0.8rem' }}
                          onClick={handleOcrRun}
                        >
                          <Sparkles size={14} /> {language === 'hi' ? 'स्क्रीन ओसीआर रीडर चलाएं' : 'Run Screen OCR Reader'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="glass-panel" 
                      style={{ 
                        padding: '40px 32px', 
                        textAlign: 'center', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '12px', 
                        borderStyle: 'dashed', 
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => document.getElementById('image-file-input').click()}
                    >
                      <span style={{ fontSize: '2.5rem' }}>📸</span>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {language === 'hi' ? 'स्क्रीनशॉट चुनने के लिए क्लिक करें या Cmd+V / Ctrl+V दबाएं' : 'Click to Select Screenshot or Press Cmd+V / Ctrl+V'}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '320px', margin: '0 auto', lineHeight: '1.4' }}>
                        {language === 'hi' ? 'इस विंडो के भीतर क्लिक करें और कॉपी की गई छवि पेस्ट करें, या ड्रैग और ड्रॉप करें!' : 'Click inside this window and paste a copied screenshot image directly, or drag PNG/JPG files here!'}
                      </p>
                      <input 
                        id="image-file-input"
                        type="file" 
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {inputMode === 'manual' && (
              <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div className="form-group">
                  <label className="form-label">{language === 'hi' ? 'आदेश / पत्र का शीर्षक' : 'Order / Letter Title'}</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Conduct U-DISE Student Survey Audits"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('issuingAuthority')}</label>
                    <select 
                      className="form-select"
                      value={newAuthority}
                      onChange={(e) => setNewAuthority(e.target.value)}
                    >
                      <option value="DEO Office">DEO Office</option>
                      <option value="BRC Office">BRC Office</option>
                      <option value="SMC Committee">SMC Committee</option>
                      <option value="Education Department">Education Department</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === 'hi' ? 'कार्य की श्रेणी' : 'Task Category'}</label>
                    <select 
                      className="form-select"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="IT & Digital">IT & Digital</option>
                      <option value="Science & Maths">Science & Maths</option>
                      <option value="Administrative">Administrative</option>
                      <option value="Co-curricular">Co-curricular</option>
                      <option value="Examinations">Examinations</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('deadline')}</label>
                    <input 
                      type="date" 
                      className="form-input"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t('priorityLevelLabel')}</label>
                    <select 
                      className="form-select"
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value)}
                    >
                      <option value="High">{t('high')}</option>
                      <option value="Medium">{t('medium')}</option>
                      <option value="Low">{t('low')}</option>
                    </select>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: 600, marginBottom: '8px' }}>
                    {language === 'hi' ? 'समय-विशिष्ट बैठक / गतिविधि विवरण (वैकल्पिक)' : 'TIME-SPECIFIC MEETING / ACTIVITY DETAILS (OPTIONAL)'}
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {language === 'hi' ? 'यदि पत्र किसी विशिष्ट बैठक या गतिविधि का आदेश देता है, तो इसे स्वचालित रूप से संघर्षों की जांच के लिए कॉन्फ़िगर करें!' : 'If the letter orders a specific meeting, training, or activity on a day/time, configure this to check teaching schedule conflicts automatically!'}
                  </p>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">{language === 'hi' ? 'गतिविधि की तारीख और समय' : 'Date & Time of Event'}</label>
                      <input 
                        type="datetime-local" 
                        className="form-input"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('durationHrs')}</label>
                      <input 
                        type="number" 
                        className="form-input"
                        min={1}
                        max={6}
                        value={newDuration}
                        onChange={(e) => setNewDuration(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('directiveDescription')}</label>
                  <textarea 
                    className="form-textarea"
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Paste details of the BRC/DEO letter..."
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      setParseSuccessBadge("");
                    }}
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                  >
                    {language === 'hi' ? 'पत्र बनाएं और विश्लेषण करें' : 'Create & Analyze Letter'}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
