import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect } from 'react'
import L from 'leaflet'

// Fix for default marker icons in Leaflet + React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
})

// Component to handle map center updates
function ChangeView({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.setView(center, zoom)
        }
    }, [center, zoom, map])
    return null
}

export default function Map({ currentPos, markers = [] }) {
    const defaultCenter = [10.0827, 105.7834] // Con Son, Can Tho
    const zoom = 15

    const center = currentPos ? [currentPos.lat, currentPos.lng] : defaultCenter

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
            scrollWheelZoom={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={center} zoom={zoom} />

            {currentPos && (
                <Marker position={[currentPos.lat, currentPos.lng]}>
                    <Popup>
                        Bạn đang ở đây
                    </Popup>
                </Marker>
            )}

            {markers.map((m, i) => (
                <Marker key={i} position={[m.lat, m.lng]}>
                    <Popup>
                        {m.title}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
