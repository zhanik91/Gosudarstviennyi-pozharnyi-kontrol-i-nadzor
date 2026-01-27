import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const storedTheme = localStorage.getItem("theme");
if (storedTheme === "light") {
  document.documentElement.classList.add("light");
} else {
  document.documentElement.classList.remove("light");
}

createRoot(document.getElementById("root")!).render(<App />);
