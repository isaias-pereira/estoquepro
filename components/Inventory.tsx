
import React, { useState, useRef, useEffect } from 'react';
import { Product, InventoryItem } from '../types';
import BarcodeScanner from './BarcodeScanner';

declare const XLSX: any;

interface InventoryProps {
  base: Product[];
  inventory: InventoryItem[];
  onAdd: (item: InventoryItem) => void;
  onUndo: (item: InventoryItem, quantity: number) => void;
  onUpdateQuantity: (codigo: string, newQuantity: number) => void;
  onClear: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ base, inventory, onAdd, onUndo, onUpdateQuantity, onClear }) => {
  const [searchCode, setSearchCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [lastEntry, setLastEntry] = useState<{ product: InventoryItem, quantity: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Initial focus on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (e?: React.FormEvent, codeToSearch?: string) => {
    if (e) e.preventDefault();
    const code = codeToSearch || searchCode;
    if (!code) return;
    
    setError(null);
    setIsSearching(true);
    
    try {
      // Prioridade: Busca no Banco de Dados PostgreSQL (Neon/Supabase)
      const response = await fetch(`/api/products/${code}`);
      
      if (response.ok) {
        const dbProduct = await response.json();
        // Sincroniza com a contagem local se já existir
        const localItem = inventory.find(p => p.codigo === dbProduct.codigo || p.ean === dbProduct.ean);
        
        setSelectedProduct({
          ean: dbProduct.ean,
          codigo: dbProduct.codigo,
          descricao: dbProduct.descricao,
          quantidade: localItem ? localItem.quantidade : 0
        });
        setQuantity(1);
        setTimeout(() => qtyInputRef.current?.focus(), 50);
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Fallback 1: Busca na planilha de base enviada (Base de Dados)
        const foundInBase = base.find(p => String(p.codigo) === code || String(p.ean) === code);
        
        if (foundInBase) {
          const localItem = inventory.find(p => p.codigo === foundInBase.codigo || p.ean === foundInBase.ean);
          setSelectedProduct({
            ean: foundInBase.ean,
            codigo: foundInBase.codigo,
            descricao: foundInBase.descricao,
            quantidade: localItem ? localItem.quantidade : 0
          });
          setQuantity(1);
          setTimeout(() => qtyInputRef.current?.focus(), 50);
        } else {
          // Fallback 2: Busca na planilha de inventário local (itens já contados)
          const foundInInventory = inventory.find(p => p.codigo === code || p.ean === code);
          
          if (foundInInventory) {
            setSelectedProduct(foundInInventory);
            setQuantity(1);
            setTimeout(() => qtyInputRef.current?.focus(), 50);
          } else {
            setSelectedProduct(null);
            setError(errorData.error || errorData.message || 'Produto não encontrado no banco de dados nem na base local.');
            searchInputRef.current?.select();
          }
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      // Fallback em caso de erro de conexão: Busca primeiro na base enviada
      const foundInBase = base.find(p => String(p.codigo) === code || String(p.ean) === code);
      if (foundInBase) {
        const localItem = inventory.find(p => p.codigo === foundInBase.codigo || p.ean === foundInBase.ean);
        setSelectedProduct({
          ean: foundInBase.ean,
          codigo: foundInBase.codigo,
          descricao: foundInBase.descricao,
          quantidade: localItem ? localItem.quantidade : 0
        });
        setQuantity(1);
        setTimeout(() => qtyInputRef.current?.focus(), 50);
      } else {
        // Fallback 2: Busca na planilha de inventário local
        const foundInInventory = inventory.find(p => p.codigo === code || p.ean === code);
        if (foundInInventory) {
          setSelectedProduct(foundInInventory);
          setQuantity(1);
          setTimeout(() => qtyInputRef.current?.focus(), 50);
        } else {
          setError('Erro de conexão e produto não encontrado na base local.');
        }
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    // Salva para possível desfazer
    setLastEntry({ product: selectedProduct, quantity: quantity });

    onAdd({
      ...selectedProduct,
      quantidade: quantity
    });

    // Reset para o próximo ciclo de leitura
    setSelectedProduct(null);
    setSearchCode('');
    setQuantity(1);
    setError(null);
    
    // Retorna o foco para o input de busca para a próxima leitura
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    }, 50);
  };

  const handleUndo = () => {
    if (!lastEntry) return;

    onUndo(lastEntry.product, lastEntry.quantity);
    
    // Restaura o estado anterior
    setSelectedProduct(lastEntry.product);
    setQuantity(lastEntry.quantity);
    setLastEntry(null);
    setError(null);

    setTimeout(() => {
      qtyInputRef.current?.focus();
      qtyInputRef.current?.select();
    }, 50);
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setSearchCode('');
    setQuantity(1);
    setError(null);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const exportInventory = () => {
    const countedItems = inventory.filter(item => item.quantidade > 0);
    if (countedItems.length === 0) return;
    
    const data = countedItems.map(item => [item.ean, item.codigo, item.descricao, item.quantidade]);
    const ws = XLSX.utils.aoa_to_sheet([['EAN', 'Código', 'Descrição', 'Quantidade'], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '').replace(/\..+/, '');
    XLSX.writeFile(wb, `inventario_${timestamp}.csv`);
  };

  const handleFinalize = () => {
    if (window.confirm('Tem certeza que deseja finalizar e LIMPAR toda a contagem atual? Esta ação não pode ser desfeita.')) {
      onClear();
      setSelectedProduct(null);
      setSearchCode('');
      setQuantity(1);
      setError(null);
      searchInputRef.current?.focus();
    }
  };

  const startEditing = (item: InventoryItem) => {
    setEditingSku(item.codigo);
    setEditValue(item.quantidade.toString());
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const handleSaveEdit = (codigo: string) => {
    const newVal = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(newVal)) {
      onUpdateQuantity(codigo, newVal);
    }
    setEditingSku(null);
  };

  const countedList = inventory.filter(item => item.quantidade > 0);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Área de Lançamento de Contagem */}
      <div className="bg-white/95 backdrop-blur-md p-4 sm:p-6 rounded-3xl shadow-xl border border-white/20">
        <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center">
          <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center mr-3 shadow-inner">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Lançar Contagem
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-grow relative">
            <input
              type="text"
              inputMode="numeric"
              ref={searchInputRef}
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-5 py-3.5 rounded-xl border border-slate-100 bg-slate-50/50 focus:bg-white text-black font-bold outline-none transition-all focus:ring-4 focus:ring-indigo-500/5 pr-12 shadow-inner text-sm"
              placeholder="EAN ou Código..."
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
              title="Escanear Código de Barras"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 00-1 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </button>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap disabled:opacity-50 min-h-[52px] text-sm"
            disabled={isSearching}
          >
            {isSearching ? 'Buscando...' : 'Consultar'}
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

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold mb-6 animate-shake">
            {error}
          </div>
        )}

        {selectedProduct && (
          <div className="bg-indigo-50/50 p-4 sm:p-6 rounded-2xl border border-indigo-100 animate-fadeIn shadow-inner">
            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div className="space-y-3">
                <div>
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-1">Produto Identificado</span>
                  <p className="text-lg sm:text-xl font-black text-indigo-950 leading-tight tracking-tight">{selectedProduct.descricao}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[8px] bg-white px-2 py-1 rounded-lg border border-indigo-100 text-indigo-500 font-black uppercase tracking-widest">EAN: {selectedProduct.ean}</span>
                  <span className="text-[8px] bg-white px-2 py-1 rounded-lg border border-indigo-100 text-indigo-500 font-black uppercase tracking-widest">SKU: {selectedProduct.codigo}</span>
                </div>
                <div className="inline-flex items-center bg-indigo-600 text-white px-3 py-1.5 rounded-lg shadow-lg shadow-indigo-200">
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-[9px] font-black uppercase tracking-widest">
                    Contagem: {selectedProduct.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                  </p>
                </div>
              </div>
              <form onSubmit={handleAddCount} className="flex gap-2 sm:gap-3">
                <div className="flex-grow">
                  <label className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.2em] block mb-1">Qtd a Somar</label>
                  <input
                    type="number"
                    ref={qtyInputRef}
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 bg-white text-black font-black outline-none focus:ring-4 focus:ring-indigo-500/10 text-lg shadow-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 rounded-xl shadow-xl shadow-emerald-100 h-[52px] active:scale-95 transition-all flex items-center justify-center text-sm"
                  >
                    Contar
                  </button>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-grow bg-slate-200 hover:bg-slate-300 text-slate-600 font-black rounded-lg h-[40px] active:scale-95 transition-all flex items-center justify-center"
                      title="Cancelar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {lastEntry && (
                      <button
                        type="button"
                        onClick={handleUndo}
                        className="flex-grow bg-amber-100 hover:bg-amber-200 text-amber-700 font-black rounded-lg h-[40px] active:scale-95 transition-all flex items-center justify-center border border-amber-200"
                        title="Desfazer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Itens Contados */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="bg-slate-50/50 px-5 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Itens Contados</h3>
          <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black px-2.5 py-1 rounded-lg border border-indigo-200">{countedList.length} SKUs</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white text-left text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b">
                <th className="px-5 py-4">Item / Código</th>
                <th className="px-5 py-4 text-right">Qtd. Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {countedList.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-5 py-10 text-center text-slate-400 font-medium italic text-xs">Nenhuma contagem realizada.</td>
                </tr>
              ) : (
                countedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-black text-slate-800 group-hover:text-indigo-700 transition-colors">{item.descricao}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[8px] font-bold text-slate-400 uppercase">EAN: {item.ean}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">SKU: {item.codigo}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {editingSku === item.codigo ? (
                        <input
                          ref={editInputRef}
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveEdit(item.codigo)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(item.codigo);
                            if (e.key === 'Escape') setEditingSku(null);
                          }}
                          className="w-20 px-2 py-1.5 rounded-lg border-2 border-indigo-500 bg-white text-black font-black outline-none text-right shadow-lg text-sm"
                        />
                      ) : (
                        <span 
                          onClick={() => startEditing(item)}
                          className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-black min-w-[50px] text-center border border-indigo-100 shadow-sm cursor-pointer hover:bg-indigo-100 transition-colors"
                          title="Clique para editar"
                        >
                          {item.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {countedList.length > 0 && (
          <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleFinalize}
              className="bg-white hover:bg-red-50 text-red-600 font-black py-3 px-6 rounded-xl transition-all border border-red-100 active:scale-95 flex items-center justify-center shadow-sm text-xs"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpar Tudo
            </button>
            <button
              onClick={exportInventory}
              className="bg-slate-900 hover:bg-black text-white font-black py-3 px-6 rounded-xl transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center text-xs"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 4m4 4v12" />
              </svg>
              Exportar (.CSV)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
