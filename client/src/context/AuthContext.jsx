import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [profiles, setProfiles] = useState(() => {
    try { return JSON.parse(localStorage.getItem("profiles")) ?? []; } catch { return []; }
  });
  const [activeProfileId, setActiveProfileId] = useState(() =>
    Number(localStorage.getItem("profileId")) || null
  );

  const login = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("profiles", JSON.stringify(data.profiles));
    const firstId = data.profiles[0]?.id ?? null;
    const savedId = Number(localStorage.getItem("profileId"));
    const profileId = data.profiles.find((p) => p.id === savedId) ? savedId : firstId;
    localStorage.setItem("profileId", profileId);
    setToken(data.token);
    setUser(data.user);
    setProfiles(data.profiles);
    setActiveProfileId(profileId);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("profiles");
    localStorage.removeItem("profileId");
    setToken(null);
    setUser(null);
    setProfiles([]);
    setActiveProfileId(null);
  }, []);

  const switchProfile = useCallback((id) => {
    localStorage.setItem("profileId", id);
    setActiveProfileId(id);
  }, []);

  const addProfile = useCallback((profile) => {
    setProfiles((prev) => {
      const next = [...prev, profile];
      localStorage.setItem("profiles", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeProfile = useCallback((id) => {
    setProfiles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      localStorage.setItem("profiles", JSON.stringify(next));
      return next;
    });
  }, []);

  const renameProfile = useCallback((id, name) => {
    setProfiles((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, name } : p));
      localStorage.setItem("profiles", JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, profiles, activeProfileId, login, logout, switchProfile, addProfile, removeProfile, renameProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
