import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapPin, Wifi, WifiOff, CheckCircle2, Clock, Navigation,
  Briefcase, Car, X, Loader2, AlertTriangle, Shield, Building2,
  RefreshCw, ExternalLink, Compass, LocateFixed, Globe, Check,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { hrmsService } from '@/services/hrms.service';
import { toast } from '@/utils/toast';
import { env } from '@/config/env';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatTime(date) {
  if (!date) return '--';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getGPSAccuracyDetails(accuracy) {
  if (!accuracy) return { label: 'Unknown', color: 'text-zinc-400', badgeBg: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' };
  if (accuracy <= 15) return { label: 'Satellite Locked (High Precision)', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' };
  if (accuracy <= 50) return { label: 'Good Accuracy', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' };
  if (accuracy <= 120) return { label: 'Moderate (Refining...)', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' };
  return { label: 'Coarse Location', color: 'text-orange-400', badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20' };
}

// ── Google Maps / OSM Map Embed with Direct External Link ──────────────────────
function StaticMapPin({ lat, lng, accuracy, label = 'Y' }) {
  const apiKey = env.googleMapsApiKey;
  const [mapType, setMapType] = useState('google'); // 'google' | 'osm'
  const [imgError, setImgError] = useState(false);

  if (!lat || !lng) return null;

  const sanitizedLabel = (label || 'Y').toString()[0].toUpperCase();
  const googleStaticSrc = apiKey && !imgError
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=500x200&scale=2&maptype=roadmap&markers=color:red%7Clabel:${sanitizedLabel}%7C${lat},${lng}&key=${apiKey}`
    : null;

  const d = 0.004;
  const osmEmbedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="rounded-xl border border-surface-3 bg-surface-1 overflow-hidden transition-all shadow-xs">
      <div className="relative w-full h-[150px] bg-surface-2 overflow-hidden">
        {/* Live GPS indicator overlay */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-1/90 backdrop-blur-md border border-surface-3 text-[10px] font-medium shadow-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-emerald-400 font-semibold">Live GPS Pin</span>
        </div>

        {/* Map Type Switcher */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-surface-1/90 backdrop-blur-md p-0.5 rounded-lg border border-surface-3 text-[10px]">
          {apiKey && !imgError && (
            <button
              type="button"
              onClick={() => setMapType('google')}
              className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                mapType === 'google' ? 'bg-brand-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Google
            </button>
          )}
          <button
            type="button"
            onClick={() => setMapType('osm')}
            className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
              mapType === 'osm' || !apiKey || imgError ? 'bg-brand-500 text-white shadow-xs' : 'text-zinc-400 hover:text-white'
            }`}
          >
            OSM
          </button>
        </div>

        {mapType === 'google' && googleStaticSrc ? (
          <img
            src={googleStaticSrc}
            alt="Real-time map location"
            onError={() => {
              setImgError(true);
              setMapType('osm');
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <iframe
            title="Real-time Map Location"
            src={osmEmbedSrc}
            className="w-full h-full border-0 pointer-events-none"
          />
        )}
      </div>

      {/* Map Footer Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-2/70 text-[10.5px] border-t border-surface-3">
        <span className="font-mono text-zinc-400 truncate">
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-semibold hover:underline"
        >
          <span>View on Google Maps</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function RealtimeAttendanceModal({ open, onOpenChange, onPunchChange }) {
  const [gpsState, setGpsState] = useState('idle'); // 'idle' | 'detecting' | 'ready' | 'denied'
  const [gps, setGps] = useState(null);
  const [address, setAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const [mode, setMode] = useState('OFFICE'); // 'OFFICE' | 'FIELD'
  const [fieldForm, setFieldForm] = useState({ clientName: '', siteName: '', purpose: '', remarks: '' });

  const [todayData, setTodayData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastGeocodedRef = useRef({ lat: null, lng: null });

  const isPunchedIn = todayData?.isPunchedIn || false;
  const checkInTime = todayData?.checkInTime;
  const workplace = todayData?.workplace;

  // ── Live Shift Timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (isPunchedIn && checkInTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - new Date(checkInTime).getTime());
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isPunchedIn, checkInTime]);

  // ── Fetch today's attendance status ───────────────────────────────────────
  const fetchToday = useCallback(async () => {
    setDataLoading(true);
    try {
      const data = await hrmsService.getMyAttendanceToday();
      setTodayData(data);
      if (data?.record?.workMode) setMode(data.record.workMode);
    } catch {
      // ignore — employee may not have a profile linked yet
    } finally {
      setDataLoading(false);
    }
  }, []);

  // ── Multi-Tier Reverse Geocode (Backend Proxy -> Client Google Maps -> Nominatim)
  const resolveAddress = useCallback(async (lat, lng, force = false) => {
    if (!lat || !lng) return;

    // Skip if coordinates moved less than 15 meters and not forced
    const last = lastGeocodedRef.current;
    if (!force && last.lat && last.lng) {
      const dLat = Math.abs(lat - last.lat);
      const dLng = Math.abs(lng - last.lng);
      if (dLat < 0.00015 && dLng < 0.00015) return;
    }

    setAddressLoading(true);
    let resolved = '';

    // Tier 1: Backend Reverse Geocode Proxy (Reliable, bypasses adblockers & CORS)
    try {
      const backendRes = await hrmsService.reverseGeocode(lat, lng);
      if (backendRes?.address) {
        resolved = backendRes.address;
      }
    } catch {
      // fallback to client tiers below
    }

    // Tier 2: Client-side Google Maps Geocoding API if key is available
    if (!resolved && env.googleMapsApiKey) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googleMapsApiKey}`,
          { signal: AbortSignal.timeout(4500) }
        );
        const json = await res.json();
        if (json.status === 'OK' && json.results?.[0]?.formatted_address) {
          resolved = json.results[0].formatted_address;
        }
      } catch {
        // fallback below
      }
    }

    // Tier 3: OpenStreetMap Nominatim fallback
    if (!resolved) {
      try {
        const nomRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
          { headers: { 'User-Agent': 'HaionERP/1.0' }, signal: AbortSignal.timeout(4500) }
        );
        const nomJson = await nomRes.json();
        if (nomJson?.display_name) {
          resolved = nomJson.display_name;
        }
      } catch {
        // silent
      }
    }

    if (resolved) {
      setAddress(resolved);
      lastGeocodedRef.current = { lat, lng };
    }
    setAddressLoading(false);
  }, []);

  // ── Network IP Fallback (Only as last resort when GPS denied/unavailable) ───
  const tryNetworkFallback = useCallback(async () => {
    try {
      const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const loc = {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 2500,
          isNetwork: true,
          timestamp: new Date(),
        };
        setGps(loc);
        setGpsState('ready');
        resolveAddress(data.latitude, data.longitude, true);
        return;
      }
    } catch {
      try {
        const res2 = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(4000) });
        const data2 = await res2.json();
        if (data2 && data2.latitude && data2.longitude) {
          const loc = {
            latitude: data2.latitude,
            longitude: data2.longitude,
            accuracy: 2500,
            isNetwork: true,
            timestamp: new Date(),
          };
          setGps(loc);
          setGpsState('ready');
          resolveAddress(data2.latitude, data2.longitude, true);
          return;
        }
      } catch {
        // both failed
      }
    }
    setGpsState('denied');
  }, [resolveAddress]);

  // ── Continuous Real-Time GPS Tracking via watchPosition ────────────────────
  const startRealtimeTracking = useCallback((forceNetwork = false) => {
    // Clear any existing watcher
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (forceNetwork || !navigator.geolocation) {
      tryNetworkFallback();
      return;
    }

    setGpsState('detecting');
    setIsCalibrating(true);

    let hasReceivedFirstFix = false;

    // Setup High-Precision Continuous Watcher
    const options = {
      enableHighAccuracy: true,
      maximumAge: 0,       // Never use stale cached coordinates!
      timeout: 15000,      // Allow sufficient time for mobile & PC satellite / Wi-Fi lock
    };

    const handleSuccess = (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      hasReceivedFirstFix = true;
      setIsCalibrating(false);

      setGps((prev) => {
        // Update live state with fresh real-time coordinates
        return {
          latitude,
          longitude,
          accuracy,
          isNetwork: false,
          timestamp: new Date(),
        };
      });

      setGpsState('ready');
      resolveAddress(latitude, longitude);
    };

    const handleError = (err) => {
      console.warn('[GPS] Error code:', err.code, err.message);

      if (err.code === 1) {
        // Permission Denied
        setIsCalibrating(false);
        setGpsState('denied');
        return;
      }

      // If high-accuracy timed out on the first attempt, try single low-accuracy fallback
      if (!hasReceivedFirstFix) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setGps({ latitude, longitude, accuracy, isNetwork: false, timestamp: new Date() });
            setGpsState('ready');
            setIsCalibrating(false);
            resolveAddress(latitude, longitude);
          },
          () => {
            setIsCalibrating(false);
            tryNetworkFallback();
          },
          { enableHighAccuracy: false, maximumAge: 0, timeout: 8000 }
        );
      }
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    } catch (e) {
      console.error('[GPS] Failed to start watchPosition:', e);
      tryNetworkFallback();
    }
  }, [resolveAddress, tryNetworkFallback]);

  // Clean up watcher when modal closes or unmounts
  useEffect(() => {
    if (open) {
      fetchToday();
      startRealtimeTracking(false);
    } else {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [open, fetchToday, startRealtimeTracking]);

  // ── Helper to acquire instantaneous fresh coordinates for Punch Out ───────
  const getInstantCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(gps);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            isNetwork: false,
          });
        },
        () => resolve(gps),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
      );
    });
  };

  // ── Punch In ──────────────────────────────────────────────────────────────
  const handlePunchIn = async () => {
    if (!gps) return toast.error('GPS location required. Please allow location access.');
    if (mode === 'FIELD' && !fieldForm.purpose) return toast.error('Please enter the purpose of field visit.');
    setActionLoading(true);
    try {
      const res = await hrmsService.punchIn({
        latitude: gps.latitude,
        longitude: gps.longitude,
        accuracy: gps.accuracy,
        address,
        workMode: mode,
        fieldDetails: mode === 'FIELD' ? fieldForm : {},
      });
      toast.success(res.message || 'Punched in successfully!');
      await fetchToday();
      onPunchChange?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to punch in');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Punch Out ─────────────────────────────────────────────────────────────
  const handlePunchOut = async () => {
    setActionLoading(true);
    try {
      // Get fresh coordinates at punch out
      const freshGps = await getInstantCoordinates();
      let outLat = freshGps?.latitude || gps?.latitude;
      let outLng = freshGps?.longitude || gps?.longitude;
      let outAddr = '';

      if (outLat && outLng) {
        try {
          const res = await hrmsService.reverseGeocode(outLat, outLng);
          if (res?.address) outAddr = res.address;
        } catch {
          // ignore
        }
      }

      const res = await hrmsService.punchOut({
        latitude: outLat,
        longitude: outLng,
        accuracy: freshGps?.accuracy || gps?.accuracy,
        address: outAddr,
      });

      toast.success(res.message || 'Punched out successfully!');
      await fetchToday();
      onPunchChange?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to punch out');
    } finally {
      setActionLoading(false);
    }
  };

  const geofenceOk = todayData?.record?.checkInLocation?.isWithinGeofence;
  const distanceMeters = todayData?.record?.checkInLocation?.distanceMeters;
  const accuracyDetails = gps ? getGPSAccuracyDetails(gps.accuracy) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Attendance" description="">
      <div className="flex flex-col gap-4 px-1 py-2">
        {/* ── Header Clock ── */}
        <div className="text-center space-y-0.5">
          <div className="text-3xl font-bold font-mono text-[var(--color-text-primary)] tabular-nums">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* ── Active Shift Timer (when punched in) ── */}
        {isPunchedIn && checkInTime && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-emerald-400 font-semibold text-sm">Shift Active</span>
              <Badge className="text-[10px] bg-emerald-500/20 border-emerald-500/30 text-emerald-300">
                {todayData?.record?.workMode === 'FIELD' ? '🚗 Field' : '🏢 Office'}
              </Badge>
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-300 tabular-nums">
              {formatDuration(elapsed)}
            </div>
            <p className="text-[11px] text-emerald-400/80">
              Checked in at {formatTime(checkInTime)} &bull; {workplace?.name}
            </p>
            {geofenceOk === false && (
              <p className="text-[10.5px] text-amber-400 flex items-center justify-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {distanceMeters}m from workplace (outside geofence)
              </p>
            )}
          </div>
        )}

        {/* ── Real-Time GPS Status & Live Map Box ── */}
        <div className="rounded-xl border border-surface-3 bg-surface-2/60 px-3 py-2.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold">
              {gpsState === 'ready' ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              ) : gpsState === 'denied' ? (
                <WifiOff className="h-3.5 w-3.5 text-red-400" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
              )}
              <span>
                {gpsState === 'ready' && (gps?.isNetwork ? 'Network Location' : 'Live GPS Tracking')}
                {gpsState === 'denied' && 'GPS Access Denied'}
                {gpsState === 'detecting' && 'Acquiring Real-Time GPS...'}
                {gpsState === 'idle' && 'GPS Idle'}
              </span>

              {accuracyDetails && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${accuracyDetails.badgeBg}`}>
                  {gps?.accuracy ? `±${Math.round(gps.accuracy)}m` : ''} {accuracyDetails.label}
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={isCalibrating}
              onClick={() => startRealtimeTracking(false)}
              className="flex items-center gap-1 text-[11px] text-brand-400 hover:text-brand-300 font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isCalibrating ? 'animate-spin' : ''}`} />
              <span>{isCalibrating ? 'Calibrating...' : 'Recalibrate GPS'}</span>
            </button>
          </div>

          {/* Reverse Geocoded Address */}
          {addressLoading && (
            <p className="text-[11px] text-[var(--color-text-tertiary)] animate-pulse flex items-center gap-1">
              <Compass className="h-3 w-3 animate-spin text-brand-400" />
              Resolving real-time address…
            </p>
          )}
          {address && !addressLoading && (
            <div className="text-[11px] text-[var(--color-text-secondary)] leading-snug flex items-start gap-1.5 bg-surface-1/50 p-2 rounded-lg border border-surface-3/60">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-brand-400" />
              <span className="font-medium text-[var(--color-text-primary)]">{address}</span>
            </div>
          )}

          {/* Real-time Map Pin with Live GPS Pin and Google Maps link */}
          {gps && gpsState === 'ready' && (
            <StaticMapPin
              lat={gps.latitude}
              lng={gps.longitude}
              accuracy={gps.accuracy}
              label="Y"
            />
          )}

          {/* GPS Access Denied Help Box */}
          {gpsState === 'denied' && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs space-y-2">
              <p className="text-[11px] text-red-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                Browser location access denied or unavailable. Please enable location permissions in your browser or device settings.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startRealtimeTracking(false)}
                  className="h-7 text-xs px-2.5"
                >
                  <LocateFixed className="h-3 w-3 mr-1" />
                  Retry GPS
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => startRealtimeTracking(true)}
                  className="h-7 text-xs px-2.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/30"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Use Network IP (Approximate)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Workplace Info ── */}
        {workplace && (
          <div className="rounded-lg border border-surface-3 bg-surface-2/40 px-3 py-2 text-xs flex items-start gap-2">
            <Building2 className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">{workplace.name}</p>
              <p className="text-[var(--color-text-secondary)]">{workplace.address || 'No address set'}</p>
              <p className="text-[var(--color-text-tertiary)] mt-0.5">Geofence: {workplace.geofenceRadiusMeters}m radius</p>
            </div>
          </div>
        )}

        {/* ── Work Mode Selector (only when not punched in) ── */}
        {!isPunchedIn && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Work Mode
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('OFFICE')}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'OFFICE'
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-surface-3 bg-surface-2/40 text-[var(--color-text-secondary)] hover:border-surface-4'
                }`}
              >
                <Building2 className="h-4 w-4" />
                Office / Store
              </button>
              <button
                type="button"
                onClick={() => setMode('FIELD')}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                  mode === 'FIELD'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                    : 'border-surface-3 bg-surface-2/40 text-[var(--color-text-secondary)] hover:border-surface-4'
                }`}
              >
                <Car className="h-4 w-4" />
                Field Visit
              </button>
            </div>

            {/* Field Visit Form */}
            {mode === 'FIELD' && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2.5">
                <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Field Visit Details
                </p>
                <div className="space-y-1">
                  <Label className="text-xs">Client / Dealer Name <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="e.g. ABC Motors, Dealer Name"
                    value={fieldForm.clientName}
                    onChange={(e) => setFieldForm((f) => ({ ...f, clientName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Site / Location Name</Label>
                  <Input
                    placeholder="e.g. Pune Service Center"
                    value={fieldForm.siteName}
                    onChange={(e) => setFieldForm((f) => ({ ...f, siteName: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Purpose of Visit <span className="text-red-400">*</span></Label>
                  <Input
                    placeholder="e.g. Sales demo, Service follow-up, Training"
                    value={fieldForm.purpose}
                    onChange={(e) => setFieldForm((f) => ({ ...f, purpose: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Remarks (optional)</Label>
                  <Input
                    placeholder="Any extra notes"
                    value={fieldForm.remarks}
                    onChange={(e) => setFieldForm((f) => ({ ...f, remarks: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Punch In / Out Button ── */}
        {isPunchedIn ? (
          <Button
            onClick={handlePunchOut}
            disabled={actionLoading}
            className="w-full h-12 text-base font-bold rounded-xl bg-red-500 hover:bg-red-600 text-white shadow-md transition-all"
          >
            {actionLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <X className="h-5 w-5 mr-2" />}
            Punch Out
          </Button>
        ) : (
          <Button
            onClick={handlePunchIn}
            disabled={actionLoading || gpsState !== 'ready'}
            className="w-full h-12 text-base font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-5 w-5 mr-2" />
            )}
            {mode === 'FIELD' ? '🚗 Punch In (Field Visit)' : '🏢 Punch In (Office)'}
          </Button>
        )}

        {/* ── Today's Record Summary ── */}
        {todayData?.record && (
          <div className="rounded-xl border border-surface-3 bg-surface-2/40 px-3 py-2.5 text-xs space-y-1.5">
            <p className="font-semibold text-[var(--color-text-primary)] uppercase tracking-wider text-[10.5px]">Today's Record</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[var(--color-text-tertiary)]">Check In</p>
                <p className="font-semibold text-[var(--color-text-primary)]">{todayData.record.checkIn || '--'}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Check Out</p>
                <p className="font-semibold text-[var(--color-text-primary)]">{todayData.record.checkOut || '--'}</p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Total</p>
                <p className="font-semibold text-emerald-400">{todayData.record.totalHours || 0} hrs</p>
              </div>
            </div>
            {todayData.record.checkInLocation?.address && (
              <p className="text-[var(--color-text-tertiary)] flex items-start gap-1 leading-snug">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                {todayData.record.checkInLocation.address}
              </p>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
}
