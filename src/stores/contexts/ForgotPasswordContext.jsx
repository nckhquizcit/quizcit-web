import { createContext, useContext, useState } from "react";

const ForgotPasswordContext = createContext();

export function ForgotPasswordProvider({ children }) {
  const [currentState, setCurrentState] = useState(1);
  return (
    <ForgotPasswordContext.Provider value={{ currentState, setCurrentState }}>
      {children}
    </ForgotPasswordContext.Provider>
  );
}
export function useForgotPassword() {
  const context = useContext(ForgotPasswordContext);
  if (!context) {
    console.log(
      "Only use useForgotPassword in ForgotPasswordProvider's children",
    );
  }
  return context;
}
