
import React, { useState, useEffect } from 'react';

interface UserData {
  id: string;
  username: string;
  role: 'admin' | 'user';
  created_at: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      if (response.ok) {
        setSuccess('Usuário criado com sucesso!');
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        fetchUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao criar usuário.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">Gestão de Usuários</h2>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-8 sm:p-10">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 shadow-inner">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            Novo Usuário
          </h3>

          <form onSubmit={handleCreateUser} className="grid lg:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Nome de Usuário</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-300 text-black font-bold"
                placeholder="Ex: joao.silva"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-300 text-black font-bold"
                placeholder="••••••"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Cargo / Permissão</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner text-black font-bold appearance-none"
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 disabled:bg-slate-200 disabled:shadow-none transition-all min-h-[64px] uppercase tracking-[0.2em] text-xs"
              >
                {loading ? 'Criando...' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-5 rounded-2xl text-xs font-black tracking-tight bg-red-50 text-red-700 border border-red-100 animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 p-5 rounded-2xl text-xs font-black tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100 animate-slideUp">
              {success}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Usuários Cadastrados</h3>
          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-3 py-1.5 rounded-xl border border-indigo-200">{users.length} Registros</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5">Cargo</th>
                <th className="px-8 py-5 text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-16 text-center text-slate-400 font-medium italic">Nenhum usuário encontrado no Supabase.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{u.username}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right text-xs font-bold text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
