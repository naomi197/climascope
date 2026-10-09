# ClimaScope

An Android application for climate specialists who need live climate parameters anywhere on Earth. It shows the atmosphere, air quality, river discharge, and a HighResMIP climate outlook, and the same view runs in the browser.

Developer: [alirezafazeli@live.com](mailto:alirezafazeli@live.com)

## What it includes

- Global indicators: CO₂, methane, nitrous oxide, the GISS temperature anomaly, and sea ice.
- A virtual station for any city or coordinate: temperature, humidity, wind, pressure, radiation, evapotranspiration, and UV.
- Air quality: PM2.5, ozone, dust, and the European and US indexes.
- A 24-hour and 7-day outlook, plus GloFAS river discharge.
- A 1991–2000 versus 2041–2050 comparison from three HighResMIP models.

The climate comparison is a model-grid mean. It is not a substitute for CMIP6 scenarios or the IPCC reports when making an official decision.

## How to run

1. Clone the repo:

```bash
git clone https://github.com/fazeli1977-dot/ClimaScope.git
cd ClimaScope
npm install
npm run dev
```

2. Open http://127.0.0.1:47231

3. To install on Android, download `release/ClimaScope.apk`, copy it to the phone, and allow install from unknown sources.

## How to rebuild the APK

JDK 21 and Android SDK API 36 are required.

```bash
export ANDROID_HOME="$HOME/android-sdk"
npm run apk
```

The signed file is written to `android/app/build/outputs/apk/release/`.

## Data

- Forecast, air quality, climate models, and flood: [Open-Meteo](https://open-meteo.com/)
- CO₂, methane, N₂O, the GISS anomaly, and sea ice: [global-warming.org](https://global-warming.org/)
- Map: Esri World Dark Gray
