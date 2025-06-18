import { onAuthStateChanged } from "firebase/auth";
import { createContext, useEffect, useState } from "react";
import { auth } from "../FirebaseConfig/firebase";

export const AuthContext = createContext()
export const AuthProvider = ({ children }) => {
     const [Currentuser, setCurrentUser] = useState({})
     useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user)
            } else {
                setCurrentUser(null)
            }
        })
        return () => unsubscribe()
     }, [])
  return (
    <AuthContext.Provider value={{Currentuser}}>
      {children}
    </AuthContext.Provider>
  )
}