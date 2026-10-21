# Economics · hipótesis y estimación reproducible

Las tarifas en `catalog/skus.json` provienen del blueprint inicial. Son **hipótesis no contrastadas** y no equivalen a ofertas ni facturación.

| SKU | Tarifa orientativa sin IVA | Máx participantes | Máx entregas |
|---|---:|---:|---:|
| DISCOVERY | 12.000–22.000 € | 50 | 15 |
| BLUEPRINT | 25.000–45.000 € | 150 | 40 |
| ENTERPRISE | 50.000–100.000 € | 500 | 120 |

## Ejemplo sintético — `PriceModel.json`
- Precio: 25.000 €.
- Servicios: 75 h × 65 €/h = 4.875 €.
- Jurado: 1.600 €, premios: 3.500 €, cómputo: 500 €, seguridad: 1.000 €, otros directos: 250 €.
- Coste base: 11.725 €; contingencia 10 % → **12.897,50 €**.
- Contribución bruta: **12.102,50 €**; margen bruto **48,41 %**.
- Precio mínimo para 40 % margen bruto: **21.495,83 €**.

No incluye CAC, gastos fijos, IVA/impuestos, financiación, coste tiempo empleados cliente ni riesgos no cuantificados. No afirmar ahorro ni retorno observado hasta disponer de mediciones, condiciones contractuales y costes reales. Calculadora offline: `calculateUnitEconomics`.
