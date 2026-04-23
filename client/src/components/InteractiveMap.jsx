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

// Icon xanh lá nổi bật cho vị trí người dùng (dạng pulse)
const userIcon = L.divIcon({
    className: '',
    html: `
        <div style="position: relative; width: 40px; height: 40px;">
            <div style="
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 18px; height: 18px;
                background: #2d7a3a;
                border: 3px solid #fff;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(45,122,58,0.6);
                z-index: 10;
            "></div>
            <div style="
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 40px; height: 40px;
                background: rgba(45,122,58,0.2);
                border: 2px solid rgba(45,122,58,0.4);
                border-radius: 50%;
                animation: userPulse 2s ease-out infinite;
            "></div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
})

// Component để auto-pan bản đồ về vị trí người dùng
function ChangeView({ center, zoom }) {
    const map = useMap()
    useEffect(() => {
        if (center) {
            map.setView(center, zoom, { animate: true })
        }
    }, [center, zoom, map])
    return null
}

export default function Map({ currentPos, markers = [], scrollWheelZoom = false }) {
    const defaultCenter = [10.08453, 105.75048] // Cồn Sơn, Bình Thủy, Cần Thơ (tọa độ chính xác)
    const zoom = 16 // Zoom gần hơn để thấy rõ đảo nhỏ

    const center = currentPos
        ? [currentPos.lat, currentPos.lng]
        : defaultCenter

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
            scrollWheelZoom={scrollWheelZoom}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ChangeView center={center} zoom={zoom} />

            {/* Marker vị trí hiện tại của người dùng */}
            {currentPos && (
                <Marker
                    position={[currentPos.lat, currentPos.lng]}
                    icon={userIcon}
                >
                    <Popup>
                        <div style={{ textAlign: 'center', padding: '4px 2px' }}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '4px' }}>📍</div>
                            <div style={{ fontWeight: 700, color: '#2d7a3a', fontSize: '0.88rem' }}>
                                Bạn đang ở đây
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '3px' }}>
                                {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Marker các địa điểm trải nghiệm */}
            {markers.map((m, i) => (
                <Marker key={i} position={[m.lat, m.lng]}>
                    <Popup>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1a2e1c' }}>
                            {m.title}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
