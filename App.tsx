
import React, { useState, useCallback, useEffect } from 'react';
import { User, Product, InventoryItem, View } from './types';
import Login from './components/Login';
import Header from './components/Header';
import Consultation from './components/Consultation';
import Database from './components/Database';
import Inventory from './components/Inventory';
import UserManagement from './components/UserManagement';

const STORAGE_KEY_CONSULTATION = 'estoque_pro_consultation_base';
const STORAGE_KEY_INVENTORY = 'estoque_pro_inventory_base';
const STORAGE_KEY_LAST_UPDATE = 'estoque_pro_last_update';
const STORAGE_KEY_SESSION = 'estoque_pro_session';

const SESSION_EXPIRATION_MS = 4 * 60 * 60 * 1000; // 4 hours

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
    const savedSession = localStorage.getItem(STORAGE_KEY_SESSION);

    if (savedConsultation) setConsultationBase(JSON.parse(savedConsultation));
    if (savedInventory) setInventoryList(JSON.parse(savedInventory));
    if (savedLastUpdate) setLastUpdateConsultation(savedLastUpdate);

    if (savedSession) {
      const session = JSON.parse(savedSession);
      const now = Date.now();
      
      if (session.token && now - session.timestamp < SESSION_EXPIRATION_MS) {
        // Verify token with server
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${session.token}`
          }
        })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Invalid session');
        })
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem(STORAGE_KEY_SESSION);
          setUser(null);
        });
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    }
  }, []);

  const handleLogin = (userData: User, rememberMe: boolean, token: string) => {
    setUser(userData);
    setCurrentView('consulta');

    const session = {
      user: userData,
      token: token,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('consulta');
    localStorage.removeItem(STORAGE_KEY_SESSION);
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

  const handleClearDatabase = useCallback(() => {
    setConsultationBase([]);
    setInventoryList([]);
    setLastUpdateConsultation(null);
    localStorage.removeItem(STORAGE_KEY_CONSULTATION);
    localStorage.removeItem(STORAGE_KEY_INVENTORY);
    localStorage.removeItem(STORAGE_KEY_LAST_UPDATE);
  }, []);

  const handleClearCache = useCallback(() => {
    localStorage.clear();
    window.location.reload();
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

  const handleUndoLastAddition = (item: InventoryItem, quantity: number) => {
    setInventoryList(prev => {
      const newList = prev.map(i => i.codigo === item.codigo 
        ? { ...i, quantidade: Math.max(0, i.quantidade - quantity) } 
        : i
      );
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(newList));
      return newList;
    });
  };

  const handleUpdateItemQuantity = (codigo: string, newQuantity: number) => {
    setInventoryList(prev => {
      const newList = prev.map(i => i.codigo === codigo 
        ? { ...i, quantidade: newQuantity } 
        : i
      );
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(newList));
      return newList;
    });
  };

  const handleClearInventory = () => {
    setInventoryList([]);
    localStorage.removeItem(STORAGE_KEY_INVENTORY);
  };

  const handleRemoveItemFromInventory = (codigo: string) => {
    setInventoryList(prev => {
      const newList = prev.filter(i => i.codigo !== codigo);
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(newList));
      return newList;
    });
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
    <div className="min-h-screen flex flex-col relative selection:bg-indigo-500 selection:text-white" style={globalBackgroundStyle}>
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-[3px] z-0"></div>

      <Header 
        user={user} 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout} 
      />
      
      <div className="flex-grow flex flex-col relative z-10">
        <main className="flex-grow py-4 sm:py-12">
          <div className="container mx-auto px-3 sm:px-6 max-w-3xl">
            {currentView === 'consulta' && (
              <Consultation inventory={consultationBase} lastUpdate={lastUpdateConsultation} />
            )}
            
            {currentView === 'inventario' && (
              <Inventory 
                base={consultationBase} 
                inventory={inventoryList} 
                onAdd={handleAddItemToInventory}
                onRemove={handleRemoveItemFromInventory}
                onClear={handleClearInventory}
              />
            )}

            {currentView === 'usuarios' && user.role === 'admin' && (
              <UserManagement />
            )}
            
            {currentView === 'database' && user.role === 'admin' && (
              <Database 
                onUploadConsultation={handleUpdateConsultation} 
                onClearDatabase={handleClearDatabase}
                onClearCache={handleClearCache}
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

      <footer className="bg-white/90 backdrop-blur-md border-t h-[36px] pt-[10px] pb-[12px] flex items-center justify-center text-center text-slate-600 text-sm relative z-20 font-medium">
        &copy; 2026 Estoque Pro - SGIS
      </footer>
    </div>
  );
};

export default App;
