import { useEffect } from "react"
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents, ZoomControl } from "react-leaflet"

function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 5), { duration: 0.7 })
  }, [lat, lon, map])
  return null
}

function Picker({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export function ObserveMap({
  lat,
  lon,
  onPick,
}: {
  lat: number
  lon: number
  onPick: (lat: number, lon: number) => void
}) {
  return (
    <MapContainer center={[lat, lon]} zoom={5} zoomControl={false} className="observe-map" scrollWheelZoom>
      <TileLayer
        attribution="&copy; OpenStreetMap &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomleft" />
      <FlyTo lat={lat} lon={lon} />
      <Picker onPick={onPick} />
      <CircleMarker
        center={[lat, lon]}
        radius={9}
        pathOptions={{ color: "#e8a06a", weight: 3, fillColor: "#2ee6c7", fillOpacity: 1 }}
      />
    </MapContainer>
  )
}
