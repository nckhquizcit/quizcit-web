/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const ForgotPasswordContext = createContext();

// Danh dau da qua buoc 1; con dau nay ma context reset ve 1 nghia la user vua reload.
const STEP_MARKER_KEY = "forgot-password-in-progress";

function readStepMarker() {
  try {
    return window.sessionStorage.getItem(STEP_MARKER_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStepMarker(active) {
  try {
    if (active) {
      window.sessionStorage.setItem(STEP_MARKER_KEY, "1");
    } else {
      window.sessionStorage.removeItem(STEP_MARKER_KEY);
    }
  } catch {
    // Storage bi chan: khong phat hien duoc reload, bo qua.
  }
}

export function ForgotPasswordProvider({ children }) {
  const [currentState, setCurrentState] = useState(1);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [confirmedToken, setConfirmedToken] = useState("");
  // Reload lam mat state trong bo nho: con dau buoc nhung dang o buoc 1 tuc la vua bi reset.
  const [sessionReset] = useState(() => readStepMarker());
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
        sessionReset,
        clearSessionReset: () => writeStepMarker(false),
        markStepAdvanced: () => writeStepMarker(true),
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
