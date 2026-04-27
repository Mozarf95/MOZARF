import { createRoot } from "react-dom/client";
import "./index.css";
import OrchestraVST from "./OrchestraVST.jsx";

/* StrictMode désactivé : en dev il démonte/remonte l’app, ferme l’AudioContext et casse Tone / le piano (silence). */
createRoot(document.getElementById("root")).render(<OrchestraVST />);
