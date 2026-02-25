
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
    if (!code) return;

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
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            Consulta de Produtos
          </h2>
          {lastUpdate && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
              Atualizado: {lastUpdate}
            </span>
          )}
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow relative">
            <input
              type="text"
              value={searchCode}
              onChange={handleInputChange}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm placeholder:text-slate-400 text-black font-medium pr-14"
              placeholder="Digite o código ou EAN do produto..."
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="Escanear Código de Barras"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            disabled={!searchCode || isSearching}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-md shadow-indigo-100 whitespace-nowrap active:scale-95 min-w-[160px]"
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
          <div className="bg-amber-50/50 border border-amber-100 text-amber-800 p-10 rounded-3xl text-center backdrop-blur-sm">
            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-100">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="font-bold text-lg">Sem base de consulta disponível</p>
            <p className="mt-2 text-amber-600/80 max-w-xs mx-auto">Vá até a aba 'Base de Dados' para realizar a importação da Planilha de Consulta.</p>
          </div>
        ) : searched ? (
          result ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-slideUp">
              <div className="bg-indigo-50/50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">Ficha Técnica</span>
              </div>
              <div className="p-10 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <label className="text-[10px] font-black uppercase tracking-widest">Descrição do Item</label>
                  </div>
                  <p className="text-3xl font-black text-slate-800 leading-tight">{result.descricao}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group space-y-2 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-emerald-100">
                    <div className="flex items-center space-x-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <label className="text-[10px] font-black uppercase tracking-widest">Preço de Venda</label>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">
                      {result.preco ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(result.preco) : 'R$ 0,00'}
                    </p>
                  </div>

                  <div className="group space-y-2 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-indigo-100">
                    <div className="flex items-center space-x-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <label className="text-[10px] font-black uppercase tracking-widest">Estoque Atual</label>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{result.estoque ?? 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50/50 border border-red-100 text-red-700 p-10 rounded-3xl text-center animate-shake backdrop-blur-sm">
              <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-red-100">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-bold text-lg">Produto não localizado</p>
              <p className="mt-1 text-red-600/70">O código informado não consta em nossa base de consulta.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-white/50 h-64 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-[1px]">
            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="font-medium tracking-wide">Pronto para buscar informações...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consultation;
