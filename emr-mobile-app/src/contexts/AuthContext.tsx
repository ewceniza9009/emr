import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AuthenticatedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  permissions: string[];
  patientId?: string;
  patientAccountId?: string;
  tenantId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthenticatedUser | null;
  token: string | null;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  login: (email: string, password: string) => Promise<void>;
  magicLogin: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Automatically detect host to bridge between web (localhost), android emulator (10.0.2.2), and production (Vercel)
const getAutoApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'https://localhost:34731';
  }

  // Deployed production Vercel apps or domain endpoints should target the envUrl or standard local port
  if (hostname.endsWith('.vercel.app') || !hostname.match(/^[0-9.]+$/)) {
    return envUrl || 'https://localhost:34731';
  }

  // Android emulator loopback to host localhost
  return 'https://10.0.2.2:34731';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(() => {
    const cached = localStorage.getItem('halkyone-mobile-api-url');
    const autoUrl = getAutoApiUrl();

    // Self-healing: Clear cached emulator IP if the user has loaded on a deployed production domain
    if (cached && cached.includes('10.0.2.2') && !window.location.hostname.match(/^(localhost|127\.0\.0\.1)$/)) {
      return autoUrl;
    }

    return cached || autoUrl;
  });

  useEffect(() => {
    localStorage.setItem('halkyone-mobile-api-url', apiUrl);
  }, [apiUrl]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('halkyone-mobile-token');
    const savedUser = localStorage.getItem('halkyone-mobile-user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to parse saved user credentials:', e);
        localStorage.removeItem('halkyone-mobile-token');
        localStorage.removeItem('halkyone-mobile-user');
      }
    }
    setIsLoading(false);
  }, []);

  // Watch for Magic Links (e.g. ?token=DEMO_MAGIC_MRN-99999 or ?magicToken=...)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const magicToken = searchParams.get('token') || searchParams.get('magicToken');
    const deviceId = searchParams.get('deviceId') || '';

    if (magicToken) {
      console.log('Intercepted passwordless magic access token:', magicToken, 'deviceId:', deviceId);
      setIsLoading(true);
      
      // Perform passwordless authenticating bypass
      fetch(`${apiUrl}/api/auth/magic-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: magicToken, deviceId: deviceId }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Magic login validation failed.');
          }
          return res.json();
        })
        .then((data) => {
          console.log('Magic login authentication success!', data);
          localStorage.setItem('halkyone-mobile-token', data.token);
          localStorage.setItem('halkyone-mobile-user', JSON.stringify(data.user));
          setToken(data.token);
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Clear query parameters from address bar gracefully
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        })
        .catch((err) => {
          console.error('Failed to authenticate magic bypass link:', err);
          alert(`Magic Login Failed: ${err.message}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [apiUrl]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials or unauthorized login.');
      }

      const data = await res.json();
      localStorage.setItem('halkyone-mobile-token', data.token);
      localStorage.setItem('halkyone-mobile-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Credentials login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const magicLogin = async (bypassToken: string) => {
    setIsLoading(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryDeviceId = searchParams.get('deviceId');
      
      let localDeviceId = localStorage.getItem('halkyone-device-id');
      if (!localDeviceId) {
        localDeviceId = `DEV_MAC_MRN-99999`; // Sturdy default for zero-config demo ease
        localStorage.setItem('halkyone-device-id', localDeviceId);
      }
      
      const activeDeviceId = queryDeviceId || localDeviceId;

      const res = await fetch(`${apiUrl}/api/auth/magic-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: bypassToken, deviceId: activeDeviceId }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Magic bypass authorization failed.');
      }

      const data = await res.json();
      localStorage.setItem('halkyone-mobile-token', data.token);
      localStorage.setItem('halkyone-mobile-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Magic bypass login error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('halkyone-mobile-token');
    localStorage.removeItem('halkyone-mobile-user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      token,
      apiUrl,
      setApiUrl,
      login,
      magicLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
