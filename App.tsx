
import React, { useState, useCallback, useEffect } from 'react';
import { User, Product, InventoryItem, View } from './types';
import Login from './components/Login';
import Header from './components/Header';
import Consultation from './components/Consultation';
import Database from './components/Database';
import Inventory from './components/Inventory';

const STORAGE_KEY_CONSULTATION = 'estoque_pro_consultation_base';
const STORAGE_KEY_INVENTORY = 'estoque_pro_inventory_base';
const STORAGE_KEY_LAST_UPDATE = 'estoque_pro_last_update';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('consulta');
  
  // Data states
  const [consultationBase, setConsultationBase] = useState<Product[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  
  // Metadata states
  const [lastUpdateConsultation, setLastUpdateConsultation] = useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedConsultation = localStorage.getItem(STORAGE_KEY_CONSULTATION);
    const savedInventory = localStorage.getItem(STORAGE_KEY_INVENTORY);
    const savedLastUpdate = localStorage.getItem(STORAGE_KEY_LAST_UPDATE);

    if (savedConsultation) setConsultationBase(JSON.parse(savedConsultation));
    if (savedInventory) setInventoryList(JSON.parse(savedInventory));
    if (savedLastUpdate) setLastUpdateConsultation(savedLastUpdate);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentView('consulta');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('consulta');
    // Note: We don't clear the database on logout so it remains available for the next user
  };

  const handleUpdateConsultation = useCallback((data: Product[]) => {
    setConsultationBase(data);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setLastUpdateConsultation(formattedDate);
    
    // Persist
    localStorage.setItem(STORAGE_KEY_CONSULTATION, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY_LAST_UPDATE, formattedDate);
  }, []);

  const handleUpdateInventory = useCallback((data: InventoryItem[]) => {
    setInventoryList(data);
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(data));
  }, []);

  const handleClearDatabase = useCallback(() => {
    setConsultationBase([]);
    setInventoryList([]);
    setLastUpdateConsultation(null);
    localStorage.removeItem(STORAGE_KEY_CONSULTATION);
    localStorage.removeItem(STORAGE_KEY_INVENTORY);
    localStorage.removeItem(STORAGE_KEY_LAST_UPDATE);
  }, []);

  const handleAddItemToInventory = (item: InventoryItem) => {
    setInventoryList(prev => {
      let newList;
      const existing = prev.find(i => i.codigo === item.codigo);
      if (existing) {
        newList = prev.map(i => i.codigo === item.codigo 
          ? { ...i, quantidade: i.quantidade + item.quantidade } 
          : i
        );
      } else {
        newList = [...prev, item];
      }
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(newList));
      return newList;
    });
  };

  const handleClearInventory = () => {
    const clearedList = inventoryList.map(item => ({ ...item, quantidade: 0 }));
    setInventoryList(clearedList);
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(clearedList));
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const globalBackgroundStyle = {
    backgroundImage: 'url("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed'
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={globalBackgroundStyle}>
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-0"></div>

      <Header 
        user={user} 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout} 
      />
      
      <div className="flex-grow flex flex-col relative z-10">
        <main className="flex-grow py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            {currentView === 'consulta' && (
              <Consultation inventory={consultationBase} lastUpdate={lastUpdateConsultation} />
            )}
            
            {currentView === 'inventario' && (
              <Inventory 
                base={consultationBase} 
                inventory={inventoryList} 
                onAdd={handleAddItemToInventory}
                onClear={handleClearInventory}
              />
            )}
            
            {currentView === 'database' && user.role === 'admin' && (
              <Database 
                onUploadConsultation={handleUpdateConsultation} 
                onUploadInventory={handleUpdateInventory}
                onClearDatabase={handleClearDatabase}
                onBack={() => setCurrentView('consulta')} 
              />
            )}
            
            {currentView === 'database' && user.role !== 'admin' && (
              <div className="bg-white p-8 rounded-3xl shadow-lg text-center">
                <p className="text-red-500 font-bold">Acesso restrito ao administrador.</p>
                <button onClick={() => setCurrentView('consulta')} className="mt-4 text-indigo-600 font-bold underline">Voltar para Consulta</button>
              </div>
            )}
          </div>
        </main>
      </div>

      <footer className="bg-white/90 backdrop-blur-md border-t py-4 text-center text-slate-600 text-sm relative z-20 font-medium">
        &copy; {new Date().getFullYear()} Estoque Pro - Sistema de Gestão Inteligente de Supermercados
      </footer>
    </div>
  );
};

export default App;
