import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import ErrorBoundary from "./components/ui/ErrorBoundary/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Luoi an toan cuoi cung: bat moi loi render thoat ra khoi cay route. */}
    <ErrorBoundary>
      <RouterProvider router={router}></RouterProvider>
    </ErrorBoundary>
  </StrictMode>,
);
