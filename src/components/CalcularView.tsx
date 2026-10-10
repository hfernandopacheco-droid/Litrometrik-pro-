import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  MapPin,
  Wind,
  Repeat,
  Save,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  TrendingDown,
  Gauge,
  RefreshCw,
  Sliders,
  Flame,
  Zap,
  Map as MapIcon,
  X,
  Check,
  ChevronUp,
} from 'lucide-react';
import { CalculatorInputs, SavedTrip, CountryCode } from '../types';
import { DATA_PAIS } from '../utils/countryData';
import { calculateDetailedTrip } from '../utils/calculator';
import { saveCloudRecord } from '../utils/firestoreService';
import {
  Sedan3D,
  Suv3D,
  Compacto3D,
  Van3D,
  Pickup3D,
  Custom3D,
} from './Vehicle3DIcons';

interface CalcularViewProps {
  inputs: CalculatorInputs;
  onChange: (newInputs: Partial<CalculatorInputs>) => void;
  onSaveTrip: (trip: SavedTrip) => void;
  onReset: () => void;
  onOpenHistory: () => void;
  currentUser: any;
}

import {
  UNIFIED_VEHICLE_CATALOG,
  UnifiedEngineSpec,
  getActiveVehicleState,
  saveActiveVehicleState,
} from '../utils/vehicleCatalog';

interface VehicleCatalogItem {
  type: string;
  label: string;
  renderIcon: (className?: string) => React.ReactNode;
  defaultBase: number;
  engines: UnifiedEngineSpec[];
}

const VEHICLE_CATALOG: Record<string, VehicleCatalogItem> = {
  compact: {
    type: 'compact',
    label: UNIFIED_VEHICLE_CATALOG.compact.label,
    renderIcon: (cls) => <Compacto3D className={cls} size={46} />,
    defaultBase: UNIFIED_VEHICLE_CATALOG.compact.defaultBaseL100,
    engines: UNIFIED_VEHICLE_CATALOG.compact.engines,
  },
  sedan: {
    type: 'sedan',
    label: UNIFIED_VEHICLE_CATALOG.sedan.label,
    renderIcon: (cls) => <Sedan3D className={cls} size={46} />,
    defaultBase: UNIFIED_VEHICLE_CATALOG.sedan.defaultBaseL100,
    engines: UNIFIED_VEHICLE_CATALOG.sedan.engines,
  },
  suv: {
    type: 'suv',
    label: UNIFIED_VEHICLE_CATALOG.suv.label,
    renderIcon: (cls) => <Suv3D className={cls} size={46} />,
    defaultBase: UNIFIED_VEHICLE_CATALOG.suv.defaultBaseL100,
    engines: UNIFIED_VEHICLE_CATALOG.suv.engines,
  },
  pickup: {
    type: 'pickup',
    label: UNIFIED_VEHICLE_CATALOG.pickup.label,
    renderIcon: (cls) => <Pickup3D className={cls} size={46} />,
    defaultBase: UNIFIED_VEHICLE_CATALOG.pickup.defaultBaseL100,
    engines: UNIFIED_VEHICLE_CATALOG.pickup.engines,
  },
  van: {
    type: 'van',
    label: UNIFIED_VEHICLE_CATALOG.van.label,
    renderIcon: (cls) => <Van3D className={cls} size={46} />,
    defaultBase: UNIFIED_VEHICLE_CATALOG.van.defaultBaseL100,
    engines: UNIFIED_VEHICLE_CATALOG.van.engines,
  },
  custom: {
    type: 'custom',
    label: UNIFIED_VEHICLE_CATALOG.custom.label,
    renderIcon: (cls) => <Custom3D className={cls} size={46} />,
    defaultBase: UNIFIED_VEHICLE_CATALOG.custom.defaultBaseL100,
    engines: UNIFIED_VEHICLE_CATALOG.custom.engines,
  },
};

export const CalcularView: React.FC<CalcularViewProps> = ({
  inputs,
  onChange,
  onSaveTrip,
  onReset,
  onOpenHistory,
  currentUser,
}) => {
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cloudSaving, setCloudSaving] = useState(false);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);

  // Active vehicle and motor selection
  const activeVehicleKey = inputs.vehicleType || 'sedan';
  const currentCatalog = VEHICLE_CATALOG[activeVehicleKey] || VEHICLE_CATALOG.sedan;
  const [modalVehicleKey, setModalVehicleKey] = useState<string>(activeVehicleKey);
  const modalCatalog = VEHICLE_CATALOG[modalVehicleKey] || VEHICLE_CATALOG.sedan;

  // Selected engine key inside the current vehicle catalog
  const [selectedEngineKey, setSelectedEngineKey] = useState<string>(() => {
    if (activeVehicleKey === 'custom') return 'custom';
    return currentCatalog.engines[1]?.key || currentCatalog.engines[0]?.key || 'custom';
  });

  // Direct manual consumption input text
  const [customInputText, setCustomInputText] = useState<string>(() => {
    return (inputs.customBaseConsumption > 0 ? inputs.customBaseConsumption : currentCatalog.defaultBase).toString();
  });

  // Temporary snapshots to support Cancel in engine modal
  const [snapshotVehicleKey, setSnapshotVehicleKey] = useState<string>(activeVehicleKey);
  const [snapshotEngineKey, setSnapshotEngineKey] = useState<string>(selectedEngineKey);
  const [snapshotBase, setSnapshotBase] = useState<number>(inputs.customBaseConsumption);

  // Global vehicle sync listener (when updated from Modo Marcha or Garaje)
  useEffect(() => {
    const handleVehicleSync = (e: any) => {
      const v = e?.detail || getActiveVehicleState();
      if (v?.vehicleType) {
        setModalVehicleKey(v.vehicleType);
        setSelectedEngineKey(v.engineKey || 'custom');
        setCustomInputText(v.baseL100?.toString() || '8.0');
      }
    };
    window.addEventListener('litrometrik-vehicle-updated', handleVehicleSync);
    window.addEventListener('storage', handleVehicleSync);
    return () => {
      window.removeEventListener('litrometrik-vehicle-updated', handleVehicleSync);
      window.removeEventListener('storage', handleVehicleSync);
    };
  }, []);

  // When vehicle changes from outside or reset, keep state synced
  useEffect(() => {
    const catalog = VEHICLE_CATALOG[inputs.vehicleType] || VEHICLE_CATALOG.sedan;
    setModalVehicleKey(inputs.vehicleType || 'sedan');
    if (inputs.vehicleType === 'custom') {
      setSelectedEngineKey('custom');
    } else {
      const match = catalog.engines.find((e) => Math.abs(e.baseL100 - inputs.customBaseConsumption) < 0.1);
      if (match) {
        setSelectedEngineKey(match.key);
      }
    }
  }, [inputs.vehicleType]);

  // Inputs editable text states (allows backspacing completely without forcing locked zeros)
  const [distanceInputText, setDistanceInputText] = useState<string>(() => inputs.distanceKm ? inputs.distanceKm.toString() : '');
  const [priceInputText, setPriceInputText] = useState<string>(() => inputs.pricePerLiter ? inputs.pricePerLiter.toString() : '');

  // Keep text states synced when external inputs change (e.g. quick buttons or presets)
  useEffect(() => {
    setDistanceInputText(inputs.distanceKm ? inputs.distanceKm.toString() : '');
  }, [inputs.distanceKm]);

  useEffect(() => {
    setPriceInputText(inputs.pricePerLiter ? inputs.pricePerLiter.toString() : '');
  }, [inputs.pricePerLiter]);

  // ---------------- REAL-TIME REACTIVE CALCULATION ENGINE ----------------
  // Recalculates synchronously with 0ms lag upon any input modification
  const calc = useMemo(() => {
    return calculateDetailedTrip(inputs);
  }, [inputs]);

  const countryData = DATA_PAIS[inputs.country] || DATA_PAIS.PL;
  const currency = calc.currency;

  const countries = [
    { code: 'PL' as CountryCode, label: 'Polonia', flag: '🇵🇱' },
    { code: 'CO' as CountryCode, label: 'Colombia', flag: '🇨🇴' },
    { code: 'ES' as CountryCode, label: 'España', flag: '🇪🇸' },
    { code: 'MX' as CountryCode, label: 'México', flag: '🇲🇽' },
  ];
  const currentCountry = countries.find((c) => c.code === inputs.country) || countries[0];

  // Handler: Select Vehicle Category Card -> Opens engine selection modal with snapshot
  const handleSelectVehicleCard = (vehicleKey: string) => {
    setSnapshotVehicleKey(inputs.vehicleType || 'sedan');
    setSnapshotEngineKey(selectedEngineKey);
    setSnapshotBase(inputs.customBaseConsumption);

    setModalVehicleKey(vehicleKey);
    const catalog = VEHICLE_CATALOG[vehicleKey] || VEHICLE_CATALOG.sedan;
    const defaultEngine = catalog.engines[0];

    const newBase = vehicleKey === 'custom'
      ? (parseFloat(customInputText.replace(',', '.')) || 8.0)
      : defaultEngine.baseL100;

    setSelectedEngineKey(defaultEngine.key);
    setCustomInputText(newBase.toString());
    setIsEngineModalOpen(true);
  };

  // Handler: Select Specific Engine under modal vehicle (temporary until Save)
  const handleSelectEngine = (engine: UnifiedEngineSpec) => {
    setSelectedEngineKey(engine.key);
    if (!engine.key.includes('custom') && engine.key !== 'custom_direct') {
      setCustomInputText(engine.baseL100.toString());
    }
  };

  // Cancel changes and revert to snapshot
  const handleCancelEngineModal = () => {
    setModalVehicleKey(snapshotVehicleKey);
    setSelectedEngineKey(snapshotEngineKey);
    setCustomInputText(snapshotBase.toString());
    setIsEngineModalOpen(false);
  };

  // Save changes, broadcast event and update calculation
  const handleSaveEngineModal = () => {
    const catalog = VEHICLE_CATALOG[modalVehicleKey] || VEHICLE_CATALOG.sedan;
    const engine = catalog.engines.find((e) => e.key === selectedEngineKey) || catalog.engines[0];
    let finalBase = engine.baseL100;

    if (modalVehicleKey === 'custom' || selectedEngineKey.includes('custom')) {
      const parsed = parseFloat(customInputText.replace(',', '.'));
      finalBase = !isNaN(parsed) && parsed > 0 ? parsed : 8.0;
    }

    onChange({
      vehicleType: modalVehicleKey as any,
      customBaseConsumption: finalBase,
    });

    saveActiveVehicleState({
      vehicleType: modalVehicleKey as any,
      engineKey: engine.key,
      engineName: engine.name,
      baseL100: finalBase,
      vehicleModelName: catalog.label,
    });

    setIsEngineModalOpen(false);
  };

  // Handler: Direct Manual Consumption input change
  const handleCustomBaseInputChange = (val: string) => {
    setCustomInputText(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      onChange({ customBaseConsumption: parsed });
    }
  };

  // Reset to official fuel price for current country & fuel type
  const handleResetOfficialPrice = () => {
    let official = countryData.preciosDefecto.gasolina;
    if (inputs.fuelType === 'diesel') official = countryData.preciosDefecto.diesel;
    else if (inputs.fuelType === 'lpg' || inputs.fuelType === 'glp') official = countryData.preciosDefecto.lpg;
    onChange({ pricePerLiter: official });
  };

  // Save Trip Action
  const handleSave = async () => {
    const newTrip: SavedTrip = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      routeName: inputs.routeName.trim() || `Ruta ${inputs.distanceKm} km (${currentCatalog.label})`,
      vehicleType: inputs.vehicleType,
      transmission: inputs.transmission,
      fuelType: inputs.fuelType,
      routeType: inputs.routeType,
      distanceKm: calc.effectiveDistance,
      isRoundTrip: inputs.isRoundTrip,
      isACActive: inputs.isACActive,
      coldStartLpg: inputs.coldStartLpg,
      pricePerLiter: inputs.pricePerLiter,
      totalLiters: parseFloat(calc.totalLiters.toFixed(2)),
      totalCostPLN: parseFloat(calc.totalCostMoney.toFixed(2)),
      costPerKm: parseFloat(calc.costPerKm.toFixed(2)),
      savingsVsGasoline: parseFloat(calc.comparativa.savingGlpVsGas.toFixed(2)),
      country: inputs.country,
    };

    onSaveTrip(newTrip);

    if (currentUser?.uid && currentUser.uid !== 'guest' && currentUser.uid !== 'guest_user') {
      setCloudSaving(true);
      await saveCloudRecord(currentUser.uid, 'viajes', newTrip);
      setCloudSaving(false);
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const isCustomModeActive = selectedEngineKey === 'custom' || activeVehicleKey === 'custom';

  return (
    <div className="min-h-screen bg-[#080B11] text-white pb-36 select-none font-sans antialiased">
      {/* ---------------- 1. STICKY TOP HEADER (Solid, No Opacity Layer) ---------------- */}
      <header className="sticky top-0 z-30 bg-[#080B11] border-b border-slate-800 px-4 py-3 flex items-center justify-between pt-[max(env(safe-area-inset-top,0px),12px)] shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF4F00] to-[#FF8000] flex items-center justify-center shadow-lg shadow-[#FF4F00]/25 shrink-0">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-1.5 leading-none">
              <span>LitroMetrik</span>
              <span className="text-[#FF4F00]">PRO</span>
            </h1>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
              CALCULADORA DE RUTA EN TIEMPO REAL
            </p>
          </div>
        </div>

        {/* Country Selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCountryMenu(!showCountryMenu)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#1A202C] hover:bg-[#2D3748] border border-slate-700/80 text-xs font-black text-slate-200 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <span>{currentCountry.flag}</span>
            <span>{currentCountry.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showCountryMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-[#1A202C] border border-slate-700 shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {countries.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    const nextCountryData = DATA_PAIS[c.code] || DATA_PAIS.PL;
                    try {
                      localStorage.setItem('litrometrik_selected_country', c.code);
                      localStorage.setItem('litrometrik_jurisdiction_country', c.code);
                    } catch (e) {}

                    let defaultPrice = nextCountryData.preciosDefecto.gasolina;
                    if (inputs.fuelType === 'diesel') defaultPrice = nextCountryData.preciosDefecto.diesel;
                    else if (inputs.fuelType === 'lpg' || inputs.fuelType === 'glp') defaultPrice = nextCountryData.preciosDefecto.lpg;

                    onChange({
                      country: c.code,
                      pricePerLiter: defaultPrice,
                      referenceGasolinePrice: nextCountryData.preciosDefecto.gasolina,
                      routeName: `Viaje en ${nextCountryData.nombre}`,
                    });
                    setShowCountryMenu(false);
                    window.dispatchEvent(new CustomEvent('litrometrik-country-changed', { detail: { country: c.code } }));
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-black transition flex items-center justify-between ${
                    inputs.country === c.code ? 'text-[#FF4F00] bg-white/5' : 'text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </span>
                  {inputs.country === c.code && <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F00]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Floating Save Notification */}
      {saveSuccess && (
        <div className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto">
          <div className="p-3.5 rounded-2xl bg-[#121620] border border-emerald-500/60 text-white text-xs font-bold flex items-center space-x-2 shadow-2xl animate-in slide-in-from-top duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {cloudSaving
                ? 'Sincronizando con Firestore...'
                : '✅ ¡Ruta calculada y guardada exitosamente en la nube!'}
            </span>
          </div>
        </div>
      )}

      {/* ---------------- 2. MAIN CONTAINER ---------------- */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* =========================================================================
            PASO 1: VEHÍCULO Y MOTORIZACIÓN (VENTANA FLOTANTE AL TOCAR CUALQUIER CARRO)
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#FF4F00] text-white text-[11px] font-black flex items-center justify-center">
                1
              </span>
              <span className="text-xs font-black tracking-wider text-white uppercase">
                Vehículo y Motorización
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#FF4F00]/15 text-[#FF4F00] border border-[#FF4F00]/30 shadow-sm">
                Base: {calc.activeBaseConsumption.toFixed(1)} L/100km
              </span>
            </div>
          </div>

          {/* Selector de 6 Categorías de Vehículos con Renders 3D Profesionales */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {Object.entries(VEHICLE_CATALOG).map(([key, cat]) => {
              const isSelected = activeVehicleKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectVehicleCard(key)}
                  className={`py-2 px-1.5 rounded-2xl text-center transition-all duration-200 cursor-pointer border flex flex-col items-center justify-between active:scale-95 relative overflow-hidden group ${
                    isSelected
                      ? 'border-[#FF4F00] bg-gradient-to-b from-[#FF4F00]/25 via-[#FF4F00]/10 to-[#121620] text-white shadow-[0_0_16px_rgba(255,79,0,0.35)] scale-[1.02]'
                      : 'border-slate-800 bg-[#0B0F19] text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {/* Isometric 3D Professional Vehicle Render */}
                  <div className="h-11 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    {cat.renderIcon(isSelected ? 'brightness-110 drop-shadow-[0_0_8px_rgba(255,79,0,0.4)]' : 'opacity-85')}
                  </div>

                  <span className="text-[11px] font-black leading-tight mt-1">
                    {cat.label}
                  </span>

                  {isSelected ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF4F00] mt-1 shadow-[0_0_6px_#FF4F00]" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Barra Resumen Limpia: Muestra vehículo activo y abre la ventana de motor */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                <Gauge className="w-4 h-4 text-[#00D4FF]" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black text-white truncate">
                  {currentCatalog.label} • {currentCatalog.engines.find((e) => e.key === selectedEngineKey)?.name || 'Motor Estándar'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Consumo base: <span className="text-[#FF4F00] font-bold">{calc.activeBaseConsumption.toFixed(1)} L/100km</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSnapshotVehicleKey(inputs.vehicleType || 'sedan');
                setSnapshotEngineKey(selectedEngineKey);
                setSnapshotBase(inputs.customBaseConsumption || calc.activeBaseConsumption || 7.5);
                setModalVehicleKey(activeVehicleKey);
                setIsEngineModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-black flex items-center space-x-1.5 transition active:scale-95 shadow-md shadow-blue-500/25 shrink-0 cursor-pointer"
            >
              <span>Cambiar Motor</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            PASO 2: TRANSMISIÓN
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#FF4F00] text-white text-[11px] font-black flex items-center justify-center">
                2
              </span>
              <span className="text-xs font-black tracking-wider text-white uppercase">
                Transmisión
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Factor: x{calc.transmissionFactor.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onChange({ transmission: 'manual' })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-95 ${
                inputs.transmission === 'manual'
                  ? 'border-[#FF4F00] bg-[#FF4F00]/15 text-white shadow-[0_0_12px_rgba(255,79,0,0.25)]'
                  : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
              }`}
            >
              <div>
                <div className="text-xs font-black text-white">Manual</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Factor x1.0 (Estándar)</div>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  inputs.transmission === 'manual'
                    ? 'bg-[#FF4F00] text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                x1.0
              </span>
            </button>

            <button
              type="button"
              onClick={() => onChange({ transmission: 'automatic' })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-95 ${
                inputs.transmission === 'automatic'
                  ? 'border-[#FF4F00] bg-[#FF4F00]/15 text-white shadow-[0_0_12px_rgba(255,79,0,0.25)]'
                  : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
              }`}
            >
              <div>
                <div className="text-xs font-black text-white">Automática</div>
                <div className="text-[10px] text-slate-400 mt-0.5">+8% consumo estimado</div>
              </div>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  inputs.transmission === 'automatic'
                    ? 'bg-[#FF4F00] text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                x1.08
              </span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            PASO 3: TIPO DE COMBUSTIBLE PRINCIPAL
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#FF4F00] text-white text-[11px] font-black flex items-center justify-center">
                3
              </span>
              <span className="text-xs font-black tracking-wider text-white uppercase">
                Tipo de Combustible Principal
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Factor: x{calc.fuelFactor.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              {
                id: 'gasolina',
                name: 'Gasolina Pb95',
                factorStr: 'x1.0',
                note: 'Consumo base',
                price: countryData.preciosDefecto.gasolina,
              },
              {
                id: 'diesel',
                name: 'Diésel ON',
                factorStr: 'x0.85',
                note: '-15% consumo',
                price: countryData.preciosDefecto.diesel,
              },
              {
                id: 'lpg',
                name: 'Gas LPG',
                factorStr: 'x1.20',
                note: '+20% consumo',
                price: countryData.preciosDefecto.lpg,
              },
              {
                id: 'hibrido',
                name: 'Híbrido / GNC',
                factorStr: 'x0.75',
                note: '-25% consumo',
                price: countryData.preciosDefecto.gasolina,
              },
            ].map((f) => {
              const isSelected = inputs.fuelType === f.id || (f.id === 'lpg' && inputs.fuelType === 'glp');
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    onChange({
                      fuelType: f.id as any,
                      pricePerLiter: f.price,
                    });
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-95 ${
                    isSelected
                      ? 'border-[#FF4F00] bg-[#FF4F00]/15 text-white shadow-[0_0_12px_rgba(255,79,0,0.25)]'
                      : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black text-white">{f.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{f.note}</div>
                  </div>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#FF4F00] text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {f.factorStr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            PASO 4: ESTILO DE CONDUCCIÓN / RUTA
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-[#FF4F00] text-white text-[11px] font-black flex items-center justify-center">
                4
              </span>
              <span className="text-xs font-black tracking-wider text-white uppercase">
                Estilo de Conducción / Ruta
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              Factor: x{calc.routeFactor.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'carretera', label: 'Carretera / Autopista', factor: 'x0.85', desc: '-15% vel. constante' },
              { id: 'mixto', label: 'Mixto / Combinado', factor: 'x1.0', desc: 'Ruta estándar' },
              { id: 'ciudad', label: 'Ciudad / Congestión', factor: 'x1.25', desc: '+25% arranques' },
            ].map((r) => {
              const isSelected = inputs.routeType === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onChange({ routeType: r.id as any })}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between active:scale-95 ${
                    isSelected
                      ? 'border-[#00D4FF] bg-[#00D4FF]/15 text-white shadow-[0_0_12px_rgba(0,212,255,0.25)]'
                      : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-black leading-tight text-white">{r.label}</span>
                  <span className="text-[9px] text-slate-400 mt-1">{r.desc}</span>
                  <span
                    className={`mt-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-[#00D4FF] text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.factor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            PASO 5: FACTORES ESPECIALES (A/C & IDA Y VUELTA)
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-5 rounded-full bg-[#FF4F00] text-white text-[11px] font-black flex items-center justify-center">
              5
            </span>
            <span className="text-xs font-black tracking-wider text-white uppercase">
              Factores Especiales
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Switch Aire Acondicionado */}
            <button
              type="button"
              onClick={() => onChange({ isACActive: !inputs.isACActive })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-95 ${
                inputs.isACActive
                  ? 'border-cyan-400 bg-cyan-400/15 text-white shadow-[0_0_14px_rgba(34,211,238,0.25)]'
                  : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
              }`}
            >
              <div className="min-w-0 pr-1.5">
                <div className="text-xs font-black text-white flex items-center space-x-1.5">
                  <span className="truncate">Aire A/C</span>
                  <Wind className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">+0.6 L/100km directo</div>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                  inputs.isACActive ? 'bg-cyan-400' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    inputs.isACActive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>

            {/* Switch Ida y Vuelta */}
            <button
              type="button"
              onClick={() => onChange({ isRoundTrip: !inputs.isRoundTrip })}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-95 ${
                inputs.isRoundTrip
                  ? 'border-[#FF4F00] bg-[#FF4F00]/15 text-white shadow-[0_0_14px_rgba(255,79,0,0.25)]'
                  : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
              }`}
            >
              <div>
                <div className="text-xs font-black text-white flex items-center space-x-1">
                  <span>Ida y Vuelta</span>
                  <Repeat className="w-3.5 h-3.5 text-[#FF4F00]" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Distancia x 2</div>
              </div>
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  inputs.isRoundTrip ? 'bg-[#FF4F00]' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                    inputs.isRoundTrip ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* =========================================================================
            PARÁMETROS DE TRAYECTO (DISTANCIA, PRECIO POR LITRO Y ETIQUETA)
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#FF4F00]" />
              <span>PARÁMETROS DE TRAYECTO</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-[#FF4F00]">
                {calc.effectiveDistance} km efectivo
              </span>
            </div>
          </div>

          {/* Campo Nombre o Etiqueta del Viaje */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300">
              Nombre o Etiqueta del Viaje:
            </label>
            <input
              type="text"
              value={inputs.routeName}
              onChange={(e) => onChange({ routeName: e.target.value })}
              placeholder="Ej. Varsovia a Cracovia / Bogotá a Medellín"
              className="w-full px-4 py-2.5 rounded-2xl bg-[#080B11] border border-slate-700 text-white font-sans text-xs focus:outline-none focus:border-[#FF4F00] transition"
            />
          </div>

          {/* Input de Distancia con Slider y Botones Rápidos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-300">
                Distancia en kilómetros:
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="3500"
                  value={distanceInputText}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const valStr = e.target.value;
                    setDistanceInputText(valStr);
                    if (valStr.trim() !== '') {
                      const num = parseFloat(valStr);
                      if (!isNaN(num) && num > 0) {
                        onChange({ distanceKm: num });
                      }
                    }
                  }}
                  onBlur={() => {
                    if (distanceInputText.trim() === '' || isNaN(parseFloat(distanceInputText))) {
                      setDistanceInputText(inputs.distanceKm.toString());
                    }
                  }}
                  placeholder="150"
                  className="w-24 px-2 py-1 rounded-xl bg-[#080B11] border border-slate-700 text-right font-sans font-black text-sm text-[#FF4F00] focus:outline-none focus:border-[#FF4F00]"
                />
                <span className="text-xs font-bold text-slate-400">km</span>
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="1000"
              step="5"
              value={inputs.distanceKm}
              onChange={(e) => {
                const num = parseFloat(e.target.value) || 5;
                setDistanceInputText(num.toString());
                onChange({ distanceKm: num });
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#FF4F00]"
            />

            {/* Botones rápidos: 25 km, 60 km, 150 km, 300 km, 500 km */}
            <div className="flex justify-between gap-1 pt-1">
              {[25, 60, 150, 300, 500].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => {
                    setDistanceInputText(km.toString());
                    onChange({ distanceKm: km });
                  }}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black border transition active:scale-95 cursor-pointer ${
                    inputs.distanceKm === km
                      ? 'border-[#FF4F00] text-[#FF4F00] bg-[#FF4F00]/15 shadow-sm'
                      : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-white'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {/* Input de Precio por Litro con botón Restablecer Precio Oficial */}
          <div className="p-3.5 rounded-2xl bg-[#080B11] border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-white">Precio por Litro</div>
              <button
                type="button"
                onClick={() => {
                  handleResetOfficialPrice();
                  let official = countryData.preciosDefecto.gasolina;
                  if (inputs.fuelType === 'diesel') official = countryData.preciosDefecto.diesel;
                  else if (inputs.fuelType === 'lpg' || inputs.fuelType === 'glp') official = countryData.preciosDefecto.lpg;
                  setPriceInputText(official.toString());
                }}
                className="text-[10px] text-[#00D4FF] hover:underline flex items-center space-x-1 font-bold mt-0.5 cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Restablecer Precio Oficial</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={priceInputText}
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const valStr = e.target.value;
                  setPriceInputText(valStr);
                  if (valStr.trim() !== '') {
                    const num = parseFloat(valStr);
                    if (!isNaN(num) && num >= 0) {
                      onChange({ pricePerLiter: num });
                    }
                  }
                }}
                onBlur={() => {
                  if (priceInputText.trim() === '' || isNaN(parseFloat(priceInputText))) {
                    setPriceInputText(inputs.pricePerLiter.toString());
                  }
                }}
                placeholder={inputs.pricePerLiter.toString()}
                className="w-32 px-3 py-2 rounded-xl bg-[#121620] border border-slate-700 text-white font-sans font-black text-right text-sm focus:outline-none focus:border-[#FF4F00]"
              />
              <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                {currency}
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            COMPARATIVA AVANZADA DE COSTOS EN TIEMPO REAL
            (Reactividad pura con barras de progreso animadas, neon gradients y ahorro)
           ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#121620] border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-[#00D4FF] uppercase flex items-center space-x-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-[#00D4FF]" />
              <span>COMPARATIVA AVANZADA DE COSTOS</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              {calc.effectiveDistance} km en tiempo real
            </span>
          </div>

          {/* Gráfico Interactivo de 3 Barras con Gradientes Neon y Porcentajes Relativos */}
          <div className="space-y-4">
            {/* 1. Gasolina Pb95 (Naranja Neón #FF6B00) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF6B00] shadow-[0_0_8px_#FF6B00]" />
                  <span className="text-white">{calc.comparativa.gasolina.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({calc.comparativa.gasolina.pricePerLiter.toFixed(2)} {currency}/L)</span>
                </div>
                <div className="text-right">
                  <span className="text-[#FF6B00] font-black text-sm">
                    {calc.comparativa.gasolina.totalCost.toFixed(2).replace('.', ',')} {currency}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    ({calc.comparativa.gasolina.totalLiters.toFixed(1)} L)
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-5 w-full bg-slate-900/90 rounded-full p-0.5 border border-slate-800 relative overflow-hidden flex items-center shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF4F00] via-[#FF6B00] to-[#FFA000] shadow-[0_0_14px_rgba(255,107,0,0.45)] transition-[width] duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${calc.comparativa.gasolina.percent}%` }}
                >
                  <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {calc.comparativa.gasolina.percent}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Consumo: {calc.comparativa.gasolina.rateL100.toFixed(2)} L/100km</span>
                <span className="text-slate-500">Base estándar x1.0</span>
              </div>
            </div>

            {/* 2. Diésel ON (Azul Eléctrico #00B4D8) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00B4D8] shadow-[0_0_8px_#00B4D8]" />
                  <span className="text-white">{calc.comparativa.diesel.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({calc.comparativa.diesel.pricePerLiter.toFixed(2)} {currency}/L)</span>
                </div>
                <div className="text-right">
                  <span className="text-[#00B4D8] font-black text-sm">
                    {calc.comparativa.diesel.totalCost.toFixed(2).replace('.', ',')} {currency}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    ({calc.comparativa.diesel.totalLiters.toFixed(1)} L)
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-5 w-full bg-slate-900/90 rounded-full p-0.5 border border-slate-800 relative overflow-hidden flex items-center shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0077B6] via-[#00B4D8] to-[#90E0EF] shadow-[0_0_14px_rgba(0,180,216,0.45)] transition-[width] duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${calc.comparativa.diesel.percent}%` }}
                >
                  <span className="text-[10px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                    {calc.comparativa.diesel.percent}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Consumo: {calc.comparativa.diesel.rateL100.toFixed(2)} L/100km</span>
                <span className="text-cyan-400">-15% consumo en ruta</span>
              </div>
            </div>

            {/* 3. Gas LPG (Verde Esmeralda #10B981) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-black">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                  <span className="text-white">{calc.comparativa.glp.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({calc.comparativa.glp.pricePerLiter.toFixed(2)} {currency}/L)</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-black text-sm">
                    {calc.comparativa.glp.totalCost.toFixed(2).replace('.', ',')} {currency}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    ({calc.comparativa.glp.totalLiters.toFixed(1)} L)
                  </span>
                </div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-5 w-full bg-slate-900/90 rounded-full p-0.5 border border-slate-800 relative overflow-hidden flex items-center shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399] shadow-[0_0_16px_rgba(16,185,129,0.55)] transition-[width] duration-500 ease-out flex items-center justify-end pr-2"
                  style={{ width: `${calc.comparativa.glp.percent}%` }}
                >
                  <span className="text-[10px] font-black text-slate-950 font-sans drop-shadow-sm">
                    {calc.comparativa.glp.percent}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Consumo: {calc.comparativa.glp.rateL100.toFixed(2)} L/100km</span>
                <span className="text-emerald-400 font-bold">Máximo ahorro monetario</span>
              </div>
            </div>
          </div>

          {/* Tarjeta Destacada de Ahorro con LPG (Integrada debajo del gráfico) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-emerald-900/50 to-teal-950/70 border border-emerald-500/40 flex items-start space-x-3.5 shadow-xl">
            <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shrink-0 mt-0.5 shadow-md shadow-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white">
                {calc.comparativa.savingGlpVsGas > 0 ? (
                  <span>
                    Si usaras LPG podrías ahorrar hasta{' '}
                    <span className="text-emerald-300 font-black text-sm">
                      {calc.comparativa.savingGlpVsGas.toFixed(2).replace('.', ',')} {currency}
                    </span>{' '}
                    ({calc.comparativa.percentSavedVsGas}% menos) en este trayecto.
                  </span>
                ) : (
                  <span>
                    Conduciendo con LPG disfrutas del costo más económico por kilómetro.
                  </span>
                )}
              </div>
              <p className="text-[10px] text-emerald-200/80 mt-1">
                Cálculo basado en {calc.effectiveDistance} km e incluye un arranque en frío con gasolina para proteger válvulas.
              </p>
            </div>
          </div>

          {/* Botón Reiniciar Todos los Valores */}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={onReset}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reiniciar Valores</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            TARJETA FINAL DE RESUMEN DE GASTOS
           ========================================================================= */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1C2436] via-[#121620] to-[#0A0D14] border border-[#FF4F00]/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black tracking-widest text-[#FF4F00] uppercase flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4" />
              <span>RESUMEN FINAL DE GASTOS</span>
            </span>
            <span className="text-xs font-bold text-slate-300">
              {calc.effectiveDistance} km efectivo
            </span>
          </div>

          {/* Dinero Total Estimado en Grande */}
          <div className="border-b border-slate-800/80 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Dinero Total Estimado
            </span>
            <div className="text-4xl sm:text-5xl font-black font-sans text-white tracking-tight mt-0.5">
              {calc.totalCostMoney.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xl sm:text-2xl text-[#FF4F00] font-black">{currency}</span>
            </div>
          </div>

          {/* 3 Métricas Clave */}
          <div className="grid grid-cols-2 gap-3">
            {/* Combustible a gastar con equivalencia en garrafas */}
            <div className="p-3.5 rounded-2xl bg-[#080B11] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Combustible a gastar
              </span>
              <div className="text-xl font-black text-white">
                {calc.totalLiters.toFixed(2).replace('.', ',')} <span className="text-xs text-slate-400">Litros</span>
              </div>
              <div className="text-[10px] text-cyan-300 font-bold">
                ≈ {calc.garrafas20L.toFixed(1)} garrafas (de 20L)
              </div>
            </div>

            {/* Costo por Kilómetro (1 km y 10 km) */}
            <div className="p-3.5 rounded-2xl bg-[#080B11] border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Costo por Kilómetro
              </span>
              <div className="text-xl font-black text-[#FF4F00]">
                {calc.costPerKm.toFixed(2).replace('.', ',')} <span className="text-xs text-slate-400">{currency}/km</span>
              </div>
              <div className="text-[10px] text-slate-300 font-bold">
                {calc.costPer10Km.toFixed(2).replace('.', ',')} {currency} cada 10 km
              </div>
            </div>
          </div>

          {/* Consumo Medio Estimado con la fórmula desglosada */}
          <div className="p-3.5 rounded-2xl bg-[#080B11] border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Consumo Medio Estimado
              </span>
              <span className="text-base font-black text-white">
                {calc.finalConsumptionL100.toFixed(2).replace('.', ',')} L/100km
              </span>
            </div>

            {/* Fórmula desglosada */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] text-slate-300 font-medium leading-relaxed">
              <span className="text-[#FF4F00] font-black">Fórmula:</span> Base ({calc.activeBaseConsumption.toFixed(1)}) × Transmisión ({calc.transmissionFactor.toFixed(2)}) × Combustible ({calc.fuelFactor.toFixed(2)}) × Ruta ({calc.routeFactor.toFixed(2)}){inputs.isACActive ? ' + A/C (0.6)' : ''} = <span className="text-white font-black">{calc.finalConsumptionL100.toFixed(2)} L/100km</span>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={handleSave}
              className="py-3.5 px-4 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] text-white font-black text-xs transition active:scale-95 cursor-pointer shadow-lg shadow-[#FF4F00]/30 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Registro</span>
            </button>

            <button
              type="button"
              onClick={onOpenHistory}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center space-x-2"
            >
              <span>Ver Historial</span>
            </button>
          </div>
        </div>
      </main>

      {/* =========================================================================
          MODAL FLOTANTE / VENTANA DEDICADA DE SELECCIÓN DE MOTOR
         ========================================================================= */}
      {isEngineModalOpen && (
        <div className="fixed inset-0 z-[200] flex flex-col justify-between sm:justify-center items-center p-3 sm:p-4 pb-20 sm:pb-6 bg-black/85 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0E131F] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100dvh-5.5rem)] sm:max-h-[600px] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header Fijo */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 sm:p-5 shrink-0 bg-[#0E131F]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/30 flex items-center justify-center text-[#00D4FF]">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Motorización: {modalCatalog.label}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Elige la cilindrada o ingresa tu consumo manual
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelEngineModal}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition active:scale-90 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo con Scroll Suave e Independiente (con min-h-0 para mantener fijo el footer) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]">
              {/* Showcase Hero Card with Professional Vehicle Render */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#121829] border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FF4F00]/20 text-[#FF4F00] border border-[#FF4F00]/30">
                    {modalCatalog.label} Seleccionado
                  </span>
                  <div className="text-sm font-black text-white">
                    {modalCatalog.label} • {modalCatalog.engines.find((e) => e.key === selectedEngineKey)?.name || modalCatalog.engines[0]?.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    Consumo base: <strong className="text-white">{calc.activeBaseConsumption.toFixed(1)} L/100km</strong>
                  </div>
                </div>
                <div className="w-20 h-14 flex items-center justify-center shrink-0">
                  {modalCatalog.renderIcon('drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]')}
                </div>
              </div>

              {/* List of Engine Specs for this Vehicle */}
              <div className="space-y-2">
                <div className="text-xs font-black text-slate-300 flex items-center justify-between">
                  <span>Opciones de Cilindrada para {modalCatalog.label}:</span>
                  <span className="text-[10px] text-slate-500">Toca una opción</span>
                </div>

                <div className="space-y-2">
                  {modalCatalog.engines.map((eng) => {
                    const isSelected = selectedEngineKey === eng.key;
                    return (
                      <button
                        key={eng.key}
                        type="button"
                        onClick={() => handleSelectEngine(eng)}
                        className={`w-full p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                          isSelected
                            ? 'border-[#00D4FF] bg-[#00D4FF]/10 text-white shadow-[0_0_14px_rgba(0,212,255,0.25)]'
                            : 'border-slate-800 bg-[#080B11] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="pr-2">
                          <div className="text-xs font-black text-white flex items-center space-x-2">
                            <span>{eng.name}</span>
                            {isSelected && (
                              <span className="px-2 py-0.2 rounded-full bg-[#00D4FF] text-slate-950 font-black text-[9px] uppercase">
                                Activo
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-300 font-medium mt-0.5">
                            {eng.displacement}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {eng.description}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-xl block ${
                              isSelected
                                ? 'bg-[#00D4FF] text-slate-950 font-black shadow-sm'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {eng.key === 'custom' ? `${calc.activeBaseConsumption.toFixed(1)} L` : `${eng.baseL100} L/100km`}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual input if 'Personalizado' mode is active */}
              {(selectedEngineKey === 'custom' || modalVehicleKey === 'custom') && (
                <div className="p-4 rounded-2xl bg-[#080B11] border border-[#00D4FF]/40 space-y-2.5 shadow-lg">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-black text-white flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#00D4FF]" />
                      <span>Consumo personalizado (L/100km):</span>
                    </label>
                    <span className="text-[10px] text-[#00D4FF] font-black uppercase">Manual</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      step="0.1"
                      min="2"
                      max="40"
                      value={customInputText}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleCustomBaseInputChange(e.target.value)}
                      placeholder="Ej. 7.8"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#121620] border border-slate-700 text-white font-sans font-black text-base focus:outline-none focus:border-[#00D4FF]"
                    />
                    <span className="text-xs font-bold text-slate-300 pr-2">L / 100km</span>
                  </div>

                  {/* Preset Chips */}
                  <div className="flex items-center space-x-1.5 pt-1 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] text-slate-500 font-bold shrink-0">Preajustes:</span>
                    {[5.5, 6.8, 8.0, 9.5, 11.0, 13.5].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleCustomBaseInputChange(preset.toString())}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition active:scale-95 shrink-0"
                      >
                        {preset} L
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Footer Fijo y Visible */}
            <div className="p-4 border-t border-slate-800 bg-[#080B11] shrink-0 flex space-x-2.5 z-20 shadow-2xl">
              <button
                type="button"
                onClick={handleCancelEngineModal}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 text-slate-200 hover:text-white font-bold text-xs hover:bg-slate-700 cursor-pointer active:scale-95 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEngineModal}
                className="flex-1 py-3.5 rounded-2xl bg-[#FF4F00] hover:bg-[#FF621F] text-white font-black text-xs shadow-lg shadow-[#FF4F00]/25 cursor-pointer active:scale-95 transition flex items-center justify-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
