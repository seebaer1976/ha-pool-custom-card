# Pool Custom Card

Eine schematische Pool-Übersicht für Home Assistant mit animiertem Filterkreislauf.

## Installation via HACS

1. HACS → Frontend → Menü (⋮) → Custom repositories
2. URL: `https://github.com/seebaer1976/ha-pool-custom-card`, Kategorie: **Lovelace**
3. Installieren
4. Home Assistant neu laden

Die Karte registriert sich automatisch – kein manuelles Eintragen der Ressource nötig.

## Manuelle Installation

1. `pool-custom-card.js` nach `config/www/pool-custom-card/pool-custom-card.js` kopieren
2. Dashboard → Ressourcen → `/local/pool-custom-card/pool-custom-card.js` als `JavaScript-Modul`
3. HA neu laden

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

## Sensoren

| Option | Beschreibung | Pflicht |
|---|---|---|
| `temp_entity` | Wassertemperatur | Ja |
| `ph_entity` | pH-Wert | Nein |
| `level_entity` | Füllstand in % | Nein |
| `pressure_entity` | Filterdruck in bar | Nein |
| `flow_entity` | Durchfluss in m³/h | Nein |
| `pump_entity` | Filterpumpe (switch) | Nein |
