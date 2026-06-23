import React, { createContext, useContext, useState } from 'react';

const UsuarioContext = createContext(null);

export function UsuarioProvider({ children }) {
  const [usuarioActual, setUsuarioActual] = useState(null);

  return (
    <UsuarioContext.Provider value={{ usuarioActual, setUsuarioActual }}>
      {children}
    </UsuarioContext.Provider>
  );
}

export function useUsuario() {
  const ctx = useContext(UsuarioContext);
  if (!ctx) {
    throw new Error('useUsuario debe usarse dentro de UsuarioProvider');
  }
  return ctx;
}