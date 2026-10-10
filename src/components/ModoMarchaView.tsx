import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Fuel,
  Gauge,
  ChevronDown,
  RotateCcw,
  Save,
  Plus,
  Sliders,
  CheckCircle2,
  Trash2,
  Clock,
  Navigation,
  BarChart3,
  TrendingUp,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  AlertOctagon,
  Bell,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  Sun,
  Activity,
  Snowflake,
  Car,
  Settings,
  HelpCircle,
  User,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { CountryCode, DATA_PAIS } from '../utils/countryData';
import { saveCloudRecord, saveCloudVehicleConfig } from '../utils/firestoreService';
import { clearSupabaseTrips, signOutSupabase } from '../utils/supabaseClient';
import { UserAccountModal } from './UserAccountModal';
import { VehicleType, TransmissionType } from '../types';
import {
  UNIFIED_VEHICLE_CATALOG,
  UnifiedEngineSpec,
  UnifiedVehicleCategory,
  getActiveVehicleState,
  saveActiveVehicleState,
} from '../utils/vehicleCatalog';
import {
  Sedan3D,
  Suv3D,
  Compacto3D,
  Pickup3D,
  Van3D,
  Custom3D,
} from './Vehicle3DIcons';

export type TimeFilterPeriod = 'DIA' | 'SEMANA' | 'MES' | 'ANO';
export type FuelKey = 'Gasolina Pb95' | 'Diésel ON' | 'Gas LPG';

export interface FuelTankData {
  balance: number;
  liters: number;
  lastRefuelAmount?: number;
  lastRefuelPrice?: number;
  lastRefuelDate?: string;
}

export type FuelTankMap = Record<FuelKey, FuelTankData>;

interface ModoMarchaViewProps {
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  onOpenHistory?: () => void;
  currentUser?: any;
}

export interface ViajeRegistro {
  id: string | number;
  timestamp: string;
  date?: string;
  km: number;
  litros: number;
  costo: number;
  combustible: string;
  precioLitro: number;
  moneda: string;
  pais: string;
  durationSeconds?: number;
  movingSeconds?: number;
  idleSeconds?: number;
  vehicleType?: string;
  isACActive?: boolean;
}

const VEHICLE_PRESETS: UnifiedVehicleCategory[] = Object.values(UNIFIED_VEHICLE_CATALOG);

export const ModoMarchaView: React.FC<ModoMarchaViewProps> = ({
  selectedCountry,
  onCountryChange,
  currentUser,
}) => {
  const defaultPrices: Record<CountryCode, Record<FuelKey, number>> = {
    PL: { 'Gasolina Pb95': 6.09, 'Diésel ON': 6.15, 'Gas LPG': 2.89 },
    CO: { 'Gasolina Pb95': 3900, 'Diésel ON': 4100, 'Gas LPG': 2500 },
    ES: { 'Gasolina Pb95': 1.58, 'Diésel ON': 1.45, 'Gas LPG': 0.95 },
    MX: { 'Gasolina Pb95': 23.80, 'Diésel ON': 24.50, 'Gas LPG': 12.80 },
  };

  const currencySymbols: Record<CountryCode, string> = {
    PL: 'PLN',
    CO: 'COP',
    ES: 'EUR',
    MX: 'MXN',
  };

  const currency = currencySymbols[selectedCountry] || 'PLN';

  // ---------------- VEHICLE & ENGINE CALIBRATION STATE ----------------
  const [vehicleType, setVehicleType] = useState<VehicleType>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_active_vehicle_type');
      if (stored) return stored as VehicleType;
    } catch (_) {}
    return 'sedan';
  });

  const [engineName, setEngineName] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_active_engine_name');
      if (stored) return stored;
    } catch (_) {}
    return '1.8L / 2.0L Estándar';
  });

  const [baseConsumptionL100, setBaseConsumptionL100] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_active_base_l100');
      if (stored) {
        const val = parseFloat(stored);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch (_) {}
    return 8.5;
  });

  const [transmission, setTransmission] = useState<TransmissionType>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_active_transmission');
      if (stored === 'automatic' || stored === 'manual') return stored as TransmissionType;
    } catch (_) {}
    return 'manual';
  });

  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [modalTempVehicleType, setModalTempVehicleType] = useState<VehicleType>(vehicleType);
  const [modalTempEngineName, setModalTempEngineName] = useState<string>(engineName);
  const [modalTempBaseL100, setModalTempBaseL100] = useState<number>(baseConsumptionL100);
  const [modalTempTransmission, setModalTempTransmission] = useState<TransmissionType>(transmission);
  const [modalTempVehicleModelName, setModalTempVehicleModelName] = useState<string>(() => {
    return localStorage.getItem('litrometrik_user_vehicle_model') || '';
  });

  const renderMarchaVehicle3D = (type: string, size = 36) => {
    if (type === 'sedan') return <Sedan3D size={size} />;
    if (type === 'suv') return <Suv3D size={size} />;
    if (type === 'compact') return <Compacto3D size={size} />;
    if (type === 'pickup') return <Pickup3D size={size} />;
    if (type === 'van') return <Van3D size={size} />;
    return <Custom3D size={size} />;
  };

  useEffect(() => {
    const handleVehicleSync = () => {
      const state = getActiveVehicleState();
      setVehicleType(state.vehicleType);
      setEngineName(state.engineName);
      setBaseConsumptionL100(state.baseL100);
      setTransmission(state.transmission);
    };
    window.addEventListener('litrometrik-vehicle-updated', handleVehicleSync);
    window.addEventListener('storage', handleVehicleSync);
    return () => {
      window.removeEventListener('litrometrik-vehicle-updated', handleVehicleSync);
      window.removeEventListener('storage', handleVehicleSync);
    };
  }, []);

  // ---------------- FUNCTIONAL AIRE ACONDICIONADO (A/C) STATE ----------------
  const [isACActive, setIsACActive] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_active_ac');
      if (stored !== null) return stored === 'true';
    } catch (_) {}
    return false;
  });

  // A/C dynamic consumption impact based on vehicle category
  const acAddonAmount = useMemo(() => {
    if (vehicleType === 'compact') return 0.5;
    if (vehicleType === 'suv') return 0.8;
    return 0.6; // Estándar +0.6 L/100km directo según imagen 2
  }, [vehicleType]);

  const toggleAC = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(22);
      } catch (_) {}
    }
    const nextState = !isACActive;
    setIsACActive(nextState);
    try {
      localStorage.setItem('litrometrik_active_ac', nextState.toString());
    } catch (_) {}
    setNotification(
      nextState
        ? `❄️ Aire A/C Encendido (+${acAddonAmount.toFixed(1)} L/100km)`
        : '💨 Aire A/C Apagado (Modo Eco)'
    );
    setTimeout(() => setNotification(null), 2500);
  };

  // ---------------- DUAL FUEL SYSTEM & UNIFIED GLOBAL PRICES (SINGLE SOURCE OF TRUTH) ----------------
  const getStoredFuelPrices = (country: CountryCode): Record<FuelKey, number> => {
    const defaults = defaultPrices[country] || {
      'Gasolina Pb95': 6.09,
      'Diésel ON': 6.15,
      'Gas LPG': 2.89,
    };
    try {
      const storedJson = localStorage.getItem(`litrometrik_fuel_prices_${country}`);
      if (storedJson) {
        const parsed = JSON.parse(storedJson);
        const lpgVal = typeof parsed['Gas LPG'] === 'number' && parsed['Gas LPG'] > 0
          ? parsed['Gas LPG']
          : typeof parsed['Gas GLP / LPG'] === 'number' && parsed['Gas GLP / LPG'] > 0
          ? parsed['Gas GLP / LPG']
          : defaults['Gas LPG'];
        return {
          'Gasolina Pb95': typeof parsed['Gasolina Pb95'] === 'number' && parsed['Gasolina Pb95'] > 0 ? parsed['Gasolina Pb95'] : defaults['Gasolina Pb95'],
          'Diésel ON': typeof parsed['Diésel ON'] === 'number' && parsed['Diésel ON'] > 0 ? parsed['Diésel ON'] : defaults['Diésel ON'],
          'Gas LPG': lpgVal,
        };
      }
      // Check legacy individual keys
      const g = parseFloat(localStorage.getItem(`fuel_price_${country}_Gasolina Pb95`) || '');
      const d = parseFloat(localStorage.getItem(`fuel_price_${country}_Diésel ON`) || '');
      const l = parseFloat(localStorage.getItem(`fuel_price_${country}_Gas LPG`) || localStorage.getItem(`fuel_price_${country}_Gas GLP / LPG`) || '');
      return {
        'Gasolina Pb95': (!isNaN(g) && g > 0) ? g : defaults['Gasolina Pb95'],
        'Diésel ON': (!isNaN(d) && d > 0) ? d : defaults['Diésel ON'],
        'Gas LPG': (!isNaN(l) && l > 0) ? l : defaults['Gas LPG'],
      };
    } catch (_) {}
    return defaults;
  };

  const [activeFuel, setActiveFuel] = useState<FuelKey>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_active_fuel');
      if (stored === 'Gas LPG' || stored === 'Gasolina Pb95' || stored === 'Diésel ON') {
        return stored as FuelKey;
      }
      if (stored === 'Gas GLP / LPG' || stored === 'GLP') {
        return 'Gas LPG';
      }
    } catch (_) {}
    return 'Gas LPG';
  });

  const [fuelPrices, setFuelPrices] = useState<Record<FuelKey, number>>(() => {
    return getStoredFuelPrices(selectedCountry);
  });

  const [fuelPrice, setFuelPrice] = useState<number>(() => {
    const prices = getStoredFuelPrices(selectedCountry);
    return prices[activeFuel] || defaultPrices[selectedCountry]?.[activeFuel] || 2.89;
  });

  // ---------------- DRIVING STATE & LIVE TELEMETRY ----------------
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return !!JSON.parse(saved).isRunning;
    } catch (_) {}
    return false;
  });
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Live Telemetry
  const [distanceKm, setDistanceKm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return JSON.parse(saved).distanceKm || 0;
    } catch (_) {}
    return 0;
  });
  const [liveLiters, setLiveLiters] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return JSON.parse(saved).liveLiters || 0;
    } catch (_) {}
    return 0;
  });
  const [liveCost, setLiveCost] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return JSON.parse(saved).liveCost || 0;
    } catch (_) {}
    return 0;
  });

  // Re-sync prices when country changes
  useEffect(() => {
    const updated = getStoredFuelPrices(selectedCountry);
    setFuelPrices(updated);
    const p = updated[activeFuel] || defaultPrices[selectedCountry]?.[activeFuel] || 2.89;
    setFuelPrice(p);
  }, [selectedCountry, activeFuel]);

  // Synchronize global price updates from other components
  useEffect(() => {
    const handlePricesUpdated = (e: any) => {
      if (e?.detail?.country === selectedCountry) {
        const nextPrices = getStoredFuelPrices(selectedCountry);
        setFuelPrices(nextPrices);
        if (e.detail.fuel === activeFuel && typeof e.detail.price === 'number') {
          setFuelPrice(e.detail.price);
          fuelPriceRef.current = e.detail.price;
          setLiveCost((prevCost) => Math.round(liveLiters * e.detail.price * 100) / 100);
        }
      }
    };
    window.addEventListener('litrometrik-prices-updated', handlePricesUpdated);
    return () => window.removeEventListener('litrometrik-prices-updated', handlePricesUpdated);
  }, [selectedCountry, activeFuel, liveLiters]);

  // Unified global price updater (Updates single source of truth, localStorage and active telemetry)
  const updateGlobalFuelPrice = (targetFuel: FuelKey, newPrice: number) => {
    const validPrice = Math.max(0.01, Math.round(newPrice * 100) / 100);
    const nextPrices = {
      ...fuelPrices,
      [targetFuel]: validPrice,
    };
    setFuelPrices(nextPrices);

    try {
      localStorage.setItem(`litrometrik_fuel_prices_${selectedCountry}`, JSON.stringify(nextPrices));
      localStorage.setItem(`fuel_price_${selectedCountry}_${targetFuel}`, validPrice.toString());
      if (targetFuel === activeFuel) {
        localStorage.setItem('fuel_price_per_liter', validPrice.toString());
      }
    } catch (_) {}

    if (targetFuel === activeFuel) {
      setFuelPrice(validPrice);
      fuelPriceRef.current = validPrice;
      setLiveCost(Math.round(liveLiters * validPrice * 100) / 100);
    }

    const uid = currentUser?.uid;
    if (uid && uid !== 'guest' && uid !== 'guest_user') {
      try {
        saveCloudVehicleConfig(uid, {
          fuelPricePerLiter: validPrice,
          fuelPrices: nextPrices,
          lastFuelType: targetFuel,
        });
      } catch (_) {}
    }

    window.dispatchEvent(
      new CustomEvent('litrometrik-prices-updated', {
        detail: { country: selectedCountry, fuel: targetFuel, price: validPrice },
      })
    );
    window.dispatchEvent(new Event('fuel-storage-updated'));
  };

  // Modals for Fuel Change with Safe Segment Saving
  const [showFuelPickerModal, setShowFuelPickerModal] = useState<boolean>(false);
  const [showSaveSegmentConfirmModal, setShowSaveSegmentConfirmModal] = useState<boolean>(false);
  const [pendingFuelTarget, setPendingFuelTarget] = useState<FuelKey | null>(null);
  const [pendingFuelPriceInput, setPendingFuelPriceInput] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.startTime) {
          const add = Math.floor((Date.now() - parsed.startTime) / 1000);
          return (parsed.accumulatedSeconds || 0) + add;
        }
        return parsed.accumulatedSeconds || 0;
      }
    } catch (_) {}
    return 0;
  });

  const [movingSeconds, setMovingSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return JSON.parse(saved).movingSeconds || 0;
    } catch (_) {}
    return 0;
  });
  const [idleSeconds, setIdleSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return JSON.parse(saved).idleSeconds || 0;
    } catch (_) {}
    return 0;
  });

  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [currentGpsCoords, setCurrentGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  // ---------------- MULTI-FUEL TANK BALANCE & DEDUCTION SYSTEM ----------------
  const getDefaultTanks = (country: CountryCode, prices: Record<FuelKey, number>): FuelTankMap => {
    const pLpg = prices['Gas LPG'] || defaultPrices[country]['Gas LPG'] || 2.89;
    const pGas = prices['Gasolina Pb95'] || defaultPrices[country]['Gasolina Pb95'] || 6.09;
    const pDie = prices['Diésel ON'] || defaultPrices[country]['Diésel ON'] || 6.15;
    if (country === 'CO') {
      return {
        'Gasolina Pb95': { balance: 120000, liters: Math.round((120000 / pGas) * 100) / 100 },
        'Gas LPG': { balance: 80000, liters: Math.round((80000 / pLpg) * 100) / 100 },
        'Diésel ON': { balance: 130000, liters: Math.round((130000 / pDie) * 100) / 100 },
      };
    } else if (country === 'ES') {
      return {
        'Gasolina Pb95': { balance: 50.00, liters: Math.round((50 / pGas) * 100) / 100 },
        'Gas LPG': { balance: 35.00, liters: Math.round((35 / pLpg) * 100) / 100 },
        'Diésel ON': { balance: 55.00, liters: Math.round((55 / pDie) * 100) / 100 },
      };
    } else if (country === 'MX') {
      return {
        'Gasolina Pb95': { balance: 750.00, liters: Math.round((750 / pGas) * 100) / 100 },
        'Gas LPG': { balance: 450.00, liters: Math.round((450 / pLpg) * 100) / 100 },
        'Diésel ON': { balance: 800.00, liters: Math.round((800 / pDie) * 100) / 100 },
      };
    } else {
      // PL
      return {
        'Gasolina Pb95': { balance: 150.00, liters: Math.round((150 / pGas) * 100) / 100 },
        'Gas LPG': { balance: 114.38, liters: Math.round((114.38 / pLpg) * 100) / 100 },
        'Diésel ON': { balance: 160.00, liters: Math.round((160 / pDie) * 100) / 100 },
      };
    }
  };

  const [fuelTanks, setFuelTanks] = useState<FuelTankMap>(() => {
    try {
      const stored = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const def = getDefaultTanks(selectedCountry, defaultPrices[selectedCountry]);
        return {
          'Gasolina Pb95': parsed['Gasolina Pb95'] || def['Gasolina Pb95'],
          'Gas LPG': parsed['Gas LPG'] || parsed['Gas GLP / LPG'] || def['Gas LPG'],
          'Diésel ON': parsed['Diésel ON'] || def['Diésel ON'],
        };
      }
      // Check legacy single-tank balance
      const legacyBal = parseFloat(
        localStorage.getItem('litrometrik_base_fuel_balance_pln') ||
        localStorage.getItem('litrometrik_fuel_balance_pln') ||
        '114.38'
      );
      const def = getDefaultTanks(selectedCountry, defaultPrices[selectedCountry]);
      if (!isNaN(legacyBal) && legacyBal > 0) {
        def['Gas LPG'].balance = legacyBal;
      }
      return def;
    } catch (_) {}
    return getDefaultTanks(selectedCountry, defaultPrices[selectedCountry]);
  });

  // Re-sync tanks when country changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const def = getDefaultTanks(selectedCountry, fuelPrices);
        setFuelTanks({
          'Gasolina Pb95': parsed['Gasolina Pb95'] || def['Gasolina Pb95'],
          'Gas LPG': parsed['Gas LPG'] || parsed['Gas GLP / LPG'] || def['Gas LPG'],
          'Diésel ON': parsed['Diésel ON'] || def['Diésel ON'],
        });
      } else {
        setFuelTanks(getDefaultTanks(selectedCountry, fuelPrices));
      }
    } catch (_) {}
  }, [selectedCountry]);

  // Reactive Tank Deductions for active fuel (No negative numbers)
  const activeBaseBalance = fuelTanks[activeFuel]?.balance ?? 114.38;
  const currentFuelBalance = useMemo(() => {
    return Math.max(0, Math.round((activeBaseBalance - liveCost) * 100) / 100);
  }, [activeBaseBalance, liveCost]);

  const activeTankVolumeLiters = useMemo(() => {
    const tankLit = fuelTanks[activeFuel]?.liters;
    if (typeof tankLit === 'number' && tankLit > 0) {
      return tankLit;
    }
    return fuelPrice > 0 ? activeBaseBalance / fuelPrice : 0;
  }, [fuelTanks, activeFuel, activeBaseBalance, fuelPrice]);

  const currentRemainingLiters = useMemo(() => {
    return Math.max(0, Math.round((activeTankVolumeLiters - liveLiters) * 100) / 100);
  }, [activeTankVolumeLiters, liveLiters]);

  // Dynamic Fuel Tank Reserve Alert (< 15% volume or <= 30 PLN / proportional)
  const tankCapacity = 50;
  const isReserveActive = useMemo(() => {
    return (
      currentFuelBalance <= (selectedCountry === 'CO' ? 25000 : selectedCountry === 'MX' ? 100 : 30) ||
      currentRemainingLiters <= tankCapacity * 0.15 ||
      currentFuelBalance === 0 ||
      currentRemainingLiters === 0
    );
  }, [currentFuelBalance, currentRemainingLiters, selectedCountry]);

  // Haptic feedback when entering fuel reserve
  const lastReserveHapticRef = useRef<number>(0);
  useEffect(() => {
    if (isReserveActive && isRunning) {
      const now = Date.now();
      if (now - lastReserveHapticRef.current > 35000) {
        lastReserveHapticRef.current = now;
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch (_) {}
        }
      }
    }
  }, [isReserveActive, isRunning]);

  // Sync discounted balance and tanks map to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(fuelTanks));
      localStorage.setItem('litrometrik_fuel_balance_pln', currentFuelBalance.toFixed(2));
      localStorage.setItem('fuel_balance_pln', currentFuelBalance.toFixed(2));
      localStorage.setItem('currentFuelBalancePLN', currentFuelBalance.toFixed(2));
      localStorage.setItem('litrometrik_base_fuel_balance_pln', activeBaseBalance.toFixed(2));
      window.dispatchEvent(new Event('fuel-storage-updated'));
    } catch (_) {}
  }, [fuelTanks, currentFuelBalance, activeBaseBalance, selectedCountry]);

  // Initialize GPS on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          if (!lastLocationRef.current) {
            lastLocationRef.current = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: Date.now(),
            };
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Modals for Refuel and Adjust
  const [showRefuelModal, setShowRefuelModal] = useState(false);
  const [refuelFuelType, setRefuelFuelType] = useState<FuelKey>(activeFuel);
  const [refuelAmountInput, setRefuelAmountInput] = useState('');
  const [refuelPriceInput, setRefuelPriceInput] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustBalanceInput, setAdjustBalanceInput] = useState('');
  const [adjustLitersInput, setAdjustLitersInput] = useState('');

  const handleSelectRefuelFuel = (fuel: FuelKey) => {
    setRefuelFuelType(fuel);
    const p = fuelPrices[fuel] || defaultPrices[selectedCountry]?.[fuel] || 6.09;
    setRefuelPriceInput(p.toFixed(2));
  };

  // Toast Notification
  const [notification, setNotification] = useState<string | null>(null);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showUserAccountModal, setShowUserAccountModal] = useState(false);

  // Clear history and reset the 4 telemetry fields to 0,00
  const handleClearHistoryAndTelemetry = async () => {
    const confirmClear = window.confirm(
      '¿Deseas eliminar todo el historial y reiniciar los 4 campos de telemetría a 0,00?'
    );
    if (!confirmClear) return;

    // 1. Reset telemetry values to 0
    setDistanceKm(0);
    setLiveLiters(0);
    setLiveCost(0);
    setElapsedSeconds(0);
    setMovingSeconds(0);
    setIdleSeconds(0);
    setCurrentSpeed(0);
    setIsRunning(false);
    setIsACActive(false);

    // 2. Clear stored active trip
    try {
      localStorage.removeItem('litrometrik_active_trip');
      localStorage.removeItem('historial_viajes');
      localStorage.removeItem('fuel_trips_pln');
    } catch (_) {}

    // 3. Clear local historial state
    setHistorialViajes([]);

    // 4. Clear Supabase database if logged in
    const uid = currentUser?.uid || currentUser?.id;
    if (uid && uid !== 'guest' && uid !== 'guest_user') {
      try {
        await clearSupabaseTrips(uid);
      } catch (err) {
        console.warn('Error clearing Supabase trips:', err);
      }
    }

    // 5. Broadcast events to synchronize with other tabs and dashboard
    window.dispatchEvent(new CustomEvent('litrometrik-clear-history'));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('fuel-storage-updated'));

    setNotification('🗑️ Historial eliminado. Telemetría y los 4 campos restablecidos a 0,00.');
    setTimeout(() => setNotification(null), 3500);
  };

  // Speed Limit and Safety
  const [speedLimit, setSpeedLimit] = useState<number>(() => {
    const stored = localStorage.getItem('litrometrik_speed_limit');
    return stored ? parseInt(stored, 10) : 80;
  });
  const [soundAlertsEnabled] = useState<boolean>(true);
  const [driverAlert, setDriverAlert] = useState<{
    id: number;
    type: 'speed' | 'consumption' | 'reserve';
    title: string;
    message: string;
  } | null>(null);

  const lastSpeedAlertRef = useRef<number>(0);
  const lastConsumptionAlertRef = useRef<number>(0);
  const prevSpeedRef = useRef<number>(0);

  const playDriverAlertChime = (type: 'speed' | 'consumption' | 'reserve') => {
    if (!soundAlertsEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'speed') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.12);
      } else if (type === 'reserve') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.setValueAtTime(780, ctx.currentTime + 0.12);
      }
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (_) {}
  };

  const triggerDriverAlert = (type: 'speed' | 'consumption' | 'reserve', title: string, message: string) => {
    setDriverAlert({ id: Date.now(), type, title, message });
    playDriverAlertChime(type);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'speed') navigator.vibrate([140, 60, 140]);
        else if (type === 'reserve') navigator.vibrate([100, 50, 100]);
        else navigator.vibrate([90, 40, 90]);
      } catch (_) {}
    }
  };

  // Period filter for Chart & History
  const [filtroPeriodo, setFiltroPeriodo] = useState<TimeFilterPeriod>('DIA');
  const [historialViajes, setHistorialViajes] = useState<ViajeRegistro[]>(() => {
    try {
      const stored = localStorage.getItem('historial_viajes');
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return [];
  });

  // Sync price when country or activeFuel changes
  useEffect(() => {
    const p = defaultPrices[selectedCountry]?.[activeFuel] || 6.09;
    setFuelPrice(p);
  }, [selectedCountry, activeFuel]);

  // Synchronize storage
  useEffect(() => {
    const handleStorageSync = () => {
      try {
        const storedTanks = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
        if (storedTanks) {
          setFuelTanks(JSON.parse(storedTanks));
        }
        const storedTrips = localStorage.getItem('historial_viajes');
        if (storedTrips) {
          setHistorialViajes(JSON.parse(storedTrips));
        }
      } catch (_) {}
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('fuel-storage-updated', handleStorageSync);
    window.addEventListener('litrometrik-records-updated', handleStorageSync);
    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('fuel-storage-updated', handleStorageSync);
      window.removeEventListener('litrometrik-records-updated', handleStorageSync);
    };
  }, []);

  // Format MM:SS for Cronómetro
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Hardware & Telemetry Engine Refs
  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedSecondsRef = useRef<number>(0);
  const lastTickTimeRef = useRef<number>(Date.now());
  const wakeLockSentinelRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);

  // Sync refs for background calculations
  const isRunningRef = useRef<boolean>(isRunning);
  const currentSpeedRef = useRef<number>(currentSpeed);
  const activeFuelRef = useRef<FuelKey>(activeFuel);
  const fuelPriceRef = useRef<number>(fuelPrice);
  const isACActiveRef = useRef<boolean>(isACActive);
  const acAddonAmountRef = useRef<number>(acAddonAmount);
  const baseConsumptionL100Ref = useRef<number>(baseConsumptionL100);
  const transmissionRef = useRef<TransmissionType>(transmission);
  const vehicleTypeRef = useRef<VehicleType>(vehicleType);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { currentSpeedRef.current = currentSpeed; }, [currentSpeed]);
  useEffect(() => { activeFuelRef.current = activeFuel; }, [activeFuel]);
  useEffect(() => { fuelPriceRef.current = fuelPrice; }, [fuelPrice]);
  useEffect(() => { isACActiveRef.current = isACActive; }, [isACActive]);
  useEffect(() => { acAddonAmountRef.current = acAddonAmount; }, [acAddonAmount]);
  useEffect(() => { baseConsumptionL100Ref.current = baseConsumptionL100; }, [baseConsumptionL100]);
  useEffect(() => { transmissionRef.current = transmission; }, [transmission]);
  useEffect(() => { vehicleTypeRef.current = vehicleType; }, [vehicleType]);

  // Persist active trip state
  useEffect(() => {
    try {
      localStorage.setItem(
        'litrometrik_active_trip',
        JSON.stringify({
          isRunning,
          distanceKm,
          liveLiters,
          liveCost,
          elapsedSeconds,
          movingSeconds,
          idleSeconds,
          activeFuel,
          isACActive,
          startTime: startTimeRef.current,
        })
      );
    } catch (_) {}
  }, [isRunning, distanceKm, liveLiters, liveCost, elapsedSeconds, movingSeconds, idleSeconds, activeFuel, isACActive]);

  // Screen Wake Lock API
  const requestWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockSentinelRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockSentinelRef.current.addEventListener('release', () => {
          wakeLockSentinelRef.current = null;
        });
      } catch (err) {
        console.warn('Wake Lock request warning:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockSentinelRef.current) {
      try {
        await wakeLockSentinelRef.current.release();
        wakeLockSentinelRef.current = null;
      } catch (_) {}
    }
  };

  useEffect(() => {
    if (isRunning) requestWakeLock();
    else releaseWakeLock();
    return () => { releaseWakeLock(); };
  }, [isRunning]);

  // Background Web Worker Engine Tick with Dynamic Vehicle & A/C Sync
  const handleEngineTick = (deltaSec: number) => {
    if (!isRunningRef.current) return;
    if (deltaSec <= 0 || isNaN(deltaSec)) return;

    setElapsedSeconds((prev) => prev + deltaSec);

    const speed = currentSpeedRef.current;
    const isIdle = speed < 3;
    const isLpg = activeFuelRef.current === 'Gas LPG';
    const isDiesel = activeFuelRef.current === 'Diésel ON';
    const isAC = isACActiveRef.current;

    if (isIdle) {
      // RALENTÍ / DETENIDO (Semáforos, tráfico, paradas)
      setIdleSeconds((prev) => prev + deltaSec);

      // Base idle per vehicle category
      const baseIdleRate =
        vehicleTypeRef.current === 'compact' ? 0.70 :
        vehicleTypeRef.current === 'suv' ? 1.10 : 0.85;

      const fuelFactor = isLpg ? 1.18 : isDiesel ? 0.85 : 1.0;
      // Compressor A/C adds +0.20 L/h load in idle
      const acIdleAdd = isAC ? 0.20 : 0.0;
      const idleRatePerHour = (baseIdleRate * fuelFactor) + acIdleAdd;
      const idleBurnedLiters = (idleRatePerHour / 3600) * deltaSec;

      setLiveLiters((prevL) => {
        const nextL = prevL + idleBurnedLiters;
        setLiveCost(nextL * fuelPriceRef.current);
        return nextL;
      });
    } else {
      // EN MOVIMIENTO
      setMovingSeconds((prev) => prev + deltaSec);
    }
  };

  // Web Worker setup
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        const worker = new Worker('/telemetry-worker.js');
        workerRef.current = worker;
        worker.onmessage = (e) => {
          if (e.data?.type === 'TICK') {
            const deltaMs = e.data.deltaMs || 1000;
            const deltaSec = deltaMs / 1000;
            lastTickTimeRef.current = e.data.timestamp || Date.now();
            handleEngineTick(deltaSec);
          }
        };
      } catch (err) {
        console.warn('Telemetry Web Worker init error:', err);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Visibility Change Reconciliation
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        if (isRunning) {
          await requestWakeLock();
          const now = Date.now();
          const deltaSec = (now - lastTickTimeRef.current) / 1000;
          if (deltaSec > 1.2) {
            handleEngineTick(deltaSec);
          }
          lastTickTimeRef.current = now;
          workerRef.current?.postMessage({ action: 'SYNC' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Start / Pause Driving
  const toggleMarcha = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(18); } catch (_) {}
    }

    if (isRunning) {
      // Pause
      setIsRunning(false);
      setCurrentSpeed(0);
      startTimeRef.current = null;
      accumulatedSecondsRef.current = elapsedSeconds;

      workerRef.current?.postMessage({ action: 'STOP' });
      releaseWakeLock();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('litrometrik-speed-update', {
            detail: { speed: 0, distance: distanceKm, isRunning: false },
          })
        );
      }
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    } else {
      // Start Real Marcha
      setIsRunning(true);
      setGpsError(null);
      startTimeRef.current = Date.now();
      lastTickTimeRef.current = Date.now();
      accumulatedSecondsRef.current = elapsedSeconds;

      workerRef.current?.postMessage({ action: 'START' });
      requestWakeLock();

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('litrometrik-speed-update', {
            detail: { speed: currentSpeed, distance: distanceKm, isRunning: true },
          })
        );
      }

      if (!workerRef.current) {
        timerIntervalRef.current = setInterval(() => {
          const now = Date.now();
          const deltaSec = (now - lastTickTimeRef.current) / 1000;
          lastTickTimeRef.current = now;
          handleEngineTick(deltaSec);
        }, 1000);
      }

      // Continuous high-accuracy GPS tracking
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const speedKmh = pos.coords.speed
              ? Math.max(0, Math.round(pos.coords.speed * 3.6))
              : 0;
            setCurrentSpeed(speedKmh);

            const now = Date.now();

            if (speedKmh > speedLimit && now - lastSpeedAlertRef.current > 15000) {
              lastSpeedAlertRef.current = now;
              triggerDriverAlert(
                'speed',
                '⚠️ ¡Límite de Velocidad Superado!',
                `Vas a ${speedKmh} km/h (Límite: ${speedLimit} km/h). Reduce la velocidad.`
              );
            }

            const speedDelta = speedKmh - prevSpeedRef.current;
            if (speedDelta >= 20 && now - lastConsumptionAlertRef.current > 20000) {
              lastConsumptionAlertRef.current = now;
              triggerDriverAlert(
                'consumption',
                '⚡ ¡Cambio Drástico de Consumo!',
                `Aceleración brusca detectada (+${speedDelta} km/h).`
              );
            }
            prevSpeedRef.current = speedKmh;

            let updatedKm = distanceKm;
            if (lastLocationRef.current) {
              const delta = calculateDistanceKm(
                lastLocationRef.current.lat,
                lastLocationRef.current.lng,
                pos.coords.latitude,
                pos.coords.longitude
              );

              if (delta > 0.003 && delta < 2.0) {
                setDistanceKm((prevKm) => {
                  const nextKm = prevKm + delta;
                  updatedKm = nextKm;

                  // Dynamic consumption factor based on selected vehicle, engine, transmission, fuel and A/C
                  const transMult = transmissionRef.current === 'automatic' ? 1.08 : 1.0;
                  const fuelMult =
                    activeFuelRef.current === 'Gas LPG' ? 1.20 :
                    activeFuelRef.current === 'Diésel ON' ? 0.85 : 1.0;
                  const acAdd = isACActiveRef.current ? acAddonAmountRef.current : 0.0;
                  const currentRateL100 = (baseConsumptionL100Ref.current * transMult * fuelMult) + acAdd;

                  const movingBurnedLiters = (delta * currentRateL100) / 100;

                  setLiveLiters((prevL) => {
                    const nextL = prevL + movingBurnedLiters;
                    setLiveCost(nextL * fuelPriceRef.current);
                    return nextL;
                  });
                  return nextKm;
                });
              }
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('litrometrik-speed-update', {
                  detail: { speed: speedKmh, distance: updatedKm, isRunning: true },
                })
              );
            }

            setCurrentGpsCoords({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });

            lastLocationRef.current = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: now,
            };
          },
          (err) => {
            console.warn('GPS location error:', err);
            setGpsError('⚠️ Permiso de ubicación requerido para calcular distancia.');
          },
          { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
        );
      } else {
        setGpsError('⚠️ Este dispositivo no soporta el sensor GPS.');
      }
    }
  };

  // Reset Tramo
  const handleResetTramo = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(14); } catch (_) {}
    }
    setFuelTanks((prev) => {
      const cur = prev[activeFuel] || { balance: 0, liters: 0 };
      const updated = {
        ...prev,
        [activeFuel]: { ...cur, balance: currentFuelBalance, liters: currentRemainingLiters },
      };
      try {
        localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    try {
      localStorage.setItem('litrometrik_base_fuel_balance_pln', currentFuelBalance.toString());
      localStorage.setItem('litrometrik_fuel_balance_pln', currentFuelBalance.toString());
    } catch (_) {}

    setDistanceKm(0);
    setLiveLiters(0);
    setLiveCost(0);
    setElapsedSeconds(0);
    setMovingSeconds(0);
    setIdleSeconds(0);
    setCurrentSpeed(0);

    setNotification('🔄 Tramo reiniciado a 0,00 km y 00:00');
    setTimeout(() => setNotification(null), 2500);
  };

  // Save Current Trip
  const handleSaveTrip = (customLabel?: string) => {
    if (distanceKm <= 0 && liveLiters <= 0) {
      alert('Debes desplazarte al menos unos metros para registrar el viaje.');
      return;
    }

    const tripRecord: ViajeRegistro = {
      id: `viaje_${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      km: parseFloat(distanceKm.toFixed(2)),
      litros: parseFloat(liveLiters.toFixed(3)),
      costo: parseFloat(liveCost.toFixed(2)),
      combustible: activeFuel,
      precioLitro: fuelPrice,
      moneda: currency,
      pais: selectedCountry,
      durationSeconds: Math.floor(elapsedSeconds),
      movingSeconds: Math.floor(movingSeconds),
      idleSeconds: Math.floor(idleSeconds),
      vehicleType,
      isACActive,
    };

    const updatedBalance = currentFuelBalance;
    setFuelTanks((prev) => {
      const cur = prev[activeFuel] || { balance: 0, liters: 0 };
      const updated = {
        ...prev,
        [activeFuel]: { ...cur, balance: updatedBalance, liters: currentRemainingLiters },
      };
      try {
        localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
    try {
      localStorage.setItem('litrometrik_base_fuel_balance_pln', updatedBalance.toString());
      localStorage.setItem('litrometrik_fuel_balance_pln', updatedBalance.toString());
    } catch (_) {}

    const updatedTrips = [tripRecord, ...historialViajes];
    setHistorialViajes(updatedTrips);
    localStorage.setItem('historial_viajes', JSON.stringify(updatedTrips));

    const uid = currentUser?.uid;
    if (uid && uid !== 'guest' && uid !== 'guest_user') {
      saveCloudRecord(uid, 'viajes', {
        ...tripRecord,
        routeName: customLabel || `Viaje en marcha (${distanceKm.toFixed(1)} km - ${activeFuel})`,
        distanceKm: tripRecord.km,
        totalCostPLN: tripRecord.costo,
        totalLiters: tripRecord.litros,
        createdAt: tripRecord.timestamp,
      });
      saveCloudVehicleConfig(uid, { fuelBalance: updatedBalance });
    }

    window.dispatchEvent(new Event('fuel-storage-updated'));
    window.dispatchEvent(new Event('storage'));

    handleResetTramo();
    setNotification(`✅ ¡Viaje guardado (${tripRecord.km} km con ${activeFuel})! Saldo descontado.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // ---------------- INTERACTIVE FUEL SWITCH ENGINE & DEDICATED TANK SYNC ----------------
  const handleSwitchFuel = (targetFuel: FuelKey) => {
    if (targetFuel === activeFuel) return;

    // Deduct accumulated cost and liters from the previous fuel's tank
    if (liveCost > 0 || liveLiters > 0) {
      setFuelTanks((prev) => {
        const cur = prev[activeFuel] || { balance: 0, liters: 0 };
        const newBal = Math.max(0, Math.round((cur.balance - liveCost) * 100) / 100);
        const newLit = Math.max(0, Math.round(((cur.liters || (fuelPrice > 0 ? cur.balance / fuelPrice : 0)) - liveLiters) * 100) / 100);
        const updated = {
          ...prev,
          [activeFuel]: { ...cur, balance: newBal, liters: newLit },
        };
        try {
          localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
      setLiveCost(0);
      setLiveLiters(0);
    }

    setActiveFuel(targetFuel);
    activeFuelRef.current = targetFuel;
    const p = fuelPrices[targetFuel] || defaultPrices[selectedCountry]?.[targetFuel] || 2.89;
    setFuelPrice(p);
    fuelPriceRef.current = p;
    try {
      localStorage.setItem('litrometrik_active_fuel', targetFuel);
      localStorage.setItem('fuel_price_per_liter', p.toString());
    } catch (_) {}

    const shortLabel = targetFuel === 'Gas LPG' ? 'LPG' : targetFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina';
    setNotification(`⛽ Conmutado a ${shortLabel} (${p.toFixed(2)} ${currency}/L) • Tanque y telemetría sincronizados`);
    setTimeout(() => setNotification(null), 3000);
  };

  const initiateFuelChange = (targetFuel: FuelKey) => {
    if (targetFuel === activeFuel) {
      setShowFuelPickerModal(false);
      return;
    }

    const currentSavedPrice = fuelPrices[targetFuel] || defaultPrices[selectedCountry]?.[targetFuel] || 6.09;
    setPendingFuelTarget(targetFuel);
    setPendingFuelPriceInput(currentSavedPrice.toFixed(2));
    setShowFuelPickerModal(false);

    // If there is an active recorded segment (> 50 meters or > 0.01 L), ask to save segment!
    if (distanceKm > 0.05 || liveLiters > 0.01) {
      setShowSaveSegmentConfirmModal(true);
    } else {
      finalizeFuelChange(targetFuel, currentSavedPrice, false);
    }
  };

  const finalizeFuelChange = (targetFuel: FuelKey, priceVal: number, saveOldSegment: boolean) => {
    if (saveOldSegment) {
      handleSaveTrip(`Tramo previo con ${activeFuel === 'Gas LPG' ? 'LPG' : activeFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina'} (${distanceKm.toFixed(1)} km)`);
    } else if (liveCost > 0 || liveLiters > 0) {
      // Deduct from previous fuel's tank
      setFuelTanks((prev) => {
        const cur = prev[activeFuel] || { balance: 0, liters: 0 };
        const newBal = Math.max(0, Math.round((cur.balance - liveCost) * 100) / 100);
        const newLit = Math.max(0, Math.round(((cur.liters || (fuelPrice > 0 ? cur.balance / fuelPrice : 0)) - liveLiters) * 100) / 100);
        const updated = {
          ...prev,
          [activeFuel]: { ...cur, balance: newBal, liters: newLit },
        };
        try {
          localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
      setLiveCost(0);
      setLiveLiters(0);
    }

    setActiveFuel(targetFuel);
    activeFuelRef.current = targetFuel;
    updateGlobalFuelPrice(targetFuel, priceVal);

    try {
      localStorage.setItem('litrometrik_active_fuel', targetFuel);
      localStorage.setItem('fuel_price_per_liter', priceVal.toString());
    } catch (_) {}

    setShowSaveSegmentConfirmModal(false);
    setPendingFuelTarget(null);

    const shortLabel = targetFuel === 'Gas LPG' ? 'LPG' : targetFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina';
    setNotification(`⛽ Conmutado a ${shortLabel} (${priceVal.toFixed(2)} ${currency}/L) • Algoritmo y tanque sincronizados`);
    setTimeout(() => setNotification(null), 3500);
  };

  // ---------------- VEHICLE CALIBRATION APPLY ----------------
  const handleApplyVehicleConfig = () => {
    setVehicleType(modalTempVehicleType);
    setEngineName(modalTempEngineName);
    setBaseConsumptionL100(modalTempBaseL100);
    setTransmission(modalTempTransmission);

    saveActiveVehicleState({
      vehicleType: modalTempVehicleType as any,
      engineName: modalTempEngineName,
      baseL100: modalTempBaseL100,
      transmission: modalTempTransmission,
      vehicleModelName: modalTempVehicleModelName || undefined,
    });

    setShowVehicleModal(false);
    setNotification(`🚗 Vehículo calibrado: ${modalTempEngineName} (${modalTempBaseL100} L/100km base)`);
    setTimeout(() => setNotification(null), 3000);
  };

  // ---------------- TANK REFUEL & ADJUST (PER-FUEL TANK SYNC) ----------------
  const handleSaveRefuel = () => {
    const amount = parseFloat(refuelAmountInput.replace(',', '.'));
    const enteredPrice = parseFloat(refuelPriceInput.replace(',', '.'));
    const targetFuelKey = (refuelFuelType as FuelKey) || activeFuel;
    const finalPrice = !isNaN(enteredPrice) && enteredPrice > 0
      ? Math.round(enteredPrice * 100) / 100
      : (fuelPrices[targetFuelKey] || fuelPrice);

    if (isNaN(amount) || amount <= 0) return;

    // 1. Actualización global del precio para ese tipo de combustible
    updateGlobalFuelPrice(targetFuelKey, finalPrice);

    // Si coincide con el combustible activo del viaje, actualizarlo en vivo
    if (targetFuelKey === activeFuel) {
      setFuelPrice(finalPrice);
    }

    const addedLiters = finalPrice > 0 ? Math.round((amount / finalPrice) * 100) / 100 : 0;

    // 2. Guardar en el tanque correspondiente a ese combustible en fuelTanks
    setFuelTanks((prev) => {
      const prevTank = prev[targetFuelKey] || { balance: 0, liters: 0 };
      const nextBal = Math.round((prevTank.balance + amount) * 100) / 100;
      const nextLit = Math.round(((prevTank.liters || (finalPrice > 0 ? prevTank.balance / finalPrice : 0)) + addedLiters) * 100) / 100;
      const nextMap: FuelTankMap = {
        ...prev,
        [targetFuelKey]: {
          balance: nextBal,
          liters: nextLit,
          lastRefuelAmount: amount,
          lastRefuelPrice: finalPrice,
          lastRefuelDate: new Date().toISOString(),
        },
      };
      try {
        localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(nextMap));
        if (targetFuelKey === activeFuel) {
          localStorage.setItem('litrometrik_base_fuel_balance_pln', nextBal.toString());
          localStorage.setItem('litrometrik_fuel_balance_pln', Math.max(0, nextBal - liveCost).toFixed(2));
          localStorage.setItem('fuel_balance_pln', Math.max(0, nextBal - liveCost).toFixed(2));
          localStorage.setItem('currentFuelBalancePLN', Math.max(0, nextBal - liveCost).toFixed(2));
        }
      } catch (_) {}
      return nextMap;
    });

    try {
      const uid = currentUser?.uid || 'guest';
      const repostajesKey = `litrometrik_${uid}_repostajes`;
      const refuels = JSON.parse(localStorage.getItem(repostajesKey) || '[]');
      const defaultStation =
        selectedCountry === 'PL' ? 'Orlen' : selectedCountry === 'CO' ? 'Terpel' : selectedCountry === 'ES' ? 'Repsol' : 'Pemex';

      const shortName = targetFuelKey === 'Gas LPG' ? 'LPG' : targetFuelKey === 'Diésel ON' ? 'Diésel' : 'Gasolina';

      const newRefuelEntry = {
        id: `rec_refuel_${Date.now()}`,
        createdAt: new Date().toISOString(),
        categoria: 'bitacora',
        userId: uid,
        pais: selectedCountry,
        moneda: currency,
        odometer: 145500 + Math.round(distanceKm),
        cost: amount,
        title: `Repostaje ${shortName}`,
        station: defaultStation,
        fuelType: targetFuelKey,
        liters: addedLiters,
        pricePerLiter: finalPrice,
        kmSinceLastRefuel: Math.round(distanceKm || 320),
        consumptionL100: baseConsumptionL100,
        refuelDate: new Date().toISOString().split('T')[0],
      };

      refuels.unshift(newRefuelEntry);
      localStorage.setItem(repostajesKey, JSON.stringify(refuels));

      if (uid && uid !== 'guest' && uid !== 'guest_user') {
        saveCloudRecord(uid, 'repostajes', newRefuelEntry);
        saveCloudVehicleConfig(uid, {
          fuelBalance: Math.max(0, (fuelTanks[targetFuelKey]?.balance || 0) + amount - (targetFuelKey === activeFuel ? liveCost : 0)),
          fuelPricePerLiter: finalPrice,
          lastFuelType: targetFuelKey,
        });
      }

      window.dispatchEvent(new Event('fuel-storage-updated'));
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('litrometrik-records-updated'));
    } catch (_) {}

    setShowRefuelModal(false);
    setRefuelAmountInput('');
    const shortName = targetFuelKey === 'Gas LPG' ? 'LPG' : targetFuelKey === 'Diésel ON' ? 'Diésel' : 'Gasolina';
    setNotification(`⛽ ¡Tanque de ${shortName} recargado con +${amount} ${currency}! (+${addedLiters.toFixed(2)} L @ ${finalPrice.toFixed(2)}/L)`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAdjustLevel = () => {
    let targetBal = currentFuelBalance;
    if (adjustBalanceInput) {
      targetBal = parseFloat(adjustBalanceInput.replace(',', '.')) || 0;
    } else if (adjustLitersInput) {
      const l = parseFloat(adjustLitersInput.replace(',', '.')) || 0;
      targetBal = l * fuelPrice;
    }

    const clampedTarget = Math.max(0, Math.round(targetBal * 100) / 100);
    const newLiters = fuelPrice > 0 ? Math.round((clampedTarget / fuelPrice) * 100) / 100 : 0;

    setFuelTanks((prev) => {
      const updated: FuelTankMap = {
        ...prev,
        [activeFuel]: {
          ...prev[activeFuel],
          balance: clampedTarget,
          liters: newLiters,
        },
      };
      try {
        localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(updated));
        localStorage.setItem('litrometrik_base_fuel_balance_pln', clampedTarget.toString());
        localStorage.setItem('litrometrik_fuel_balance_pln', clampedTarget.toString());
        localStorage.setItem('fuel_balance_pln', clampedTarget.toString());
      } catch (_) {}
      return updated;
    });

    setLiveCost(0);
    setLiveLiters(0);

    const uid = currentUser?.uid;
    if (uid && uid !== 'guest' && uid !== 'guest_user') {
      saveCloudVehicleConfig(uid, { fuelBalance: clampedTarget });
    }

    window.dispatchEvent(new Event('fuel-storage-updated'));
    window.dispatchEvent(new Event('storage'));

    setShowAdjustModal(false);
    const shortName = activeFuel === 'Gas LPG' ? 'LPG' : activeFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina';
    setNotification(`⛽ Saldo del tanque de ${shortName} ajustado a ${clampedTarget.toFixed(2)} ${currency}`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetZero = () => {
    const shortName = activeFuel === 'Gas LPG' ? 'LPG' : activeFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina';
    if (window.confirm(`¿Seguro que deseas restablecer el saldo del tanque de ${shortName} a 0,00?`)) {
      setFuelTanks((prev) => {
        const updated: FuelTankMap = {
          ...prev,
          [activeFuel]: {
            ...prev[activeFuel],
            balance: 0,
            liters: 0,
          },
        };
        try {
          localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(updated));
          localStorage.setItem('litrometrik_base_fuel_balance_pln', '0');
          localStorage.setItem('litrometrik_fuel_balance_pln', '0');
          localStorage.setItem('fuel_balance_pln', '0');
        } catch (_) {}
        return updated;
      });
      setLiveCost(0);
      setLiveLiters(0);
      const uid = currentUser?.uid;
      if (uid && uid !== 'guest' && uid !== 'guest_user') {
        saveCloudVehicleConfig(uid, { fuelBalance: 0 });
      }
      window.dispatchEvent(new Event('fuel-storage-updated'));
      window.dispatchEvent(new Event('storage'));
      setNotification(`⛽ Saldo del tanque de ${shortName} restablecido a 0,00`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // ---------------- PERIOD FILTER & CHART ENGINE ----------------
  const viajesFiltrados = useMemo(() => {
    const ahora = new Date();
    return historialViajes.filter((v) => {
      if (!v || !v.timestamp) return false;
      const f = new Date(v.timestamp);
      if (isNaN(f.getTime())) return false;

      if (filtroPeriodo === 'DIA') return f.toDateString() === ahora.toDateString();
      if (filtroPeriodo === 'SEMANA') {
        const hace7Dias = new Date();
        hace7Dias.setDate(ahora.getDate() - 7);
        return f >= hace7Dias;
      }
      if (filtroPeriodo === 'MES') {
        return f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
      }
      if (filtroPeriodo === 'ANO') return f.getFullYear() === ahora.getFullYear();
      return true;
    });
  }, [historialViajes, filtroPeriodo]);

  const resumenTotales = useMemo(() => {
    const totalKm = viajesFiltrados.reduce((acc, v) => acc + (v.km || 0), 0);
    const totalLiters = viajesFiltrados.reduce((acc, v) => acc + (v.litros || 0), 0);
    const totalCost = viajesFiltrados.reduce((acc, v) => acc + (v.costo || 0), 0);
    return { km: totalKm, liters: totalLiters, cost: totalCost, count: viajesFiltrados.length };
  }, [viajesFiltrados]);

  const chartData = useMemo(() => {
    if (filtroPeriodo === 'DIA') {
      const slots = [
        { label: '0h', cost: 0, liters: 0, minHour: 0, maxHour: 3 },
        { label: '3h', cost: 0, liters: 0, minHour: 3, maxHour: 6 },
        { label: '6h', cost: 0, liters: 0, minHour: 6, maxHour: 9 },
        { label: '9h', cost: 0, liters: 0, minHour: 9, maxHour: 12 },
        { label: '12h', cost: 0, liters: 0, minHour: 12, maxHour: 15 },
        { label: '15h', cost: 0, liters: 0, minHour: 15, maxHour: 18 },
        { label: '18h', cost: 0, liters: 0, minHour: 18, maxHour: 21 },
        { label: '21h', cost: 0, liters: 0, minHour: 21, maxHour: 24 },
      ];
      viajesFiltrados.forEach((v) => {
        const h = new Date(v.timestamp).getHours();
        const slot = slots.find((s) => h >= s.minHour && h < s.maxHour);
        if (slot) {
          slot.cost += v.costo || 0;
          slot.liters += v.litros || 0;
        }
      });
      return slots;
    }
    if (filtroPeriodo === 'SEMANA') {
      const days = [
        { label: 'Lun', cost: 0, liters: 0, dayIdx: 1 },
        { label: 'Mar', cost: 0, liters: 0, dayIdx: 2 },
        { label: 'Mié', cost: 0, liters: 0, dayIdx: 3 },
        { label: 'Jue', cost: 0, liters: 0, dayIdx: 4 },
        { label: 'Vie', cost: 0, liters: 0, dayIdx: 5 },
        { label: 'Sáb', cost: 0, liters: 0, dayIdx: 6 },
        { label: 'Dom', cost: 0, liters: 0, dayIdx: 0 },
      ];
      viajesFiltrados.forEach((v) => {
        const d = new Date(v.timestamp).getDay();
        const day = days.find((item) => item.dayIdx === d);
        if (day) {
          day.cost += v.costo || 0;
          day.liters += v.litros || 0;
        }
      });
      return days;
    }
    if (filtroPeriodo === 'MES') {
      const weeks = [
        { label: 'Sem 1', cost: 0, liters: 0 },
        { label: 'Sem 2', cost: 0, liters: 0 },
        { label: 'Sem 3', cost: 0, liters: 0 },
        { label: 'Sem 4', cost: 0, liters: 0 },
      ];
      viajesFiltrados.forEach((v) => {
        const dayOfMonth = new Date(v.timestamp).getDate();
        const idx = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
        weeks[idx].cost += v.costo || 0;
        weeks[idx].liters += v.litros || 0;
      });
      return weeks;
    }
    const months = [
      { label: 'Ene', cost: 0, liters: 0, mIdx: 0 },
      { label: 'Feb', cost: 0, liters: 0, mIdx: 1 },
      { label: 'Mar', cost: 0, liters: 0, mIdx: 2 },
      { label: 'Abr', cost: 0, liters: 0, mIdx: 3 },
      { label: 'May', cost: 0, liters: 0, mIdx: 4 },
      { label: 'Jun', cost: 0, liters: 0, mIdx: 5 },
      { label: 'Jul', cost: 0, liters: 0, mIdx: 6 },
      { label: 'Ago', cost: 0, liters: 0, mIdx: 7 },
      { label: 'Sep', cost: 0, liters: 0, mIdx: 8 },
      { label: 'Oct', cost: 0, liters: 0, mIdx: 9 },
      { label: 'Nov', cost: 0, liters: 0, mIdx: 10 },
      { label: 'Dic', cost: 0, liters: 0, mIdx: 11 },
    ];
    viajesFiltrados.forEach((v) => {
      const m = new Date(v.timestamp).getMonth();
      const month = months.find((item) => item.mIdx === m);
      if (month) {
        month.cost += v.costo || 0;
        month.liters += v.litros || 0;
      }
    });
    return months;
  }, [viajesFiltrados, filtroPeriodo]);

  const countries = [
    { code: 'PL' as CountryCode, label: 'Polonia', flag: '🇵🇱' },
    { code: 'CO' as CountryCode, label: 'Colombia', flag: '🇨🇴' },
    { code: 'ES' as CountryCode, label: 'España', flag: '🇪🇸' },
    { code: 'MX' as CountryCode, label: 'México', flag: '🇲🇽' },
  ];

  const currentCountry = countries.find((c) => c.code === selectedCountry) || countries[0];
  const activeVehiclePreset = VEHICLE_PRESETS.find((v) => v.type === vehicleType) || VEHICLE_PRESETS[1];
  const activeVehicleState = getActiveVehicleState();

  return (
    <div className="min-h-screen bg-[#080B11] text-white pb-28 sm:pb-32 select-none font-sans antialiased">
      {/* ---------------- 1. NATIVE HEADER (SOLID OPAQUE, ZERO TRANSLUCENT STRIP) ---------------- */}
      <header
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
        className="sticky top-0 z-30 bg-[#080B11] border-b border-slate-800/80 px-4 pb-3 flex items-center justify-between shadow-md"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF4F00] flex items-center justify-center shadow-lg shadow-[#FF4F00]/25 shrink-0">
            <Fuel className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-1.5 leading-none">
              <span>LitroMetrik</span>
              <span className="text-[#FF4F00]">PRO</span>
            </h1>
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-1">
              MODO EN MARCHA
            </p>
          </div>
        </div>

        {/* Action buttons: Trash icon (borrar historial & reiniciar 4 campos), User icon (info usuario & cerrar sesión), Country Selector */}
        <div className="flex items-center space-x-2">
          {/* TRASH ICON BUTTON: Borrar historial y sincronizar los 4 campos a 0 */}
          <button
            type="button"
            onClick={handleClearHistoryAndTelemetry}
            className="w-9 h-9 rounded-full bg-[#1A202C] hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-500/60 text-slate-300 hover:text-rose-400 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm"
            title="Borrar historial y reiniciar telemetría a 0"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* USER PROFILE & LOGOUT ICON BUTTON */}
          <button
            type="button"
            onClick={() => setShowUserAccountModal(true)}
            className="w-9 h-9 rounded-full bg-[#1A202C] hover:bg-sky-950/60 border border-slate-700/80 hover:border-sky-500/60 text-slate-300 hover:text-sky-400 flex items-center justify-center transition active:scale-95 cursor-pointer shadow-sm relative"
            title="Información de usuario y cerrar sesión"
          >
            <User className="w-4 h-4" />
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#080B11]" />
          </button>

          {/* Country Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountryMenu(!showCountryMenu)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#1A202C] hover:bg-[#2D3748] border border-slate-700/80 text-xs font-black text-slate-200 transition active:scale-95 cursor-pointer shadow-sm"
            >
              <span>{currentCountry.flag}</span>
              <span className="hidden sm:inline">{currentCountry.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showCountryMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-[#1A202C] border border-slate-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      onCountryChange(c.code);
                      setShowCountryMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-black transition flex items-center justify-between ${
                      selectedCountry === c.code
                        ? 'text-[#FF4F00] bg-white/5'
                        : 'text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{c.flag}</span>
                      <span>{c.label}</span>
                    </span>
                    {selectedCountry === c.code && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F00]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-18 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="p-3.5 rounded-2xl bg-[#121620] border border-[#FF4F00]/60 text-white text-xs font-bold flex items-center space-x-2 shadow-2xl animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#FF4F00] shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Driver Safety Alert Banner */}
      {driverAlert && (
        <div className="fixed top-20 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-top duration-300">
          <div
            className={`p-4 rounded-3xl border shadow-2xl flex items-start space-x-3 backdrop-blur-xl ${
              driverAlert.type === 'speed'
                ? 'bg-[#2A0F12]/95 border-red-500/80 text-red-200 shadow-red-500/20'
                : driverAlert.type === 'reserve'
                ? 'bg-[#2A1505]/95 border-amber-500/80 text-amber-200 shadow-amber-500/20'
                : 'bg-[#2A1E08]/95 border-amber-500/80 text-amber-200 shadow-amber-500/20'
            }`}
          >
            <div className="p-2 rounded-2xl bg-black/40 shrink-0">
              {driverAlert.type === 'speed' ? (
                <AlertOctagon className="w-6 h-6 text-red-400 animate-bounce" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider">{driverAlert.title}</h4>
              <p className="text-[11px] font-medium leading-relaxed opacity-90 mt-0.5">
                {driverAlert.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDriverAlert(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 2. MAIN WORKSPACE ---------------- */}
      <main className="max-w-md mx-auto px-3.5 sm:px-4 pt-2.5 space-y-3.5">
        {/* TOP STATUS BAR: SENSOR GPS & SCREEN WAKE LOCK */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-wider text-slate-300">
              {isRunning ? 'SENSOR GPS ACTIVO' : 'SENSOR DETENIDO'}
            </span>
            {isRunning && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[9px] font-black text-cyan-400">
                <Sun className="w-2.5 h-2.5 text-cyan-400" />
                <span>PANTALLA ACTIVA</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={toggleMarcha}
            className={`px-4 py-1.5 rounded-full font-black text-xs transition active:scale-95 cursor-pointer shadow-md flex items-center space-x-1.5 ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-[#FF4F00] hover:bg-[#FF621F] text-white shadow-[#FF4F00]/30'
            }`}
          >
            <span>{isRunning ? '⏸ Pausar' : '▶ Iniciar Marcha'}</span>
          </button>
        </div>

        {/* GPS Alert */}
        {gpsError && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{gpsError}</span>
          </div>
        )}

        {/* ---------------- 1. SELECTOR COMPACTO DE VEHÍCULO Y MOTORIZACIÓN (ANTES DE INICIAR MARCHA) ---------------- */}
        <div className="p-2.5 rounded-2xl bg-[#121620]/95 backdrop-blur-md border border-slate-800 shadow-lg flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setModalTempVehicleType(vehicleType);
              setModalTempEngineName(engineName);
              setModalTempBaseL100(baseConsumptionL100);
              setModalTempTransmission(transmission);
              setShowVehicleModal(true);
            }}
            className="flex-1 flex items-center justify-between p-1 rounded-xl hover:bg-white/5 transition active:scale-[0.99] cursor-pointer text-left group"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#121620] to-[#0D1017] border border-slate-700/80 flex items-center justify-center shrink-0 shadow-sm overflow-hidden p-1">
                {activeVehicleState.carPhotoUrl ? (
                  <img
                    src={activeVehicleState.carPhotoUrl}
                    alt="Vehículo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  renderMarchaVehicle3D(vehicleType, 36)
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 leading-tight flex-wrap gap-y-1">
                  <span className="text-xs font-black text-white truncate">
                    {activeVehicleState.vehicleModelName || activeVehiclePreset.label}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-bold border border-sky-500/30 shrink-0">
                    {engineName}
                  </span>
                  {isACActive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/25 text-cyan-300 font-black border border-cyan-400/50 shrink-0 flex items-center space-x-1">
                      <Snowflake className="w-2.5 h-2.5 text-cyan-300 animate-spin" />
                      <span>A/C (+0.6)</span>
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  {baseConsumptionL100.toFixed(1)} L/100km base • {transmission === 'automatic' ? 'Automático' : 'Manual'}
                  {isACActive ? ' • A/C Encendido' : ' • Modo Eco'}
                </p>
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-sky-400 transition ml-2" />
          </button>
        </div>

        {/* ---------------- 4 CAMPOS INTEGRADOS CON ESTILO MÁS GORDITO, NÚMEROS MÁS GRANDES Y CÍRCULO CENTRAL KM/H CON CRONÓMETRO ---------------- */}
        <div className="relative select-none">
          {/* 2x2 Cluster de las 4 tarjetas envolviendo el velocímetro */}
          <div className="grid grid-cols-2 gap-3">
            {/* Campo 1: DISTANCIA (Top-Left) */}
            <div className="relative min-h-[126px] sm:min-h-[136px] p-4 sm:p-5 rounded-tl-[34px] rounded-tr-2xl rounded-bl-2xl rounded-br-[52px] bg-[#121620]/95 border border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-400 uppercase block">
                  DISTANCIA
                </span>
                <div className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight mt-1">
                  {distanceKm.toFixed(2).replace('.', ',')} <span className="text-xs font-bold text-slate-400">km</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {(liveLiters * (distanceKm > 0 ? 1 : 0)).toFixed(2).replace('.', ',')} L mov.
              </p>
            </div>

            {/* Campo 2: CONSUMO EN VIVO (Top-Right) */}
            <div className="relative min-h-[136px] sm:min-h-[146px] p-3.5 sm:p-4 rounded-tr-[34px] rounded-tl-2xl rounded-br-2xl rounded-bl-[52px] bg-[#121620]/95 border border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between text-right overflow-hidden">
              <div>
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-400 uppercase block">
                  CONSUMO EN VIVO
                </span>
                <div className="text-2xl sm:text-3xl font-black font-sans text-white tracking-tight mt-1">
                  {liveLiters.toFixed(3).replace('.', ',')} <span className="text-xs font-bold text-slate-400">L</span>
                </div>
              </div>
              <div className="flex items-center justify-end">
                {isRunning ? (
                  currentSpeed < 3 ? (
                    <span className="text-[10px] sm:text-[11px] text-amber-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>En Ralentí ({activeFuel === 'Gas LPG' ? (isACActive ? '1,15' : '0,95') : (isACActive ? '1,00' : '0,80')} L/h)</span>
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>En Movimiento ({((baseConsumptionL100 * (transmission === 'automatic' ? 1.08 : 1.0) * (activeFuel === 'Gas LPG' ? 1.2 : 1.0)) + (isACActive ? acAddonAmount : 0)).toFixed(1)} L/100km)</span>
                    </span>
                  )
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">
                    En reposo
                  </p>
                )}
              </div>
            </div>

            {/* Campo 3: GASTO EN VIVO (Bottom-Left) con SELECTOR DE 3 COMBUSTIBLES Y SU PANEL DE SALDO DE TANQUE */}
            <div className="relative min-h-[142px] sm:min-h-[148px] p-3 sm:p-3.5 rounded-bl-[32px] rounded-br-2xl rounded-tl-2xl rounded-tr-[42px] bg-[#121620]/95 border border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-400 uppercase">
                  GASTO EN VIVO
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-300">
                  {fuelPrices[activeFuel]?.toFixed(2)} {currency}/L
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-black font-sans text-[#FF4F00] tracking-tight">
                  {liveCost.toFixed(2).replace('.', ',')} <span className="text-xs font-bold">{currency}</span>
                </div>

                {/* SELECTOR INTERACTIVO DIRECTO DE 3 COMBUSTIBLES (LPG / Gasolina / Diésel) */}
                <div className="grid grid-cols-3 gap-1 mt-1.5">
                  {(['Gas LPG', 'Gasolina Pb95', 'Diésel ON'] as FuelKey[]).map((fKey) => {
                    const isSel = activeFuel === fKey;
                    const shortLabel = fKey === 'Gas LPG' ? 'LPG' : fKey === 'Diésel ON' ? 'Diésel' : 'Gasolina';
                    const icon = fKey === 'Gas LPG' ? '🔥' : fKey === 'Diésel ON' ? '🛢️' : '⛽';
                    return (
                      <button
                        key={fKey}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitchFuel(fKey);
                        }}
                        className={`py-1 px-1 rounded-xl text-[10px] font-black transition-all flex items-center justify-center space-x-1 cursor-pointer active:scale-95 ${
                          isSel
                            ? 'bg-[#FF4F00] text-white shadow-sm shadow-[#FF4F00]/40 ring-1 ring-white/20'
                            : 'bg-[#182030] hover:bg-[#20293D] text-slate-300 border border-slate-700/60'
                        }`}
                        title={`Seleccionar combustible ${shortLabel}`}
                      >
                        <span className="text-xs">{icon}</span>
                        <span className="truncate">{shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Panel de saldo restante en tanque para el combustible seleccionado */}
                <div className="mt-1.5 p-1 rounded-lg bg-black/40 border border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px]">
                  <div className="flex items-center space-x-1 min-w-0">
                    <span className="text-slate-400 font-bold truncate">
                      Tanque {activeFuel === 'Gas LPG' ? 'LPG' : activeFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina'}:
                    </span>
                    <span className="font-mono font-black text-amber-300 truncate">
                      {currentFuelBalance.toFixed(1).replace('.', ',')} {currency} ({currentRemainingLiters.toFixed(1)}L)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRefuelFuelType(activeFuel);
                      const p = fuelPrices[activeFuel] || fuelPrice;
                      setRefuelAmountInput('');
                      setRefuelPriceInput(p.toFixed(2));
                      setShowRefuelModal(true);
                    }}
                    className="ml-1 px-1.5 py-0.5 rounded-md bg-[#FF4F00]/20 hover:bg-[#FF4F00]/30 text-[#FF4F00] font-bold text-[8px] sm:text-[9px] border border-[#FF4F00]/40 shrink-0 cursor-pointer transition active:scale-95"
                    title="Registrar tanqueo para este combustible"
                  >
                    + Tanqueo
                  </button>
                </div>
              </div>
            </div>

            {/* Campo 4: SWITCH DE AIRE ACONDICIONADO A/C (Bottom-Right) - Letras perfectamente encajadas y 100% visibles */}
            <div
              onClick={toggleAC}
              className={`relative min-h-[142px] sm:min-h-[148px] p-3 sm:p-3.5 rounded-br-[32px] rounded-bl-2xl rounded-tr-2xl rounded-tl-[42px] border transition-all duration-300 flex flex-col justify-between text-right cursor-pointer select-none overflow-hidden ${
                isACActive
                  ? 'bg-gradient-to-br from-[#0B2138] via-[#0A1A2C] to-[#121620] border-cyan-400/80 shadow-[0_0_30px_rgba(0,212,255,0.25)] ring-1 ring-cyan-400/30'
                  : 'bg-[#121620]/95 border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-slate-700'
              }`}
            >
              {/* Header con Aire A/C a la izquierda y Switch a la derecha: completamente visible sin recortes */}
              <div className="flex items-center justify-between w-full gap-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xl border text-[10px] sm:text-[11px] font-black tracking-wide uppercase transition-all shadow-sm shrink-0 whitespace-nowrap ${
                    isACActive
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-cyan-500/20'
                      : 'bg-slate-800/90 border-slate-700/80 text-slate-300'
                  }`}
                >
                  <Snowflake
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isACActive ? 'text-cyan-300 animate-spin' : 'text-slate-400'
                    }`}
                  />
                  <span className="font-black">Aire A/C</span>
                </span>

                {/* Tactile Switch Toggle */}
                <div
                  className={`w-8 h-4.5 rounded-full transition-colors flex items-center px-0.5 shadow-inner shrink-0 ${
                    isACActive ? 'bg-[#00D4FF] justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-end space-x-1">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-sans tracking-tight transition-colors ${
                      isACActive
                        ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]'
                        : 'text-slate-300'
                    }`}
                  >
                    {isACActive ? `+${acAddonAmount.toFixed(1)}` : '0,0'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">L/100km</span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-bold mt-0.5 truncate text-right ${
                    isACActive ? 'text-cyan-300' : 'text-slate-500'
                  }`}
                >
                  {isACActive ? 'Aire A/C (+0.6 L/100)' : 'Aire A/C Apagado'}
                </p>
              </div>
            </div>
          </div>

          {/* ---------------- CÍRCULO CENTRAL KM/H CON CRONÓMETRO ADENTRO (MÁS GRANDE Y PROFESIONAL) ---------------- */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <button
              type="button"
              onClick={toggleMarcha}
              title="Velocímetro GPS & Cronómetro (Toca para iniciar o pausar)"
              className={`pointer-events-auto relative w-34 h-34 sm:w-38 sm:h-38 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_0_6px_#080B11,0_0_24px_rgba(0,0,0,0.8)] active:scale-95 ${
                isRunning
                  ? currentSpeed < 3
                    ? 'bg-gradient-to-b from-[#261B0A] via-[#171106] to-[#0A0702] border-[3px] border-amber-500/90 text-white shadow-[0_0_28px_rgba(245,158,11,0.3)]'
                    : 'bg-gradient-to-b from-[#0F1E36] via-[#0A1628] to-[#050D18] border-[3px] border-[#00D4FF]/90 text-white shadow-[0_0_28px_rgba(0,212,255,0.3)]'
                  : 'bg-gradient-to-b from-[#1C2433] via-[#121824] to-[#080B11] border-[3px] border-slate-600/80 hover:border-[#00D4FF]/70 text-slate-200'
              }`}
            >
              {/* SVG Speedometer Gauge Arc */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="speedDialGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00E5FF" />
                    <stop offset="40%" stopColor="#10B981" />
                    <stop offset="70%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                  <filter id="speedDialGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="3"
                      floodColor={currentSpeed > speedLimit ? '#EF4444' : '#00E5FF'}
                      floodOpacity="0.8"
                    />
                  </filter>
                </defs>

                {/* Track de fondo */}
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  fill="none"
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="202 270"
                  transform="rotate(135 50 50)"
                />

                {/* Línea animada interior */}
                <circle
                  cx="50"
                  cy="50"
                  r="43"
                  fill="none"
                  stroke="url(#speedDialGrad)"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeDasharray="202 270"
                  strokeDashoffset={202 - (Math.min(Math.max(currentSpeed, 0), 160) / 160) * 202}
                  filter="url(#speedDialGlow)"
                  transform="rotate(135 50 50)"
                  style={{
                    strokeDashoffset: 202 - (Math.min(Math.max(currentSpeed, 0), 160) / 160) * 202,
                    transition: 'stroke-dashoffset 450ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />

                {/* Ticks a 0, 40, 80, 120, 160 km/h */}
                {[0, 40, 80, 120, 160].map((tSpeed, idx) => {
                  const angleDeg = 135 + (idx / 4) * 270;
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const x1 = 50 + 36 * Math.cos(angleRad);
                  const y1 = 50 + 36 * Math.sin(angleRad);
                  const x2 = 50 + 39 * Math.cos(angleRad);
                  const y2 = 50 + 39 * Math.sin(angleRad);
                  return (
                    <line
                      key={tSpeed}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              {/* Status Indicator */}
              <div className="flex items-center space-x-1 -mt-1 z-10">
                <Navigation
                  className={`w-2.5 h-2.5 ${
                    isRunning
                      ? currentSpeed < 3
                        ? 'text-amber-400 animate-pulse'
                        : 'text-[#00D4FF] animate-pulse'
                      : 'text-slate-400'
                  }`}
                />
                <span
                  className={`text-[8px] font-black uppercase tracking-wider ${
                    isRunning
                      ? currentSpeed < 3
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {isRunning ? (currentSpeed < 3 ? 'RALENTÍ' : 'EN MARCHA') : 'PAUSADO'}
                </span>
              </div>

              {/* Giant Speed Display */}
              <div className="flex items-baseline space-x-0.5 leading-none z-10 my-0.5">
                <span
                  className={`text-3xl sm:text-4xl font-black font-sans tracking-tighter drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] transition-colors ${
                    currentSpeed > speedLimit
                      ? 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse'
                      : 'text-white'
                  }`}
                >
                  {currentSpeed}
                </span>
                <span
                  className={`text-[9px] font-black tracking-widest uppercase ${
                    currentSpeed > speedLimit ? 'text-red-400' : 'text-[#00D4FF]'
                  }`}
                >
                  km/h
                </span>
              </div>

              {/* CRONÓMETRO DENTRO DEL CÍRCULO (SOLICITUD EXPLÍCITA) */}
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-black/60 border border-slate-700/80 text-white font-mono text-[10px] sm:text-[11px] font-black shadow-inner z-10 my-0.5">
                <Clock className="w-2.5 h-2.5 text-[#00D4FF] shrink-0" />
                <span>{formatTime(Math.floor(elapsedSeconds))}</span>
              </div>

              {/* Action Hint */}
              <span className="text-[7px] font-black text-slate-300 z-10 uppercase tracking-tight">
                {isRunning ? 'Toca para pausar' : 'Toca para iniciar'}
              </span>
            </button>
          </div>
        </div>

        {/* ---------------- 2 & 5. SALDO RESTANTE EN TANQUE CON DESCUENTO EN VIVO Y ALERTA DE RESERVA ---------------- */}
        <div
          className={`p-5 rounded-3xl transition-all duration-300 shadow-xl space-y-4 ${
            isReserveActive
              ? 'border-2 border-red-500/90 shadow-[0_0_35px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(239,68,68,0.15)] animate-pulse bg-gradient-to-b from-[#2A0F14] via-[#1A0B10] to-[#121620]'
              : 'bg-[#121620] border border-slate-800/80'
          }`}
        >
          {/* Header con tabs para cambiar entre Gasolina, LPG o Diésel y ver el saldo de cada uno */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
                SALDO RESTANTE EN TANQUE
              </span>
              <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#1A202C] border border-slate-700/80 text-xs font-sans font-bold text-slate-200">
                <span>💧</span>
                <span>{currentRemainingLiters.toFixed(2).replace('.', ',')} L</span>
              </div>
            </div>

            {/* Pestañas de combustible con su saldo individual guardado */}
            <div className="grid grid-cols-3 gap-2">
              {(['Gas LPG', 'Gasolina Pb95', 'Diésel ON'] as FuelKey[]).map((fKey) => {
                const isCurrent = activeFuel === fKey;
                const shortLabel = fKey === 'Gas LPG' ? 'LPG' : fKey === 'Diésel ON' ? 'Diésel' : 'Gasolina';
                const icon = fKey === 'Gas LPG' ? '🔥' : fKey === 'Diésel ON' ? '🛢️' : '⛽';
                const tankVal = isCurrent ? currentFuelBalance : (fuelTanks[fKey]?.balance || 0);
                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => handleSwitchFuel(fKey)}
                    className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-center cursor-pointer active:scale-95 ${
                      isCurrent
                        ? 'bg-[#FF4F00]/20 border-[#FF4F00] text-white shadow-md shadow-[#FF4F00]/25 ring-1 ring-[#FF4F00]'
                        : 'bg-[#182030] border-slate-700/70 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm">{icon}</span>
                      <span className="text-xs font-black truncate">{shortLabel}</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-300 font-bold mt-0.5">
                      {tankVal.toFixed(0)} {currency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Giant Amount - Orange or Glowing Red if in Reserve */}
          <div className="flex items-baseline justify-between">
            <div
              className={`text-4xl sm:text-5xl font-black font-sans tracking-tight transition-colors ${
                isReserveActive
                  ? 'text-red-400 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]'
                  : 'text-[#FF4F00]'
              }`}
            >
              {currentFuelBalance.toFixed(2).replace('.', ',')}{' '}
              <span className="text-2xl font-bold uppercase">{currency}</span>
            </div>

            {isReserveActive && (
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/60 text-[10px] font-black text-red-400 uppercase tracking-wide animate-pulse">
                <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                <span>Reserva</span>
              </span>
            )}
          </div>

          {/* Big Orange Button: + Registrar Tanqueo */}
          <button
            type="button"
            onClick={() => {
              setRefuelFuelType(activeFuel);
              const p = fuelPrices[activeFuel] || fuelPrice;
              setRefuelAmountInput('');
              setRefuelPriceInput(p.toFixed(2));
              setShowRefuelModal(true);
            }}
            className="w-full py-3.5 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] text-white font-black text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer shadow-lg shadow-[#FF4F00]/30 flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Registrar Tanqueo ({activeFuel === 'Gas LPG' ? 'LPG' : activeFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina'})</span>
          </button>

          {/* Secondary Buttons Row: [ Ajustar Nivel ] and [ Reset 0 ] */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setAdjustBalanceInput(currentFuelBalance.toFixed(2));
                setAdjustLitersInput(currentRemainingLiters.toFixed(2));
                setShowAdjustModal(true);
              }}
              className="py-3 px-3 rounded-2xl bg-[#1A202C] hover:bg-[#252E3E] text-slate-200 font-bold text-xs border border-slate-700/80 transition active:scale-95 cursor-pointer flex items-center justify-center space-x-2 shadow-sm"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Ajustar Nivel</span>
            </button>

            <button
              type="button"
              onClick={handleResetZero}
              className="py-3 px-3 rounded-2xl bg-[#2A1215] hover:bg-[#3B171B] text-[#FF6B6B] border border-[#551A1A] font-bold text-xs transition active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <span>Reset 0</span>
            </button>
          </div>
        </div>

        {/* ---------------- ACTION BUTTONS: [ ↺ Reiniciar tramo ] and [ 💾 Guardar viaje ] ---------------- */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleResetTramo}
            className="py-3.5 px-3 rounded-2xl bg-[#121620] hover:bg-[#1A202C] text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center space-x-2 shadow-md"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reiniciar tramo</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveTrip()}
            className="py-3.5 px-3 rounded-2xl bg-[#121620] hover:bg-[#1A202C] text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition active:scale-95 cursor-pointer flex items-center justify-center space-x-2 shadow-md"
          >
            <Save className="w-4 h-4 text-[#FF4F00]" />
            <span>Guardar viaje</span>
          </button>
        </div>

        {/* ---------------- INTEGRATED STATISTICS & CHART ---------------- */}
        <div className="pt-2 space-y-4">
          {/* Period Filter Tabs */}
          <div className="p-1.5 rounded-2xl bg-[#090D16]/95 border border-white/10 shadow-[inset_0_2px_6px_rgba(0,0,0,0.6),0_6px_20px_rgba(0,0,0,0.4)] backdrop-blur-xl grid grid-cols-4 gap-1.5">
            {(['DIA', 'SEMANA', 'MES', 'ANO'] as TimeFilterPeriod[]).map((p) => {
              const isActive = filtroPeriodo === p;
              const labels: Record<TimeFilterPeriod, string> = {
                DIA: 'DÍA',
                SEMANA: 'SEMANA',
                MES: 'MES',
                ANO: 'AÑO',
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                      try { navigator.vibrate(15); } catch (_) {}
                    }
                    setFiltroPeriodo(p);
                  }}
                  className={`py-3.5 px-2 rounded-2xl text-xs sm:text-sm font-black transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-90 flex items-center justify-center space-x-1 cursor-pointer select-none ${
                    isActive
                      ? 'bg-gradient-to-b from-[#FF5E00] to-[#D93800] text-white shadow-[0_6px_20px_rgba(255,79,0,0.5),0_1px_2px_rgba(255,255,255,0.4)_inset] scale-[1.03]'
                      : 'bg-[#121724] text-slate-400 hover:text-white hover:bg-[#1A2234] border border-white/5'
                  }`}
                >
                  <span>{labels[p]}</span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 font-medium px-1 flex items-center justify-between">
            <span>Toca una barra para ver el desglose</span>
            <span className="text-[11px] font-bold text-[#FF4F00]">
              {chartData.reduce((acc, curr) => acc + (curr.cost || 0), 0).toFixed(2)} {currency}
            </span>
          </p>

          {/* Interactive Bar Chart */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#0D121D] border border-slate-800 shadow-2xl space-y-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 14, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="chartCostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFA000" stopOpacity={1} />
                      <stop offset="45%" stopColor="#FF5722" stopOpacity={1} />
                      <stop offset="100%" stopColor="#D84315" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="chartLitersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity={1} />
                      <stop offset="50%" stopColor="#00B0FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0288D1" stopOpacity={0.9} />
                    </linearGradient>
                    <filter id="neonGlowCost" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#FF5722" floodOpacity="0.65" />
                    </filter>
                    <filter id="neonGlowLiters" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#00E5FF" floodOpacity="0.65" />
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748B"
                    tick={{ fill: '#CBD5E1', fontSize: 11, fontWeight: 'bold' }}
                    axisLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    yAxisId="cost"
                    orientation="left"
                    stroke="#FF7043"
                    tick={{ fill: '#FF8A65', fontSize: 10, fontWeight: 'bold' }}
                    axisLine={{ stroke: '#FF5722' }}
                    tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : `${val}`)}
                  />
                  <YAxis
                    yAxisId="liters"
                    orientation="right"
                    stroke="#00E5FF"
                    tick={{ fill: '#38BDF8', fontSize: 10, fontWeight: 'bold' }}
                    axisLine={{ stroke: '#0284C7' }}
                    tickFormatter={(val) => `${val}L`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 8 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#090D16]/98 backdrop-blur-xl p-3.5 rounded-2xl border border-white/15 shadow-2xl text-xs space-y-1.5 z-50">
                            <div className="font-black text-white border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                              <span>{data.label}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{filtroPeriodo}</span>
                            </div>
                            <div className="flex items-center justify-between space-x-3 text-[#FF5722] font-bold">
                              <span>Gasto Total:</span>
                              <span className="font-sans font-black">
                                {data.cost.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                              </span>
                            </div>
                            <div className="flex items-center justify-between space-x-3 text-sky-400 font-bold">
                              <span>Litros Consumidos:</span>
                              <span className="font-sans font-black">
                                {data.liters.toFixed(2)} L
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    yAxisId="cost"
                    dataKey="cost"
                    name="Gasto"
                    fill="url(#chartCostGrad)"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={24}
                    minPointSize={0}
                    filter="url(#neonGlowCost)"
                  />
                  <Bar
                    yAxisId="liters"
                    dataKey="liters"
                    name="Litros"
                    fill="url(#chartLitersGrad)"
                    radius={[8, 8, 2, 2]}
                    maxBarSize={24}
                    minPointSize={0}
                    filter="url(#neonGlowLiters)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center space-x-4 pt-1 px-2 text-xs font-bold text-slate-300">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF4F00]/15 border border-[#FF4F00]/30 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF4F00] shadow-[0_0_8px_#FF4F00]" />
                <span className="text-white">Gasto ({currency})</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8]" />
                <span className="text-white">Litros (L)</span>
              </div>
            </div>
          </div>

          {/* 4 SUMMARY KPI CARDS (2x2 grid) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-lg space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                CONSUMO
              </span>
              <div className="text-2xl font-black font-sans text-white tracking-tight">
                {resumenTotales.liters.toFixed(2).replace('.', ',')} <span className="text-sm font-bold text-slate-400">L</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-lg space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                GASTO TOTAL
              </span>
              <div className="text-2xl font-black font-sans text-[#FF4F00] tracking-tight">
                {resumenTotales.cost.toFixed(2).replace('.', ',')} <span className="text-sm font-bold">{currency}</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-lg space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                KM REGISTRADOS
              </span>
              <div className="text-2xl font-black font-sans text-white tracking-tight">
                {resumenTotales.km.toFixed(1).replace('.', ',')}
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-lg space-y-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                VIAJES
              </span>
              <div className="text-2xl font-black font-sans text-white tracking-tight">
                {resumenTotales.count}
              </div>
            </div>
          </div>

          {/* ---------------- HISTORIAL LIST LINKED TO PERIOD FILTER ---------------- */}
          <div className="space-y-3 pt-2">
            <h3 className="text-base font-black text-white px-1">Historial</h3>

            {viajesFiltrados.length === 0 ? (
              <div className="p-8 rounded-3xl bg-[#121620] border border-slate-800/80 text-center space-y-2">
                <Navigation className="w-6 h-6 text-slate-500 mx-auto" />
                <p className="text-xs font-bold text-slate-400">
                  Sin viajes registrados en este período.
                </p>
                <p className="text-[11px] text-slate-500">
                  Presiona "▶ Iniciar Marcha" y luego "Guardar viaje" para registrar tu primer trayecto.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {viajesFiltrados.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-2xl bg-[#121620] border border-slate-800/80 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{v.date || new Date(v.timestamp).toLocaleDateString('es-ES')}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#1A202C] text-[#FF4F00] text-[10px] font-black">
                          {v.combustible}
                        </span>
                        {v.isACActive && (
                          <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-black">
                            A/C
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {v.km.toFixed(2)} km • {v.litros.toFixed(2)} L
                        {v.durationSeconds ? ` • ${formatTime(v.durationSeconds)}` : ''}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-black font-sans text-[#FF4F00]">
                        {v.costo.toFixed(2)} {currency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ---------------- MODAL SELECCIONAR / CALIBRAR VEHÍCULO Y MOTORIZACIÓN INVESTIGADA ---------------- */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111622] border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Vehículo y Motorización Real</h3>
                  <p className="text-[10px] text-slate-400">Datos técnicos investigados WLTP y consumo oficial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Categoría de Vehículo (Gráficas 3D Profesionales Reales) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                1. Categoría de Carrocería
              </label>
              <div className="grid grid-cols-3 gap-2">
                {VEHICLE_PRESETS.map((preset) => {
                  const isSel = modalTempVehicleType === preset.type;
                  return (
                    <button
                      key={preset.type}
                      type="button"
                      onClick={() => {
                        setModalTempVehicleType(preset.type);
                        setModalTempVehicleModelName(preset.label);
                        const defEng = preset.engines[1] || preset.engines[0];
                        setModalTempEngineName(defEng.name);
                        setModalTempBaseL100(defEng.baseL100);
                      }}
                      className={`p-2 rounded-2xl border text-center transition flex flex-col items-center justify-between cursor-pointer active:scale-95 ${
                        isSel
                          ? 'bg-sky-500/20 border-sky-400 text-white shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                          : 'bg-[#182030] border-slate-700/80 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-12 h-10 flex items-center justify-center">
                        {renderMarchaVehicle3D(preset.type, 42)}
                      </div>
                      <div className="text-[11px] font-black truncate w-full mt-1">
                        {preset.shortLabel}
                      </div>
                      <div className="text-[9px] text-sky-400 font-mono font-bold">
                        {preset.defaultBaseL100} L/100
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Motorización Investigada para la categoría */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                2. Motor & Cilindrada
              </label>
              <div className="space-y-2">
                {(
                  UNIFIED_VEHICLE_CATALOG[modalTempVehicleType]?.engines ||
                  UNIFIED_VEHICLE_CATALOG.sedan.engines
                ).map((eng) => {
                  const isSel = modalTempEngineName === eng.name;
                  return (
                    <button
                      key={eng.key}
                      type="button"
                      onClick={() => {
                        setModalTempEngineName(eng.name);
                        setModalTempBaseL100(eng.baseL100);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between active:scale-98 ${
                        isSel
                          ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/20 border-sky-400 text-white shadow-sm'
                          : 'bg-[#161D2B] border-slate-700/70 text-slate-300 hover:bg-[#1E2738]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-black truncate text-white">{eng.name}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{eng.displacement} • {eng.powerCV}</div>
                        <div className="text-[9px] text-slate-500 truncate mt-0.5">{eng.description}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sky-400 font-black text-xs block">{eng.baseL100.toFixed(1)}</span>
                        <span className="text-[9px] text-slate-500">L/100km</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Transmisión */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                3. Transmisión
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalTempTransmission('manual')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-black transition cursor-pointer ${
                    modalTempTransmission === 'manual'
                      ? 'bg-sky-500/20 border-sky-400 text-white'
                      : 'bg-[#1A202C] border-slate-700/60 text-slate-400'
                  }`}
                >
                  Manual (x1.0)
                </button>
                <button
                  type="button"
                  onClick={() => setModalTempTransmission('automatic')}
                  className={`p-2.5 rounded-xl border text-center text-xs font-black transition cursor-pointer ${
                    modalTempTransmission === 'automatic'
                      ? 'bg-sky-500/20 border-sky-400 text-white'
                      : 'bg-[#1A202C] border-slate-700/60 text-slate-400'
                  }`}
                >
                  Automática (+8%)
                </button>
              </div>
            </div>

            {/* Summary preview */}
            <div className="p-3 rounded-2xl bg-black/40 border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px]">Vehículo a sincronizar:</span>
                <span className="font-bold text-white text-xs truncate">
                  {modalTempVehicleModelName || modalTempEngineName}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Consumo calibrado:</span>
                <span className="font-mono font-black text-sky-400 text-sm">
                  {(modalTempBaseL100 * (modalTempTransmission === 'automatic' ? 1.08 : 1.0)).toFixed(1)} L/100km
                </span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyVehicleConfig}
                className="flex-1 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-black text-xs shadow-md shadow-sky-500/25 cursor-pointer active:scale-95 transition"
              >
                Aplicar y Sincronizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL LISTA DE COMBUSTIBLES (Imagen 3) ---------------- */}
      {showFuelPickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF4F00]/20 text-[#FF4F00] flex items-center justify-center">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Seleccionar Combustible</h3>
                  <p className="text-[10px] text-slate-400">Cambia en vivo o programa tu tipo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFuelPickerModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {(['Gas LPG', 'Gasolina Pb95', 'Diésel ON'] as FuelKey[]).map((fKey) => {
                const isCurrent = activeFuel === fKey;
                const currentPrice = fuelPrices[fKey] || defaultPrices[selectedCountry]?.[fKey] || 6.09;
                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => initiateFuelChange(fKey)}
                    className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between text-left cursor-pointer ${
                      isCurrent
                        ? 'bg-[#FF4F00]/15 border-[#FF4F00] text-white shadow-md'
                        : 'bg-[#1A202C] border-slate-700/70 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {fKey === 'Gas LPG' ? '🔥' : fKey === 'Diésel ON' ? '🛢️' : '⛽'}
                      </span>
                      <div>
                        <div className="text-xs font-black">{fKey}</div>
                        <div className="text-[10px] text-slate-400">
                          {fKey === 'Gas LPG'
                            ? 'Factor x1.20 • Máximo ahorro'
                            : fKey === 'Diésel ON'
                            ? 'Factor x0.85 • Alta eficiencia'
                            : 'Factor x1.00 • Consumo estándar'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black font-mono text-[#FF4F00]">
                        {currentPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{currency}/L</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed text-center px-2">
              💡 Si cambias de combustible con un viaje en marcha, la app te preguntará si deseas guardar el tramo previo.
            </p>
          </div>
        </div>
      )}

      {/* ---------------- MODAL CONFIRMACIÓN GUARDAR TRAMO AL CAMBIAR COMBUSTIBLE ---------------- */}
      {showSaveSegmentConfirmModal && pendingFuelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#121620] border border-[#FF4F00]/60 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF4F00]/20 text-[#FF4F00] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#FF4F00]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">¿Guardar tramo con {activeFuel}?</h3>
                <p className="text-[10px] text-slate-400">Has registrado actividad con este combustible</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Distancia recorrida:</span>
                <span className="font-bold text-white">{distanceKm.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consumo con {activeFuel}:</span>
                <span className="font-bold text-white">{liveLiters.toFixed(3)} L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gasto generado:</span>
                <span className="font-bold text-[#FF4F00]">{liveCost.toFixed(2)} {currency}</span>
              </div>
            </div>

            {/* Price confirmation for new fuel */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Precio confirmado para {pendingFuelTarget} ({currency}/L):
              </label>
              <input
                type="number"
                step="0.01"
                value={pendingFuelPriceInput}
                onChange={(e) => setPendingFuelPriceInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#080B11] border border-slate-700 text-white font-mono font-bold text-sm focus:border-[#FF4F00] outline-none"
              />
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const pVal = parseFloat(pendingFuelPriceInput) || (fuelPrices[pendingFuelTarget] || fuelPrice);
                  finalizeFuelChange(pendingFuelTarget, pVal, true);
                }}
                className="w-full py-3 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] text-white font-black text-xs shadow-md shadow-[#FF4F00]/25 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Guardar tramo y cambiar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pVal = parseFloat(pendingFuelPriceInput) || (fuelPrices[pendingFuelTarget] || fuelPrice);
                  finalizeFuelChange(pendingFuelTarget, pVal, false);
                }}
                className="w-full py-2.5 rounded-2xl bg-[#1A2234] hover:bg-[#252E3E] text-slate-200 font-bold text-xs"
              >
                Continuar sin guardar
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSaveSegmentConfirmModal(false);
                  setPendingFuelTarget(null);
                }}
                className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL REGISTRAR TANQUEO (UNIFICADO CON SELECTOR SUPERIOR) ---------------- */}
      {showRefuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#FF4F00]" />
                <span>Registrar Tanqueo</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowRefuelModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Suma combustible al tanque y actualiza el precio global del combustible seleccionado.
            </p>

            <div className="space-y-3">
              {/* 1. Selector de combustible en la parte superior */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Combustible a repostar:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Gas LPG', 'Gasolina Pb95', 'Diésel ON'] as FuelKey[]).map((f) => {
                    const isSelected = refuelFuelType === f;
                    const icon = f === 'Gas LPG' ? '🔥' : f === 'Diésel ON' ? '🛢️' : '⛽';
                    const shortLabel = f === 'Gas LPG' ? 'LPG' : f === 'Gasolina Pb95' ? 'Gasolina' : 'Diésel';
                    const storedP = fuelPrices[f] || defaultPrices[selectedCountry]?.[f] || 6.09;

                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => handleSelectRefuelFuel(f)}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#FF4F00]/20 border-[#FF4F00] text-white shadow-[0_0_15px_rgba(255,79,0,0.3)] ring-1 ring-[#FF4F00]'
                            : 'bg-[#080B11] border-slate-700/80 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className="text-base">{icon}</span>
                        <span className="text-[11px] font-black mt-0.5 truncate w-full">{shortLabel}</span>
                        <span className="text-[10px] font-mono text-[#FF4F00] font-bold mt-0.5">
                          {storedP.toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Monto pagado ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej. 100.00"
                  value={refuelAmountInput}
                  onChange={(e) => setRefuelAmountInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080B11] border border-slate-700 text-white font-sans font-bold text-base focus:outline-none focus:border-[#FF4F00]"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Precio por litro ({currency}/L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={refuelPriceInput}
                  onChange={(e) => setRefuelPriceInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080B11] border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-[#FF4F00]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  💡 Al cambiar este valor, se actualiza el precio global de {refuelFuelType} en toda la app.
                </span>
              </div>

              {refuelAmountInput && parseFloat(refuelAmountInput) > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 flex items-center justify-between font-sans">
                  <span>Equivalente:</span>
                  <span>
                    ~{(
                      parseFloat(refuelAmountInput.replace(',', '.')) /
                      (parseFloat(refuelPriceInput.replace(',', '.')) || (fuelPrices[refuelFuelType] || fuelPrice))
                    ).toFixed(2)}{' '}
                    Litros ({refuelFuelType})
                  </span>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRefuelModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRefuel}
                disabled={!refuelAmountInput || parseFloat(refuelAmountInput) <= 0}
                className="flex-1 py-3 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] disabled:opacity-40 text-white font-black text-xs shadow-md shadow-[#FF4F00]/25 cursor-pointer"
              >
                Guardar Tanqueo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL AJUSTAR NIVEL ---------------- */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#FF4F00]" />
                <span>Ajustar Saldo del Tanque</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Modifica directamente el valor disponible en el tanque:
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Saldo en dinero ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={adjustBalanceInput}
                  onChange={(e) => {
                    setAdjustBalanceInput(e.target.value);
                    const val = parseFloat(e.target.value) || 0;
                    if (fuelPrice > 0) {
                      setAdjustLitersInput((val / fuelPrice).toFixed(2));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080B11] border border-slate-700 text-white font-sans font-bold text-base focus:outline-none focus:border-[#FF4F00]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  O ingresar directamente en Litros (L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={adjustLitersInput}
                  onChange={(e) => {
                    setAdjustLitersInput(e.target.value);
                    const l = parseFloat(e.target.value) || 0;
                    setAdjustBalanceInput((l * fuelPrice).toFixed(2));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080B11] border border-slate-700 text-white font-sans font-bold text-base focus:outline-none focus:border-[#FF4F00]"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustLevel}
                className="flex-1 py-3 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] text-white font-black text-xs shadow-md shadow-[#FF4F00]/25"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Profile & Supabase Account Info Modal */}
      <UserAccountModal
        isOpen={showUserAccountModal}
        onClose={() => setShowUserAccountModal(false)}
        currentUser={currentUser}
        onLogout={() => {
          signOutSupabase();
          window.location.reload();
        }}
      />
    </div>
  );
};
