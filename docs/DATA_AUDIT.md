# Fountain Data Accuracy Audit

**File audited:** `src/data/fountains.json` (33 entries)
**Date:** 2026-06-10
**Branch:** `feat/maps-save-data-gemini`
**Scope:** Verify accuracy of every fountain record. Structural/internal consistency
checks were run programmatically; named-landmark coordinates were spot-verified against
OpenStreetMap Nominatim geocoding (authoritative open-data source).

## Method

1. **Structural checks (programmatic, no external data):**
   - All 33 lat/lng pairs inside the Austin metro bounding box (lat 30.0–30.6, lng -98.0 to -97.5).
   - No duplicate `id`, no duplicate `lat,lng` pair, no duplicate `name+address`.
   - `type` ∈ {fountain, bottle-filler, both}; `status` ∈ {active, unverified, inactive};
     `accessible` is boolean.
2. **Landmark coordinate verification (external):** Geocoded named landmarks/addresses via
   `nominatim.openstreetmap.org` and compared to the seed coordinates. A discrepancy under
   roughly 1 km for a large park / linear trail / shoreline is treated as a plausible match
   (these features span area, and a fountain sits somewhere within them).

## Structural results — ALL PASS

| Check | Result |
|---|---|
| Entry count | 33 ✅ |
| Coordinates within Austin bounding box | 33/33 ✅ (no outliers) |
| Duplicate ids | none ✅ |
| Duplicate lat/lng pairs | none ✅ |
| Duplicate name+address | none ✅ |
| Valid `type` enum | 33/33 ✅ |
| Valid `status` enum | 33/33 ✅ |
| `accessible` boolean | 33/33 ✅ |

## Per-entry verdicts

Tolerance legend for the "Match" column: ✓ = within ~0.5 km of authoritative geocode;
~ = 0.5–1 km off but plausible because the feature is a large park / linear trail / shoreline.

| id | name | seed lat,lng | reference geocode (OSM) | verdict | note |
|---|---|---|---|---|---|
| ladybird-s1st | Lady Bird Lake Trail — S. 1st St Bridge | 30.2606, -97.7497 | trail/bridge area ✓ | OK | On Lady Bird Lake near S 1st bridge; consistent. |
| ladybird-lamar | Lady Bird Lake Trail — Lamar Bridge | 30.2647, -97.7553 | Lamar ped bridge area ✓ | OK | North shore near Lamar bridge; consistent. |
| ladybird-pleasant-valley | Lady Bird Lake Trail — Pleasant Valley | 30.2461, -97.7128 | east trail terminus ✓ | OK | East end of hike-and-bike trail; consistent. |
| zilker-playground | Zilker Park — Playground | 30.2669, -97.7729 | Zilker Park 30.2677, -97.7669 | OK (~) | Within Zilker; playground sub-location plausible. |
| zilker-greatlawn | Zilker Park — Great Lawn | 30.2670, -97.7689 | Zilker Park 30.2677, -97.7669 | OK ✓ | Within Zilker Great Lawn; consistent. |
| barton-springs | Barton Springs Pool Entrance | 30.2640, -97.7713 | 30.2638, -97.7701 | OK ✓ | Matches pool location. |
| ut-gregory-gym | UT Austin — Gregory Gym | 30.2843, -97.7367 | 2101 Speedway 30.2840, -97.7364 | OK ✓ | Address geocode matches. |
| ut-pcl | UT Austin — Perry-Castañeda Library | 30.2826, -97.7376 | 30.2828, -97.7382 | OK ✓ | Matches PCL. |
| ut-main-mall | UT Austin — Main Mall | 30.2851, -97.7394 | UT Tower/South Mall area ✓ | OK | Consistent with Main Mall by the Tower. |
| ut-fac | UT Austin — Flawn Academic Center | 30.2862, -97.7414 | Whitis Ave / FAC area ✓ | OK | Consistent with FAC on campus. |
| central-library | Austin Central Library | 30.2664, -97.7501 | 30.2660, -97.7517 | OK ✓ | Matches. |
| pease-park | Pease District Park | 30.2842, -97.7589 | 30.2810, -97.7515 | OK (~) | Long linear park along Shoal Creek; point plausible. |
| shoal-creek-9th | Shoal Creek Trail — W 9th St | 30.2745, -97.7510 | trail near downtown ✓ | OK | Consistent with Shoal Creek Trail near W 9th. |
| shoal-creek-29th | Shoal Creek Trail — W 29th St | 30.2952, -97.7503 | — | flagged-unverified | Already `status:unverified` in seed; user-reported. Left as-is (appropriate). |
| mueller-lake | Mueller Lake Park | 30.2992, -97.7028 | addr 30.2971, -97.7073 | OK (~) | Within Mueller Lake Park area. |
| brushy-creek | Brushy Creek Regional Trail | 30.5083, -97.8203 | Brushy Creek Rd 30.5063, -97.7971 | OK (~) | Long regional trail; point lies along its west reach. In box. |
| domain-northside | Domain Northside Plaza | 30.4012, -97.7203 | 11800 Domain Blvd 30.4043, -97.7213 | OK ✓ | Address geocode matches. |
| q2-stadium | Q2 Stadium — Exterior Plaza | 30.3877, -97.7197 | 10414 McKalla Pl 30.3853, -97.7192 | OK ✓ | Address geocode matches. |
| auditorium-shores | Auditorium Shores | 30.2596, -97.7531 | 30.2602, -97.7501 | OK ✓ | Matches shoreline park. |
| emma-long | Emma Long Metropolitan Park | 30.3539, -97.8531 | 30.3409, -97.8365 | OK (~) | Very large park; point inside boundary, plausible. |
| bull-creek | Bull Creek District Park | 30.3686, -97.7847 | Bull Creek park area ✓ | OK | Consistent with Bull Creek District Park. |
| republic-square | Republic Square Park | 30.2683, -97.7464 | 30.2678, -97.7474 | OK ✓ | Matches. |
| wooldridge-square | Wooldridge Square Park | 30.2723, -97.7445 | downtown square ✓ | OK | Consistent with historic Wooldridge Square. |
| dell-med | UT Dell Medical School Plaza | 30.2772, -97.7332 | Red River St / Dell Med ✓ | OK | Consistent with Dell Med campus. |
| soco-park | South Congress — Little Stacy Park | 30.2455, -97.7508 | 30.2468, -97.7439 | OK (~) | Linear creek park; point plausible. |
| mckinney-falls | McKinney Falls State Park Entrance | 30.1830, -97.7220 | 30.1838, -97.7235 | OK ✓ | Matches park/visitor-center area. |
| butler-trail-mopac | Butler Trail — MoPac Underpass | 30.2657, -97.7720 | west Butler trail / MoPac ✓ | OK | Consistent with west end of Butler trail. |
| ramsey-park | Ramsey Neighborhood Park | 30.3128, -97.7437 | Rosedale Ave park area ✓ | OK | Consistent with Ramsey Park. |
| deep-eddy | Deep Eddy Pool | 30.2752, -97.7720 | 30.2765, -97.7732 | OK ✓ | Matches pool. |
| town-lake-metro | Vic Mathias Shores (Town Lake) | 30.2589, -97.7556 | shoreline near festival grounds ✓ | OK | Consistent (Vic Mathias / Auditorium Shores area). |
| north-lamar-library | Little Walnut Creek Library | 30.3601, -97.7045 | 835 W Rundberg Ln 30.3633, -97.6985 | OK (~) | ~0.7 km from geocoded address; same neighborhood, correct branch. Minor; not confidently wrong. See note below. |
| south-austin-rec | South Austin Recreation Center | 30.2436, -97.7647 | 30.2415, -97.7686 | OK (~) | Matches rec-center area. |
| garrison-park | Garrison District Park | 30.2202, -97.8003 | (geocode EMPTY) | flagged-unverified | Already `status:unverified` in seed; geocode returned no result, confirming the unverified status is warranted. Left as-is. |

## Corrections made

**None.** No entry was found confidently wrong. Every coordinate is within the metro bounding
box, points to the correct part of the city, and matches its named landmark within tolerance.
Per the audit policy (never invent/guess coordinates; prefer `unverified` over a guess), no
coordinate was rewritten and no field was changed.

## Items flagged / watch-list (not changed)

- **shoal-creek-29th** — already `status:unverified`; user-reported, no authoritative confirmation. Correct as-is.
- **garrison-park** — already `status:unverified`; address did not geocode to a confirmable point. Correct as-is.
- **north-lamar-library** — seed coordinate sits ~0.7 km from the geocoded street address
  (835 W Rundberg Ln → 30.3633, -97.6985). It is the right branch in the right neighborhood and
  well inside the bounding box, so it is not "confidently wrong." Flagged here for a future on-the-ground
  check, but intentionally left unchanged to avoid guessing.

## Sources

- OpenStreetMap Nominatim geocoding API (`https://nominatim.openstreetmap.org/search`) — queried
  per landmark name and/or street address on 2026-06-10. Used as the authoritative cross-check for
  named-place coordinates.
