import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Performance: Remove initial loader
const removeInitialLoader = () => {
    const loader = document.getElementById('initial-loader');
    if (loader) {
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.2s';
        setTimeout(() => loader.remove(), 200);
    }
};

// Create root with concurrent features
const root = createRoot(document.getElementById("root")!);

// Render app
root.render(
    <StrictMode>
        <App />
    </StrictMode>
);

// Remove loader after hydration
removeInitialLoader();
