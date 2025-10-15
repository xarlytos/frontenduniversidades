import React, { useState, useEffect } from 'react';
import { Eye } from 'lucide-react';  // Cambiar Menu por Eye
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import ContactsPage from './components/ContactsPage';
import CountPage from './components/CountPage';
import UserManagement from './components/UserManagement';
import AdminPanel from './components/AdminPanel';
import ContactosCompleta from './components/ContactosCompleta';
import { useContacts } from './hooks/useContacts';
import { usePermissions } from './hooks/usePermissions';
import { ContactFilters } from './types';

function App() {
  const { 
    user, 
    users,
    isAuthenticated, 
    isLoading, 
    login, 
    logout, 
    hasPermission, 
    getAllUsers,
    updateUserPassword,
    toggleDeletePermission,
    getUserDeletePermission,
    updateUser,
    deleteUser,
    addUser
  } = useAuth();
  const { hasPermissionWithHierarchy } = usePermissions();
  const [currentPage, setCurrentPage] = useState<'contactos' | 'conteo' | 'usuarios' | 'admin' | 'contactoscompleta'>('contactos');
  const [contactsFilters, setContactsFilters] = useState<Partial<ContactFilters>>({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const toggleSidebar = () => {
    const newState = !isSidebarVisible;
    setIsSidebarVisible(newState);
    localStorage.setItem('sidebarVisible', JSON.stringify(newState));
  };
  
  // Pasar isAuthenticated && !isLoading para asegurar que la auth esté completa
  const { contacts, addContact, updateContact, deleteContact, deleteMultipleContacts, refreshContacts } = useContacts(isAuthenticated && !isLoading);

  // Cargar usuarios cuando el usuario sea admin
  useEffect(() => {
    if (user?.role?.toLowerCase() === 'admin') {
      getAllUsers();
    }
  }, [user?.role, getAllUsers]);

  const handleNavigateToContacts = (filters: Partial<ContactFilters>) => {
    setContactsFilters(filters);
    setCurrentPage('contactos');
  };

  // Mostrar efecto de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Mostrar página de login si no está autenticado
  if (!isAuthenticated) {
    return <LoginPage onLogin={login} isLoading={isLoading} />;
  }

  // Eliminar las secciones de loading y error ya que useContacts no las tiene
  // El hook useContacts carga los datos instantáneamente desde localStorage

  // Filtrar contactos según permisos del usuario
  console.log('🔍 App.tsx - Contacts from hook:', contacts.length, contacts.map(c => ({ id: c.id, nombre: c.nombre })));
  console.log('👤 App.tsx - Current user:', user);
  console.log('🎭 App.tsx - User role:', user?.role);
  console.log('🎭 App.tsx - User role type:', typeof user?.role);
  console.log('🎭 App.tsx - Is admin?:', user?.role === 'admin');
  console.log('🎭 App.tsx - Is admin (lowercase)?:', user?.role?.toLowerCase() === 'admin');
  
  // Eliminar el filtro del frontend - el backend ya maneja la jerarquía correctamente
  const filteredContacts = contacts; // Usar todos los contactos que vienen del backend
  
  console.log('📊 App.tsx - All contacts from backend:', filteredContacts.length, filteredContacts.map(c => c.nombre));

  return (
    <div className="flex h-screen bg-gray-50">
      {isSidebarVisible && (
        <Sidebar 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          user={user}
          onLogout={logout}
          onToggleSidebar={toggleSidebar}  // Pasar la función
        />
      )}
      
      {/* Botón flotante solo cuando sidebar está oculto */}
      {!isSidebarVisible && (
        <button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 p-2 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
          title="Mostrar sidebar"
        >
          <Eye className="w-5 h-5 text-gray-600" />
        </button>
      )}
      
      <main className="flex-1 overflow-auto relative">
        {currentPage === 'contactos' && (
          <ContactsPage
            contacts={filteredContacts}
            onAddContact={addContact}
            onUpdateContact={updateContact}
            onDeleteContact={deleteContact}
            onDeleteMultipleContacts={deleteMultipleContacts}
            onRefreshContacts={refreshContacts}
            initialFilters={contactsFilters}
            currentUser={user}
            hasPermission={async (action, contactOwnerId) => {
              if (user?.role?.toLowerCase() === 'admin') return true;
              if (action === 'view') return hasPermissionWithHierarchy(user?.id || '', contactOwnerId || '');
              if (action === 'edit') return user?.id === contactOwnerId;
              if (action === 'delete') return await hasPermission('delete', contactOwnerId);
              return false;
            }}
          />
        )}
        
        {currentPage === 'conteo' && (
          <CountPage
            onNavigateToContacts={handleNavigateToContacts}
            currentUser={user}
          />
        )}
        
        {currentPage === 'contactoscompleta' && (
          <ContactosCompleta />
        )}
        
        {currentPage === 'admin' && user?.role?.toLowerCase() === 'admin' && (
          <AdminPanel
            users={users}
            currentUser={user}
            onUpdateUserPassword={updateUserPassword}
            onToggleDeletePermission={toggleDeletePermission}
            getUserDeletePermission={getUserDeletePermission}
          />
        )}
        
        {currentPage === 'usuarios' && user?.role?.toLowerCase() === 'admin' && (
          <UserManagement
            users={users}
            currentUser={user}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
          />
        )}
      </main>
    </div>
  );
}

export default App;