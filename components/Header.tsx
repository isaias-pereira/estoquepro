
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

  const handleNavigate = (view: View) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-indigo-700/90 backdrop-blur-md text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-1.5 rounded-xl shadow-sm shrink-0">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tight truncate">Estoque Pro</h1>
          </div>

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
            
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('database')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  currentView === 'database' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              >
                Base de Dados
              </button>
            )}

            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('usuarios')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  currentView === 'usuarios' ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              >
                Usuários
              </button>
            )}

            <div className="h-6 w-px bg-white/20 mx-2"></div>
            <div className="flex items-center space-x-2 text-indigo-100 mr-2">
              <span className="text-[9px] uppercase font-black bg-indigo-800/50 px-2 py-0.5 rounded-lg border border-white/10">
                {user.role}
              </span>
              <span className="text-sm font-bold max-w-[100px] truncate">{user.username}</span>
            </div>
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
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-[600px] opacity-100 py-6' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-white/10 space-y-6">
            <div className="grid grid-cols-2 gap-3 pt-6">
              <button
                onClick={() => handleNavigate('consulta')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-95 ${
                  currentView === 'consulta' 
                    ? 'bg-white text-indigo-700 shadow-xl' 
                    : 'bg-white/10 text-white border border-white/10 backdrop-blur-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${currentView === 'consulta' ? 'bg-indigo-50' : 'bg-white/10'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">Consulta</span>
              </button>

              <button
                onClick={() => handleNavigate('inventario')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-95 ${
                  currentView === 'inventario' 
                    ? 'bg-white text-indigo-700 shadow-xl' 
                    : 'bg-white/10 text-white border border-white/10 backdrop-blur-sm'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${currentView === 'inventario' ? 'bg-indigo-50' : 'bg-white/10'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">Inventário</span>
              </button>

              {user.role === 'admin' && (
                <button
                  onClick={() => handleNavigate('database')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-95 ${
                    currentView === 'database' 
                      ? 'bg-white text-indigo-700 shadow-xl' 
                      : 'bg-white/10 text-white border border-white/10 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${currentView === 'database' ? 'bg-indigo-50' : 'bg-white/10'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Dados</span>
                </button>
              )}

              {user.role === 'admin' && (
                <button
                  onClick={() => handleNavigate('usuarios')}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all active:scale-95 ${
                    currentView === 'usuarios' 
                      ? 'bg-white text-indigo-700 shadow-xl' 
                      : 'bg-white/10 text-white border border-white/10 backdrop-blur-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${currentView === 'usuarios' ? 'bg-indigo-50' : 'bg-white/10'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">Usuários</span>
                </button>
              )}
            </div>

            <div className="pt-6 border-t border-white/10 flex items-center justify-between px-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-base font-black ring-2 ring-white/20 shadow-inner backdrop-blur-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black leading-none">{user.username}</p>
                  <p className="text-[8px] uppercase font-black text-indigo-200 tracking-widest mt-1">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-500/20 hover:bg-red-500 text-red-100 p-2.5 rounded-xl transition-all border border-red-500/30 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
