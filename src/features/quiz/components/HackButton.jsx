import { useState, useEffect } from "react";
import { getStoredUser } from "../../../services/apiClient";
import { Button } from "../../../components/ui";

export default function HackButton({ onHackSubmit }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const user = getStoredUser();
      const isAdmin = user?.role === "ADMIN";
      const hasKey = window.hackModeEnabled === true;
      setVisible(isAdmin || hasKey);
    };

    checkVisibility();
    window.addEventListener("hackModeToggled", checkVisibility);
    return () => window.removeEventListener("hackModeToggled", checkVisibility);
  }, []);

  if (!visible) return null;

  return (
    <Button
      variant="danger"
      onClick={onHackSubmit}
      style={{ marginLeft: "10px", backgroundColor: "#ff4d4f", color: "white" }}
    >
      Chọn câu đúng
    </Button>
  );
}
