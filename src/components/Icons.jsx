import React from 'react';

const Icon = ({ path, size = 22, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} dangerouslySetInnerHTML={{ __html: path }} />
);

export const Icons = {
    Settings2: ({size, className}) => <Icon size={size} className={className} path='<path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="7" r="3"/><circle cx="10" cy="17" r="3"/>' />,
    PlusCircle: ({size, className}) => <Icon size={size} className={className} path='<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' />,
    Camera: ({size, className}) => <Icon size={size} className={className} path='<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' />,
    PenTool: ({size, className}) => <Icon size={size} className={className} path='<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>' />,
    List: ({size, className}) => <Icon size={size} className={className} path='<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>' />,
    History: ({size, className}) => <Icon size={size} className={className} path='<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>' />,
    BarChart3: ({size, className}) => <Icon size={size} className={className} path='<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>' />,
    CheckCircle: ({size, className}) => <Icon size={size} className={className} path='<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' />,
    Info: ({size, className}) => <Icon size={size} className={className} path='<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>' />,
    X: ({size, className}) => <Icon size={size} className={className} path='<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' />,
    AlertTriangle: ({size, className}) => <Icon size={size} className={className} path='<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' />,
    Trash2: ({size, className}) => <Icon size={size} className={className} path='<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>' />,
    Menu: ({size, className}) => <Icon size={size} className={className} path='<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>' />,
    Grid: ({size, className}) => <Icon size={size} className={className} path='<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>' />,
    ChevronLeft: ({size, className}) => <Icon size={size} className={className} path='<polyline points="15 18 9 12 15 6"/>' />,
    ChevronRight: ({size, className}) => <Icon size={size} className={className} path='<polyline points="9 18 15 12 9 6"/>' />,
    ChevronUp: ({size, className}) => <Icon size={size} className={className} path='<polyline points="18 15 12 9 6 15"/>' />,
    ChevronDown: ({size, className}) => <Icon size={size} className={className} path='<polyline points="6 9 12 15 18 9"/>' />,
    Car: ({size, className}) => <Icon size={size} className={className} path='<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H9.3a2 2 0 0 0-1.6.8L5 11l-5.16.86a1 1 0 0 0-.84.99V16h3m14 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM9 16a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>' />,
    Activity: ({size, className}) => <Icon size={size} className={className} path='<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' />,
    MapPin: ({size, className}) => <Icon size={size} className={className} path='<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>' />,
    Edit2: ({size, className}) => <Icon size={size} className={className} path='<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>' />,
    FileText: ({size, className}) => <Icon size={size} className={className} path='<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>' />,
    Users: ({size, className}) => <Icon size={size} className={className} path='<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' />,
    Download: ({size, className}) => <Icon size={size} className={className} path='<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>' />,
    Brush: ({size, className}) => <Icon size={size} className={className} path='<path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"></path><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"></path>' />,
    Layers: ({size, className}) => <Icon size={size} className={className} path='<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>' />,
    Eye: ({size, className}) => <Icon size={size} className={className} path='<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' />,
    Monitor: ({size, className}) => <Icon size={size} className={className} path='<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' />
};
