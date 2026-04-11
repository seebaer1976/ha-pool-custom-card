# Pool Custom Card 🏊

**Schematische Pool-Übersicht als Lovelace Custom Card für Home Assistant**

[![GitHub Release](https://img.shields.io/github/release/seebaer1976/ha-pool-custom-card.svg?style=for-the-badge&color=0078d4)](https://github.com/seebaer1976/ha-pool-custom-card/releases)
[![GitHub Issues](https://img.shields.io/github/issues/seebaer1976/ha-pool-custom-card.svg?style=for-the-badge&color=orange)](https://github.com/seebaer1976/ha-pool-custom-card/issues)
[![HACS](https://img.shields.io/badge/HACS-Custom-41BDF5.svg?style=for-the-badge)](https://github.com/hacs/integration)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2025.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io)

---

## Was ist die Pool Custom Card?

Die **Pool Custom Card** ist eine animierte Lovelace-Karte für Home Assistant, die deine Pool-Anlage als schematisches Diagramm darstellt. Sie zeigt alle wichtigen Sensorwerte auf einen Blick – von der Wassertemperatur über den Filterdruck bis zum Salzwassersystem.

Die Karte basiert auf Canvas 2D und zeigt animierte Rohrleitungen, die den Wasserkreislauf visualisieren – inklusive Pumpe, Sandfilter, Mehrwegeventil und optionalem Chlorinator.

---

## Features

* 🏊 **Animierter Wasserkreislauf** – Rohrleitungen fließen animiert wenn die Pumpe läuft
* 🌡️ **Wassertemperatur** – Großes Display in der Mitte des Pools
* ⚗️ **pH-Wert** – Optional links im Pool
* 💧 **Füllstand** – Optional rechts im Pool
* 🔵 **Filterdruck** – Manometer-Anzeige am Sandfilter
* 🌊 **Durchfluss** – m³/h Anzeige auf der Rücklaufleitung
* 🧂 **Salzwassersystem** – Intex Chlorinator mit Status-LED
* 🔌 **Pumpensteuerung** – Pumpe direkt aus der Karte ein-/ausschalten
* ✅ **Optionale Sensoren** – Grafiken werden nur angezeigt wenn ein Sensor konfiguriert ist
* ⚙️ **GUI-Editor** – Vollständige Konfiguration ohne YAML

---

## Voraussetzungen

* Home Assistant **2025.1** oder neuer
* HACS installiert

---

## Installation

### Option 1: Über HACS (empfohlen)

#### Schritt 1 – Repository als Custom Repository hinzufügen

Klicke auf den Button oder folge der manuellen Anleitung darunter:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=seebaer1976&repository=ha-pool-custom-card&category=plugin)

**Oder manuell:**

1. HACS öffnen
2. Oben rechts auf die **drei Punkte** klicken → **„Benutzerdefinierte Repositories"**
3. URL eingeben: `https://github.com/seebaer1976/ha-pool-custom-card`
4. Kategorie: **Lovelace** wählen
5. **„Hinzufügen"** klicken

#### Schritt 2 – Karte installieren

1. In HACS nach **„Pool Custom Card"** suchen
2. **„Herunterladen"** klicken
3. Home Assistant **neu starten** (oder Lovelace-Ressourcen neu laden)

#### Schritt 3 – Karte zum Dashboard hinzufügen

Klicke auf den Button oder füge die Karte manuell über den Dashboard-Editor hinzu:

[![Open your Home Assistant instance and navigate to your dashboard.](https://my.home-assistant.io/badges/lovelace_dashboards.svg)](https://my.home-assistant.io/redirect/lovelace_dashboards/)

**Oder manuell per YAML:**

```yaml
type: custom:pool-custom-card
title: Pool
temp_entity: sensor.pool_wassertemperatur
pump_entity: switch.pool_filterpumpe
```

---

### Option 2: Manuelle Installation

1. Lade die [neueste Version](https://github.com/seebaer1976/ha-pool-custom-card/releases/latest) herunter
2. Kopiere `pool-custom-card.js` in dein HA-Verzeichnis:

   ```
   /config/www/pool-custom-card/pool-custom-card.js
   ```
3. Füge die Ressource in Home Assistant hinzu:
   - **Einstellungen** → **Dashboards** → **Drei Punkte oben rechts** → **Ressourcen**
   - URL: `/local/pool-custom-card/pool-custom-card.js`
   - Typ: **JavaScript-Modul**
4. Home Assistant **neu starten**

---

## Konfiguration

Die Karte wird vollständig über den **GUI-Editor** konfiguriert – kein YAML nötig.

### Pflichtsensoren

| Feld | Beschreibung | Entity-Typ |
|------|-------------|------------|
| `temp_entity` | Wassertemperatur | `sensor` mit `device_class: temperature` |
| `pump_entity` | Filterpumpe | `switch` |

### Optionale Sensoren

Optionale Grafiken werden **nur angezeigt, wenn eine Entity konfiguriert ist**.

| Feld | Beschreibung | Entity-Typ |
|------|-------------|------------|
| `ph_entity` | pH-Wert | `sensor` |
| `level_entity` | Füllstand | `sensor` mit `device_class: moisture / volume / distance` |
| `pressure_entity` | Filterdruck | `sensor` mit `device_class: pressure` |
| `flow_entity` | Durchfluss (m³/h) | `sensor` |
| `chlor_entity` | Salzwassersystem | `switch` |

### Weitere Optionen

| Feld | Beschreibung |
|------|-------------|
| `title` | Kartenname (Standard: „Pool") |

### Vollständiges YAML-Beispiel

```yaml
type: custom:pool-custom-card
title: Mein Pool
temp_entity: sensor.pool_wassertemperatur
pump_entity: switch.pool_filterpumpe
ph_entity: sensor.pool_ph_wert
level_entity: sensor.pool_fuellstand
pressure_entity: sensor.pool_sandfilter_druck
flow_entity: sensor.pool_durchfluss
chlor_entity: switch.pool_salzwassersystem
```

---

## Pumpensteuerung

Die Karte enthält einen **Pumpe ein/ausschalten** Button in der Titelleiste. Dieser ruft direkt den `switch.turn_on` / `switch.turn_off` Service für die konfigurierte `pump_entity` auf.

Wenn die Pumpe läuft:
- Rohrleitungen werden animiert (fließende Strichelung)
- Statusanzeige wechselt auf „Pumpe läuft" (grün)
- Pumpen-LED leuchtet grün

---

## Salzwassersystem

Wenn `chlor_entity` konfiguriert ist, wird der **Intex Krystal Clear Chlorinator** in der Grafik angezeigt. Die Status-LED zeigt:

- 🟢 **Grün** – Chlorinator läuft (`state: on`)
- 🔴 **Rot** – Chlorinator aus (`state: off`)

Wenn kein `chlor_entity` konfiguriert ist, wird stattdessen eine direkte **Bypass-Linie** gezeichnet.

---

## Kompatibilität

| Gerät | Getestet |
|-------|---------|
| Intex Krystal Clear ECO 5220G / CG-26668GS | ✅ |
| Intex Sandfilteranlage | ✅ |
| ESPHome-basierte Sensoren | ✅ |

---

## Changelog

### v1.3
- Canvas 2D Renderer ersetzt SVG
- Animierte Wasserwellen im Pool
- Flüssigere Rohranimation ohne Ruckeln
- Optionale Sensorgrafiken: werden nur angezeigt wenn Entity konfiguriert
- Bypass-Linie wenn kein Chlorinator konfiguriert
- `disconnectedCallback` stoppt den Render-Loop beim Entfernen der Karte

### v1.2
- Chlorinator (Intex Salzwassersystem) hinzugefügt
- GUI-Editor mit aufklappbaren Gruppen (Pflichtsensoren / Optionale Sensoren)
- Kartenname konfigurierbar
- `flatten: true` Fix für korrekte Anzeige gespeicherter Werte im Editor
- Durchfluss-Badge auf der Rücklaufleitung

### v1.1
- Isometrisches SVG Design
- Animierte Rohrleitungen (blau + grün)
- Pumpensteuerung per Button

### v1.0
- Erste Version mit einfachem Schemadiagramm

---

## Credits

Erstellt von [@seebaer1976](https://github.com/seebaer1976)

---

Wenn dir die Karte gefällt, freue ich mich über einen ⭐ auf GitHub!
