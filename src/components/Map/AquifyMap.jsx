// AquifyMap.jsx — React-Leaflet map with color-coded divIcon markers.
// Leaflet default-icon fix is handled via divIcon (custom HTML pins) so no
// broken-image issue under Vite's bundler.

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import { AUSTIN_CENTER } from '../../lib/geo'

// ─── Marker icon factories ────────────────────────────────────────────────────

/**
 * Build a teardrop-shaped divIcon for a fountain marker.
 * @param {'fountain'|'bottle-filler'|'both'|'inactive'|'user'} kind
 */
function buildIcon(kind) {
  const colorMap = {
    fountain: '#2563eb',      // blue-600
    'bottle-filler': '#16a34a', // green-600
    both: '#7c3aed',          // purple-600
    inactive: '#6b7280',      // gray-500
    user: '#0284c7',          // sky-600 (distinct pulse circle)
  }
  const fill = colorMap[kind] ?? colorMap.inactive

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

  // Teardrop pin via inline SVG
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

const ICONS = {
  fountain: buildIcon('fountain'),
  'bottle-filler': buildIcon('bottle-filler'),
  both: buildIcon('both'),
  inactive: buildIcon('inactive'),
  user: buildIcon('user'),
}

function iconForFountain(fountain) {
  if (fountain.status === 'inactive') return ICONS.inactive
  return ICONS[fountain.type] ?? ICONS.inactive
}

// ─── Type badge ───────────────────────────────────────────────────────────────

const TYPE_LABELS = {
  fountain: 'Drinking Fountain',
  'bottle-filler': 'Bottle Filler',
  both: 'Fountain + Bottle Filler',
}

const TYPE_COLORS = {
  fountain: 'background:#dbeafe;color:#1d4ed8',
  'bottle-filler': 'background:#dcfce7;color:#15803d',
  both: 'background:#f3e8ff;color:#6d28d9',
}

// ─── Map effect child — fly to focusId or userLocation ───────────────────────

function MapEffect({ focusId, fountains, userLocation }) {
  const map = useMap()

  useEffect(() => {
    if (focusId) {
      const target = fountains.find((f) => f.id === focusId)
      if (target) {
        map.flyTo([target.lat, target.lng], 17, { duration: 1 })
        return
      }
    }
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, userLocation])

  return null
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   fountains: Array,
 *   userLocation: {lat:number,lng:number}|null,
 *   center?: {lat:number,lng:number,zoom?:number},
 *   focusId?: string|null,
 *   onReview?: (fountain:object) => void,
 * }} props
 */
export default function AquifyMap({
  fountains = [],
  userLocation = null,
  center,
  focusId = null,
  onReview,
}) {
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
        <Marker
          key={fountain.id}
          position={[fountain.lat, fountain.lng]}
          icon={iconForFountain(fountain)}
        >
          <Popup>
            <div style={{ minWidth: '180px', lineHeight: '1.5' }}>
              <p style={{ fontWeight: '700', margin: '0 0 4px' }}>
                {fountain.name}
              </p>
              <p style={{ margin: '0 0 4px', color: '#475569', fontSize: '0.85em' }}>
                {fountain.address}
              </p>

              {/* Type badge */}
              <span
                style={{
                  display: 'inline-block',
                  padding: '1px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.75em',
                  fontWeight: '600',
                  marginBottom: '4px',
                  ...(TYPE_COLORS[fountain.type]
                    ? Object.fromEntries(
                        TYPE_COLORS[fountain.type]
                          .split(';')
                          .filter(Boolean)
                          .map((p) => p.split(':').map((s) => s.trim())),
                      )
                    : {}),
                }}
              >
                {TYPE_LABELS[fountain.type] ?? fountain.type}
              </span>

              {/* Accessibility */}
              {fountain.accessible && (
                <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                  <span aria-label="ADA accessible">♿</span> ADA Accessible
                </p>
              )}

              {/* Status */}
              <p style={{ margin: '2px 0', fontSize: '0.85em' }}>
                Status:{' '}
                <span
                  style={{
                    fontWeight: '600',
                    color:
                      fountain.status === 'active'
                        ? '#15803d'
                        : fountain.status === 'unverified'
                          ? '#b45309'
                          : '#6b7280',
                  }}
                >
                  {fountain.status}
                </span>
              </p>

              {/* Notes */}
              {fountain.notes && (
                <p
                  style={{
                    margin: '4px 0',
                    fontSize: '0.82em',
                    color: '#64748b',
                    fontStyle: 'italic',
                  }}
                >
                  {fountain.notes}
                </p>
              )}

              {/* Review CTA */}
              <div style={{ marginTop: '8px' }}>
                {currentUser ? (
                  <button
                    type="button"
                    onClick={() => onReview?.(fountain)}
                    style={{
                      padding: '4px 12px',
                      background: '#0084cc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.82em',
                      fontWeight: '600',
                    }}
                  >
                    Leave a review
                  </button>
                ) : (
                  <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>
                    Log in to review
                  </span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={ICONS.user}
        >
          <Popup>
            <span style={{ fontWeight: '600' }}>Your location</span>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  )
}
