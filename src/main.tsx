import "./lib/stubs/polyfill.ts";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";



if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

createRoot(document.getElementById("root")!).render(<App />);
