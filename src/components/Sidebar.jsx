import React from 'react';
import { 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  CheckSquare, 
  Grid,
  X,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ activeView, onViewChange, teachers, orders, isOpen, onClose, language, t }) {
  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: <Grid size={18} /> },
    { id: 'timetable', label: t('timetable'), icon: <Calendar size={18} /> },
    { id: 'teachers', label: t('teachers'), icon: <Users size={18} /> },
    { id: 'orders', label: t('orders'), icon: <FileText size={18} /> },
    { id: 'reports', label: t('reports'), icon: <CheckSquare size={18} /> },
    { id: 'staff-portal', label: t('staff-portal'), icon: <UserCheck size={18} /> }
  ];

  // Calculate notifications (unassigned letters count)
  const unassignedCount = orders.filter(o => !o.assignedTeacherId && o.status !== "Completed").length;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand logo */}
      <div className="brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="brand-icon">
            <Clock size={22} color="var(--bg-dark)" strokeWidth={2.5} />
          </div>
          <span className="brand-title" style={{ fontSize: '0.95rem' }}>{t('brandName')}</span>
        </div>
        <button 
          className="sidebar-close-btn" 
          onClick={onClose}
          aria-label="Close Menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav list */}
      <nav style={{ flexGrow: 1 }}>
        <ul className="nav-list">
          {menuItems.map(item => (
            <li 
              key={item.id}
              className={`nav-item ${activeView === item.id ? 'active' : ''}`}
              onClick={() => {
                onViewChange(item.id);
                if (onClose) onClose();
              }}
            >
              <span className="nav-icon" style={{ display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              <span style={{ fontSize: '0.9rem', flexGrow: 1 }}>{item.label}</span>
              
              {/* Floating notification badge for orders */}
              {item.id === 'orders' && unassignedCount > 0 && (
                <span 
                  style={{ 
                    background: 'var(--accent-rose)', 
                    color: 'var(--bg-dark)', 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    borderRadius: '99px', 
                    padding: '2px 7px',
                    boxShadow: '0 0 8px var(--accent-rose-glow)' 
                  }}
                >
                  {unassignedCount}
                </span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar Footer User Details */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">JK</div>
          <div className="user-info">
            <div className="name">Mr. Janardan Kumar</div>
            <div className="role">Computer Teacher</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
