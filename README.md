# ha-pool-custom-card

Eine schematische Pool-Übersicht für Home Assistant mit animiertem Filterkreislauf.

## Features

- Schematische Darstellung von Pool und Sandfilter
- Animierte Rohrleitungen (Vor- und Rücklauf) wenn Pumpe läuft
- Wassertemperatur, pH-Wert und Füllstand direkt im Pool angezeigt
- Filterdruck und Durchfluss am Sandfilter
- Grafischer Konfigurations-Editor in HA (kein YAML nötig)
- Automatische Ressourcen-Registrierung

## Installation via HACS

1. HACS → Frontend → Menü (⋮) → **Custom repositories**
2. URL: `https://github.com/youruser/ha-pool-custom-card`
3. Kategorie: **Lovelace**
4. **Installieren** → Browser-Cache leeren

## Manuelle Installation

1. `pool-custom-card.js` nach `config/www/ha-pool-custom-card/pool-custom-card.js` kopieren
2. HA neu starten

## Konfiguration

```yaml
type: custom:pool-custom-card
temp_entity: sensor.pool_temperature
ph_entity: sensor.pool_ph
level_entity: sensor.pool_level
pressure_entity: sensor.pool_filter_pressure
flow_entity: sensor.pool_flow_rate
pump_entity: switch.pool_pump
```

## Optionen

| Option | Beschreibung | Pflicht |
|---|---|---|
| `temp_entity` | Wassertemperatur (sensor) | Ja |
| `ph_entity` | pH-Wert (sensor) | Nein |
| `level_entity` | Füllstand in % (sensor) | Nein |
| `pressure_entity` | Filterdruck in bar (sensor) | Nein |
| `flow_entity` | Durchfluss in m³/h (sensor) | Nein |
| `pump_entity` | Filterpumpe (switch) | Nein |
