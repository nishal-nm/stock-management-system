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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      <aside className="w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/50 flex flex-col shadow-xl shadow-slate-200/20 dark:shadow-none z-10">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 font-bold text-xl flex-shrink-0">
            S
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent tracking-tight">
            StockFlow
          </h1>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.end ? location.pathname === item.path : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={clsx(
                  'group flex items-center gap-3.5 py-3 rounded-xl font-medium transition-all duration-300 relative overflow-hidden',
                  item.isSubItem ? 'pl-10 pr-4 text-sm' : 'px-4',
                  isActive 
                    ? 'text-indigo-700 dark:text-indigo-300'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 opacity-100 rounded-xl" />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700/50 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300" />
                )}
                {isActive && (
                  <div className={clsx("absolute top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full", item.isSubItem ? 'left-6' : 'left-0')} />
                )}
                <Icon size={item.isSubItem ? 16 : 20} className={clsx("relative z-10 transition-transform duration-300 group-hover:scale-110", isActive ? 'text-indigo-600 dark:text-indigo-400' : 'opacity-70')} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-100 dark:border-slate-700/50">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-3 w-full px-4 py-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl font-medium transition-all duration-300 group"
            >
              <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay dark:opacity-10"></div>
        <div className="h-full overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
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
