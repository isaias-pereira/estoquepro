
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
    
    try {
      // Prioridade: Busca no Banco de Dados PostgreSQL (Neon)
      const response = await fetch(`/api/products/${searchCode}`);
      
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
        // Fallback: Busca na planilha de inventário local
        const found = inventory.find(p => p.codigo === searchCode || p.ean === searchCode);
        
        if (found) {
          setSelectedProduct(found);
          setQuantity(1);
          setTimeout(() => qtyInputRef.current?.focus(), 50);
        } else {
          setSelectedProduct(null);
          setError('Produto não encontrado no banco de dados nem na planilha local.');
          searchInputRef.current?.select();
        }
      }
    } catch (err) {
      console.error("Search error:", err);
      // Fallback em caso de erro de conexão
      const found = inventory.find(p => p.codigo === searchCode || p.ean === searchCode);
      if (found) {
        setSelectedProduct(found);
        setQuantity(1);
        setTimeout(() => qtyInputRef.current?.focus(), 50);
      } else {
        setError('Erro de conexão com o servidor. Verifique sua internet.');
      }
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

  const countedList = inventory.filter(item => item.quantidade > 0);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Área de Lançamento de Contagem */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          Lançar Contagem
        </h2>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            ref={searchInputRef}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value.replace(/\D/g, ''))}
            className="flex-grow px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50/30 focus:bg-white text-black font-medium outline-none transition-all focus:ring-4 focus:ring-indigo-500/10"
            placeholder="Buscar EAN ou Código na Planilha de Inventário..."
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-2xl transition-all shadow-md active:scale-95 whitespace-nowrap disabled:opacity-50"
            disabled={isSearching}
          >
            {isSearching ? 'Buscando...' : 'Consultar'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold mb-6 animate-shake">
            {error}
          </div>
        )}

        {selectedProduct && (
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-6 items-end">
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Produto na Base de Inventário</span>
                <p className="text-lg font-black text-indigo-900 leading-tight">{selectedProduct.descricao}</p>
                <div className="flex gap-4 mt-1">
                  <p className="text-xs text-indigo-500 font-bold uppercase">EAN: {selectedProduct.ean}</p>
                  <p className="text-xs text-indigo-500 font-bold uppercase">SKU: {selectedProduct.codigo}</p>
                </div>
                <div className="mt-3 inline-block bg-white px-3 py-1 rounded-full border border-indigo-100">
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Contagem acumulada: {selectedProduct.quantidade}</p>
                </div>
              </div>
              <form onSubmit={handleAddCount} className="flex gap-4">
                <div className="flex-grow">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Quantidade a Somar</label>
                  <input
                    type="number"
                    ref={qtyInputRef}
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-indigo-200 text-black font-black outline-none focus:ring-4 focus:ring-indigo-500/10"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 rounded-xl shadow-lg h-[52px] active:scale-95 transition-all"
                >
                  Contar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Itens Contados */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-8 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Itens Contados (Qtd &gt; 0)</h3>
          <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full">{countedList.length} SKUs</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-8 py-4">EAN</th>
                <th className="px-4 py-4">Código</th>
                <th className="px-4 py-4">Descrição</th>
                <th className="px-8 py-4 text-right">Qtd. Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {countedList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 italic">Nenhum item com contagem realizada.</td>
                </tr>
              ) : (
                countedList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-4 text-xs font-bold text-slate-600">{item.ean}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-600">{item.codigo}</td>
                    <td className="px-4 py-4 text-xs font-black text-slate-800">{item.descricao}</td>
                    <td className="px-8 py-4 text-right text-lg font-black text-indigo-600">{item.quantidade}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {countedList.length > 0 && (
          <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4">
            <button
              onClick={handleFinalize}
              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-8 rounded-xl transition-all border border-red-200 active:scale-95 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Finalizar e Limpar
            </button>
            <button
              onClick={exportInventory}
              className="bg-slate-800 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 4m4 4v12" />
              </svg>
              Exportar Apenas Contados (.CSV)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
