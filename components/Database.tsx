
import React, { useState, useRef } from 'react';
import { Product, InventoryItem } from '../types';

declare const XLSX: any;

interface DatabaseProps {
  onUploadConsultation: (data: Product[]) => void;
  onUploadInventory: (data: InventoryItem[]) => void;
  onClearDatabase: () => void;
  onBack: () => void;
}

const Database: React.FC<DatabaseProps> = ({ onUploadConsultation, onUploadInventory, onClearDatabase, onBack }) => {
  const [fileConsult, setFileConsult] = useState<File | null>(null);
  const [fileInvent, setFileInvent] = useState<File | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string, target: 'consult' | 'invent' } | null>(null);
  
  const fileConsultRef = useRef<HTMLInputElement>(null);
  const fileInventRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'consult' | 'invent') => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (type === 'consult') setFileConsult(selectedFile);
      else setFileInvent(selectedFile);
      setStatus(null);
    }
  };

  const processFile = async (file: File, type: 'consult' | 'invent') => {
    setLoading(type);
    setStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        
        // Suppress noisy ODS warnings from SheetJS
        const oldConsoleError = console.error;
        const oldConsoleWarn = console.warn;
        console.error = () => {};
        console.warn = () => {};
        
        let workbook;
        try {
          workbook = XLSX.read(data, { 
            type: 'array',
            cellStyles: false,
            cellNF: false,
            cellDates: true
          });
        } finally {
          console.error = oldConsoleError;
          console.warn = oldConsoleWarn;
        }

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, 
          raw: true,
          defval: ''
        });

        if (rows.length === 0) {
          setStatus({ type: 'error', message: 'A planilha está vazia.', target: type });
          setLoading(null);
          return;
        }

        const validRows = rows.filter(r => r.length > 0);
        
        // Skip header if the first row contains non-numeric values in numeric columns
        let dataRows = validRows;
        if (validRows.length > 0) {
          const firstRow = validRows[0];
          const isHeader = isNaN(Number(firstRow[2])) || isNaN(Number(firstRow[3]));
          if (isHeader) {
            dataRows = validRows.slice(1);
          }
        }

        const requiredCols = 4;
        
        if (validRows.length > 0 && validRows[0].length < requiredCols) {
          setStatus({ 
            type: 'error', 
            message: `Formato inválido. Verifique se o arquivo contém as ${requiredCols} colunas exigidas.`, 
            target: type 
          });
          setLoading(null);
          return;
        }

        if (type === 'consult') {
          const formattedData: Product[] = dataRows.map(row => {
            const estoqueStr = String(row[2] || '0').replace(',', '.');
            const precoStr = String(row[3] || '0').replace(',', '.');
            
            return {
              ean: String(row[0] || '').trim(),
              codigo: String(row[0] || '').trim(),
              descricao: String(row[1] || '').trim(),
              estoque: parseFloat(estoqueStr) || 0,
              preco: parseFloat(precoStr) || 0
            };
          });
          onUploadConsultation(formattedData);
          setStatus({ type: 'success', message: `Base de consulta atualizada! ${formattedData.length} registros.`, target: type });
        } else {
          const formattedData: InventoryItem[] = dataRows.map(row => {
            const qtdStr = String(row[3] || '0').replace(',', '.');
            return {
              ean: String(row[0] || '').trim(),
              codigo: String(row[1] || '').trim(),
              descricao: String(row[2] || '').trim(),
              quantidade: parseFloat(qtdStr) || 0
            };
          });
          onUploadInventory(formattedData);
          setStatus({ type: 'success', message: `Inventário carregado! ${formattedData.length} itens contados.`, target: type });
        }
        setLoading(null);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro ao processar arquivo.', target: type });
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">Base de Dados</h2>
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-indigo-600 transition-all flex items-center text-xs font-black uppercase tracking-[0.2em] bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl border border-white/20 active:scale-95"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Planilha de Consulta Section */}
      <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-6 sm:p-10">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 shadow-inner">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            1. Planilha de Consulta
          </h3>
          
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <div className="group border-4 border-dashed border-slate-100 rounded-[2rem] p-10 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition-all cursor-pointer text-center shadow-inner"
                   onClick={() => fileConsultRef.current?.click()}>
                <input type="file" ref={fileConsultRef} onChange={(e) => handleFileChange(e, 'consult')} accept=".csv, .xlsx, .xls, .ods" className="hidden" />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-sm font-black text-slate-700 truncate px-2">{fileConsult ? fileConsult.name : 'Selecionar Arquivo'}</p>
                <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-[0.2em] font-black">EAN, DESCRIÇÃO, ESTOQUE, PREÇO</p>
              </div>
              <button
                onClick={() => fileConsult && processFile(fileConsult, 'consult')}
                disabled={!fileConsult || loading === 'consult'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 disabled:bg-slate-200 disabled:shadow-none transition-all min-h-[64px]"
              >
                {loading === 'consult' ? 'Importando...' : 'Importar Consulta'}
              </button>
            </div>
            
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Estrutura Esperada (4 Colunas)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[10px] font-black shadow-sm">EAN</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[10px] font-black shadow-sm">Descrição</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[10px] font-black shadow-sm">Estoque</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[10px] font-black shadow-sm">Preço</div>
              </div>
            </div>
          </div>
          {status?.target === 'consult' && (
             <div className={`mt-8 p-5 rounded-2xl text-xs font-black tracking-tight animate-slideUp ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
               {status.message}
             </div>
          )}
        </div>
      </div>

      {/* Planilha de Inventário Section */}
      <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-6 sm:p-10">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center mr-4 shadow-inner">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            2. Planilha de Inventário
          </h3>
          
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <div className="group border-4 border-dashed border-slate-100 rounded-[2rem] p-10 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all cursor-pointer text-center shadow-inner"
                   onClick={() => fileInventRef.current?.click()}>
                <input type="file" ref={fileInventRef} onChange={(e) => handleFileChange(e, 'invent')} accept=".csv, .xlsx, .xls, .ods" className="hidden" />
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-sm font-black text-slate-700 truncate px-2">{fileInvent ? fileInvent.name : 'Selecionar Arquivo'}</p>
                <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-[0.2em] font-black">EAN, CÓDIGO, DESCRIÇÃO, QUANTIDADE</p>
              </div>
              <button
                onClick={() => fileInvent && processFile(fileInvent, 'invent')}
                disabled={!fileInvent || loading === 'invent'}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 px-8 rounded-2xl shadow-xl shadow-emerald-100 active:scale-95 disabled:bg-slate-200 disabled:shadow-none transition-all min-h-[64px]"
              >
                {loading === 'invent' ? 'Carregando...' : 'Carregar Inventário'}
              </button>
            </div>
            
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Estrutura Esperada (4 Colunas)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[9px] font-black shadow-sm">EAN</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[9px] font-black shadow-sm">Código</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[9px] font-black shadow-sm">Descrição</div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center text-[9px] font-black shadow-sm">Qtd.</div>
              </div>
            </div>
          </div>
          {status?.target === 'invent' && (
             <div className={`mt-8 p-5 rounded-2xl text-xs font-black tracking-tight animate-slideUp ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
               {status.message}
             </div>
          )}
        </div>
      </div>

      {/* Clear Database Section */}
      <div className="bg-red-50/40 backdrop-blur-md rounded-[2.5rem] p-8 sm:p-10 border border-red-100 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center text-center lg:text-left flex-col lg:flex-row">
            <div className="w-16 h-16 bg-red-100 rounded-3xl flex items-center justify-center mb-4 lg:mb-0 lg:mr-6 shadow-inner">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-red-900 tracking-tight">Zona de Perigo</h3>
              <p className="text-sm text-red-700/70 font-bold mt-1 leading-relaxed max-w-md">Esta ação irá apagar permanentemente todos os dados de consulta e inventário salvos localmente.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja apagar toda a base de dados? Esta ação não pode ser desfeita.')) {
                onClearDatabase();
                setStatus({ type: 'success', message: 'Toda a base de dados foi apagada com sucesso.', target: 'consult' });
              }
            }}
            className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-red-100 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs"
          >
            Limpar Base de Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default Database;
