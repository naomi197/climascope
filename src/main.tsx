import { createRoot } from "react-dom/client"
import { Capacitor } from "@capacitor/core"
import "@fontsource/vazirmatn/400.css"
import "@fontsource/vazirmatn/500.css"
import "@fontsource/vazirmatn/700.css"
import "@fontsource/vazirmatn/800.css"
import "leaflet/dist/leaflet.css"
import App from "./App.tsx"
import "./index.css"

document.documentElement.dataset.native = Capacitor.isNativePlatform() ? "true" : "false"

createRoot(document.getElementById("root")!).render(<App />)
