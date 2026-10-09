# ClimaScope

## Android Climate Observatory

[![Live observatory](https://img.shields.io/badge/Live-naomi197.github.io%2Fclimascope-0b3a36?style=for-the-badge)](https://naomi197.github.io/climascope/)
[![APK](https://img.shields.io/badge/Download-ClimaScope.apk-1d4e89?style=for-the-badge)](https://github.com/naomi197/climascope/releases/latest/download/ClimaScope.apk)
[![License: MIT](https://img.shields.io/badge/License-MIT-2a2f33?style=for-the-badge)](LICENSE)

ClimaScope is an English-language Android application for climate specialists who need live climate parameters anywhere on Earth. The same observatory runs in the browser.

Developer: [alirezafazeli@live.com](mailto:alirezafazeli@live.com)

<p align="center">
  <img src="docs/preview.png" alt="ClimaScope showing global greenhouse-gas indicators and a live station" width="920" />
</p>

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

1. Open the live observatory: https://naomi197.github.io/climascope/
2. Or install the signed APK from [Releases](https://github.com/naomi197/climascope/releases/latest). Copy `ClimaScope.apk` to the phone and allow install from unknown sources.
3. To run the source locally:

```bash
git clone https://github.com/naomi197/climascope.git
cd climascope
npm install
npm run dev
```

4. Open http://127.0.0.1:47231

### Rebuild the APK

JDK 21 and Android SDK API 36 are required.

```bash
export ANDROID_HOME="$HOME/android-sdk"
npm run apk
```

The signed file is written to `android/app/build/outputs/apk/release/`. A copy for direct install is kept at `release/ClimaScope.apk`.

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
