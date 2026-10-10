# Method

ClimaScope reduces two decades of daily HighResMIP output to a monthly ensemble for one grid cell, then sets the live observation beside that baseline.

## Periods

| Role | Dates | Why this window |
| --- | --- | --- |
| Baseline | 1991-01-01 to 2000-12-31 | A complete model decade. It is not the WMO 1991–2020 normal. |
| Future | 2041-01-01 to 2050-12-31 | The same length. These HighResMIP runs end in 2050. |

## Models

The ensemble is the unweighted mean of:

- MPI-ESM1-2-XR
- EC-Earth3P-HR
- MRI-AGCM3-2-S

Open-Meteo serves the daily series. ClimaScope does not refit the models.

## Reduction

For each model and month:

- temperature is the mean of the daily means
- precipitation is the sum of the daily totals, divided by the number of years in the decade

The published monthly curve is the mean of the three models. The shaded band is the highest model minus the lowest model for that month. It is a cross-model spread, not a confidence interval from a larger CMIP6 archive.

`stationOutlook` then reports:

- the change in annual mean temperature between the two decades
- the percent change in annual precipitation
- today’s temperature minus the baseline month
- the same temperature change for each model separately

## What this is not

The values are model-grid means, not station observations. They are not a substitute for CMIP6 scenarios or the IPCC reports when a decision has to be official.

## Check

`npm test` locks the monthly mean, the treatment of missing days, and the decade delta. `npm run example` prints a briefing from a two-day fixture.
