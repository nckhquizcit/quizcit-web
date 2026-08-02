/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const ForgotPasswordContext = createContext();

export function ForgotPasswordProvider({ children }) {
  const [currentState, setCurrentState] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [confirmedToken, setConfirmedToken] = useState("");
  return (
    <ForgotPasswordContext.Provider
      value={{
        currentState,
        setCurrentState,
        email,
        setEmail,
        resetToken,
        setResetToken,
        confirmedToken,
        setConfirmedToken,
      }}
    >
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
