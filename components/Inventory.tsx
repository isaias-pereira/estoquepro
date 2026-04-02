
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, Trash2, Package, ListFilter, FileDown, Trash, Pencil, Check, X } from 'lucide-react';
import { Product, InventoryItem } from '../types';
import BarcodeScanner from './BarcodeScanner';

declare const XLSX: any;

interface InventoryProps {
  base: Product[];
  inventory: InventoryItem[];
  onAdd: (item: InventoryItem) => void;
  onRemove: (codigo: string) => void;
  onUpdate: (codigo: string, newQuantity: number) => void;
  onClear: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ base, inventory, onAdd, onRemove, onUpdate, onClear }) => {
  const [searchCode, setSearchCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [lastAddedSku, setLastAddedSku] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number | string>('');
  
  const [showConfirmFinalize, setShowConfirmFinalize] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

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
    setSelectedProduct(null);

    try {
      // Prioridade 1: Busca na planilha de inventário local (se carregada)
      const foundLocally = inventory.find(p => p.codigo === code || p.ean === code);
      
      if (foundLocally) {
        setSelectedProduct(foundLocally);
        setTimeout(() => qtyInputRef.current?.focus(), 50);
      } else {
        // Prioridade 2: Busca no Banco de Dados Central (Neon)
        const response = await fetch(`/api/products/${code}`);
        
        if (response.ok) {
          const dbProduct = await response.json();
          // Converte para InventoryItem (adiciona quantidade 0 inicial se necessário)
          setSelectedProduct({
            ...dbProduct,
            quantidade: 0
          });
          setTimeout(() => qtyInputRef.current?.focus(), 50);
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || errorData.message || 'Produto não encontrado na base local nem no banco central.');
          searchInputRef.current?.select();
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      setError('Erro ao conectar com o banco de dados central.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    
    onAdd({
      ...selectedProduct,
      quantidade: Number(quantity) || 0
    });

    setLastAddedSku(selectedProduct.codigo);

    // Reset for the next scan cycle as requested
    setSelectedProduct(null);
    setSearchCode('');
    setQuantity('');
    setError(null);
    
    // Return focus to the search input for the next scan
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const totalQuantity = useMemo(() => {
    return inventory.reduce((acc, item) => acc + item.quantidade, 0);
  }, [inventory]);

  const exportInventory = () => {
    if (inventory.length === 0) return;
    
    const data = inventory.map(item => [item.ean, item.codigo, item.descricao, item.quantidade]);
    const ws = XLSX.utils.aoa_to_sheet([['EAN', 'Código', 'Descrição', 'Quantidade'], ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '').replace(/\..+/, '');
    XLSX.writeFile(wb, `inventario_${timestamp}.csv`);
  };

  const handleFinalize = () => {
    onClear();
    setSelectedProduct(null);
    setSearchCode('');
    setQuantity('');
    setError(null);
    setEditingSku(null);
    setShowConfirmFinalize(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const handleStartEdit = (item: InventoryItem) => {
    setEditingSku(item.codigo);
    setEditQuantity(item.quantidade);
  };

  const handleSaveEdit = (codigo: string) => {
    const newQty = Number(editQuantity);
    if (!isNaN(newQty)) {
      onUpdate(codigo, newQty);
    }
    setEditingSku(null);
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
  };

  const countedList = useMemo(() => {
    return [...inventory].sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [inventory]);

  return (
    <div className="space-y-4 sm:space-y-8 animate-fadeIn">
      {/* Área de Lançamento de Contagem */}
      <div className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Lançar Contagem
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-grow relative">
            <input
              type="text"
              ref={searchInputRef}
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white text-black font-medium outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 text-sm sm:text-base pl-12"
              placeholder="Buscar EAN ou Código..."
            />
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
              title="Escanear Código de Barras"
            >
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className={`${isSearching ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-bold py-3 sm:py-4 px-6 sm:px-10 rounded-xl sm:rounded-2xl transition-all shadow-md active:scale-95 whitespace-nowrap text-sm sm:text-base flex items-center justify-center min-w-[120px]`}
          >
            {isSearching ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Consultar'}
          </button>
        </form>

        {error && (
          <div className="p-3 sm:p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs sm:text-sm font-bold mb-4 sm:mb-6 animate-shake">
            {error}
          </div>
        )}

        {showScanner && (
          <BarcodeScanner 
            onScan={(code) => {
              setSearchCode(code);
              setShowScanner(false);
              // Trigger search immediately after scan
              handleSearch(undefined, code);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {selectedProduct && (
          <div className="bg-indigo-50/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-100 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-end">
              <div>
                <span className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Produto na Base</span>
                <p className="text-base sm:text-lg font-black text-indigo-900 leading-tight">{selectedProduct.descricao}</p>
                <div className="flex gap-3 mt-1">
                  <p className="text-[10px] sm:text-xs text-indigo-500 font-bold uppercase">EAN: {selectedProduct.ean}</p>
                  <p className="text-[10px] sm:text-xs text-indigo-500 font-bold uppercase">SKU: {selectedProduct.codigo}</p>
                </div>
                <div className="mt-2 sm:mt-3 inline-block bg-white px-2 py-1 rounded-full border border-indigo-100">
                  <p className="text-[9px] sm:text-[10px] text-indigo-400 font-black uppercase tracking-widest">Contagem: {selectedProduct.quantidade}</p>
                </div>
              </div>
              <form onSubmit={handleAddCount} className="flex gap-2 sm:gap-4">
                <div className="flex-grow">
                  <label className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Qtd a Somar</label>
                  <input
                    type="number"
                    ref={qtyInputRef}
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-lg sm:rounded-xl border border-indigo-200 text-black font-black outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm sm:text-base"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 sm:px-8 rounded-lg sm:rounded-xl shadow-lg h-[38px] sm:h-[52px] active:scale-95 transition-all text-sm sm:text-base"
                >
                  Contar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Itens Contados */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fadeIn">
        <div className="bg-slate-50 px-4 py-4 sm:px-8 sm:py-5 border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-widest flex items-center">
                <ListFilter className="w-4 h-4 mr-2 text-indigo-500" />
                Itens Contados
              </h3>
            </div>

            {inventory.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={exportInventory}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                  title="Exportar (.CSV)"
                >
                  <FileDown className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                {!showConfirmFinalize ? (
                  <button
                    onClick={() => setShowConfirmFinalize(true)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                    title="Finalizar e Limpar"
                  >
                    <Trash className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-red-100 shadow-sm animate-fadeIn">
                    <button
                      onClick={handleFinalize}
                      className="bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={() => setShowConfirmFinalize(false)}
                      className="bg-slate-100 text-slate-600 text-[8px] font-black px-2 py-1 rounded uppercase"
                    >
                      X
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full">
          <table className="w-full table-fixed">
            <thead>
              <tr className="bg-slate-100/80 text-left text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-4 py-3 sm:px-8 sm:py-4 w-[60%] sm:w-[70%]">Produto</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 text-center w-[20%] sm:w-[15%]">Qtd</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4 text-right w-[20%] sm:w-[15%]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {countedList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 sm:px-8 sm:py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <Package className="w-12 h-12 mb-3 opacity-20" />
                      <p className="italic text-xs sm:text-sm font-medium">Nenhum item com contagem realizada.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                countedList.map((item) => (
                  <tr key={item.codigo} className={`hover:bg-indigo-50/30 transition-colors group even:bg-slate-200/60 ${lastAddedSku === item.codigo ? 'bg-indigo-100/50' : ''}`}>
                    <td className="px-4 py-3 sm:px-8 sm:py-4 overflow-hidden border-l-2 border-transparent group-hover:border-indigo-500 transition-all">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] sm:text-xs font-black text-slate-800 leading-tight truncate group-hover:text-indigo-900 transition-colors" title={item.descricao}>
                          {item.descricao}
                        </p>
                        {lastAddedSku === item.codigo && (
                          <span className="shrink-0 text-[6px] font-black bg-emerald-500 text-white px-1 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">Novo</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                        <span className="text-[7px] sm:text-[8px] font-black text-indigo-500 uppercase">SKU: {item.codigo}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 text-center">
                      {editingSku === item.codigo ? (
                        <input
                          type="number"
                          min="0"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-16 sm:w-20 px-1 py-1 rounded border border-indigo-300 text-center text-[10px] sm:text-base font-black outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(item.codigo);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                      ) : (
                        <span className="inline-block text-[10px] sm:text-base font-black text-indigo-600 bg-indigo-50/50 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg border border-indigo-100/50">
                          {item.quantidade}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        {editingSku === item.codigo ? (
                          <>
                            <button 
                              onClick={() => handleSaveEdit(item.codigo)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-90"
                              title="Salvar"
                            >
                              <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all active:scale-90"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-90"
                              title="Editar quantidade"
                            >
                              <Pencil className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </button>
                            <button 
                              onClick={() => onRemove(item.codigo)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90"
                              title="Remover item"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                            </button>
                          </>
                        )}
                      </div>
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

export default Inventory;
