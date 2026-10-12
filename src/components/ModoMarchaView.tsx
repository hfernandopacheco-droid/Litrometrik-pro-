import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { clearSupabaseTrips, signOutSupabase, insertSupabaseRefuel } from '../utils/supabaseClient';
import { UserAccountModal } from './UserAccountModal';
import { VehicleType, TransmissionType } from '../types';
import {
  UNIFIED_VEHICLE_CATALOG,
  UnifiedEngineSpec,
  UnifiedVehicleCategory,
  getActiveVehicleState,
  saveActiveVehicleState,
  formatFuelEconomy,
  getFuelDisplayName,
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
  onLogout?: () => void;
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
  tipoRegistro?: 'viaje' | 'repostaje';
  estacion?: string;
}

const VEHICLE_PRESETS: UnifiedVehicleCategory[] = Object.values(UNIFIED_VEHICLE_CATALOG);

export const ModoMarchaView: React.FC<ModoMarchaViewProps> = ({
  selectedCountry,
  onCountryChange,
  currentUser,
  onLogout,
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
  const [liveMovingLiters, setLiveMovingLiters] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('litrometrik_active_trip');
      if (saved) return JSON.parse(saved).liveMovingLiters || 0;
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

  // Interactive Explanatory Modals for 4 Cluster Cards & Engine Info
  const [selectedClusterCardInfo, setSelectedClusterCardInfo] = useState<'distancia' | 'consumo' | 'gasto' | 'rendimiento' | 'tanque' | null>(null);
  const [selectedEngineForInfo, setSelectedEngineForInfo] = useState<UnifiedEngineSpec | null>(null);
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
          'Gasolina Pb95': parsed['Gasolina Pb95'] !== undefined ? parsed['Gasolina Pb95'] : def['Gasolina Pb95'],
          'Gas LPG': parsed['Gas LPG'] !== undefined ? parsed['Gas LPG'] : (parsed['Gas GLP / LPG'] !== undefined ? parsed['Gas GLP / LPG'] : (parsed['LPG'] !== undefined ? parsed['LPG'] : def['Gas LPG'])),
          'Diésel ON': parsed['Diésel ON'] !== undefined ? parsed['Diésel ON'] : (parsed['Diesel ON'] !== undefined ? parsed['Diesel ON'] : def['Diésel ON']),
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
          'Gasolina Pb95': parsed['Gasolina Pb95'] !== undefined ? parsed['Gasolina Pb95'] : def['Gasolina Pb95'],
          'Gas LPG': parsed['Gas LPG'] !== undefined ? parsed['Gas LPG'] : (parsed['Gas GLP / LPG'] !== undefined ? parsed['Gas GLP / LPG'] : (parsed['LPG'] !== undefined ? parsed['LPG'] : def['Gas LPG'])),
          'Diésel ON': parsed['Diésel ON'] !== undefined ? parsed['Diésel ON'] : (parsed['Diesel ON'] !== undefined ? parsed['Diesel ON'] : def['Diésel ON']),
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

  // Último tanqueo guardado reactivo
  const [ultimoTanqueo, setUltimoTanqueo] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('litrometrik_ultimo_tanqueo');
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  });

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
    setLiveMovingLiters(0);
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

  // Helper to load all trips and refuel records seamlessly
  const loadMergedHistory = (): ViajeRegistro[] => {
    const list: ViajeRegistro[] = [];
    const idSet = new Set<string>();

    try {
      const storedTrips = localStorage.getItem('historial_viajes');
      if (storedTrips) {
        const parsed = JSON.parse(storedTrips);
        if (Array.isArray(parsed)) {
          parsed.forEach((t) => {
            if (t && t.id && !idSet.has(t.id)) {
              idSet.add(t.id);
              list.push(t);
            }
          });
        }
      }
    } catch (_) {}

    try {
      const uid = currentUser?.uid || 'guest';
      const refuelsRaw =
        localStorage.getItem(`litrometrik_${uid}_repostajes`) ||
        localStorage.getItem('litrometrik_repostajes') ||
        localStorage.getItem('litrometrik_guest_repostajes');
      if (refuelsRaw) {
        const parsedRefuels = JSON.parse(refuelsRaw);
        if (Array.isArray(parsedRefuels)) {
          parsedRefuels.forEach((r) => {
            if (r && r.id && !idSet.has(r.id)) {
              idSet.add(r.id);
              list.push({
                id: r.id,
                timestamp: r.createdAt || new Date().toISOString(),
                date: r.refuelDate || (r.createdAt ? r.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
                km: 0,
                litros: Number(r.liters) || 0,
                costo: Number(r.cost) || 0,
                combustible: r.fuelType || 'Gas LPG',
                precioLitro: Number(r.pricePerLiter) || 0,
                moneda: r.moneda || currency,
                pais: r.pais || selectedCountry,
                vehicleType: vehicleType,
                tipoRegistro: 'repostaje',
                estacion: r.station || r.title || 'Estación',
              });
            }
          });
        }
      }
    } catch (_) {}

    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  };

  // Period filter for Chart & History
  const [filtroPeriodo, setFiltroPeriodo] = useState<TimeFilterPeriod>('DIA');
  const [historialViajes, setHistorialViajes] = useState<ViajeRegistro[]>(loadMergedHistory);

  // Synchronize storage from external tab updates
  useEffect(() => {
    const handleStorageSync = () => {
      try {
        const storedTanks = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
        if (storedTanks) {
          try {
            const parsed = JSON.parse(storedTanks);
            setFuelTanks((prev) => ({
              'Gasolina Pb95': parsed['Gasolina Pb95'] !== undefined ? parsed['Gasolina Pb95'] : prev['Gasolina Pb95'],
              'Gas LPG': parsed['Gas LPG'] !== undefined ? parsed['Gas LPG'] : (parsed['Gas GLP / LPG'] !== undefined ? parsed['Gas GLP / LPG'] : prev['Gas LPG']),
              'Diésel ON': parsed['Diésel ON'] !== undefined ? parsed['Diésel ON'] : prev['Diésel ON'],
            }));
          } catch (_) {}
        }
        const storedActive = localStorage.getItem('litrometrik_active_fuel') as FuelKey;
        if (storedActive && (storedActive === 'Gas LPG' || storedActive === 'Gasolina Pb95' || storedActive === 'Diésel ON')) {
          setActiveFuel(storedActive);
          activeFuelRef.current = storedActive;
        }
        const merged = loadMergedHistory();
        setHistorialViajes(merged);
        const storedUltimo = localStorage.getItem('litrometrik_ultimo_tanqueo');
        if (storedUltimo) {
          try {
            setUltimoTanqueo(JSON.parse(storedUltimo));
          } catch (_) {}
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
  }, [selectedCountry]);

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
  const lastGpsPositionUpdateTimeRef = useRef<number>(0);

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
          liveMovingLiters,
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
  }, [isRunning, distanceKm, liveLiters, liveMovingLiters, liveCost, elapsedSeconds, movingSeconds, idleSeconds, activeFuel, isACActive]);

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

      const fuelFactor = isLpg ? 1.20 : isDiesel ? 0.85 : 1.0;
      // Compressor A/C adds +0.5 L/h load in idle (estricto según arquitectura)
      const acIdleAdd = isAC ? 0.50 : 0.0;
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

      // Sincronización continua de avance: si el GPS satelital no ha enviado delta en los últimos 1.5s
      const now = Date.now();
      if (now - lastGpsPositionUpdateTimeRef.current > 1500) {
        const deltaKm = (speed * deltaSec) / 3600;
        const transMult = transmissionRef.current === 'automatic' ? 1.08 : 1.0;
        const fuelMult = isLpg ? 1.20 : isDiesel ? 0.85 : 1.0;
        const acAdd = isAC ? 0.60 : 0.0;
        const currentRateL100 = (baseConsumptionL100Ref.current * transMult * fuelMult) + acAdd;
        const movingBurnedLiters = (deltaKm * currentRateL100) / 100;

        setDistanceKm((prevKm) => prevKm + deltaKm);
        setLiveMovingLiters((prevMov) => prevMov + movingBurnedLiters);
        setLiveLiters((prevL) => {
          const nextL = prevL + movingBurnedLiters;
          setLiveCost(nextL * fuelPriceRef.current);
          return nextL;
        });
      }
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
                lastGpsPositionUpdateTimeRef.current = now;
                setDistanceKm((prevKm) => {
                  const nextKm = prevKm + delta;
                  updatedKm = nextKm;

                  // Dynamic consumption factor based on selected vehicle, engine, transmission, fuel and A/C
                  const transMult = transmissionRef.current === 'automatic' ? 1.08 : 1.0;
                  const fuelMult =
                    activeFuelRef.current === 'Gas LPG' ? 1.20 :
                    activeFuelRef.current === 'Diésel ON' ? 0.85 : 1.0;
                  const acAdd = isACActiveRef.current ? 0.60 : 0.0;
                  const currentRateL100 = (baseConsumptionL100Ref.current * transMult * fuelMult) + acAdd;

                  const movingBurnedLiters = (delta * currentRateL100) / 100;

                  setLiveMovingLiters((prevMov) => prevMov + movingBurnedLiters);

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
    setLiveMovingLiters(0);
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

    let latestMap = { ...fuelTanks };
    try {
      const stored = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
      if (stored) {
        latestMap = { ...latestMap, ...JSON.parse(stored) };
      }
    } catch (_) {}

    // Deduct accumulated cost and liters from previous fuel if running
    if (liveCost > 0 || liveLiters > 0) {
      const cur = latestMap[activeFuel] || { balance: 0, liters: 0 };
      const newBal = Math.max(0, Math.round((cur.balance - liveCost) * 100) / 100);
      const newLit = Math.max(0, Math.round(((cur.liters || (fuelPrice > 0 ? cur.balance / fuelPrice : 0)) - liveLiters) * 100) / 100);
      latestMap = {
        ...latestMap,
        [activeFuel]: { ...cur, balance: newBal, liters: newLit },
      };
      setLiveCost(0);
      setLiveLiters(0);
    }

    const targetBal = latestMap[targetFuel]?.balance ?? 0;
    const p = fuelPrices[targetFuel] || defaultPrices[selectedCountry]?.[targetFuel] || 2.89;

    try {
      localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(latestMap));
      localStorage.setItem('litrometrik_active_fuel', targetFuel);
      localStorage.setItem('fuel_price_per_liter', p.toString());
      localStorage.setItem('litrometrik_base_fuel_balance_pln', targetBal.toString());
      localStorage.setItem('litrometrik_fuel_balance_pln', targetBal.toFixed(2));
      localStorage.setItem('fuel_balance_pln', targetBal.toFixed(2));
      localStorage.setItem('currentFuelBalancePLN', targetBal.toFixed(2));
    } catch (_) {}

    setFuelTanks(latestMap);
    setActiveFuel(targetFuel);
    activeFuelRef.current = targetFuel;
    setFuelPrice(p);
    fuelPriceRef.current = p;

    window.dispatchEvent(new Event('fuel-storage-updated'));
    window.dispatchEvent(new Event('storage'));

    const shortLabel = targetFuel === 'Gas LPG' ? 'LPG' : targetFuel === 'Diésel ON' ? 'Diésel' : 'Gasolina';
    setNotification(`⛽ Conmutado a ${shortLabel} (${p.toFixed(2)} ${currency}/L) • Tanque y modo en vivo sincronizados`);
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

  // ---------------- VEHICLE CALIBRATION APPLY & CANCEL ----------------
  const handleCancelVehicleModal = () => {
    setModalTempVehicleType(vehicleType);
    setModalTempEngineName(engineName);
    setModalTempBaseL100(baseConsumptionL100);
    setModalTempTransmission(transmission);
    setModalTempVehicleModelName(activeVehicleState.vehicleModelName || '');
    setShowVehicleModal(false);
  };

  const handleApplyVehicleConfig = () => {
    setVehicleType(modalTempVehicleType);
    setEngineName(modalTempEngineName);
    setBaseConsumptionL100(modalTempBaseL100);
    setTransmission(modalTempTransmission);

    const cat = UNIFIED_VEHICLE_CATALOG[modalTempVehicleType] || UNIFIED_VEHICLE_CATALOG.sedan;
    const matchEng = cat.engines.find((e) => e.name === modalTempEngineName) || cat.engines[0];
    const engineShort = (matchEng.name.match(/\d+\.\d+L/) || [])[0] || matchEng.name.split(' ')[0];
    const modelName = `${cat.shortLabel} (${engineShort})`;

    saveActiveVehicleState({
      vehicleType: modalTempVehicleType as any,
      engineKey: matchEng.key,
      engineName: matchEng.name,
      displacement: matchEng.displacement,
      baseL100: modalTempBaseL100,
      transmission: modalTempTransmission,
      vehicleModelName: modelName,
    });

    setShowVehicleModal(false);
    setNotification(`🚗 Vehículo calibrado: ${modelName} • ${matchEng.name} (${modalTempBaseL100} L/100km base)`);
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

    const addedLiters = finalPrice > 0 ? Math.round((amount / finalPrice) * 100) / 100 : 0;

    // 2. Leer mapa más reciente para evitar sobreescritura de tanques
    let currentMap: FuelTankMap = { ...fuelTanks };
    try {
      const stored = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
      if (stored) {
        currentMap = { ...currentMap, ...JSON.parse(stored) };
      }
    } catch (_) {}

    // Si el combustible a tanquear es el actualmente activo, su base es el saldo actual (restando consumo en vivo)
    // Si es otro combustible, el combustible previo conserva su saldo descontado
    if (targetFuelKey !== activeFuel && (liveCost > 0 || liveLiters > 0)) {
      const curActive = currentMap[activeFuel] || { balance: 0, liters: 0 };
      currentMap[activeFuel] = {
        ...curActive,
        balance: currentFuelBalance,
        liters: currentRemainingLiters,
      };
    }

    const prevTank = currentMap[targetFuelKey] || { balance: 0, liters: 0 };
    const prevBal = targetFuelKey === activeFuel ? currentFuelBalance : (Number(prevTank.balance) || 0);
    const nextBal = Math.round((prevBal + amount) * 100) / 100;
    const prevLit = targetFuelKey === activeFuel ? currentRemainingLiters : (Number(prevTank.liters) || (finalPrice > 0 ? prevBal / finalPrice : 0));
    const nextLit = Math.round((prevLit + addedLiters) * 100) / 100;

    const nextMap: FuelTankMap = {
      ...currentMap,
      [targetFuelKey]: {
        balance: nextBal,
        liters: nextLit,
        lastRefuelAmount: amount,
        lastRefuelPrice: finalPrice,
        lastRefuelDate: new Date().toISOString(),
      },
    };

    // 3. Persistir INMEDIATAMENTE en localStorage antes de emitir ningún evento
    try {
      localStorage.setItem(`litrometrik_tanks_${selectedCountry}`, JSON.stringify(nextMap));
      localStorage.setItem('litrometrik_base_fuel_balance_pln', nextBal.toString());
      localStorage.setItem('litrometrik_fuel_balance_pln', nextBal.toFixed(2));
      localStorage.setItem('fuel_balance_pln', nextBal.toFixed(2));
      localStorage.setItem('currentFuelBalancePLN', nextBal.toFixed(2));
      localStorage.setItem('litrometrik_active_fuel', targetFuelKey);
      localStorage.setItem('fuel_price_per_liter', finalPrice.toString());
    } catch (_) {}

    // Actualizar estado reactivo de tanques
    setFuelTanks(nextMap);

    // 4. Activar de inmediato ese combustible para reflejar el saldo en su botón, pantalla y modo en vivo
    setActiveFuel(targetFuelKey);
    activeFuelRef.current = targetFuelKey;
    setFuelPrice(finalPrice);
    fuelPriceRef.current = finalPrice;
    setLiveCost(0);
    setLiveLiters(0);

    try {
      const uid = currentUser?.uid || currentUser?.id || 'guest';
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
      localStorage.setItem('litrometrik_repostajes', JSON.stringify(refuels));
      localStorage.setItem('litrometrik_guest_repostajes', JSON.stringify(refuels));
      localStorage.setItem('litrometrik_ultimo_tanqueo', JSON.stringify(newRefuelEntry));
      setUltimoTanqueo(newRefuelEntry);

      // Sincronizar inmediatamente con el historial de Modo Marcha para que aparezca visible de inmediato
      const viajeRefuelEntry: ViajeRegistro = {
        id: newRefuelEntry.id,
        timestamp: newRefuelEntry.createdAt,
        date: newRefuelEntry.refuelDate,
        km: 0,
        litros: addedLiters,
        costo: amount,
        combustible: targetFuelKey,
        precioLitro: finalPrice,
        moneda: currency,
        pais: selectedCountry,
        vehicleType: vehicleType,
        tipoRegistro: 'repostaje',
        estacion: defaultStation,
      };

      setHistorialViajes((prev) => {
        const next = [viajeRefuelEntry, ...prev.filter((h) => h.id !== viajeRefuelEntry.id)];
        try {
          localStorage.setItem('historial_viajes', JSON.stringify(next));
        } catch (_) {}
        return next;
      });

      if (uid && uid !== 'guest' && uid !== 'guest_user') {
        saveCloudRecord(uid, 'repostajes', newRefuelEntry);
        insertSupabaseRefuel(uid, {
          estacion: defaultStation,
          litros: addedLiters,
          precio_por_litro: finalPrice,
          costo_total: amount,
          odometro: 145500 + Math.round(distanceKm),
          combustible: targetFuelKey,
          notas: `Repostaje ${shortName} desde Modo Marcha`,
        }).catch((e) => console.warn('Supabase refuel sync notice:', e));

        saveCloudVehicleConfig(uid, {
          fuelBalance: Math.max(0, nextBal - (targetFuelKey === activeFuel ? liveCost : 0)),
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

    let currentMap: FuelTankMap = { ...fuelTanks };
    try {
      const stored = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
      if (stored) currentMap = { ...currentMap, ...JSON.parse(stored) };
    } catch (_) {}

    const updated: FuelTankMap = {
      ...currentMap,
      [activeFuel]: {
        ...currentMap[activeFuel],
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

    setFuelTanks(updated);
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
      let currentMap: FuelTankMap = { ...fuelTanks };
      try {
        const stored = localStorage.getItem(`litrometrik_tanks_${selectedCountry}`);
        if (stored) currentMap = { ...currentMap, ...JSON.parse(stored) };
      } catch (_) {}

      const updated: FuelTankMap = {
        ...currentMap,
        [activeFuel]: {
          ...currentMap[activeFuel],
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

      setFuelTanks(updated);
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
              setModalTempVehicleModelName(activeVehicleState.vehicleModelName || activeVehiclePreset.label);
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
                  {formatFuelEconomy(baseConsumptionL100, selectedCountry)} base • {transmission === 'automatic' ? 'Automático' : 'Manual'}
                  {isACActive ? ' • A/C Encendido' : ' • Modo Eco'}
                </p>
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-sky-400 transition ml-2" />
          </button>
        </div>

        {/* ---------------- 4 CAMPOS INTEGRADOS CON ESTILO MÁS GORDITO, NÚMEROS MÁS GRANDES Y CÍRCULO CENTRAL KM/H CON CRONÓMETRO ---------------- */}
        <div className="relative select-none">
          {/* 2x2 Cluster de las 4 tarjetas envolviendo el velocímetro con interactividad y estética LitroMetrik Pro */}
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
            {/* Campo 1: DISTANCIA (Top-Left) - Clickeable con información interactiva */}
            <div
              onClick={() => setSelectedClusterCardInfo('distancia')}
              title="Toca para ver explicación de Distancia"
              className="relative min-h-[136px] sm:min-h-[146px] p-3.5 sm:p-4 rounded-tl-3xl rounded-tr-xl rounded-bl-xl rounded-br-[52px] bg-[#131927]/95 border border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-slate-700 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left items-start overflow-hidden group"
            >
              <div>
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-400 uppercase block group-hover:text-sky-400 transition">
                  DISTANCIA
                </span>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-sans text-white tracking-tight mt-1">
                  {distanceKm.toFixed(2).replace('.', ',')} <span className="text-xs sm:text-sm font-bold text-slate-400">km</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {liveMovingLiters.toFixed(2).replace('.', ',')} L mov.
              </p>
            </div>

            {/* Campo 2: CONSUMO EN VIVO (Top-Right) - Clickeable con información interactiva */}
            <div
              onClick={() => setSelectedClusterCardInfo('consumo')}
              title="Toca para ver explicación de Consumo en Vivo"
              className="relative min-h-[136px] sm:min-h-[146px] p-3.5 sm:p-4 rounded-tr-3xl rounded-tl-xl rounded-br-xl rounded-bl-[52px] bg-[#131927]/95 border border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-slate-700 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-right items-end overflow-hidden group"
            >
              <div>
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-400 uppercase block group-hover:text-sky-400 transition">
                  CONSUMO EN VIVO
                </span>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-sans text-white tracking-tight mt-1">
                  {liveLiters.toFixed(3).replace('.', ',')} <span className="text-xs sm:text-sm font-bold text-slate-400">L</span>
                </div>
              </div>
              <div className="flex items-center justify-end">
                {isRunning ? (
                  currentSpeed < 3 ? (
                    <span className="text-[10px] sm:text-[11px] text-amber-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>
                        En reposo / ralentí (
                        {(
                          (vehicleType === 'compact' ? 0.70 : vehicleType === 'suv' ? 1.10 : 0.85) *
                            (activeFuel === 'Gas LPG' ? 1.20 : activeFuel === 'Diésel ON' ? 0.85 : 1.0) +
                          (isACActive ? 0.50 : 0.0)
                        )
                          .toFixed(1)
                          .replace('.', ',')}{' '}
                        L/h)
                      </span>
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>
                        En movimiento (
                        {formatFuelEconomy(
                          baseConsumptionL100 *
                            (transmission === 'automatic' ? 1.08 : 1.0) *
                            (activeFuel === 'Gas LPG' ? 1.20 : activeFuel === 'Diésel ON' ? 0.85 : 1.0) +
                            (isACActive ? 0.60 : 0.0),
                          selectedCountry
                        )}
                        )
                      </span>
                    </span>
                  )
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium">
                    En reposo
                  </p>
                )}
              </div>
            </div>

            {/* Campo 3: GASTO EN VIVO (Bottom-Left) - Clickeable con información interactiva */}
            <div
              onClick={() => setSelectedClusterCardInfo('gasto')}
              title="Toca para ver explicación de Gasto en Vivo"
              className="relative min-h-[136px] sm:min-h-[146px] p-3.5 sm:p-4 rounded-bl-3xl rounded-tl-xl rounded-br-xl rounded-tr-[52px] bg-[#131927]/95 border border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-slate-700 active:scale-[0.98] transition-all cursor-pointer flex flex-col justify-between text-left items-start overflow-hidden group"
            >
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-slate-400 uppercase group-hover:text-[#FF5722] transition">
                  GASTO EN VIVO
                </span>
                <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1">
                  <span>
                    {activeFuel === 'Gas LPG'
                      ? selectedCountry === 'CO' || selectedCountry === 'MX' ? '🔥 Gas GLP' : '🔥 LPG'
                      : activeFuel === 'Diésel ON' ? '🛢️ Diésel' : '⛽ Gasolina'}
                  </span>
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black font-sans text-[#FF5722] tracking-tight">
                  {liveCost.toFixed(2).replace('.', ',')} <span className="text-xs sm:text-sm font-bold text-slate-300">{currency}</span>
                </div>

                <div className="text-[11px] text-slate-400 font-bold truncate mt-0.5">
                  Combustible: {getFuelDisplayName(activeFuel, selectedCountry)}
                </div>
              </div>
            </div>

            {/* Campo 4: RITMO INSTANTÁNEO Y A/C (Bottom-Right) - Clickeable (A/C con e.stopPropagation) */}
            <div
              onClick={() => setSelectedClusterCardInfo('rendimiento')}
              title="Toca la tarjeta para ver explicación de Ritmo Instantáneo y A/C"
              className={`relative min-h-[136px] sm:min-h-[146px] p-3.5 sm:p-4 rounded-br-3xl rounded-tr-xl rounded-bl-xl rounded-tl-[52px] border transition-all duration-300 flex flex-col justify-between text-right items-end cursor-pointer select-none overflow-hidden group ${
                isACActive
                  ? 'bg-gradient-to-br from-[#0B2138] via-[#0A1A2C] to-[#121620] border-cyan-400/80 shadow-[0_0_25px_rgba(0,212,255,0.2)] ring-1 ring-cyan-400/30'
                  : 'bg-[#131927]/95 border-slate-800/90 shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-slate-700 active:scale-[0.98]'
              }`}
            >
              {/* Header con aire A/C y switch táctil simétrico a la derecha con e.stopPropagation() */}
              <div className="flex items-center justify-end space-x-2 w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAC();
                  }}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xl border text-[10px] font-black tracking-tight transition-all shadow-sm shrink-0 whitespace-nowrap cursor-pointer ${
                    isACActive
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-cyan-500/20'
                      : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Snowflake
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isACActive ? 'text-cyan-300 animate-spin' : 'text-slate-400'
                    }`}
                  />
                  <span>aire A/C</span>
                </button>

                {/* Tactile Switch Toggle */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAC();
                  }}
                  className={`w-8 h-4.5 rounded-full transition-colors flex items-center px-0.5 shadow-inner shrink-0 cursor-pointer ${
                    isACActive ? 'bg-[#00D4FF] justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform" />
                </div>
              </div>

              <div>
                {/* Consumo Instantáneo en Marcha / Ralentí */}
                <div className="flex items-baseline justify-end space-x-1">
                  <span
                    className={`text-2xl sm:text-3xl lg:text-4xl font-black font-sans tracking-tight transition-colors ${
                      isACActive
                        ? 'text-cyan-400 drop-shadow-[0_0_12px_rgba(0,212,255,0.6)]'
                        : 'text-white'
                    }`}
                  >
                    {(() => {
                      if (!isRunning) {
                        return '0,0';
                      }
                      if (currentSpeed < 3) {
                        // Ralentí detenido en L/h
                        const idleLh =
                          (vehicleType === 'compact' ? 0.70 : vehicleType === 'suv' ? 1.10 : 0.85) *
                            (activeFuel === 'Gas LPG' ? 1.20 : activeFuel === 'Diésel ON' ? 0.85 : 1.0) +
                          (isACActive ? 0.50 : 0.0);
                        return idleLh.toFixed(1).replace('.', ',');
                      }
                      // En marcha: nunca 0,0 mientras el coche ruede
                      const movingRateL100 =
                        baseConsumptionL100 *
                          (transmission === 'automatic' ? 1.08 : 1.0) *
                          (activeFuel === 'Gas LPG' ? 1.20 : activeFuel === 'Diésel ON' ? 0.85 : 1.0) +
                        (isACActive ? 0.60 : 0.0);

                      if (selectedCountry === 'CO' || selectedCountry === 'MX') {
                        const kmPerLiter = movingRateL100 > 0 ? 100 / movingRateL100 : 0;
                        return kmPerLiter.toFixed(1).replace('.', ',');
                      }
                      return movingRateL100.toFixed(1).replace('.', ',');
                    })()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-400">
                    {isRunning && currentSpeed < 3
                      ? 'L/h'
                      : selectedCountry === 'CO' || selectedCountry === 'MX'
                      ? 'km/L'
                      : 'L/100km'}
                  </span>
                </div>
                <p
                  className={`text-[10px] sm:text-[11px] font-bold mt-0.5 truncate text-right ${
                    isACActive ? 'text-cyan-300' : 'text-slate-500'
                  }`}
                >
                  {isACActive
                    ? `Compresor Activo (+0.6 L/100 • +0.5 L/h)`
                    : isRunning && currentSpeed >= 3
                    ? 'Ritmo Instantáneo (Eco)'
                    : 'Compresor Apagado (0.0)'}
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
                  {isRunning ? (currentSpeed < 3 ? 'DETENIDO' : 'EN MARCHA') : 'PAUSADO'}
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

        {/* Simulador / Test de Velocidad GPS (Disponible cuando el cronómetro está en marcha) */}
        {isRunning && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-2xl bg-[#0F1420]/80 border border-slate-800/80 text-[10px] text-slate-400">
            <span className="font-bold flex items-center space-x-1 text-slate-400">
              <Navigation className="w-3 h-3 text-[#00D4FF]" />
              <span>Simular GPS:</span>
            </span>
            <div className="flex items-center space-x-1.5">
              {[0, 45, 80, 120].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCurrentSpeed(s)}
                  className={`px-2 py-0.5 rounded-lg border font-mono font-bold transition cursor-pointer active:scale-95 ${
                    currentSpeed === s
                      ? 'bg-[#00D4FF]/20 border-[#00D4FF] text-[#00D4FF]'
                      : 'bg-slate-800/90 border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  {s} km/h
                </button>
              ))}
            </div>
          </div>
        )}

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
            <div
              onClick={() => setSelectedClusterCardInfo('tanque')}
              className="flex items-center justify-between flex-wrap gap-2 cursor-pointer group"
              title="Toca para ver explicación de Reserva de Tanque y Combustible Activo"
            >
              <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase group-hover:text-amber-400 transition">
                SALDO RESTANTE EN TANQUE
              </span>
              <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-[#1A202C] border border-slate-700/80 text-xs font-sans font-bold text-slate-200 group-hover:border-amber-400/60 transition">
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
                      {tankVal.toFixed(1).replace('.', ',')} {currency}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Giant Amount - Orange or Glowing Red if in Reserve */}
          <div
            onClick={() => setSelectedClusterCardInfo('tanque')}
            className="flex items-baseline justify-between cursor-pointer group"
            title="Toca para ver explicación de Reserva de Tanque y Combustible Activo"
          >
            <div
              className={`text-4xl sm:text-5xl font-black font-sans tracking-tight transition-colors group-hover:brightness-110 ${
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
                {viajesFiltrados.map((v) => {
                  const isRepostaje = v.tipoRegistro === 'repostaje';
                  const shortFuel = v.combustible === 'Gas LPG' ? 'LPG' : v.combustible === 'Diésel ON' ? 'Diésel' : 'Gasolina';
                  return (
                    <div
                      key={v.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm transition ${
                        isRepostaje
                          ? 'bg-gradient-to-r from-emerald-950/30 to-[#121620] border-emerald-500/30'
                          : 'bg-[#121620] border-slate-800/80'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>{v.date || new Date(v.timestamp).toLocaleDateString('es-ES')}</span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                            isRepostaje
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-[#1A202C] text-[#FF4F00]'
                          }`}>
                            {isRepostaje ? `⛽ Repostaje ${shortFuel}` : shortFuel}
                          </span>
                          {v.isACActive && (
                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-black">
                              A/C
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {isRepostaje ? (
                            <span>
                              +{v.litros.toFixed(2)} L @ {v.precioLitro.toFixed(2)} {currency}/L
                              {v.estacion ? ` • ${v.estacion}` : ''}
                            </span>
                          ) : (
                            <span>
                              {v.km.toFixed(2)} km • {v.litros.toFixed(2)} L
                              {v.durationSeconds ? ` • ${formatTime(v.durationSeconds)}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-black font-sans ${
                          isRepostaje ? 'text-emerald-400' : 'text-[#FF4F00]'
                        }`}>
                          {isRepostaje ? `+${v.costo.toFixed(2)}` : `${v.costo.toFixed(2)}`} {currency}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ---------------- MODAL SELECCIONAR / CALIBRAR VEHÍCULO Y MOTORIZACIÓN INVESTIGADA ---------------- */}
      {showVehicleModal && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-between sm:justify-center items-center p-3 sm:p-4 pb-20 sm:pb-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#111622] border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-5.5rem)] sm:max-h-[580px] overflow-hidden">
            {/* Header Fijo */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-[#111622]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Vehículo y Motorización Real</h3>
                  <p className="text-[10px] text-slate-400">Datos técnicos oficiales WLTP y consumo calibrado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelVehicleModal}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo con Scroll Suave e Independiente (con min-h-0 para garantizar que el footer permanezca fijo y visible) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
              {/* 1. Categoría de Vehículo */}
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
                          const defEng = preset.engines[1] || preset.engines[0];
                          const engineShort = (defEng.name.match(/\d+\.\d+L/) || [])[0] || defEng.name.split(' ')[0];
                          setModalTempVehicleModelName(`${preset.shortLabel} (${engineShort})`);
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
                          {formatFuelEconomy(preset.defaultBaseL100, selectedCountry)}
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
                    const isSel = modalTempEngineName === (eng.nombreComun || eng.name);
                    return (
                      <div
                        key={eng.key || eng.id}
                        onClick={() => {
                          setModalTempEngineName(eng.nombreComun || eng.name);
                          setModalTempBaseL100(eng.consumoBaseL100 || eng.baseL100);
                          const cat = UNIFIED_VEHICLE_CATALOG[modalTempVehicleType] || UNIFIED_VEHICLE_CATALOG.sedan;
                          setModalTempVehicleModelName(`${cat.shortLabel} (${eng.nombreComun || eng.name})`);
                        }}
                        className={`w-full p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between active:scale-[0.99] select-none ${
                          isSel
                            ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/20 border-sky-400 text-white shadow-sm'
                            : 'bg-[#161D2B] border-slate-700/70 text-slate-300 hover:bg-[#1E2738]'
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-black truncate text-white">{eng.nombreComun || eng.name}</div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">{eng.cc || eng.displacement} • {eng.cilindrosPotencia || eng.powerCV}</div>
                          <div className="text-[9px] text-slate-500 truncate mt-0.5">{eng.descripcionBreve || eng.description}</div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="text-right">
                            <span className="font-mono text-sky-400 font-black text-xs block">
                              {formatFuelEconomy(eng.consumoBaseL100 || eng.baseL100, selectedCountry)}
                            </span>
                          </div>

                          {/* Botón de Información (?) con stopPropagation */}
                          {eng.detalleInfo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEngineForInfo(eng);
                              }}
                              className="w-6 h-6 rounded-full bg-slate-800 hover:bg-sky-500/30 border border-slate-700 hover:border-sky-400 text-slate-300 hover:text-sky-300 text-xs font-black flex items-center justify-center transition cursor-pointer shadow-sm active:scale-90"
                              title="Ver ficha técnica y detalles"
                            >
                              ?
                            </button>
                          )}
                        </div>
                      </div>
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
            </div>

            {/* Footer Fijo y Permanente (Siempre visible para guardar) */}
            <div className="p-4 border-t border-slate-800 bg-[#0C101A] shrink-0 flex space-x-2.5 z-20 shadow-2xl">
              <button
                type="button"
                onClick={handleCancelVehicleModal}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 cursor-pointer active:scale-95 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyVehicleConfig}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-500/30 cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL LISTA DE COMBUSTIBLES (Imagen 3) ---------------- */}
      {showFuelPickerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-[#121620]">
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
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
              <div className="space-y-2">
                {(['Gas LPG', 'Gasolina Pb95', 'Diésel ON'] as FuelKey[]).map((fKey) => {
                  const isCurrent = activeFuel === fKey;
                  const currentPrice = fuelPrices[fKey] || defaultPrices[selectedCountry]?.[fKey] || 6.09;
                  return (
                    <button
                      key={fKey}
                      type="button"
                      onClick={() => initiateFuelChange(fKey)}
                      className={`w-full p-3.5 rounded-2xl border transition flex items-center justify-between text-left cursor-pointer active:scale-98 ${
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

            <div className="p-3 sm:p-4 border-t border-slate-800 bg-[#0C101A] shrink-0">
              <button
                type="button"
                onClick={() => setShowFuelPickerModal(false)}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition active:scale-98"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL CONFIRMACIÓN GUARDAR TRAMO AL CAMBIAR COMBUSTIBLE ---------------- */}
      {showSaveSegmentConfirmModal && pendingFuelTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header Fijo */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-[#121620]">
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

            {/* Cuerpo con Scroll Suave */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
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
                    type="text"
                    inputMode="decimal"
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
                    type="text"
                    inputMode="decimal"
                    value={refuelPriceInput}
                    onChange={(e) => setRefuelPriceInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#080B11] border border-slate-700 text-white font-mono font-bold text-base focus:outline-none focus:border-[#FF4F00]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    💡 Al cambiar este valor, se actualiza el precio global de {refuelFuelType} en toda la app.
                  </span>
                </div>

                {refuelAmountInput && parseFloat(refuelAmountInput.replace(',', '.')) > 0 && (
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
            </div>

            {/* Footer Fijo y Visible */}
            <div className="p-4 pb-[max(env(safe-area-inset-bottom,0px),16px)] sm:pb-4 border-t border-slate-800 bg-[#0C101A] shrink-0 flex space-x-2.5 z-10">
              <button
                type="button"
                onClick={() => setShowRefuelModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 cursor-pointer active:scale-95 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveRefuel}
                disabled={
                  !refuelAmountInput ||
                  isNaN(parseFloat(refuelAmountInput.replace(',', '.'))) ||
                  parseFloat(refuelAmountInput.replace(',', '.')) <= 0
                }
                className="flex-1 py-3.5 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] disabled:opacity-40 text-white font-black text-xs shadow-md shadow-[#FF4F00]/25 cursor-pointer active:scale-95 transition"
              >
                Guardar Tanqueo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL AJUSTAR NIVEL ---------------- */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121620] border border-slate-700 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header Fijo */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 shrink-0 bg-[#121620]">
              <h3 className="text-base font-black text-white flex items-center space-x-2">
                <Sliders className="w-5 h-5 text-[#FF4F00]" />
                <span>Ajustar Saldo del Tanque</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo con Scroll Suave */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
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
            </div>

            {/* Footer Fijo y Visible */}
            <div className="p-4 pb-[max(env(safe-area-inset-bottom,0px),16px)] sm:pb-4 border-t border-slate-800 bg-[#0C101A] shrink-0 flex space-x-2.5 z-10">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 cursor-pointer active:scale-95 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustLevel}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] text-white font-black text-xs shadow-md shadow-[#FF4F00]/25 cursor-pointer active:scale-95 transition"
              >
                Guardar Nivel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Emergente Informativo de las 4 Tarjetas Alrededor del Velocímetro y del Tanque */}
      {selectedClusterCardInfo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedClusterCardInfo(null)}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#131927] border border-slate-700/90 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-4 animate-in zoom-in-95 duration-150"
          >
            <button
              type="button"
              onClick={() => setSelectedClusterCardInfo(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {selectedClusterCardInfo === 'distancia' && (
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Gauge className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">Distancia Recorrida y Movimiento</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mide la distancia exacta calculada por satélite GPS desde que iniciaste el trayecto. En la parte inferior registra cuántos litros de combustible gastó el motor exclusivamente mientras el auto estuvo rodando, descontando los momentos en que te detuviste en semáforos o atascos.
                </p>
              </div>
            )}

            {selectedClusterCardInfo === 'consumo' && (
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Fuel className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">Litros Totales Consumidos</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Es el acumulador de combustible quemado durante todo el viaje. Suma el combustible consumido al acelerar más el combustible consumido en ralentí (cuando el motor está encendido pero el vehículo permanece detenido). Conforme este número sube, se descuenta de forma idéntica de la gota de litros de tu tanque.
                </p>
              </div>
            )}

            {selectedClusterCardInfo === 'gasto' && (
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-[#FF5722]/15 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
                  <span className="font-black text-base">{currency}</span>
                </div>
                <h3 className="text-base font-black text-white">Gasto Económico en Vivo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Convierte los litros consumidos a dinero real según el precio por litro configurado en tu último tanqueo. Refleja exactamente cuánto te está costando el viaje actual en tu moneda y se resta en vivo del saldo monetario de tu tanque.
                </p>
              </div>
            )}

            {selectedClusterCardInfo === 'rendimiento' && (
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Snowflake className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-white">Ritmo de Consumo Instantáneo y A/C</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Muestra la eficiencia del motor en cada segundo según tu velocidad y aceleración. Si estás en Europa se expresa en L/100km; si estás en Colombia/México se expresa en km/L. El interruptor de Aire A/C simula la carga mecánica del compresor en el motor (aproximadamente +0.6 L/100km en marcha o +0.5 L/h detenido).
                </p>
              </div>
            )}

            {selectedClusterCardInfo === 'tanque' && (
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
                  💧
                </div>
                <h3 className="text-base font-black text-white">Reserva de Tanque y Combustible Activo</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Muestra los litros físicos y el saldo en dinero que le quedan al combustible que tienes seleccionado (LPG, Gasolina o Diésel). Cuando estás conduciendo con LPG seleccionado, el gasto se descuenta únicamente del tanque de gas. Si cambias a Gasolina, los cálculos pasan a descontarse del tanque de gasolina.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedClusterCardInfo(null)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              Entendido
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Informativo Detallado del Motor (?) con Portal en z-[80] y backdrop independiente */}
      {selectedEngineForInfo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setSelectedEngineForInfo(null)}
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#131927] border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Ficha Técnica de Motorización
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {selectedEngineForInfo.nombreComun || selectedEngineForInfo.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {selectedEngineForInfo.cc || selectedEngineForInfo.displacement} • {selectedEngineForInfo.cilindrosPotencia || selectedEngineForInfo.powerCV}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEngineForInfo(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="text-[11px] font-bold text-slate-400">Rendimiento Base Investigado:</div>
              <div className="text-sm font-black text-emerald-400">
                {formatFuelEconomy(selectedEngineForInfo.consumoBaseL100 || selectedEngineForInfo.baseL100, selectedCountry)}
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                {selectedEngineForInfo.descripcionBreve || selectedEngineForInfo.description}
              </p>
            </div>

            {selectedEngineForInfo.detalleInfo && (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-black text-sky-400 block mb-0.5">Tipo de manejo que cubre:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedEngineForInfo.detalleInfo.tipoManejo}
                  </p>
                </div>

                <div>
                  <span className="font-black text-amber-400 block mb-1">Ejemplos de autos en el mercado:</span>
                  <ul className="space-y-1">
                    {selectedEngineForInfo.detalleInfo.ejemplosAutos.map((auto, idx) => (
                      <li key={idx} className="flex items-center space-x-1.5 text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{auto}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-black text-emerald-400 block mb-0.5">Rendimiento promedio y combustibles:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedEngineForInfo.detalleInfo.rendimientoYCombustible}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedEngineForInfo(null)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-95"
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* User Profile & Supabase Account Info Modal */}
      <UserAccountModal
        isOpen={showUserAccountModal}
        onClose={() => setShowUserAccountModal(false)}
        currentUser={currentUser}
        onLogout={() => {
          signOutSupabase();
          onLogout?.();
        }}
      />
    </div>
  );
};
