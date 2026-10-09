# ClimaScope

## Android Climate Observatory

ClimaScope is an English-language Android application for climate specialists who need live climate parameters anywhere on Earth. The same interface also runs in the browser.

Developer: [alirezafazeli@live.com](mailto:alirezafazeli@live.com)

### Features

- Global indicators: CO₂, methane, nitrous oxide, the GISS temperature anomaly, and sea ice
- A virtual station for any city or coordinate: temperature, humidity, wind, pressure, radiation, evapotranspiration, and UV
- Air quality: PM2.5, PM10, ozone, dust, and the European and US indexes
- A 24-hour and 7-day outlook, plus GloFAS river discharge
- A 1991–2000 versus 2041–2050 comparison from three HighResMIP models
- English user interface and a signed Android APK

The climate comparison is a model-grid mean. It is not a substitute for CMIP6 scenarios or the IPCC reports when making an official decision.

### Data Sources

1. **Open-Meteo** — forecast, air quality, climate models, and flood: https://open-meteo.com/
2. **global-warming.org** — CO₂, methane, N₂O, the GISS anomaly, and sea ice: https://global-warming.org/
3. **Esri** — World Dark Gray basemap

### Technology

- TypeScript and React
- Vite
- Leaflet
- Capacitor for the Android package

### Setup

1. Clone the repository:

```bash
git clone https://github.com/naomi197/climascope.git
cd climascope
npm install
npm run dev
```

2. Open http://127.0.0.1:47231
3. To install on Android, download `release/ClimaScope.apk`, copy it to the phone, and allow install from unknown sources.

### Rebuild the APK

JDK 21 and Android SDK API 36 are required.

```bash
export ANDROID_HOME="$HOME/android-sdk"
npm run apk
```

The signed file is written to `android/app/build/outputs/apk/release/`.

### Project Structure

```text
src/
├── components/     # Map and charts
├── lib/            # Climate APIs, formatting, and model summaries
android/            # Capacitor Android project
release/            # Signed ClimaScope.apk
```

## License

MIT License.
