import { CountryCode } from './countryData';

export interface UnifiedEngineSpec {
  key: string;
  name: string;
  displacement: string; // Exact technical displacement & specs
  powerCV: string;      // Power output
  baseL100: number;     // Investigated real-world / WLTP mixed consumption (L/100km)
  description: string;  // Detailed automotive engineering description
  fuelRecommendation?: string;
}

export interface UnifiedVehicleCategory {
  type: 'compact' | 'sedan' | 'suv' | 'pickup' | 'van' | 'custom';
  label: string;
  shortLabel: string;
  defaultBaseL100: number;
  icon: string;
  engines: UnifiedEngineSpec[];
  description: string;
}

/**
 * CATÁLOGO TÉCNICO OFICIAL DE VEHÍCULOS Y MOTORIZACIONES INVESTIGADAS (WLTP / Consumo Real)
 * Fuente única de verdad sincronizada para:
 * 1. Modo de Marcha (Panel de Conducción y Tacómetro)
 * 2. Calculadora de Viajes y Combustible
 * 3. Garaje y Diagnóstico Mecánico
 * 4. Perfil de Conductor y Telemetría
 */
export const UNIFIED_VEHICLE_CATALOG: Record<string, UnifiedVehicleCategory> = {
  compact: {
    type: 'compact',
    label: 'Compacto / Urbano',
    shortLabel: 'Compacto',
    icon: '🚗',
    defaultBaseL100: 5.4,
    description: 'Hatchbacks y autos urbanos ágiles de bajo peso (ej. VW Polo, Fiesta, Yaris, Ibiza)',
    engines: [
      {
        key: 'comp_10_turbo',
        name: '1.0L TSI / EcoBoost / MPI (3-Cil)',
        displacement: '999 cc • 3 Cilindros Turbo',
        powerCV: '95 - 110 CV',
        baseL100: 5.4,
        description: 'Motor downsized ultra-eficiente con inyección directa y turbo. Consumo urbano contenido.',
        fuelRecommendation: 'Gasolina Pb95 / LPG',
      },
      {
        key: 'comp_12_14_std',
        name: '1.2L - 1.4L 16V / PureTech Estándar',
        displacement: '1.197 - 1.395 cc • 4 Cilindros',
        powerCV: '85 - 125 CV',
        baseL100: 6.0,
        description: 'Mecánica atmosférica o turbo de baja presión. Rendimiento probado y excelente longevidad.',
        fuelRecommendation: 'Gasolina Pb95 / LPG',
      },
      {
        key: 'comp_15_16_sport',
        name: '1.5L - 1.6L TSI / Sport VVT',
        displacement: '1.498 - 1.598 cc • 16 Válvulas',
        powerCV: '130 - 150 CV',
        baseL100: 6.6,
        description: 'Respuesta dinámica superior con sincronización variable de válvulas y mayor aceleración en carretera.',
        fuelRecommendation: 'Gasolina Pb95 / Pb98',
      },
      {
        key: 'comp_custom',
        name: 'Personalizado de Tablero',
        displacement: 'Calibración manual directa',
        powerCV: 'Ajuste libre',
        baseL100: 5.8,
        description: 'Ingresa el consumo mixto registrado en el computador de viaje de tu vehículo.',
      },
    ],
  },

  sedan: {
    type: 'sedan',
    label: 'Sedán / Mediano / Berlina',
    shortLabel: 'Sedán',
    icon: '🚘',
    defaultBaseL100: 8.2,
    description: 'Sedanes y familiares con carrocería alargada y maletero independiente (ej. Octavia, Mazda 3, Corolla, Passat)',
    engines: [
      {
        key: 'sedan_16_mpi',
        name: '1.6L MPI / VVT 16V Eficiente',
        displacement: '1.598 cc • 4 Cilindros DOHC',
        powerCV: '102 - 115 CV',
        baseL100: 7.2,
        description: 'Motor atmosférico de alta resistencia, óptimo para instalación de kit LPG y crucero en autopista.',
        fuelRecommendation: 'Gasolina Pb95 / LPG',
      },
      {
        key: 'sedan_20_skyactiv',
        name: '1.8L - 2.0L TSI / Skyactiv-G Confort',
        displacement: '1.984 - 1.998 cc • 16V Inyección Directa',
        powerCV: '145 - 165 CV',
        baseL100: 8.2,
        description: 'Equilibrio perfecto de la gama media con alto ratio de compresión y empuje lineal.',
        fuelRecommendation: 'Gasolina Pb95 / LPG',
      },
      {
        key: 'sedan_25_turbo',
        name: '2.5L - 3.0L Turbo / V6 Potente',
        displacement: '2.488 - 2.998 cc • 4 o 6 Cilindros',
        powerCV: '190 - 250 CV',
        baseL100: 9.8,
        description: 'Alta cilindrada y par motor elevado para adelantamientos inmediatos y máxima solvencia en autopista.',
        fuelRecommendation: 'Gasolina Pb98 / Pb95',
      },
      {
        key: 'sedan_custom',
        name: 'Personalizado de Tablero',
        displacement: 'Calibración manual directa',
        powerCV: 'Ajuste libre',
        baseL100: 8.2,
        description: 'Ingresa el consumo mixto registrado en el computador de viaje de tu vehículo.',
      },
    ],
  },

  suv: {
    type: 'suv',
    label: 'Grande / SUV / Crossover',
    shortLabel: 'SUV',
    icon: '🚙',
    defaultBaseL100: 8.8,
    description: 'Camionetas familiares elevadas, 4x2 y 4x4 (ej. Duster, CX-30, RAV4, Sportage, Tucson)',
    engines: [
      {
        key: 'suv_10_13_turbo',
        name: '1.0L - 1.3L TCe / Turbo Crossover',
        displacement: '999 - 1.332 cc • 3 o 4 Cilindros Turbo',
        powerCV: '100 - 130 CV',
        baseL100: 6.8,
        description: 'Motor turbo moderno downsized de alta eficiencia para crossovers urbanos y carretera plana.',
        fuelRecommendation: 'Gasolina Pb95 / LPG',
      },
      {
        key: 'suv_15_20_fwd',
        name: '1.5L - 2.0L Skyactiv / T-GDI FWD (4x2)',
        displacement: '1.998 cc • Inyección Directa',
        powerCV: '150 - 180 CV',
        baseL100: 8.8,
        description: 'Tracción delantera equilibrada para uso familiar, viajes interurbanos y topografía mixta.',
        fuelRecommendation: 'Gasolina Pb95 / LPG',
      },
      {
        key: 'suv_20_25_awd',
        name: '2.0L - 2.5L AWD Tracción Integral (4x4)',
        displacement: '2.488 cc • Tracción 4x4 Inteligente',
        powerCV: '185 - 220 CV',
        baseL100: 10.2,
        description: 'Tracción integral total para adherencia en lluvia, nieve, curvas y pendientes pronunciadas.',
        fuelRecommendation: 'Gasolina Pb95 / Diésel',
      },
      {
        key: 'suv_30_v6_gran',
        name: '3.0L V6 / 4.0L Gran SUV 7P',
        displacement: '2.995 - 3.956 cc • V6 Gran Chasis',
        powerCV: '250 - 300 CV',
        baseL100: 12.5,
        description: 'Gran porte, chasis reforzado de largueros para 7 pasajeros, remolque y carga completa.',
        fuelRecommendation: 'Gasolina / Diésel',
      },
      {
        key: 'suv_custom',
        name: 'Personalizado de Tablero',
        displacement: 'Calibración manual directa',
        powerCV: 'Ajuste libre',
        baseL100: 9.5,
        description: 'Ingresa el consumo mixto registrado en el computador de viaje de tu vehículo.',
      },
    ],
  },

  pickup: {
    type: 'pickup',
    label: 'Pickup / Camioneta 4x4',
    shortLabel: 'Pickup',
    icon: '🛻',
    defaultBaseL100: 10.2,
    description: 'Camionetas con platón de carga y tracción reforzada (ej. Hilux, Frontier, Ranger, Amarok)',
    engines: [
      {
        key: 'pick_24_diesel_4x2',
        name: '2.0L - 2.4L Turbodiésel 4x2 Trabajo',
        displacement: '2.393 cc • 4 Cilindros D-4D / CRDi',
        powerCV: '150 CV • 400 Nm',
        baseL100: 8.5,
        description: 'Uso comercial diario, reparto de media carga y bajo costo de mantenimiento por km.',
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        key: 'pick_28_diesel_4x4',
        name: '2.8L - 3.2L Turbodiésel 4x4 Alto Torque',
        displacement: '2.755 cc • 1GD-FTV 16V Intercooler',
        powerCV: '204 CV • 500 Nm',
        baseL100: 10.2,
        description: 'Máxima fuerza de arrastre para trochas difíciles, lodo, pendientes y carga de 1 tonelada.',
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        key: 'pick_v8_gasolina',
        name: '3.5L - 5.7L V6 / V8 Gasolina Heavy Duty',
        displacement: '3.497 - 5.654 cc • V6 / V8 Gran Cilindrada',
        powerCV: '380 - 400 CV',
        baseL100: 13.8,
        description: 'Gran potencia bruta americana, aceleración inmediata y gran capacidad de arrastre.',
        fuelRecommendation: 'Gasolina',
      },
      {
        key: 'pick_custom',
        name: 'Personalizado de Tablero',
        displacement: 'Calibración manual directa',
        powerCV: 'Ajuste libre',
        baseL100: 10.2,
        description: 'Ingresa el consumo mixto registrado en el computador de viaje de tu camioneta.',
      },
    ],
  },

  van: {
    type: 'van',
    label: 'Furgón / Utilitario / Van',
    shortLabel: 'Furgón',
    icon: '🚐',
    defaultBaseL100: 8.6,
    description: 'Vehículos comerciales de transporte y logística cerrada (ej. Master, Transit, Daily, Partner)',
    engines: [
      {
        key: 'van_15_diesel',
        name: '1.5L - 1.6L Diésel Ligero Reparto',
        displacement: '1.499 - 1.598 cc • BlueHDi / dCi',
        powerCV: '100 - 120 CV',
        baseL100: 6.2,
        description: 'Furgonetas pequeñas para mensajería y logística urbana intensiva de bajo consumo.',
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        key: 'van_20_23_diesel',
        name: '2.0L - 2.3L Diésel Utilitario Medio',
        displacement: '1.968 - 2.298 cc • TDI / dCi 16V',
        powerCV: '130 - 150 CV',
        baseL100: 8.6,
        description: 'Volumen medio estándar para transporte interurbano de mercancías y pallets.',
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        key: 'van_30_heavy',
        name: '3.0L Diésel Chasis Gran Volumen',
        displacement: '2.998 cc • 4 Cilindros HPI 16V',
        powerCV: '180 CV • 430 Nm',
        baseL100: 11.2,
        description: 'Chasis cabina reforzado para cargas pesadas y furgón cerrado de hasta 3.500 kg.',
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        key: 'van_custom',
        name: 'Personalizado de Tablero',
        displacement: 'Calibración manual directa',
        powerCV: 'Ajuste libre',
        baseL100: 8.6,
        description: 'Ingresa el consumo mixto registrado en el computador de viaje de tu utilitario.',
      },
    ],
  },

  custom: {
    type: 'custom',
    label: 'Personalizado',
    shortLabel: 'Personalizado',
    icon: '⚡',
    defaultBaseL100: 8.0,
    description: 'Vehículo configurado manualmente con consumo y cilindrada libre',
    engines: [
      {
        key: 'custom_direct',
        name: 'Calibración Libre de Odómetro',
        displacement: 'Ajuste manual directo de tablero',
        powerCV: 'Ajuste libre',
        baseL100: 8.0,
        description: 'Calibra el consumo base exacto según los registros de tu computador de a bordo.',
      },
    ],
  },
};

export interface ActiveVehicleState {
  vehicleType: 'compact' | 'sedan' | 'suv' | 'pickup' | 'van' | 'custom';
  engineKey: string;
  engineName: string;
  displacement: string;
  baseL100: number;
  transmission: 'manual' | 'automatic';
  vehicleModelName: string;
  carPhotoUrl: string | null;
  fuelType: string;
}

/**
 * Obtiene el estado actual sincronizado del vehículo desde localStorage
 */
export function getActiveVehicleState(): ActiveVehicleState {
  try {
    const vType = (localStorage.getItem('litrometrik_active_vehicle_type') ||
      localStorage.getItem('litrometrik_user_vehicle') ||
      'sedan') as ActiveVehicleState['vehicleType'];

    const category = UNIFIED_VEHICLE_CATALOG[vType] || UNIFIED_VEHICLE_CATALOG.sedan;
    const defaultEng = category.engines[1] || category.engines[0];

    const engineKey = localStorage.getItem('litrometrik_active_engine_key') || defaultEng.key;
    const engineName = localStorage.getItem('litrometrik_active_engine_name');

    // Buscar motor concordante por nombre primero para que coincida perfectamente con el panel de marcha
    const foundEng =
      (engineName ? category.engines.find((e) => e.name === engineName) : null) ||
      category.engines.find((e) => e.key === engineKey) ||
      defaultEng;

    const storedBase = parseFloat(localStorage.getItem('litrometrik_active_base_l100') || '');
    const baseL100 = !isNaN(storedBase) && storedBase > 0 ? storedBase : foundEng.baseL100;

    const resolvedEngineName = engineName || foundEng.name;
    const transmission = (localStorage.getItem('litrometrik_active_transmission') || 'manual') as 'manual' | 'automatic';

    const rawVehicleModelName =
      localStorage.getItem('litrometrik_user_vehicle_model') ||
      localStorage.getItem('litrometrik_active_vehicle_model');

    const engineDisplacementShort = (resolvedEngineName.match(/\d+\.\d+L/) || [])[0] || resolvedEngineName.split(' ')[0];
    const defaultModelName = `${category.shortLabel} (${engineDisplacementShort})`;

    const vehicleModelName =
      rawVehicleModelName && !rawVehicleModelName.startsWith(category.shortLabel + ' (')
        ? rawVehicleModelName
        : defaultModelName;

    const carPhotoUrl =
      localStorage.getItem('litrometrik_car_photo') ||
      localStorage.getItem('litrometrik_user_car_photo') ||
      null;

    const fuelType =
      localStorage.getItem('litrometrik_active_fuel') ||
      localStorage.getItem('litrometrik_user_fuel') ||
      'Gasolina';

    return {
      vehicleType: vType,
      engineKey: foundEng.key,
      engineName: resolvedEngineName,
      displacement: foundEng.displacement,
      baseL100,
      transmission,
      vehicleModelName,
      carPhotoUrl,
      fuelType,
    };
  } catch (_) {
    return {
      vehicleType: 'sedan',
      engineKey: 'sedan_16_mpi',
      engineName: '1.6L MPI / VVT 16V Eficiente',
      displacement: '1.598 cc • 4 Cilindros DOHC',
      baseL100: 7.2,
      transmission: 'manual',
      vehicleModelName: 'Sedán (1.6L)',
      carPhotoUrl: null,
      fuelType: 'Gasolina',
    };
  }
}

/**
 * Guarda y propaga la calibración del vehículo para que Garaje, Modo Marcha y Calculadora
 * permanezcan 100% idénticos y en tiempo real.
 */
export function saveActiveVehicleState(partial: Partial<ActiveVehicleState>): ActiveVehicleState {
  const current = getActiveVehicleState();
  const next: ActiveVehicleState = { ...current, ...partial };

  const category = UNIFIED_VEHICLE_CATALOG[next.vehicleType] || UNIFIED_VEHICLE_CATALOG.sedan;
  const matchEng =
    category.engines.find((e) => e.name === next.engineName) ||
    category.engines.find((e) => e.key === next.engineKey) ||
    category.engines[0];

  if (matchEng) {
    next.engineKey = matchEng.key;
    next.displacement = matchEng.displacement;
    if (!partial.baseL100) {
      next.baseL100 = matchEng.baseL100;
    }
  }

  const engineDisplacementShort = (next.engineName.match(/\d+\.\d+L/) || [])[0] || next.engineName.split(' ')[0];
  if (!partial.vehicleModelName || partial.vehicleModelName.includes('(')) {
    next.vehicleModelName = `${category.shortLabel} (${engineDisplacementShort})`;
  }

  try {
    localStorage.setItem('litrometrik_active_vehicle_type', next.vehicleType);
    localStorage.setItem('litrometrik_user_vehicle', next.vehicleType);
    localStorage.setItem('litrometrik_active_engine_key', next.engineKey);
    localStorage.setItem('litrometrik_active_engine_name', next.engineName);
    localStorage.setItem('litrometrik_active_base_l100', next.baseL100.toString());
    localStorage.setItem('litrometrik_active_transmission', next.transmission);
    localStorage.setItem('litrometrik_user_vehicle_model', next.vehicleModelName);
    localStorage.setItem('litrometrik_active_vehicle_model', next.vehicleModelName);

    if (next.carPhotoUrl) {
      localStorage.setItem('litrometrik_car_photo', next.carPhotoUrl);
      localStorage.setItem('litrometrik_user_car_photo', next.carPhotoUrl);
    } else if (partial.carPhotoUrl === null) {
      localStorage.removeItem('litrometrik_car_photo');
      localStorage.removeItem('litrometrik_user_car_photo');
    }

    if (next.fuelType) {
      localStorage.setItem('litrometrik_active_fuel', next.fuelType);
      localStorage.setItem('litrometrik_user_fuel', next.fuelType);
    }

    // Emit global sync events across the entire application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('litrometrik-vehicle-updated', { detail: next }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.warn('Error saving vehicle state:', err);
  }

  return next;
}
