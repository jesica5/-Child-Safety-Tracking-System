import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Dynamic Leaflet DivIcon constructor for color-coded & blinking markers
const createChildMarkerIcon = (status, name) => {
  let color = '#22c55e'; // safe (green)
  let pingEffect = '';
  
  if (status === 'SOS') {
    color = '#ef4444'; // critical (red)
    pingEffect = '<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>';
  } else if (status === 'Outside Safe Zone') {
    color = '#f59e0b'; // outside (amber)
    pingEffect = '<span class="absolute inline-flex h-full w-full animate-pulse rounded-full bg-amber-400 opacity-50"></span>';
  } else if (status === 'Inactive') {
    color = '#64748b'; // inactive (slate)
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        ${pingEffect}
        <div style="background-color: ${color};" class="relative w-6 h-6 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-[10px] font-extrabold font-sans">
          ${name ? name.slice(0, 2).toUpperCase() : 'C'}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Component to dynamically re-center map when selected child changes
const ChangeMapView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

const MapTracker = ({ childrenList = [], geofences = [], selectedChild = null, historyPath = [] }) => {
  const defaultCenter = [37.7794, -122.4194]; // San Francisco Home Area
  const defaultZoom = 14;

  // Determine map focus center
  let activeCenter = defaultCenter;
  if (selectedChild && selectedChild.currentLocation) {
    activeCenter = [selectedChild.currentLocation.lat, selectedChild.currentLocation.lng];
  } else if (childrenList.length > 0 && childrenList[0].currentLocation) {
    activeCenter = [childrenList[0].currentLocation.lat, childrenList[0].currentLocation.lng];
  }

  // Format historical polyline coordinates
  const polylinePath = historyPath.map(pt => [pt.lat, pt.lng]);

  return (
    <div className="h-full w-full relative overflow-hidden rounded-xl shadow-premium border border-slate-100 bg-slate-100">
      <MapContainer 
        center={activeCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true} 
        className="h-full w-full"
      >
        <ChangeMapView center={activeCenter} zoom={selectedChild ? 15 : 14} />
        
        {/* OpenStreetMap Beautiful Slate-like Map Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render safe zones geofences */}
        {geofences.map(fence => {
          if (!fence.center || !fence.center.lat || !fence.isActive) return null;
          
          let color = '#22c55e'; // default green
          if (fence.name.toLowerCase().includes('school')) color = '#3b66ff'; // school blue
          if (fence.name.toLowerCase().includes('home')) color = '#10b981'; // home teal

          return (
            <Circle
              key={fence._id}
              center={[fence.center.lat, fence.center.lng]}
              radius={fence.radius}
              pathOptions={{ 
                color: color, 
                fillColor: color, 
                fillOpacity: 0.1, 
                weight: 1.5,
                dashArray: '5, 5'
              }}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <span className="font-semibold">{fence.name}</span>
                  <br />
                  Radius: {fence.radius}m
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Render History Polyline */}
        {polylinePath.length > 0 && (
          <Polyline 
            positions={polylinePath} 
            pathOptions={{ 
              color: '#3b66ff', 
              weight: 3, 
              opacity: 0.8,
              dashArray: '8, 8' 
            }} 
          />
        )}

        {/* Render Children Markers */}
        {childrenList.map(child => {
          if (!child.currentLocation || !child.currentLocation.lat) return null;
          const pos = [child.currentLocation.lat, child.currentLocation.lng];
          const isFocused = selectedChild && selectedChild._id === child._id;

          return (
            <Marker 
              key={child._id} 
              position={pos} 
              icon={createChildMarkerIcon(child.status, child.name)}
            >
              <Popup>
                <div className="font-sans text-xs w-48 leading-relaxed">
                  <div className="flex items-center justify-between border-b pb-1 mb-2">
                    <span className="font-bold text-sm text-slate-800">{child.name}</span>
                    <span 
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${
                        child.status === 'SOS' 
                          ? 'bg-red-500 animate-pulse' 
                          : child.status === 'Outside Safe Zone' 
                          ? 'bg-amber-500' 
                          : 'bg-green-500'
                      }`}
                    >
                      {child.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Class:</span> {child.class}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Parent:</span> {child.parentName}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500">Speed:</span> {child.currentLocation.speed || 0} km/h
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Last update: {new Date(child.currentLocation.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapTracker;
