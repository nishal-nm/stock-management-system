import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { LayoutDashboard, Package, PlusSquare, ArrowRightLeft, LogOut, FileText, Tags } from 'lucide-react';
import clsx from 'clsx';
import ConfirmModal from './ConfirmModal';

export default function Layout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    dispatch(logout());
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Create Product', path: '/products/new', icon: PlusSquare, isSubItem: true },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Stock Movement', path: '/stock/movement', icon: ArrowRightLeft },
    { name: 'Stock Report', path: '/stock/report', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans antialiased">
      <aside className="w-64 bg-slate-100 border-r border-slate-200 flex flex-col z-10 flex-shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-200 bg-slate-100">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm">
            S
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            StockFlow
          </h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'flex items-center gap-3 py-2.5 px-3 rounded-lg font-medium text-sm transition-colors duration-150',
                  item.isSubItem ? 'pl-8' : '',
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                )}
              >
                <Icon size={isActive ? 18 : 17} className={clsx(isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-slate-200 bg-slate-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg font-medium text-sm transition-colors duration-150"
          >
            <LogOut size={17} className="text-rose-400 group-hover:text-rose-600" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden relative bg-white flex flex-col">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto h-full relative z-10">
            <Outlet />
          </div>
        </div>
      </main>
      <ConfirmModal 
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Sign Out"
        message="Are you sure you want to sign out of the system?"
        confirmText="Sign Out"
        isDestructive={true}
      />
    </div>
  );
}
