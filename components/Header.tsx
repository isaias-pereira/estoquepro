
import React, { useState } from 'react';
import { User, View } from '../types';

interface HeaderProps {
  user: User;
  currentView: View;
  onNavigate: (view: View) => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, currentView, onNavigate, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const [isMobileAdminOpen, setIsMobileAdminOpen] = useState(false);

  const handleNavigate = (view: View) => {
    onNavigate(view);
    setIsMenuOpen(false);
    setIsMobileAdminOpen(false);
  };

  return (
    <header className="bg-indigo-700/90 backdrop-blur-md text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('consulta')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity active:scale-95 group"
          >
            <div className="bg-white p-1.5 rounded-xl shadow-sm shrink-0 group-hover:shadow-md transition-shadow">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tight truncate">Estoque Pro</h1>
          </button>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate('consulta')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                currentView === 'consulta' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              Consulta
            </button>

            <button
              onClick={() => onNavigate('inventario')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                currentView === 'inventario' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              Inventário
            </button>

            <div className="h-6 w-px bg-white/20 mx-2"></div>

            {user.role === 'admin' ? (
              <div className="relative">
                <button
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsAdminDropdownOpen(false), 200)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all active:scale-95 border border-transparent ${
                    isAdminDropdownOpen || currentView === 'database' || currentView === 'usuarios' 
                      ? 'bg-white/10 border-white/20 shadow-inner' 
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase font-black bg-indigo-800/50 px-1.5 py-0.5 rounded-md border border-white/10 leading-none mb-1">
                      {user.role}
                    </span>
                    <span className="text-xs font-bold truncate max-w-[80px]">{user.username}</span>
                  </div>
                  <svg 
                    className={`w-4 h-4 text-indigo-200 transition-transform duration-200 ${isAdminDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isAdminDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fadeIn overflow-hidden">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Administração</p>
                    </div>
                    <button
                      onClick={() => handleNavigate('database')}
                      className={`w-full flex items-center justify-end space-x-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                        currentView === 'database' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Base de Dados</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleNavigate('usuarios')}
                      className={`w-full flex items-center justify-end space-x-3 px-4 py-2.5 text-sm font-bold transition-colors ${
                        currentView === 'usuarios' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>Usuários</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-indigo-100 mr-2">
                <span className="text-[9px] uppercase font-black bg-indigo-800/50 px-2 py-0.5 rounded-lg border border-white/10">
                  {user.role}
                </span>
                <span className="text-sm font-bold max-w-[100px] truncate">{user.username}</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-red-600 transition-all active:scale-95 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013-3v1" />
              </svg>
              <span>Sair</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-xl text-indigo-100 hover:bg-indigo-600 focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] opacity-100 py-4' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-white/10 space-y-4">
            <div className="grid grid-cols-2 gap-2 pt-4">
              <button
                onClick={() => handleNavigate('consulta')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                  currentView === 'consulta' 
                    ? 'bg-white text-indigo-700 shadow-xl' 
                    : 'bg-white/10 text-white border border-white/10 backdrop-blur-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${currentView === 'consulta' ? 'bg-indigo-50' : 'bg-white/10'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider">Consulta</span>
              </button>

              <button
                onClick={() => handleNavigate('inventario')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                  currentView === 'inventario' 
                    ? 'bg-white text-indigo-700 shadow-xl' 
                    : 'bg-white/10 text-white border border-white/10 backdrop-blur-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 ${currentView === 'inventario' ? 'bg-indigo-50' : 'bg-white/10'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider">Inventário</span>
              </button>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col space-y-3 px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-sm font-black ring-2 ring-white/20 shadow-inner backdrop-blur-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black leading-none">{user.username}</p>
                      {user.role === 'admin' && (
                        <button 
                          onClick={() => setIsMobileAdminOpen(!isMobileAdminOpen)}
                          className={`p-1 rounded-md transition-colors ${isMobileAdminOpen ? 'bg-white text-indigo-700' : 'bg-white/10 text-indigo-200'}`}
                        >
                          <svg className={`w-3 h-3 transition-transform ${isMobileAdminOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-[7px] uppercase font-black text-indigo-200 tracking-widest mt-1">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-red-500/20 hover:bg-red-500 text-red-100 p-2 rounded-xl transition-all border border-red-500/30 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>

              {/* Mobile Admin Dropdown Content */}
              {user.role === 'admin' && isMobileAdminOpen && (
                <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden animate-fadeIn">
                  <button
                    onClick={() => handleNavigate('database')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      currentView === 'database' ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <span>Base de Dados</span>
                  </button>
                  <button
                    onClick={() => handleNavigate('usuarios')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                      currentView === 'usuarios' ? 'bg-white text-indigo-700' : 'text-indigo-100 hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>Usuários</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
