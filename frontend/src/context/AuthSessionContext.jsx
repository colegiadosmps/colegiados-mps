import { createContext, useContext } from "react";

const AuthSessionContext = createContext({
  canEditContent: false,
  isAdmin: false,
  session: null,
  token: "",
  user: null,
});

export const AuthSessionProvider = ({ children, session }) => {
  const user = session?.user || null;
  const profile = String(user?.perfil || "").toUpperCase();

  return (
    <AuthSessionContext.Provider
      value={{
        session,
        token: session?.token || "",
        user,
        isAdmin: profile === "ADMIN",
        canEditContent: profile === "ADMIN" || profile === "COLABORADOR",
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
};

export const useAuthSession = () => useContext(AuthSessionContext);
