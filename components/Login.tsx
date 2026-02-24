
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Pre-registered credentials
    if (username === 'admin' && password === '123') {
      onLogin({ username: 'Administrador', role: 'admin' });
    } else if (username === 'user' && password === '123') {
      onLogin({ username: 'Usuário Comum', role: 'user' });
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all outline-none shadow-sm placeholder:text-slate-400/60 text-black";

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative"
      style={{ 
        backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000")',
      }}
    >
      {/* Overlay para contraste */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

      <div className="max-w-md w-full bg-slate-50/70 rounded-3xl shadow-2xl shadow-black/30 overflow-hidden border border-white/30 relative z-10 backdrop-blur-xl">
        <div className="bg-indigo-700/90 p-10 text-white text-center relative overflow-hidden">
          {/* Efeito decorativo no header */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Estoque Pro</h2>
          <p className="text-indigo-100/90 mt-2 text-sm font-medium">Gestão Inteligente para Varejo</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          {error && (
            <div className="bg-red-50/80 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-center animate-shake backdrop-blur-sm">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Acesso do Usuário</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClasses}
              placeholder="Acesso"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Senha Privada</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClasses}
              placeholder="******"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center space-x-2 active:scale-[0.98] uppercase tracking-widest text-sm"
            >
              <span>Entrar no Sistema</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </form>
        
        <div className="px-10 pb-8 text-center">
          <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
            Logística e Distribuição Alimentícia
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
