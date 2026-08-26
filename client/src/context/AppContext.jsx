import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/api";
const AppContext = createContext(undefined);

export function AppContextProvider({ children }) {
  // auth states
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const createSession = async () => {
    try {
      const { data } = await api.get("/api/auth/me");
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };
  useEffect(() => {
    createSession();
  }, [createSession]);
  return (
    <>
      <AppContext.Provider value={{ user, loadingUser }}>
        {children}
      </AppContext.Provider>
    </>
  );
}
// a place where authentication realted data can be stored

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("userAppContext must be used within an AppContextProvider");
  }
  return context;
}
