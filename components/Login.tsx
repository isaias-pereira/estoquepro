
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User, rememberMe: boolean, token: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const { user: userData, token } = await response.json();
        onLogin(userData, rememberMe, token);
      } else {
        const data = await response.json();
        setError(data.error || 'Usuário ou senha inválidos.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none shadow-sm placeholder:text-slate-400/60 text-black";

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative selection:bg-indigo-500 selection:text-white"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000")',
      }}
    >
      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[4px]"></div>

      <div className="max-w-[340px] sm:max-w-md w-full bg-white/90 rounded-[2rem] shadow-2xl shadow-black/40 overflow-hidden border border-white/30 relative z-10 backdrop-blur-xl hover:shadow-indigo-500/20 transition-all duration-500">
        <div className="flex flex-col">
          <div className="bg-indigo-700 p-6 sm:p-10 text-white text-center relative overflow-hidden border-b border-white/10">
            {/* Efeito decorativo no header */}
            <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
            
            <div className="bg-white p-2 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xl w-12 h-12">
              <svg className="w-8 h-8 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tighter uppercase">Estoque Pro</h2>
            <p className="text-indigo-100/80 mt-1 text-[9px] font-black uppercase tracking-[0.3em]">Gestão Inteligente</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[10px] font-black border border-red-100 flex items-center shadow-sm">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Acesso do Usuário</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-400 text-slate-900 font-bold text-sm"
              placeholder="Usuário"
            />
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha Privada</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-400 text-slate-900 font-bold text-sm"
              placeholder="••••••"
            />
          </div>

          <div className="flex items-center px-1">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-slate-200 rounded focus:ring-indigo-500 cursor-pointer shadow-sm"
            />
            <label htmlFor="remember-me" className="ml-2.5 block text-[9px] font-black text-slate-500 uppercase tracking-[0.15em] cursor-pointer">
              Manter conectado
            </label>
          </div>

          <div className="pt-2 sm:pt-4 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[220px] sm:max-w-[260px] bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 sm:py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center space-x-2 uppercase tracking-[0.2em] text-[9px] sm:text-[10px] disabled:opacity-50"
            >
              <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              {!loading && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </form>
        
        <div className="px-8 pb-8 text-center">
          <p className="text-slate-300 text-[8px] uppercase font-black tracking-[0.4em]">
            Logística & Distribuição
          </p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
