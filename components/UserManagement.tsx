
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
    <div className="space-y-3 sm:space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Gestão de Usuários</h2>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-4 sm:p-6">
          <h3 className="text-sm sm:text-base font-black text-slate-800 mb-4 sm:mb-6 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-inner">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            Novo Usuário
          </h3>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 sm:ml-2">Usuário</label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-300 text-black font-bold text-xs sm:text-sm"
                placeholder="Ex: joao.silva"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 sm:ml-2">Senha</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner placeholder:text-slate-300 text-black font-bold text-xs sm:text-sm"
                placeholder="••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1 sm:ml-2">Cargo</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                className="w-full px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-lg sm:rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all outline-none shadow-inner text-black font-bold appearance-none text-xs sm:text-sm"
              >
                <option value="user">Usuário Comum</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="lg:col-span-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 sm:py-4 px-6 rounded-lg sm:rounded-xl shadow-xl shadow-indigo-100 active:scale-95 disabled:bg-slate-200 disabled:shadow-none transition-all min-h-[48px] sm:min-h-[56px] uppercase tracking-[0.2em] text-[9px] sm:text-[10px]"
              >
                {loading ? 'Criando...' : 'Cadastrar Usuário'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl text-[10px] font-black tracking-tight bg-red-50 text-red-700 border border-red-100 animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 rounded-xl text-[10px] font-black tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-100 animate-slideUp">
              {success}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-slate-50/50 px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Usuários Cadastrados</h3>
          <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black px-2.5 py-1 rounded-lg border border-indigo-200">{users.length} Registros</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white text-left text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                <th className="px-5 py-3.5">Usuário</th>
                <th className="px-5 py-3.5">Cargo</th>
                <th className="px-5 py-3.5 text-right">Data de Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-10 text-center text-slate-400 font-medium italic text-xs">Nenhum usuário encontrado no banco de dados.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{u.username}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {u.role === 'admin' ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-[10px] font-bold text-slate-400">
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
