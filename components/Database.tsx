
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
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length === 0) {
          setStatus({ type: 'error', message: 'A planilha está vazia.', target: type });
          setLoading(null);
          return;
        }

        const validRows = rows.filter(r => r.length > 0);
        const requiredCols = type === 'consult' ? 3 : 4;
        
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
          const formattedData: Product[] = validRows.map(row => ({
            ean: String(row[0] || '').trim(),
            codigo: String(row[1] || '').trim(),
            descricao: String(row[2] || '').trim()
          }));
          onUploadConsultation(formattedData);
          setStatus({ type: 'success', message: `Base de consulta atualizada! ${formattedData.length} registros.`, target: type });
        } else {
          const formattedData: InventoryItem[] = validRows.map(row => ({
            ean: String(row[0] || '').trim(),
            codigo: String(row[1] || '').trim(),
            descricao: String(row[2] || '').trim(),
            quantidade: Number(row[3]) || 0
          }));
          onUploadInventory(formattedData);
          setStatus({ type: 'success', message: `Inventário carregado! ${formattedData.length} itens contados.`, target: type });
        }
        setLoading(null);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      setStatus({ type: 'error', message: 'Erro ao processar arquivo.', target: type });
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white tracking-tight">Base de Dados</h2>
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-indigo-600 transition-all flex items-center text-sm font-bold uppercase tracking-widest bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-white/20"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Planilha de Consulta Section */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            1. Planilha de Consulta
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all cursor-pointer text-center"
                   onClick={() => fileConsultRef.current?.click()}>
                <input type="file" ref={fileConsultRef} onChange={(e) => handleFileChange(e, 'consult')} accept=".csv, .xlsx, .xls, .ods" className="hidden" />
                <p className="text-sm font-bold text-slate-700">{fileConsult ? fileConsult.name : 'Selecionar Base de Consulta'}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">EAN, CÓDIGO, DESCRIÇÃO</p>
              </div>
              <button
                onClick={() => fileConsult && processFile(fileConsult, 'consult')}
                disabled={!fileConsult || loading === 'consult'}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 disabled:bg-slate-200"
              >
                {loading === 'consult' ? 'Importando...' : 'Importar Consulta'}
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estrutura Esperada (3 Colunas)</h4>
              <div className="grid grid-cols-3 gap-1">
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[10px] font-bold">EAN</div>
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[10px] font-bold">Código</div>
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[10px] font-bold">Descrição</div>
              </div>
            </div>
          </div>
          {status?.target === 'consult' && (
             <div className={`mt-4 p-4 rounded-xl text-xs font-bold ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
               {status.message}
             </div>
          )}
        </div>
      </div>

      {/* Planilha de Inventário Section */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="p-8">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            2. Planilha de Inventário
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all cursor-pointer text-center"
                   onClick={() => fileInventRef.current?.click()}>
                <input type="file" ref={fileInventRef} onChange={(e) => handleFileChange(e, 'invent')} accept=".csv, .xlsx, .xls, .ods" className="hidden" />
                <p className="text-sm font-bold text-slate-700">{fileInvent ? fileInvent.name : 'Selecionar Base de Inventário'}</p>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">EAN, CÓDIGO, DESCRIÇÃO, QUANTIDADE</p>
              </div>
              <button
                onClick={() => fileInvent && processFile(fileInvent, 'invent')}
                disabled={!fileInvent || loading === 'invent'}
                className="w-full bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg active:scale-95 disabled:bg-slate-200"
              >
                {loading === 'invent' ? 'Carregando...' : 'Carregar Inventário'}
              </button>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estrutura Esperada (4 Colunas)</h4>
              <div className="grid grid-cols-4 gap-1">
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[8px] font-bold">EAN</div>
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[8px] font-bold">Código</div>
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[8px] font-bold">Descrição</div>
                <div className="bg-white p-2 rounded border border-slate-200 text-center text-[8px] font-bold">Qtd.</div>
              </div>
            </div>
          </div>
          {status?.target === 'invent' && (
             <div className={`mt-4 p-4 rounded-xl text-xs font-bold ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
               {status.message}
             </div>
          )}
        </div>
      </div>

      {/* Clear Database Section */}
      <div className="bg-red-50/50 backdrop-blur-md rounded-3xl p-8 border border-red-100 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-red-900">Zona de Perigo</h3>
              <p className="text-sm text-red-700 font-medium">Esta ação irá apagar permanentemente todos os dados de consulta e inventário salvos localmente.</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja apagar toda a base de dados? Esta ação não pode ser desfeita.')) {
                onClearDatabase();
                setStatus({ type: 'success', message: 'Toda a base de dados foi apagada com sucesso.', target: 'consult' });
              }
            }}
            className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-widest text-sm"
          >
            Limpar Base de Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default Database;
