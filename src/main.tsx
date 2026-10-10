import { createRoot } from "react-dom/client"
import { Capacitor } from "@capacitor/core"
import "@fontsource/source-serif-4/500.css"
import "@fontsource/source-serif-4/600.css"
import "@fontsource/ibm-plex-sans/400.css"
import "@fontsource/ibm-plex-sans/500.css"
import "@fontsource/ibm-plex-mono/400.css"
import "@fontsource/ibm-plex-mono/500.css"
import "leaflet/dist/leaflet.css"
import App from "./App.tsx"
import "./index.css"

document.documentElement.dataset.native = Capacitor.isNativePlatform() ? "true" : "false"

createRoot(document.getElementById("root")!).render(<App />)
