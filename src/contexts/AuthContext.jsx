
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Admin login
    if (email === 'gators@gators.com' && password === 'admin123') {
      const adminUser = {
        id: 'admin',
        email: email,
        role: 'admin',
        name: 'Administrator'
      };
      setUser(adminUser);
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    // Trainer login
    if (email.includes('@trainer.com') && password === 'trainer123') {
      const trainerUser = {
        id: email.split('@')[0],
        email: email,
        role: 'trainer',
        name: email.split('@')[0].replace('nametrainer', 'Trainer')
      };
      setUser(trainerUser);
      localStorage.setItem('currentUser', JSON.stringify(trainerUser));
      return { success: true, user: trainerUser };
    }

    // Trainee login (any other email)
    if (email && password) {
      const traineeUser = {
        id: email.split('@')[0],
        email: email,
        role: 'trainee',
        name: email.split('@')[0]
      };
      setUser(traineeUser);
      localStorage.setItem('currentUser', JSON.stringify(traineeUser));
      return { success: true, user: traineeUser };
    }

    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};
