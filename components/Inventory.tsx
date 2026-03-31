
import React, { useState, useRef, useEffect } from 'react';
import { Product, InventoryItem } from '../types';

declare const XLSX: any;

interface InventoryProps {
  base: Product[];
  inventory: InventoryItem[];
  onAdd: (item: InventoryItem) => void;
  onClear: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ base, inventory, onAdd, onClear }) => {
  const [searchCode, setSearchCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  const [showConfirmFinalize, setShowConfirmFinalize] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Initial focus on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode) return;
    
    setError(null);
    setIsSearching(true);
    setSelectedProduct(null);

    try {
      // Prioridade 1: Busca na planilha de inventário local (se carregada)
      const foundLocally = inventory.find(p => p.codigo === searchCode || p.ean === searchCode);
      
      if (foundLocally) {
        setSelectedProduct(foundLocally);
        setTimeout(() => qtyInputRef.current?.focus(), 50);
      } else {
        // Prioridade 2: Busca no Banco de Dados Central (Neon)
        const response = await fetch(`/api/products/${searchCode}`);
        
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
      quantidade: quantity
    });

    // Reset for the next scan cycle as requested
    setSelectedProduct(null);
    setSearchCode('');
    setQuantity(1);
    setError(null);
    
    // Return focus to the search input for the next scan
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
    onClear();
    setSelectedProduct(null);
    setSearchCode('');
    setQuantity(1);
    setError(null);
    setShowConfirmFinalize(false);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const countedList = inventory.filter(item => item.quantidade > 0);

  return (
    <div className="space-y-4 sm:space-y-8 animate-fadeIn">
      {/* Área de Lançamento de Contagem */}
      <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Lançar Contagem
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <input
            type="text"
            ref={searchInputRef}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ''))}
            className="flex-grow px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white text-black font-medium outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 text-sm sm:text-base"
            placeholder="Buscar EAN ou Código..."
          />
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
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
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
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 sm:px-8 sm:py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest">Itens Contados</h3>
          <span className="bg-slate-200 text-slate-600 text-[9px] sm:text-[10px] font-black px-2 py-1 rounded-full">{countedList.length} SKUs</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] sm:min-w-full">
            <thead>
              <tr className="bg-white text-left text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-2 py-3 sm:px-4 sm:py-4">Código</th>
                <th className="px-2 py-3 sm:px-4 sm:py-4">Descrição</th>
                <th className="px-4 py-3 sm:px-8 sm:py-4 text-right">Qtd. Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {countedList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 sm:px-8 sm:py-12 text-center text-slate-400 italic text-xs sm:text-sm">Nenhum item com contagem realizada.</td>
                </tr>
              ) : (
                countedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-2 py-3 sm:px-4 sm:py-4 text-[10px] sm:text-xs font-bold text-slate-600">{item.codigo}</td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4 text-[10px] sm:text-xs font-black text-slate-800">{item.descricao}</td>
                    <td className="px-4 py-3 sm:px-8 sm:py-4 text-right text-base sm:text-lg font-black text-indigo-600">{item.quantidade}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {countedList.length > 0 && (
          <div className="p-4 sm:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            {!showConfirmFinalize ? (
              <button
                onClick={() => setShowConfirmFinalize(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all border border-red-200 active:scale-95 flex items-center justify-center text-xs sm:text-sm"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Finalizar e Limpar
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 items-center animate-fadeIn">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mr-2">Confirmar Limpeza?</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleFinalize}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs"
                  >
                    Sim, Limpar
                  </button>
                  <button
                    onClick={() => setShowConfirmFinalize(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={exportInventory}
              className="bg-slate-800 hover:bg-black text-white font-bold py-2.5 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center text-xs sm:text-sm"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 4m4 4v12" />
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
