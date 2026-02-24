
import React, { useState } from 'react';
import { Product } from '../types';

interface ConsultationProps {
  inventory: Product[];
  lastUpdate: string | null;
}

const Consultation: React.FC<ConsultationProps> = ({ inventory, lastUpdate }) => {
  const [searchCode, setSearchCode] = useState('');
  const [result, setResult] = useState<Product | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode) return;

    // Search by codigo or EAN
    const found = inventory.find(item => 
      String(item.codigo) === searchCode || String(item.ean) === searchCode
    );
    setResult(found || null);
    setSearched(true);
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
          <div className="flex-grow">
            <input
              type="text"
              value={searchCode}
              onChange={handleInputChange}
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all shadow-sm placeholder:text-slate-400 text-black font-medium"
              placeholder="Digite o código ou EAN do produto..."
            />
          </div>
          <button
            type="submit"
            disabled={!searchCode}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-md shadow-indigo-100 whitespace-nowrap active:scale-95"
          >
            Consultar
          </button>
        </form>
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
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Item</label>
                  <p className="text-3xl font-black text-slate-800 leading-tight">{result.descricao}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EAN (Código de Barras)</label>
                    <p className="text-xl font-bold text-slate-700">{result.ean}</p>
                  </div>
                  <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Código Interno</label>
                    <p className="text-xl font-bold text-slate-700">{result.codigo}</p>
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
