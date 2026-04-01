
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Product } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface ConsultationProps {
  inventory: Product[];
  lastUpdate: string | null;
}

const Consultation: React.FC<ConsultationProps> = ({ inventory, lastUpdate }) => {
  const [searchCode, setSearchCode] = useState('');
  const [result, setResult] = useState<Product | null>(null);
  const [searched, setSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = async (e?: React.FormEvent, codeToSearch?: string) => {
    if (e) e.preventDefault();
    const code = codeToSearch || searchCode;
    
    if (!code) {
      setError('Por favor, digite um código ou escaneie um produto.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearched(false);

    try {
      // Prioridade 1: Busca na planilha de consulta local (Base de Dados enviada)
      const foundLocally = inventory.find(item => 
        String(item.codigo) === code || String(item.ean) === code
      );

      if (foundLocally) {
        setResult(foundLocally);
        setSearched(true);
      } else {
        // Prioridade 2: Busca no Banco de Dados Central (Supabase) se não encontrar na planilha
        const response = await fetch(`/api/products/${code}`);
        
        if (response.ok) {
          const dbProduct = await response.json();
          setResult(dbProduct);
          setSearched(true);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || errorData.message || 'Produto não encontrado.');
          setResult(null);
          setSearched(true);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      // Fallback final em caso de erro de conexão
      const found = inventory.find(item => 
        String(item.codigo) === code || String(item.ean) === code
      );
      setResult(found || null);
      setSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setSearchCode(value);
    setSearched(false);
    setError(null);
  };

  return (
    <div className="space-y-3 sm:space-y-6 animate-fadeIn">
      <div className="bg-blue-100 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border border-blue-200 relative">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-indigo-50 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-inner">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            Consultar
          </h2>
          {lastUpdate && (
            <span className="hidden sm:inline-block text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
              Atualizado: {lastUpdate}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className={`flex-grow relative ${error ? 'animate-shake' : ''}`}>
            <input
              type="text"
              inputMode="numeric"
              value={searchCode}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-lg sm:rounded-xl border bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-inner placeholder:text-slate-400 text-black font-bold pl-10 sm:pl-12 text-xs sm:text-sm ${
                error ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-indigo-400'
              }`}
              placeholder="Código ou EAN..."
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
              title="Escanear Código de Barras"
            >
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-2.5 sm:py-3 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-lg shadow-indigo-200 whitespace-nowrap active:scale-95 min-h-[44px] sm:min-h-[52px] text-xs sm:text-sm"
          >
            {isSearching ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </div>
            ) : 'Consultar'}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-xs font-bold mt-2 ml-2 animate-fadeIn">
            {error}
          </p>
        )}

        {showScanner && (
          <BarcodeScanner 
            onScan={(code) => {
              setSearchCode(code);
              setShowScanner(false);
              handleSearch(undefined, code);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>

      <div className="min-h-[200px]">
        {inventory.length === 0 ? (
          <div className="bg-blue-100 border border-blue-200 text-slate-800 p-6 sm:p-10 rounded-3xl text-center shadow-xl">
            <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-black text-lg tracking-tight">Sem base de consulta</p>
            <p className="mt-2 text-slate-500 font-medium max-w-xs mx-auto leading-relaxed text-xs">Vá até a aba 'Base de Dados' para realizar a importação da Planilha de Consulta.</p>
          </div>
        ) : searched ? (
          result ? (
            <div className="bg-blue-100 rounded-3xl shadow-2xl border border-blue-200 overflow-hidden animate-slideUp">
              <div className="p-6 sm:p-10 space-y-8">
                {/* Header & Description */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="h-px w-6 bg-indigo-200"></span>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Ficha Técnica</span>
                    <span className="h-px flex-grow bg-indigo-50"></span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">
                    {result.descricao}
                  </h2>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <label className="text-[9px] font-black uppercase tracking-[0.2em]">Preço de Venda</label>
                    </div>
                    <p className="text-4xl font-black text-emerald-600 tracking-tighter">
                      {result.preco ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.preco) : 'R$ 0,00'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className={`flex items-center space-x-2 ${(result.estoque ?? 0) < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {(result.estoque ?? 0) < 0 ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                      <label className="text-[9px] font-black uppercase tracking-[0.2em]">
                        {(result.estoque ?? 0) < 0 ? 'Estoque Crítico' : 'Estoque Disponível'}
                      </label>
                    </div>
                    <div className="flex items-baseline space-x-1.5">
                      <p className={`text-4xl font-black tracking-tighter ${(result.estoque ?? 0) < 0 ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                        {(result.estoque ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                      </p>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${(result.estoque ?? 0) < 0 ? 'text-red-400' : 'text-slate-400'}`}>Unidades</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Info */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">EAN</span>
                    <span className="text-[10px] font-bold text-slate-700">{result.ean}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Código</span>
                    <span className="text-[10px] font-bold text-slate-700">{result.codigo}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-100 border border-red-200 text-red-700 p-6 sm:p-10 rounded-3xl text-center animate-shake shadow-xl">
              <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-black text-lg tracking-tight">Produto não localizado</p>
              <p className="mt-1 text-red-600/70 font-medium text-xs">O código informado não consta em nossa base.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-white/40 h-60 border-4 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-[2px] transition-all hover:bg-white/10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-black uppercase tracking-[0.3em] text-[10px]">Aguardando Consulta</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultation;
