
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User, rememberMe: boolean) => void;
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
        const userData = await response.json();
        onLogin(userData, rememberMe);
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

      <div className="max-w-md w-full bg-white/90 rounded-[3rem] shadow-2xl shadow-black/40 overflow-hidden border border-white/20 relative z-10 backdrop-blur-2xl animate-fadeIn">
        <div className="bg-indigo-700/90 p-12 text-white text-center relative overflow-hidden border-b border-white/10">
          {/* Efeito decorativo no header */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="bg-white p-2 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl w-16 h-16">
            <svg className="w-10 h-10 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Estoque Pro</h2>
          <p className="text-indigo-100/80 mt-2 text-[10px] font-black uppercase tracking-[0.3em]">Gestão Inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-5 rounded-2xl text-xs font-black border border-red-100 flex items-center animate-shake shadow-sm">
              <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Acesso do Usuário</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-300 text-black font-bold"
              placeholder="Usuário"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Senha Privada</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-300 text-black font-bold"
              placeholder="••••••"
            />
          </div>

          <div className="flex items-center px-2">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 text-indigo-600 border-slate-200 rounded-lg focus:ring-indigo-500 cursor-pointer shadow-sm"
            />
            <label htmlFor="remember-me" className="ml-3 block text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] cursor-pointer">
              Manter conectado
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-4 rounded-2xl transition-all shadow-2xl shadow-indigo-200 flex items-center justify-center space-x-3 active:scale-95 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
            >
              <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
              {!loading && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </div>
        </form>
        
        <div className="px-12 pb-10 text-center">
          <p className="text-slate-300 text-[9px] uppercase font-black tracking-[0.4em]">
            Logística & Distribuição
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
