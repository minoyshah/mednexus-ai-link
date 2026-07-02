import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeShell } from "./lib/native";

createRoot(document.getElementById("root")!).render(<App />);

// iOS/Android shell niceties (status bar, splash, back button). No-op on web.
void initNativeShell();
