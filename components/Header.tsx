
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
    <header className="bg-indigo-700 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-lg shrink-0">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight truncate">Estoque Pro</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            <button
              onClick={() => onNavigate('consulta')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'consulta' ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              Consulta
            </button>

            <button
              onClick={() => onNavigate('inventario')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'inventario' ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              Inventário
            </button>
            
            {user.role === 'admin' && (
              <button
                onClick={() => onNavigate('database')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'database' ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              >
                Base de Dados
              </button>
            )}

            <div className="h-6 w-px bg-indigo-500 mx-2"></div>
            <div className="flex items-center space-x-2 text-indigo-100 mr-2">
              <span className="text-[10px] uppercase font-bold bg-indigo-800 px-2 py-0.5 rounded border border-indigo-400/30">
                {user.role}
              </span>
              <span className="text-sm font-medium max-w-[100px] truncate">{user.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-red-600 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sair</span>
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-md text-indigo-100 hover:bg-indigo-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'}`}>
          <div className="flex flex-col space-y-1 pt-2 border-t border-indigo-600/50">
            <button
              onClick={() => handleNavigate('consulta')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                currentView === 'consulta' ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Consulta</span>
            </button>

            <button
              onClick={() => handleNavigate('inventario')}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                currentView === 'inventario' ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>Inventário</span>
            </button>

            {user.role === 'admin' && (
              <button
                onClick={() => handleNavigate('database')}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-bold transition-all ${
                  currentView === 'database' ? 'bg-white text-indigo-700 shadow-lg' : 'text-indigo-100 hover:bg-indigo-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>Base de Dados</span>
              </button>
            )}

            <div className="pt-4 mt-4 border-t border-indigo-600/50 flex items-center justify-between px-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-indigo-400/30">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold leading-none">{user.username}</p>
                  <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="bg-red-500/20 hover:bg-red-500 text-red-100 p-2 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
