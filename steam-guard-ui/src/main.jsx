import React from "react";
import ReactDOM from "react-dom/client";
import { PrimeReactProvider } from "primereact/api";

// PrimeReact CSS
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import "./index.css";
import App from "./App.jsx";
import "./firebase";

ReactDOM.createRoot(document.getElementById("root")).render(
  <PrimeReactProvider>
    <App />
  </PrimeReactProvider>
);
