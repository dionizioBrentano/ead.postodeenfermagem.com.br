import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AjudaEad from "./components/AjudaEad";
import { iniciarAnalise } from "./lib/analiseGoogle";
import "./styles.css";
import "./content/guia.css";

iniciarAnalise();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <AjudaEad />
  </StrictMode>,
);
