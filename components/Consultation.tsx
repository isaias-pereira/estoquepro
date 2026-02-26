
import React, { useState } from 'react';
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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-xl border border-white/20 relative">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mr-3 shadow-inner">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            Consultar
          </h2>
          {lastUpdate && (
            <span className="hidden sm:inline-block text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              Atualizado: {lastUpdate}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className={`flex-grow relative ${error ? 'animate-shake' : ''}`}>
            <input
              type="text"
              value={searchCode}
              onChange={handleInputChange}
              className={`w-full px-6 py-4 rounded-2xl border bg-slate-50/50 focus:bg-white focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all shadow-inner placeholder:text-slate-400 text-black font-bold pr-14 ${
                error ? 'border-red-400 focus:border-red-500' : 'border-slate-100 focus:border-indigo-400'
              }`}
              placeholder="Código ou EAN..."
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
              title="Escanear Código de Barras"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 px-10 rounded-2xl transition-all shadow-lg shadow-indigo-200 whitespace-nowrap active:scale-95 min-h-[60px]"
          >
            {isSearching ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <div className="bg-white/80 backdrop-blur-md border border-white/20 text-slate-800 p-10 rounded-[2.5rem] text-center shadow-xl">
            <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-black text-xl tracking-tight">Sem base de consulta</p>
            <p className="mt-3 text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">Vá até a aba 'Base de Dados' para realizar a importação da Planilha de Consulta.</p>
          </div>
        ) : searched ? (
          result ? (
            <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden animate-slideUp">
              <div className="bg-indigo-50/50 px-8 py-5 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em]">Ficha Técnica do Produto</span>
              </div>
              <div className="p-8 sm:p-12 space-y-10">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-indigo-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <label className="text-[10px] font-black uppercase tracking-[0.25em]">Descrição do Item</label>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 leading-[1.1] tracking-tight">{result.descricao}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group space-y-3 bg-emerald-50/30 p-8 rounded-[2rem] border border-emerald-100/50 transition-all hover:bg-white hover:shadow-xl hover:border-emerald-200">
                    <div className="flex items-center space-x-2 text-emerald-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <label className="text-[10px] font-black uppercase tracking-[0.25em]">Preço de Venda</label>
                    </div>
                    <p className="text-4xl font-black text-emerald-600 tracking-tight">
                      {result.preco ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.preco) : 'R$ 0,00'}
                    </p>
                  </div>

                  <div className="group space-y-3 bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100/50 transition-all hover:bg-white hover:shadow-xl hover:border-indigo-200">
                    <div className="flex items-center space-x-2 text-indigo-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <label className="text-[10px] font-black uppercase tracking-[0.25em]">Estoque Atual</label>
                    </div>
                    <p className="text-4xl font-black text-slate-900 tracking-tight">{result.estoque ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-md border border-red-100 text-red-700 p-10 rounded-[2.5rem] text-center animate-shake shadow-xl">
              <div className="bg-red-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-black text-xl tracking-tight">Produto não localizado</p>
              <p className="mt-2 text-red-600/70 font-medium">O código informado não consta em nossa base.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-white/40 h-72 border-4 border-dashed border-white/10 rounded-[3rem] bg-white/5 backdrop-blur-[2px] transition-all hover:bg-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <svg className="w-10 h-10 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-black uppercase tracking-[0.3em] text-xs">Aguardando Consulta</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultation;
