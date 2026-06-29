// AquifyMap.tsx — React-Leaflet map with color-coded divIcon markers.
// Leaflet default-icon fix is handled via divIcon (custom HTML pins) so no
// broken-image issue under Vite's bundler. Markers are memoized and icons are
// built once at module scope (not per render).

import { memo, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import { AUSTIN_CENTER } from '../../lib/geo'
import { TYPE_MARKER_COLORS } from '../../lib/fountainTypes'
import FountainPopup from './FountainPopup'
import type { Fountain, FountainType, MapCenter, LatLng } from '../../types'

// ─── Marker icon factories (built once, at module scope) ────────────────────

type IconKind = FountainType | 'inactive' | 'user'

/** Build a teardrop-shaped divIcon (or pulse dot for the user) for a marker. */
function buildIcon(kind: IconKind): L.DivIcon {
  const fill = TYPE_MARKER_COLORS[kind] ?? TYPE_MARKER_COLORS.inactive

  if (kind === 'user') {
    return L.divIcon({
      className: '',
      html: `<span role="img" aria-label="Your location" style="
        display:block;width:18px;height:18px;border-radius:50%;
        background:${fill};border:3px solid #fff;
        box-shadow:0 0 0 3px ${fill}55;
      "></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -12],
    })
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32" aria-hidden="true">
    <path d="M12 0C6.48 0 2 4.48 2 10c0 7.5 10 22 10 22S22 17.5 22 10C22 4.48 17.52 0 12 0z" fill="${fill}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="4" fill="#fff" opacity="0.85"/>
  </svg>`

  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
  })
}

const ICONS: Record<IconKind, L.DivIcon> = {
  fountain: buildIcon('fountain'),
  'bottle-filler': buildIcon('bottle-filler'),
  both: buildIcon('both'),
  inactive: buildIcon('inactive'),
  user: buildIcon('user'),
}

function iconForFountain(fountain: Fountain): L.DivIcon {
  if (fountain.status === 'inactive') return ICONS.inactive
  return ICONS[fountain.type] ?? ICONS.inactive
}

/** Concise, screen-reader-friendly label for a marker. */
function markerLabel(fountain: Fountain): string {
  const parts = [fountain.name]
  if (fountain.accessible) parts.push('ADA accessible')
  if (fountain.status !== 'active') parts.push(fountain.status)
  return parts.join(', ')
}

// ─── Map effect child — fly to focusId or userLocation ──────────────────────

interface MapEffectProps {
  focusId: string | null
  fountains: Fountain[]
  userLocation: LatLng | null
}

function MapEffect({ focusId, fountains, userLocation }: MapEffectProps) {
  const map = useMap()

  useEffect(() => {
    // Respect users who prefer reduced motion: jump instantly instead of flying.
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const opts = reduce ? { animate: false } : { duration: 1 }

    if (focusId) {
      const target = fountains.find((f) => f.id === focusId)
      if (target) {
        map.flyTo([target.lat, target.lng], 17, opts)
        return
      }
    }
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, opts)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, userLocation])

  return null
}

// ─── Memoized marker ────────────────────────────────────────────────────────

interface FountainMarkerProps {
  fountain: Fountain
  canReview: boolean
  saved: boolean
  onReview?: (f: Fountain) => void
  onToggleSave?: (f: Fountain) => void
  canSave: boolean
}

const FountainMarker = memo(function FountainMarker({
  fountain,
  canReview,
  saved,
  onReview,
  onToggleSave,
  canSave,
}: FountainMarkerProps) {
  return (
    <Marker
      position={[fountain.lat, fountain.lng]}
      icon={iconForFountain(fountain)}
      alt={markerLabel(fountain)}
      keyboard
    >
      <Popup>
        <FountainPopup
          fountain={fountain}
          canReview={canReview}
          onReview={onReview}
          saved={saved}
          onToggleSave={onToggleSave}
          canSave={canSave}
        />
      </Popup>
    </Marker>
  )
})

// ─── Main component ─────────────────────────────────────────────────────────

interface AquifyMapProps {
  fountains?: Fountain[]
  userLocation?: LatLng | null
  center?: MapCenter
  focusId?: string | null
  onReview?: (f: Fountain) => void
  favoriteIds?: string[]
  onToggleSave?: (f: Fountain) => void
  canSave?: boolean
}

export default function AquifyMap({
  fountains = [],
  userLocation = null,
  center,
  focusId = null,
  onReview,
  favoriteIds = [],
  onToggleSave,
  canSave = false,
}: AquifyMapProps) {
  const { currentUser } = useAuth()
  const mapCenter = center ?? AUSTIN_CENTER
  const zoom = mapCenter.zoom ?? AUSTIN_CENTER.zoom

  return (
    <MapContainer
      center={[mapCenter.lat, mapCenter.lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <MapEffect
        focusId={focusId}
        fountains={fountains}
        userLocation={userLocation}
      />

      {fountains.map((fountain) => (
        <FountainMarker
          key={fountain.id}
          fountain={fountain}
          canReview={Boolean(currentUser)}
          saved={favoriteIds.includes(fountain.id)}
          onReview={onReview}
          onToggleSave={onToggleSave}
          canSave={canSave}
        />
      ))}

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={ICONS.user}
        >
          <Popup>
            <span className="font-semibold">Your location</span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
