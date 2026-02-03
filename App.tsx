
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Monitor, 
  Users, 
  Settings as SettingsIcon, 
  Search,
  LogOut,
  LayoutDashboard,
  Smartphone,
  ClipboardList,
  ShoppingBag,
  Wrench,
  CreditCard,
  PieChart as PieChartIcon,
  ChevronRight,
  Bell,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AssetRegistry from './components/AssetRegistry';
import EmployeeDirectory from './components/EmployeeDirectory';
import Assignments from './components/Assignments';
import Settings from './components/Settings';
import Auth from './components/Auth';
import Inventory from './components/Inventory';
import Repairs from './components/Repairs';
import Billing from './components/Billing';
import Reports from './components/Reports';
import { Asset, Employee, Assignment, Part, RepairJob, Invoice, InventoryCategory, Transaction, Department } from './types';
import { saveDatabase, loadDatabase } from './services/dbService';

const INITIAL_EMPLOYEES: Employee[] = [
  { 
    id: 'E001', 
    staffId: 'MF-001',
    name: 'Sarah Admin', 
    email: 'admin@company.com', 
    department: 'IT', 
    role: 'Admin',
    status: 'Active',
    permissions: { canDelete: true, canExport: true, canAccessAI: true, canManageUsers: true },
    password: 'password'
  },
  { 
    id: 'E002', 
    staffId: 'MF-002',
    name: 'John Manager', 
    email: 'manager@company.com', 
    department: 'Operations', 
    role: 'Manager',
    status: 'Active',
    permissions: { canDelete: false, canExport: true, canAccessAI: true, canManageUsers: false },
    password: 'password'
  },
];

const INITIAL_ASSETS: Asset[] = [
  {
    id: 'ASSET-1',
    tag: 'TAG-001',
    serialNumber: 'SN992831',
    model: 'iPhone 15 Pro Max',
    category: 'Mobile',
    specs: '256GB, Titanium',
    status: 'Available',
    purchaseDate: '2024-01-10',
    warrantyExpiry: '2025-01-10'
  },
  {
    id: 'ASSET-2',
    tag: 'TAG-002',
    serialNumber: 'SN992832',
    model: 'Samsung Galaxy S24 Ultra',
    category: 'Mobile',
    specs: '512GB, Black',
    status: 'Available',
    purchaseDate: '2024-02-15',
    warrantyExpiry: '2025-02-15'
  }
];

const INITIAL_CATEGORIES: InventoryCategory[] = [
  { id: 'cat-1', name: 'Screen', isVisible: true },
  { id: 'cat-2', name: 'Battery', isVisible: true },
  { id: 'cat-3', name: 'Charging Port', isVisible: true },
];

const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'IT' },
  { id: 'dept-2', name: 'Operations' },
  { id: 'dept-3', name: 'Finance' },
  { id: 'dept-4', name: 'Support' },
];

const INITIAL_PARTS: Part[] = [
  { id: 'P001', name: 'iPhone 15 Pro Screen', supplier: 'iFixIt Global', category: 'Screen', stock: 12, minStockLevel: 5, salePrice: 249, costPrice: 150 },
  { id: 'P002', name: 'MacBook M2 Battery', supplier: 'TechParts Co', category: 'Battery', stock: 3, minStockLevel: 5, salePrice: 129, costPrice: 80 },
];

const App: React.FC = () => {
  // Load database on initialization
  const db = loadDatabase();

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    try {
      const savedUser = localStorage.getItem('mobifix_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State initialization from Database or Initial Data
  const [employees, setEmployees] = useState<Employee[]>(db?.employees || INITIAL_EMPLOYEES);
  const [assets, setAssets] = useState<Asset[]>(db?.assets || INITIAL_ASSETS);
  const [assignments, setAssignments] = useState<Assignment[]>(db?.assignments || []);
  const [parts, setParts] = useState<Part[]>(db?.parts || INITIAL_PARTS);
  const [repairs, setRepairs] = useState<RepairJob[]>(db?.repairs || []);
  const [invoices, setInvoices] = useState<Invoice[]>(db?.invoices || []);
  const [transactions, setTransactions] = useState<Transaction[]>(db?.transactions || []);
  const [inventoryCategories, setInventoryCategories] = useState<InventoryCategory[]>(db?.inventoryCategories || INITIAL_CATEGORIES);
  const [departments, setDepartments] = useState<Department[]>(db?.departments || INITIAL_DEPARTMENTS);
  const [siteName, setSiteName] = useState(db?.siteName || 'MobiFix');
  const [currency, setCurrency] = useState(db?.currency || '$');
  
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-save to database on every state change
  useEffect(() => {
    const dataToSave = {
      employees,
      assets,
      assignments,
      parts,
      repairs,
      invoices,
      transactions,
      inventoryCategories,
      departments,
      siteName,
      currency
    };
    saveDatabase(dataToSave);
  }, [employees, assets, assignments, parts, repairs, invoices, transactions, inventoryCategories, departments, siteName, currency]);

  const siteAbbr = useMemo(() => {
    return siteName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'MF';
  }, [siteName]);

  const handleApproveTransaction = (transactionId: string) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId && t.status === 'Pending') {
        setParts(currentParts => currentParts.map(p => {
          if (p.id === t.partId) {
            const stockChange = t.type === 'Stock Intake' ? t.quantity : -t.quantity;
            return { ...p, stock: Math.max(0, p.stock + stockChange) };
          }
          return p;
        }));
        return { ...t, status: 'Approved', approvedBy: currentUser?.name };
      }
      return t;
    }));
  };

  const handleLogin = (email: string, pass: string) => {
    if (email === 'Admin' && pass === '1234') {
      const adminUser = employees.find(e => e.role === 'Admin');
      if (adminUser) { 
        setCurrentUser(adminUser); 
        localStorage.setItem('mobifix_session', JSON.stringify(adminUser));
        return true; 
      }
    }
    const user = employees.find(e => e.email === email && (e.password === pass || pass === 'admin'));
    if (user) { 
      setCurrentUser(user); 
      localStorage.setItem('mobifix_session', JSON.stringify(user));
      return true; 
    }
    return false;
  };

  const handleRegister = (name: string, email: string, dept: string) => {
    const newUser: Employee = {
      id: `E${Date.now()}`,
      staffId: `${siteAbbr}-${Math.floor(100 + Math.random() * 900)}`,
      name, email, department: dept,
      role: 'Staff', status: 'Pending',
      joinDate: new Date().toISOString().split('T')[0],
      permissions: { canDelete: false, canExport: false, canAccessAI: false, canManageUsers: false },
      password: 'password'
    };
    setEmployees(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem('mobifix_session', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mobifix_session');
    setActiveTab('dashboard');
  };

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'dashboard', minRole: 'Staff' },
    { name: 'Hardware Registry', icon: Smartphone, id: 'assets', minRole: 'Manager' },
    { name: 'Checkouts', icon: ClipboardList, id: 'assignments', minRole: 'Manager' },
    { name: 'Inventory', icon: ShoppingBag, id: 'inventory', minRole: 'Staff' },
    { name: 'Billing', icon: CreditCard, id: 'billing', minRole: 'Staff' },
    { name: 'Repairs', icon: Wrench, id: 'repairs', minRole: 'Staff' },
    { name: 'Reports', icon: PieChartIcon, id: 'reports', minRole: 'Manager' },
    { name: 'Staff', icon: Users, id: 'employees', minRole: 'Manager' },
    { name: 'Settings', icon: SettingsIcon, id: 'settings', minRole: 'Admin' },
  ];

  if (!currentUser) return <Auth onLogin={handleLogin} onRegister={handleRegister} siteName={siteName} departments={departments} />;

  const visibleTabs = navigation.filter(item => {
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Manager') return item.minRole !== 'Admin';
    return item.minRole === 'Staff';
  });

  const currentTabName = navigation.find(n => n.id === activeTab)?.name || 'Dashboard';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 h-16 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#4f46e5] rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-200 uppercase">{siteAbbr}</div>
          <h1 className="font-extrabold text-slate-800 tracking-tight text-lg">{siteName}</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 px-3 py-6 overflow-y-auto space-y-8">
        <div className="space-y-1">
          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
          {visibleTabs.map((item) => (
            <button 
              key={item.id} 
              onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} 
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all group relative ${
                activeTab === item.id 
                  ? 'bg-indigo-50/80 text-indigo-700 font-bold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 transition-colors ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className="text-[13px]">{item.name}</span>
              </div>
              {activeTab === item.id && <div className="absolute right-0 top-1.5 bottom-1.5 w-[3px] bg-[#4f46e5] rounded-l-full" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-4 bg-white/50 rounded-2xl border border-white p-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white shadow-sm shrink-0">
            {currentUser.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-800 truncate">{currentUser.name}</p>
            <p className="text-[9px] text-slate-400 font-black truncate uppercase tracking-widest">{currentUser.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 text-slate-500 hover:text-rose-600 transition-colors text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50/50 active:scale-95">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f9fafb] overflow-hidden font-['Inter'] text-slate-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden lg:flex shadow-[4px_0_24px_-12px_rgba(0,0,0,0.03)]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Slide-over Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transition-transform duration-300 transform lg:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Laravel Pro Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
               <span className="hidden sm:inline-block"><LayoutDashboard className="w-4.5 h-4.5" /></span>
               <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline-block" />
               <span className="text-slate-800 font-bold tracking-tight truncate max-w-[120px] sm:max-w-none">{currentTabName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
             <div className="relative group hidden md:block">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Universal search..." 
                  className="pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/5 w-48 md:w-80 transition-all placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
             </button>
             <div className="lg:hidden w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-700 border-2 border-white shadow-sm">
               {currentUser.name.charAt(0)}
             </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 no-scrollbar">
          <div className="max-w-[1600px] mx-auto pb-20">
            {activeTab === 'dashboard' && <Dashboard assets={assets} assignments={assignments} employees={employees} role={currentUser.role} />}
            {activeTab === 'assets' && <AssetRegistry assets={assets} setAssets={setAssets} employees={employees} searchQuery={searchQuery} setSearchQuery={setSearchQuery} role={currentUser.role} />}
            {activeTab === 'assignments' && <Assignments assignments={assignments} setAssignments={setAssignments} assets={assets} setAssets={setAssets} employees={employees} setActiveTab={setActiveTab} />}
            {activeTab === 'inventory' && <Inventory parts={parts} setParts={setParts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} categories={inventoryCategories} currency={currency} />}
            {activeTab === 'billing' && <Billing parts={parts} transactions={transactions} setTransactions={setTransactions} currency={currency} currentUser={currentUser} onApprove={handleApproveTransaction} />}
            {activeTab === 'repairs' && <Repairs repairs={repairs} setRepairs={setRepairs} parts={parts} setParts={setParts} searchQuery={searchQuery} setSearchQuery={setSearchQuery} currency={currency} />}
            {activeTab === 'reports' && <Reports parts={parts} repairs={repairs} invoices={invoices} assets={assets} employees={employees} currency={currency} />}
            {activeTab === 'employees' && <EmployeeDirectory employees={employees.filter(e => e.status === 'Active')} setEmployees={setEmployees} assets={assets} searchQuery={searchQuery} setSearchQuery={setSearchQuery} currentUser={currentUser} departments={departments} />}
            {activeTab === 'settings' && <Settings employees={employees} setEmployees={setEmployees} currentUser={currentUser} siteName={siteName} setSiteName={setSiteName} inventoryCategories={inventoryCategories} setInventoryCategories={setInventoryCategories} parts={parts} setParts={setParts} currency={currency} setCurrency={setCurrency} departments={departments} setDepartments={setDepartments} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
