# ClimaScope

A field observatory for climate specialists. It shows the live atmosphere, air quality, evapotranspiration, river discharge, and a climate-model outlook for any point on Earth.

Developer: [alirezafazeli@live.com](mailto:alirezafazeli@live.com)

## Run in the browser

```bash
npm install
npm run dev
```

Then open [http://127.0.0.1:47231](http://127.0.0.1:47231).

## Build the APK

The installable file is `release/ClimaScope.apk`. To rebuild it you need JDK 21 and Android SDK API 36:

```bash
export ANDROID_HOME="$HOME/android-sdk"
npm run apk
```

The signed APK is written to `android/app/build/outputs/apk/release/`. The local signing password lives in `android/keystore.properties` and is only for installing this build.

## Data

- Forecast, air quality, climate models, and river discharge: [Open-Meteo](https://open-meteo.com/)
- CO₂, methane, N₂O, the GISS temperature anomaly, and sea ice: [global-warming.org](https://global-warming.org/)
- Map: Esri World Dark Gray

The climate comparison is the mean of three HighResMIP models for 1991–2000 versus 2041–2050. It is not a substitute for CMIP6 scenarios or the IPCC reports.
