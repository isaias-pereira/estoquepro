
import React, { useState, useEffect } from 'react';

const Notes: React.FC = () => {
  const [notes, setNotes] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await fetch('/api/notes');
        if (response.ok) {
          const data = await response.json();
          setNotes(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || 'Erro ao carregar notas.');
        }
      } catch (err) {
        console.error("Fetch notes error:", err);
        setError('Erro de conexão com o servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="bg-white/90 backdrop-blur-xl p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-white/30 animate-fadeIn">
      <div className="flex items-center space-x-3 mb-4 sm:mb-6">
        <div className="bg-indigo-100 p-2 rounded-xl">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-slate-800 uppercase tracking-tight">Notas do Sistema</h2>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 mb-6">
          <div className="flex items-center space-x-2 mb-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Erro de Conexão</span>
          </div>
          <p className="font-normal">{error}</p>
          <p className="mt-2 text-[10px] opacity-70">Verifique se as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY estão configuradas corretamente nas configurações do AI Studio.</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-slate-900 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-inner border border-slate-800">
          <pre className="text-indigo-400 font-mono text-xs sm:text-sm leading-relaxed">
            {JSON.stringify(notes, null, 2)}
          </pre>
        </div>
      )}

      {!loading && !error && notes && notes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhuma nota encontrada.</p>
          <p className="text-slate-500 text-xs mt-2">As notas cadastradas no Supabase aparecerão aqui.</p>
        </div>
      )}
    </div>
  );
};

export default Notes;
