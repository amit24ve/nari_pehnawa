import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Eye,
  Users,
  TrendingUp,
  Activity,
  Globe,
  ArrowUpRight,
  Bot,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Smartphone,
  Laptop,
  Tablet,
  Chrome,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  Sun,
  Moon,
  ChevronRight,
  ChevronLeft,
  MousePointer,
  ShoppingBag,
  Bell,
  Maximize2,
  Navigation
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://naripehnawa.com:7100";

const StatCard = ({ title, value, subText, icon: Icon }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100/30">
          <Icon className="w-4 h-4 text-[#0891b2]" />
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">{value}</div>
      {subText && <p className="text-[10px] text-slate-500 mt-1">{subText}</p>}
    </div>
  );
};

// Comprehensive Geo Coordinate mapping for Indian Cities, States & Global Countries
const geoCoords = {
  // Major Indian Cities & Towns
  'sultanpur': [26.2648, 82.0727],
  'lucknow': [26.8467, 80.9462],
  'kanpur': [26.4499, 80.3319],
  'varanasi': [25.3176, 82.9739],
  'prayagraj': [25.4358, 81.8463],
  'allahabad': [25.4358, 81.8463],
  'ayodhya': [26.7922, 82.1998],
  'faizabad': [26.7731, 82.1458],
  'gorakhpur': [26.7606, 83.3732],
  'agra': [27.1767, 78.0081],
  'bareilly': [28.3670, 79.4304],
  'meerut': [28.9845, 77.7064],
  'aligarh': [27.8974, 78.0880],
  'moradabad': [28.8389, 78.7768],
  'noida': [28.5355, 77.3910],
  'greater noida': [28.4744, 77.5040],
  'ghaziabad': [28.6692, 77.4538],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'gurugram': [28.4595, 77.0266],
  'gurgaon': [28.4595, 77.0266],
  'faridabad': [28.4089, 77.3178],
  'mumbai': [19.0760, 72.8777],
  'navi mumbai': [19.0330, 73.0297],
  'thane': [19.2183, 72.9781],
  'pune': [18.5204, 73.8567],
  'nagpur': [21.1458, 79.0882],
  'nashik': [19.9975, 73.7898],
  'aurangabad': [19.8762, 75.3433],
  'kolhapur': [16.7050, 74.2433],
  'bengaluru': [12.9716, 77.5946],
  'bangalore': [12.9716, 77.5946],
  'mysuru': [12.2958, 76.6394],
  'mysore': [12.2958, 76.6394],
  'hyderabad': [17.3850, 78.4867],
  'secunderabad': [17.4399, 78.4983],
  'chennai': [13.0827, 80.2707],
  'madurai': [9.9252, 78.1198],
  'coimbatore': [11.0168, 76.9558],
  'kolkata': [22.5726, 88.3639],
  'howrah': [22.5958, 88.2636],
  'ahmedabad': [23.0225, 72.5714],
  'surat': [21.1702, 72.8311],
  'vadodara': [22.3072, 73.1812],
  'rajkot': [22.3039, 70.8022],
  'jaipur': [26.9124, 75.7873],
  'jodhpur': [26.2389, 73.0243],
  'udaipur': [24.5854, 73.7125],
  'kota': [25.2138, 75.8648],
  'patna': [25.5941, 85.1376],
  'gaya': [24.7914, 85.0002],
  'muzaffarpur': [26.1209, 85.3647],
  'ranchi': [23.3441, 85.3096],
  'jamshedpur': [22.8046, 86.2029],
  'dhanbad': [23.7957, 86.4304],
  'bhopal': [23.2599, 77.4126],
  'indore': [22.7196, 75.8577],
  'jabalpur': [23.1815, 79.9864],
  'gwalior': [26.2183, 78.1828],
  'chandigarh': [30.7333, 76.7794],
  'ludhiana': [30.9010, 75.8573],
  'amritsar': [31.6340, 74.8723],
  'jalandhar': [31.3260, 75.5762],
  'dehradun': [30.3165, 78.0322],
  'haridwar': [29.9457, 78.1642],
  'shimla': [31.1048, 77.1734],
  'srinagar': [34.0837, 74.7973],
  'jammu': [32.7266, 74.8570],
  'guwahati': [26.1445, 91.7362],
  'bhubaneswar': [20.2961, 85.8245],
  'cuttack': [20.4625, 85.8828],
  'raipur': [21.2514, 81.6296],
  'kochi': [9.9312, 76.2673],
  'cochin': [9.9312, 76.2673],
  'thiruvananthapuram': [8.5241, 76.9366],
  'trivandrum': [8.5241, 76.9366],
  'kozhikode': [11.2588, 75.7804],
  'visakhapatnam': [17.6868, 83.2185],
  'vijayawada': [16.5062, 80.6480],
  'panaji': [15.4909, 73.8278],
  'goa': [15.2993, 74.1240],

  // Indian States
  'uttar pradesh': [26.8467, 80.9462],
  'maharashtra': [19.7515, 75.7139],
  'karnataka': [15.3173, 75.7139],
  'tamil nadu': [11.1271, 78.6569],
  'gujarat': [22.2587, 71.1924],
  'rajasthan': [27.0238, 74.2179],
  'west bengal': [22.9868, 87.8550],
  'madhya pradesh': [22.9734, 78.6569],
  'bihar': [25.0961, 85.3131],
  'andhra pradesh': [15.9129, 79.7400],
  'telangana': [18.1124, 79.0193],
  'kerala': [10.8505, 76.2711],
  'punjab': [31.1471, 75.3412],
  'haryana': [29.0588, 76.0856],
  'odisha': [20.9517, 85.0985],
  'jharkhand': [23.6102, 85.2799],
  'chhattisgarh': [21.2787, 81.8661],
  'assam': [26.2006, 92.9376],
  'uttarakhand': [30.0668, 79.0193],
  'himachal pradesh': [31.1048, 77.1734],
  'jammu and kashmir': [33.7782, 76.5762],

  // Countries
  'india': [20.5937, 78.9629],
  'united arab emirates': [23.4241, 53.8478],
  'uae': [23.4241, 53.8478],
  'united states': [37.0902, -95.7129],
  'usa': [37.0902, -95.7129],
  'united kingdom': [55.3781, -3.4360],
  'uk': [55.3781, -3.4360],
  'canada': [56.1304, -106.3468],
  'australia': [-25.2744, 133.7751],
  'singapore': [1.3521, 103.8198],
  'nepal': [28.3949, 84.1240],
  'bangladesh': [23.6850, 90.3563],
  'saudi arabia': [23.8859, 45.0792],
  'germany': [51.1657, 10.4515],
  'france': [46.2276, 2.2137],
  'qatar': [25.3548, 51.1839],
  'kuwait': [29.3117, 47.4818],
  'oman': [21.4735, 55.9754],
  'malaysia': [4.2105, 101.9758],
  'unknown': [20.5937, 78.9629]
};

const resolveGeoLocation = (geo) => {
  if (!geo) return [20.5937, 78.9629];
  
  // 1. Direct valid coordinates
  const lat = Number(geo.lat);
  const lon = Number(geo.lon);
  if (lat && lon && !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
    return [lat, lon];
  }

  // 2. City lookup
  const city = (geo.city || '').toString().trim().toLowerCase().replace(/^(the\s+)/, '');
  if (city && geoCoords[city]) return geoCoords[city];
  for (const [k, v] of Object.entries(geoCoords)) {
    if (city && (city === k || city.includes(k) || k.includes(city))) return v;
  }

  // 3. State lookup
  const state = (geo.state || '').toString().trim().toLowerCase().replace(/^(the\s+)/, '');
  if (state && geoCoords[state]) return geoCoords[state];
  for (const [k, v] of Object.entries(geoCoords)) {
    if (state && (state === k || state.includes(k) || k.includes(state))) return v;
  }

  // 4. Country lookup
  const country = (geo.country || '').toString().trim().toLowerCase().replace(/^(the\s+)/, '');
  if (country && geoCoords[country]) return geoCoords[country];
  for (const [k, v] of Object.entries(geoCoords)) {
    if (country && (country === k || country.includes(k) || k.includes(country))) return v;
  }

  return [20.5937, 78.9629];
};

const Visitors = () => {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Core metrics state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [dateRange, setDateRange] = useState('7d'); // 'today', 'yesterday', '7d', '30d'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterBrowser, setFilterBrowser] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterType, setFilterType] = useState(''); // 'new', 'returning'
  const [currentPage, setCurrentPage] = useState(1);

  // Selected Visitor for modal
  const [selectedVisitorId, setSelectedVisitorId] = useState(null);
  const [visitorDetails, setVisitorDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // Live WebSocket updates
  const [liveEvents, setLiveEvents] = useState([]);
  const wsRef = useRef(null);

  // Leaflet Map states & refs
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }

    try {
      if (mapRef.current._leaflet_id) {
        delete mapRef.current._leaflet_id;
      }

      // Default view centered on India
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 18
      }).setView([22.5937, 78.9629], 4);

      const tileUrl = isDarkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: isDarkMode ? ['a', 'b', 'c', 'd'] : ['a', 'b', 'c']
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      const markerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      markersGroupRef.current = markerGroup;

      [100, 300, 600, 1200].forEach((delay) => {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
          }
        }, delay);
      });

      const handleResize = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (e) {
      console.error("Leaflet initialization failed: ", e);
    }
  }, [isDarkMode]);

  // Handle tile switch on dark mode toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const tileUrl = isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [isDarkMode]);

  // Invalidate map size on data update
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    }
  }, [dashboardData]);

  // Update Map Markers & Geolocation Pins
  useEffect(() => {
    if (!markersGroupRef.current || !mapInstanceRef.current || !dashboardData) return;

    markersGroupRef.current.clearLayers();
    const plotted = [];

    const createPulsingIcon = (color = 'amber') => {
      const colorHex = color === 'red' ? '#ef4444' : color === 'emerald' ? '#10b981' : '#0891b2';
      return L.divIcon({
        className: 'custom-pulsing-marker',
        html: `
          <div style="position: relative; width: 14px; height: 14px;">
            <div style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background-color: ${colorHex}; opacity: 0.9; z-index: 10; border: 2px solid #ffffff; box-shadow: 0 0 10px ${colorHex};"></div>
            <div class="animate-ping" style="position: absolute; width: 28px; height: 28px; top: -7px; left: -7px; border-radius: 50%; background-color: ${colorHex}; opacity: 0.5;"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
    };

    // 1. Draw Country & City Density Bubbles
    const countriesData = dashboardData.countries || [];
    countriesData.forEach(c => {
      const countryName = c.country;
      if (!countryName || countryName === 'Unknown') return;
      const count = c.count || 1;
      const coords = resolveGeoLocation({ country: countryName });
      
      const circle = L.circleMarker(coords, {
        radius: Math.min(Math.max(count * 3, 8), 36),
        fillColor: '#0891b2',
        color: '#06b6d4',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.35
      });
      
      const popupHtml = `
        <div style="background-color: #ffffff; color: #1e293b; padding: 8px 12px; border-radius: 10px; font-family: sans-serif; font-size: 11px; line-height: 1.4; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          <strong style="color:#0891b2; font-size: 12px;">📍 ${countryName}</strong><br/>
          <span style="color: #475569;"><strong>Store Visitors:</strong> ${count}</span>
        </div>
      `;
      circle.bindPopup(popupHtml, { closeButton: false });
      markersGroupRef.current.addLayer(circle);
    });

    // 2. Draw Active Session Geolocation Pins
    const journeysToPlot = dashboardData.journeys || [];
    
    journeysToPlot.forEach(j => {
      const coords = resolveGeoLocation(j.geo);
      let finalLat = coords[0];
      let finalLon = coords[1];

      // Jitter overlapping coordinates slightly so all markers are visible
      const key = `${finalLat.toFixed(2)},${finalLon.toFixed(2)}`;
      if (plotted.includes(key)) {
        finalLat += (Math.random() - 0.5) * 0.25;
        finalLon += (Math.random() - 0.5) * 0.25;
      }
      plotted.push(key);

      const aiIntent = j.ai_intent || 'medium';
      const markerColor = aiIntent === 'high' ? 'red' : aiIntent === 'low' ? 'emerald' : 'cyan';

      const marker = L.marker([finalLat, finalLon], {
        icon: createPulsingIcon(markerColor)
      });

      const cityText = j.geo?.city || j.geo?.state || 'Store Visitor';
      const countryText = j.geo?.country || 'India';
      const browserText = j.device?.browser || 'Browser';
      const osText = j.device?.os || 'OS';

      const popupContent = `
        <div style="background-color: #ffffff; color: #1e293b; padding: 12px; border-radius: 12px; font-family: sans-serif; font-size: 11px; width: 220px; line-height: 1.5; box-shadow: 0 6px 16px rgba(0,0,0,0.12);">
          <div style="font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: monospace; color: #0891b2;">${(j.visitor_id || 'Visitor').substring(0, 14)}...</span>
            <span style="background: rgba(8, 145, 178, 0.1); color: #0891b2; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase;">Active</span>
          </div>
          <div style="margin-bottom: 3px; color: #475569;"><strong>Location:</strong> ${cityText}, ${countryText}</div>
          <div style="margin-bottom: 3px; color: #475569;"><strong>Device:</strong> ${browserText} (${osText})</div>
          <div style="margin-bottom: 3px; color: #475569;"><strong>Referrer:</strong> ${j.referrer || 'Direct'}</div>
          <div style="color: #475569;"><strong>Status:</strong> <span style="font-weight: bold; color: #0891b2">${j.status || 'Guest'}</span></div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        className: 'custom-map-popup'
      });

      markersGroupRef.current.addLayer(marker);
    });
  }, [dashboardData, liveEvents]);

  // Fetch Dashboard State
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');

      const headers = { 'Authorization': `Bearer ${token}` };
      
      const queryParams = new URLSearchParams({
        date_range: dateRange,
        page: String(currentPage),
        limit: '10'
      });
      if (searchQuery) queryParams.append('search', searchQuery);
      if (filterCountry) queryParams.append('country', filterCountry);
      if (filterBrowser) queryParams.append('browser', filterBrowser);
      if (filterDevice) queryParams.append('device', filterDevice);
      if (filterSource) queryParams.append('source', filterSource);
      if (filterType) queryParams.append('visitor_type', filterType);

      const response = await fetch(`${API_BASE_URL}/analytics/visitor-dashboard?${queryParams}`, { headers });
      
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (!response.ok) throw new Error('Failed to retrieve intelligence analytics');

      const data = await response.json();
      setDashboardData(data);

      // Notification checks
      const alerts = [];
      if (data.active_visitors >= 100) alerts.push("High traffic: Over 100 active visitors online!");
      if (data.bounce_rate > 70) alerts.push("Performance alert: High bounce rate detected!");
      if (data.journeys?.some(j => j.geo?.vpn_detected)) alerts.push("Security advisory: VPN/Proxy visitors detected.");
      setNotifications(alerts);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dateRange, filterCountry, filterBrowser, filterDevice, filterSource, filterType, currentPage]);

  useEffect(() => {
    if (dashboardData && dashboardData.journeys && liveEvents.length === 0) {
      const seeded = [];
      dashboardData.journeys.slice(0, 10).forEach(j => {
        if (j.pages && j.pages.length > 0) {
          j.pages.forEach((p, idx) => {
            seeded.push({
              visitor_id: j.visitor_id,
              session_id: j.session_id,
              type: 'pageview',
              path: p,
              timestamp: new Date(new Date(j.start_time).getTime() - (j.pages.length - 1 - idx) * 30000).toISOString(),
              geo: j.geo || { country: 'India', city: 'Mumbai' },
              device: j.device || { browser: 'Chrome', os: 'Android' }
            });
          });
        }
      });
      seeded.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLiveEvents(seeded.slice(0, 20));
    }
  }, [dashboardData]);

  // Fetch detailed Visitor Profile
  const fetchVisitorDetails = async (visitorId) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('neel_token') || localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const res = await fetch(`${API_BASE_URL}/analytics/visitor/${visitorId}`, { headers });
      if (!res.ok) throw new Error('Failed to load visitor profile');

      const data = await res.json();
      setVisitorDetails(data);
    } catch (err) {
      alert(`Error loading profile: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedVisitorId) {
      fetchVisitorDetails(selectedVisitorId);
    } else {
      setVisitorDetails(null);
      setShowHeatmap(false);
    }
  }, [selectedVisitorId]);

  // Setup WebSocket connection
  useEffect(() => {
    let wsUrl;
    try {
      const parsedUrl = new URL(API_BASE_URL);
      const wsProto = parsedUrl.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${wsProto}://${parsedUrl.host}/analytics/live-ws`;
    } catch (err) {
      const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      wsUrl = `${wsProto}://${window.location.host}/analytics/live-ws`;
    }

    const connectWS = () => {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setLiveEvents((prev) => [parsed, ...prev.slice(0, 39)]);

          if (parsed.type === 'session_start') {
            setDashboardData(prev => {
              if (!prev) return null;
              
              const exists = prev.journeys.some(j => j.session_id === parsed.session_id);
              const updatedJourneys = exists ? prev.journeys : [{
                session_id: parsed.session_id,
                visitor_id: parsed.visitor_id,
                start_time: parsed.timestamp || new Date().toISOString(),
                duration: 0,
                referrer: parsed.referrer || 'Direct',
                geo: parsed.geo,
                device: parsed.device,
                pages: [parsed.path],
                bounce: true,
                status: 'Guest'
              }, ...prev.journeys.slice(0, 9)];

              return {
                ...prev,
                active_visitors: prev.active_visitors + 1,
                total_visitors: parsed.returning ? prev.total_visitors : prev.total_visitors + 1,
                journeys: updatedJourneys
              };
            });
          }
        } catch (e) {
          console.error("WS error parsing event", e);
        }
      };

      socket.onclose = () => {
        setTimeout(connectWS, 5000);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Exports
  const handleExportCSV = () => {
    if (!dashboardData || !dashboardData.journeys) return;
    let csv = "Visitor ID,IP,Country,City,Browser,OS,Duration,Pages,Status\n";
    dashboardData.journeys.forEach(j => {
      csv += `"${j.visitor_id}","${j.geo?.ip || ''}","${j.geo?.country || ''}","${j.geo?.city || ''}","${j.device?.browser || ''}","${j.device?.os || ''}",${j.duration},${j.pages?.length || 0},"${j.status || 'Guest'}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `visitor_report_${Date.now()}.csv`);
    a.click();
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0b0f19]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 animate-pulse">Loading Visitor Intelligence Systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-6 space-y-6 min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0b0f19] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800/40 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Visitor Analytics Dashboard
            </h1>
            <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-[#d4af37] text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Clarity Analytics
            </span>
          </div>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Track clicks, platform environments, conversion funnels, and scroll map overlays.
          </p>
        </div>

        {/* Buttons / Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {notifications.length > 0 && (
            <div className="relative group">
              <button className="p-2.5 rounded-xl border border-red-500/30 bg-red-950/20 text-red-400">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500"></span>
              </button>
              <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-800 rounded-xl p-3 shadow-xl hidden group-hover:block z-50 text-[10px] space-y-2">
                <p className="font-bold border-b border-zinc-850 pb-1 mb-1">System Alerts</p>
                {notifications.map((n, i) => (
                  <p key={i} className="text-zinc-300">• {n}</p>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 rounded-xl border ${isDarkMode ? 'border-gray-800 bg-[#111827] text-gray-400 hover:text-white' : 'border-gray-200 bg-white text-gray-600 hover:text-black'} transition`}
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button
            onClick={fetchDashboard}
            className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDarkMode ? 'border-gray-800 bg-[#111827] hover:bg-gray-800' : 'border-gray-200 bg-white hover:bg-gray-100'} transition text-xs font-semibold`}
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition text-xs font-semibold flex items-center gap-2 text-gray-700 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>

          <button
            onClick={handleExportPDF}
            className="p-2.5 rounded-xl bg-[#0891b2] hover:bg-[#06b6d4] transition text-xs font-bold flex items-center gap-2 text-white shadow-sm border-none"
          >
            <FileText className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* Date Filters Row */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 p-2.5 rounded-2xl">
        {[
          { key: 'today', label: 'Today' },
          { key: 'yesterday', label: 'Yesterday' },
          { key: '7d', label: 'Last 7 Days' },
          { key: '30d', label: 'Last 30 Days' },
          { key: 'all', label: 'All Time' }
        ].map((r) => (
          <button
            key={r.key}
            onClick={() => { setDateRange(r.key); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dateRange === r.key
                ? 'bg-[#0891b2] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Live Online"
          value={dashboardData?.active_visitors || 0}
          subText="Active in last 5 minutes"
          icon={Activity}
        />
        <StatCard
          title="Total Visitors"
          value={dashboardData?.total_visitors?.toLocaleString() || 0}
          subText="Unique user sessions"
          icon={Users}
        />
        <StatCard
          title="Total Pageviews"
          value={dashboardData?.total_pageviews?.toLocaleString() || 0}
          subText="Overall hits logged"
          icon={Eye}
        />
        <StatCard
          title="Bounce Rate"
          value={`${dashboardData?.bounce_rate || 0}%`}
          subText="Single page drop-offs"
          icon={TrendingUp}
        />
      </div>

      {/* Real-time Map and WebSockets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Visitor Map */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0891b2]" /> Live Geolocation Radar
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Real-time coordinates of storefront traffic.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1.5 mr-2">
                <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500"></span> High</span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-cyan-600"></span> Active</span>
                <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Low</span>
              </div>
              
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.setView([22.5937, 78.9629], 4.5)}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-cyan-50 hover:text-[#0891b2] text-slate-700 rounded-lg border border-slate-200 transition flex items-center gap-1"
                title="Center on India"
              >
                <Navigation className="w-3 h-3" /> Focus India
              </button>

              <button
                type="button"
                onClick={() => mapInstanceRef.current?.setView([20.0, 10.0], 2)}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition flex items-center gap-1"
                title="Global World View"
              >
                <Globe className="w-3 h-3" /> Global View
              </button>
            </div>
          </div>
          
          <div className="h-[400px] w-full rounded-xl bg-slate-50 border border-slate-200 relative overflow-hidden shadow-inner">
            <div ref={mapRef} className="h-full w-full z-10" style={{ height: '400px', width: '100%', minHeight: '400px' }} />
          </div>
        </div>

        {/* Live Event Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-600 animate-pulse" /> Live Stream
              </h2>
              <p className="text-xs text-slate-400">WS page hits and actions</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 flex-1">
            {liveEvents.length > 0 ? (
              liveEvents.map((evt, idx) => (
                <div key={idx} className="text-[10px] p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-slate-500 font-semibold">
                    <span className="font-mono font-bold text-[#0891b2]">{evt.visitor_id.substring(0, 10)}...</span>
                    <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-800 truncate font-semibold">
                    {evt.type === 'session_start' ? '🚀 Session Started' : `📄 Path: ${evt.path}`}
                  </div>
                  {evt.geo && <div className="text-slate-500">Location: {evt.geo.city}, {evt.geo.country}</div>}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center gap-2 border border-dashed border-slate-200 rounded-xl h-full">
                <Activity className="w-6 h-6 opacity-40 animate-pulse" />
                <span className="text-[10px]">Listening for live visitors...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SVG Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visitor & Pageviews History */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#0891b2]" /> Page Hits vs Unique Visitors
          </h3>
          
          {dashboardData?.charts?.visitors?.length > 0 ? (
            <div className="w-full h-64 relative flex items-end">
              <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0891b2" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area paths */}
                <path
                  d={`M 0 200 ${dashboardData.charts.pageviews.map((pv, i) => {
                    const maxVal = Math.max(...dashboardData.charts.pageviews, 1);
                    const x = (i / (dashboardData.charts.pageviews.length - 1)) * 500;
                    const y = 200 - (pv / maxVal) * 160;
                    return `L ${x} ${y}`;
                  }).join(' ')} L 500 200 Z`}
                  fill="url(#areaGrad)"
                />
                {/* Stroke paths */}
                <path
                  d={dashboardData.charts.pageviews.map((pv, i) => {
                    const maxVal = Math.max(...dashboardData.charts.pageviews, 1);
                    const x = (i / (dashboardData.charts.pageviews.length - 1)) * 500;
                    const y = 200 - (pv / maxVal) * 160;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#0891b2"
                  strokeWidth="3"
                />
                <path
                  d={dashboardData.charts.visitors.map((uv, i) => {
                    const maxVal = Math.max(...dashboardData.charts.pageviews, 1);
                    const x = (i / (dashboardData.charts.visitors.length - 1)) * 500;
                    const y = 200 - (uv / maxVal) * 160;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
              </svg>
              {/* Date Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] text-slate-400 font-mono">
                {dashboardData.charts.dates.map((d, idx) => (
                  <span key={idx}>{d.split('-').slice(1).join('/')}</span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-xs text-center py-12">No data logged for active charts.</p>
          )}
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#0891b2]" /> Revenue Funnel Stats
          </h3>

          <div className="space-y-4 flex-1 flex flex-col justify-around">
            {dashboardData?.funnel?.map((step, idx) => {
              const maxVal = Math.max(1, dashboardData.funnel[0].count);
              const pct = Math.round((step.count / maxVal) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span>{step.stage}</span>
                    <span>{step.count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded border border-slate-200 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#0891b2] to-[#06b6d4] rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Visitor Journeys Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Live Visitor Sessions Table</h2>
            <p className="text-xs text-slate-400">Click a row to view full pageview paths, timeline actions, and scroll heatmaps.</p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-405 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Visitor ID, Country..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            
            {/* Country filter */}
            <select
              value={filterCountry}
              onChange={(e) => { setFilterCountry(e.target.value); setCurrentPage(1); }}
              className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="">All Countries</option>
              {dashboardData?.countries?.map(c => (
                <option key={c.country} value={c.country}>{c.country}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Journeys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-550 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Visitor Details</th>
                <th className="py-3 px-4">Browser & OS</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Referral Source</th>
                <th className="py-3 px-4 font-mono">Duration</th>
                <th className="py-3 px-4">Pages View</th>
                <th className="py-3 px-4">Membership</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-750">
              {dashboardData?.journeys?.length > 0 ? (
                dashboardData.journeys.map((j) => (
                  <tr key={j.session_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 font-mono">{j.visitor_id.substring(0, 16)}...</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Started: {new Date(j.start_time).toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-800 font-medium">{j.device?.browser || 'Chrome'}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{j.device?.os || 'Windows'}</div>
                    </td>
                    <td className="py-4 px-4 flex items-center gap-1.5 mt-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#0891b2]" />
                      <span>{j.geo?.city || 'Mumbai'}, {j.geo?.country || 'India'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="truncate max-w-[140px] block text-slate-600" title={j.referrer}>{j.referrer || 'Direct'}</span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-600">{j.duration}s</td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-750 font-bold">{j.pages?.length || 0}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        j.status === 'Guest' ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-cyan-50 text-[#0891b2] border border-cyan-200'
                      }`}>{j.status}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedVisitorId(j.visitor_id)}
                        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 transition flex items-center gap-1 ml-auto text-[10px] font-bold"
                      >
                        Profile <ArrowRight className="w-3.5 h-3.5 text-[#0891b2]" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-zinc-500">No active visitor sessions matched.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Row */}
        {dashboardData?.pagination?.pages > 1 && (
          <div className="flex justify-between items-center border-t border-slate-200 pt-5 mt-4 text-xs text-slate-500">
            <span>Page {currentPage} of {dashboardData.pagination.pages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(dashboardData.pagination.pages, p + 1))}
                disabled={currentPage === dashboardData.pagination.pages}
                className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-40 hover:bg-slate-50 text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Visitor Profile modal (Clarity & Hotjar style timeline + Heatmaps) */}
      {selectedVisitorId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="text-lg font-bold text-slate-800 font-mono flex items-center gap-2">
                  Visitor Journey Log: {selectedVisitorId}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Explore pageviews, scroll depth, click heatmaps, and custom actions.</p>
              </div>
              <button
                onClick={() => setSelectedVisitorId(null)}
                className="text-slate-600 hover:text-slate-800 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition text-xs font-bold"
              >
                Close
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-24 text-center">
                <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-400">Loading visitor profile intelligence...</p>
              </div>
            ) : (
              <div className="p-5 md:p-6 space-y-6">
                
                {/* Meta Profiles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#0891b2]" /> Geography</h4>
                    <p className="text-slate-600"><strong>IP:</strong> {visitorDetails?.visitor?.ip || '127.0.0.1'}</p>
                    <p className="text-slate-600"><strong>ISP:</strong> {visitorDetails?.visitor?.geo?.isp || 'Unknown'}</p>
                    <p className="text-slate-600"><strong>Location:</strong> {visitorDetails?.visitor?.geo?.city}, {visitorDetails?.visitor?.geo?.state}, {visitorDetails?.visitor?.geo?.country}</p>
                    <p className="text-slate-600"><strong>Network:</strong> {visitorDetails?.visitor?.geo?.network_type || 'WiFi'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5"><Laptop className="w-4 h-4 text-[#0891b2]" /> Environment</h4>
                    <p className="text-slate-600"><strong>OS:</strong> {visitorDetails?.visitor?.device?.os || 'Unknown'}</p>
                    <p className="text-slate-600"><strong>Browser:</strong> {visitorDetails?.visitor?.device?.browser || 'Unknown'}</p>
                    <p className="text-slate-600"><strong>Resolution:</strong> {visitorDetails?.visitor?.device?.screen_resolution || 'Unknown'}</p>
                    <p className="text-slate-600"><strong>Language:</strong> {visitorDetails?.visitor?.device?.language || 'en'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#0891b2]" /> Session Context</h4>
                    <p className="text-slate-600"><strong>Total Visits:</strong> {visitorDetails?.visitor?.total_visits || 1}</p>
                    <p className="text-slate-600"><strong>First seen:</strong> {new Date(visitorDetails?.visitor?.first_seen).toLocaleString()}</p>
                    <p className="text-slate-600"><strong>Last seen:</strong> {new Date(visitorDetails?.visitor?.last_seen).toLocaleString()}</p>
                    <p className="text-slate-600"><strong>Membership:</strong> {visitorDetails?.visitor?.login_status}</p>
                  </div>
                </div>

                {/* Heatmap overlay and timeline tabs */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <h4 className="font-serif font-bold text-slate-800 flex items-center gap-1.5">
                      <MousePointer className="w-4 h-4 text-[#0891b2]" /> Microsoft Clarity Click Heatmap Simulation
                    </h4>
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                        showHeatmap ? 'bg-[#0891b2] text-white border-none shadow-sm' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {showHeatmap ? "Hide Heatmap" : "View Hotspots Overlay"}
                    </button>
                  </div>

                  {showHeatmap && (
                    <div className="relative w-full h-[320px] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                      {/* Grid representation representing coordinate canvas */}
                      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-10 pointer-events-none">
                        {Array.from({ length: 100 }).map((_, i) => (
                          <div key={i} className="border border-slate-300"></div>
                        ))}
                      </div>
                      
                      {/* Hotspot indicators */}
                      {visitorDetails?.clicks?.map((clk, idx) => (
                        <div
                          key={idx}
                          className="absolute w-6 h-6 rounded-full opacity-70 animate-pulse pointer-events-none"
                          style={{
                            left: `${clk.x}%`,
                            top: `${clk.y}%`,
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, #f59e0b 0%, rgba(212, 175, 55, 0) 70%)',
                            boxShadow: '0 0 12px #f59e0b'
                          }}
                          title={`Clicked: ${clk.target_tag || 'element'} (${clk.target_text || 'no text'})`}
                        />
                      ))}
                      
                      {visitorDetails?.clicks?.length === 0 ? (
                        <span className="text-slate-400 text-xs">No coordinates clicks recorded for this visitor.</span>
                      ) : (
                        <span className="absolute bottom-2 right-3 text-[9px] text-[#0891b2] bg-white border border-slate-250 px-2 py-0.5 rounded font-mono shadow-sm">
                          Simulating {visitorDetails.clicks.length} user hotspots
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-slate-800 flex items-center gap-1.5"><Clock className="w-4.5 h-4.5 text-[#0891b2]" /> Complete Visitor Activity Timeline</h4>
                  <div className="relative border-l border-slate-200 pl-6 ml-3 space-y-6">
                    {/* Pageviews */}
                    {visitorDetails?.pageviews?.map((pv, idx) => (
                      <div key={`pv-${idx}`} className="relative">
                        <div className="absolute -left-[32.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#0891b2] border-2 border-white"></div>
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                          <div className="flex justify-between items-center text-slate-500 text-[10px] font-semibold">
                            <span>Page View Log</span>
                            <span>{new Date(pv.entered_at).toLocaleString()}</span>
                          </div>
                          <p className="font-semibold text-slate-800 text-sm">{pv.title}</p>
                          <p className="font-mono text-slate-500">{pv.path}</p>
                          <div className="flex flex-wrap gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                            <span>Time spent: <strong className="text-slate-700 font-mono">{pv.time_spent}s</strong></span>
                            <span>Scroll depth: <strong className="text-slate-700 font-mono">{pv.scroll_percentage}%</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Events */}
                    {visitorDetails?.events?.map((evt, idx) => (
                      <div key={`evt-${idx}`} className="relative">
                        <div className="absolute -left-[32.5px] top-1.5 w-3.5 h-3.5 rounded-full bg-cyan-500 border-2 border-white"></div>
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                          <div className="flex justify-between items-center text-slate-500 text-[10px] font-semibold">
                            <span>Custom Event Trigger</span>
                            <span>{new Date(evt.created_at).toLocaleString()}</span>
                          </div>
                          <p className="font-bold text-slate-850 capitalize">Action: {evt.event_type.replace('_', ' ')}</p>
                          <pre className="text-[10px] text-slate-600 bg-slate-100 p-2.5 rounded font-mono overflow-x-auto max-w-full">
                            {JSON.stringify(evt.event_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;
