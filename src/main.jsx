import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import LoginPage from "./pages/LoginPage/LoginPage";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LoginPage></LoginPage>
  </StrictMode>,
);
