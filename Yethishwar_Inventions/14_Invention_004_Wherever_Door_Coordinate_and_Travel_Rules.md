# Invention 004 — The Wherever Door: Coordinate Format and Travel Rules

**Document ID:** YA-014
**Classification:** Official Rules (Canon)
**Invention number:** 004
**Related documents:** YA-013 (Manual), YA-015 (Travel Log), YA-018 (Interactions)

These are the official rules of the Wherever Door. If another document disagrees, YA-000 and this document are correct.

---

## 1. Coordinate format
- Coordinates are entered as **decimal degrees**.
- **Latitude is entered first, then longitude.**
- **Latitude:** from **−90.000000 to +90.000000**. Positive = North, negative = South.
- **Longitude:** from **−180.000000 to +180.000000**. Positive = East, negative = West.
- Up to **6 decimal places** (precision of about 0.11 metres).
- Degrees-minutes-seconds format is **not accepted**.
- **Altitude is never entered.** The door always places the traveller standing on the ground (or floor) at the destination.

**Example (Taj Mahal, Agra):**
```
LAT  27.175015
LON  78.042155
```

## 2. Date and time format
- Format: **YYYY-MM-DD HH:MM:SS**, 24-hour clock.
- **All dates and times are entered in Indian Standard Time (IST, UTC+05:30), regardless of the destination.** The door converts IST to local time at the destination.
- Example: to arrive in Paris at 9:00 AM Paris time on a winter day (UTC+01:00), enter 13:30:00 IST.

**Example (Charminar, Hyderabad, first Republic Day):**
```
LAT  17.361564
LON  78.474665
DATE 1950-01-26
TIME 09:00:00
```

## 3. Travel modes
| Mode | How to use | What happens |
|---|---|---|
| **Present Mode** | Enter latitude and longitude, leave date and time blank | Travel to the destination at the present moment |
| **Temporal Mode** | Enter latitude, longitude, date and time | Travel to the destination at the specified moment in the past or future |

For temporal travel, **all four values are required**: latitude, longitude, date and time.

## 4. Temporal range
- **Earliest:** 1900-01-01 00:00:00 IST
- **Latest:** 2099-12-31 23:59:59 IST
- Outside this range, the display shows **OUT OF RANGE: TIME**.

## 5. Destination rules (Safe-Arrival Check)
The door refuses any destination that is:
- inside solid matter (rock, walls, buildings' solid parts) — **UNSAFE: SOLID**
- in water deeper than 1 metre — **UNSAFE: WATER**
- on a slope steeper than 45°, in fire or in lava — **UNSAFE: TERRAIN**
- inside a moving vehicle
- off the surface of the Earth (the door cannot reach space, the Moon or other planets)

## 6. Forbidden times and places
- **The Frozen Hour Lock:** the door can never open into a moment when the Zero Clock had stopped the world. Forbidden windows:
  - **22 May 2026, 12:00:00 – 13:00:00 IST** (The Zero Hour)
  - **20 July 2026, 06:00:00 – 06:05:00 IST** (Activation 2)
- **The Self-Proximity Rule:** the door refuses any destination within **1 km** and **24 hours** of any other instance of Yethishwar. He cannot meet himself, watch his own birth or visit his own past self.

## 7. Origin recording — the Anchor
- At the moment of departure, the door **automatically records** the departure latitude, longitude, date and time. This record is the **Anchor**.
- The traveller does not need to enter anything for the return.
- The default Anchor is **Anchor Alpha** in Laboratory Zero.

## 8. Return mechanism
- Turn the **Return Key** twice clockwise in the air. The door outline appears within 10 seconds.
- Step through to arrive back at the Anchor, **1 minute after the original departure time** (the One-Minute Return).
- **Recall:** after **72 hours** of personal time on a trip, the door automatically pulls the traveller back, even without the Return Key.

## 9. Travel limitations
- **Trip length:** maximum 72 hours personal time.
- **Travellers:** maximum 2 people (Yethishwar plus one guest). Only Yethishwar can operate the door. To date, no guest has ever travelled.
- **Cargo:** maximum 50 kg total.
- **Daily limit:** 3 departures per 24 hours; only 1 of them may be a temporal trip.
- **Timeline Elasticity (past):** In the past, the traveller is fully physical — people can see, hear and talk to him. Small changes "heal" and leave no lasting effect on history. If the traveller attempts a major change to history, the door triggers **Recoil**: an immediate, automatic return to the Anchor.
- **Probable Future (future):** A trip to the future shows the most likely future **as it stands at the moment of departure**. It may change. Future visits are always labelled "Probable."
- **Future Fade:** Objects brought back from the future dissolve within 1 hour of return. Objects from the past remain.
- **No Zero Clock while away:** the Zero Clock cannot be activated during a door trip.

## Quick reference
| Rule | Value |
|---|---|
| Coordinates | Decimal degrees, latitude first, 6 decimals |
| Date/time | YYYY-MM-DD HH:MM:SS, IST, 24-hour |
| Time range | 1900-01-01 to 2099-12-31 |
| Return | Return Key, arrive 1 minute after departure |
| Max trip | 72 hours, then Recall |
| Capacity | 2 people, 50 kg |
| Forbidden | Zero Clock stop windows; within 1 km/24 h of himself |
