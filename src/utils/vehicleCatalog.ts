import { CountryCode } from './countryData';

export interface UnifiedEngineSpec {
  id: string;
  key: string; // alias to id
  nombreComun: string;
  name: string; // alias to nombreComun
  cc: string;
  displacement: string; // alias to cc
  cilindrosPotencia: string;
  powerCV: string; // alias to cilindrosPotencia
  descripcionBreve: string;
  description: string; // alias to descripcionBreve
  detalleInfo: {
    tipoManejo: string;
    ejemplosAutos: string[];
    rendimientoYCombustible: string;
  };
  consumoBaseL100: number;
  baseL100: number; // alias to consumoBaseL100
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
 * Función auxiliar para formatear la economía de combustible según el país.
 * - Polonia (PL) y España (ES): 'X.X L/100 km'
 * - Colombia (CO) y México (MX): 'X.X km/L' (100 / L_100km)
 */
export function formatFuelEconomy(l100km: number, countryCode: CountryCode | string = 'PL'): string {
  if (isNaN(l100km) || l100km <= 0) {
    return countryCode === 'CO' || countryCode === 'MX' ? '0.0 km/L' : '0.0 L/100 km';
  }
  const isKmL = countryCode === 'CO' || countryCode === 'MX';
  if (isKmL) {
    const kmL = 100 / l100km;
    return `${kmL.toFixed(1).replace('.', ',')} km/L`;
  }
  return `${l100km.toFixed(1).replace('.', ',')} L/100 km`;
}

/**
 * Adapta el nombre del combustible principal según el país.
 * - Colombia / México: 'Gas GLP'
 * - Polonia / España: 'LPG'
 */
export function getFuelDisplayName(fuel: string, countryCode: CountryCode | string = 'PL'): string {
  const isLatam = countryCode === 'CO' || countryCode === 'MX';
  if (fuel === 'LPG' || fuel === 'Gas LPG' || fuel === 'GLP') {
    return isLatam ? 'Gas GLP' : 'LPG';
  }
  return fuel;
}

/**
 * CATÁLOGO ESTANDARIZADO DE VEHÍCULOS Y MOTORES
 * Definición centralizada sin tecnicismos mecánicos complejos.
 * Fuente única de verdad sincronizada para:
 * 1. Modo de Marcha (Panel de Conducción y Dashboard)
 * 2. Calculadora de Combustible y Rutas
 * 3. Garaje y Diagnóstico
 * 4. Perfil de Conductor y Telemetría
 */
export const UNIFIED_VEHICLE_CATALOG: Record<string, UnifiedVehicleCategory> = {
  compact: {
    type: 'compact',
    label: 'Compacto / Urbano',
    shortLabel: 'Compacto',
    icon: '🚗',
    defaultBaseL100: 5.4,
    description: 'Hatchbacks y autos urbanos ágiles de bajo peso',
    engines: [
      {
        id: 'comp_10_12_eco',
        key: 'comp_10_12_eco',
        nombreComun: 'Motor 1.0L - 1.2L Económico',
        name: 'Motor 1.0L - 1.2L Económico',
        cc: '999 - 1.199 cc',
        displacement: '999 - 1.199 cc',
        cilindrosPotencia: '3 o 4 Cilindros · 75 - 110 CV / HP',
        powerCV: '75 - 110 CV / HP',
        descripcionBreve: 'Motor compacto de bajo cilindraje ideal para tráfico urbano y mínimo gasto de combustible.',
        description: 'Motor compacto de bajo cilindraje ideal para tráfico urbano y mínimo gasto de combustible.',
        detalleInfo: {
          tipoManejo: 'Manejo urbano diario, reparto ágil y recorridos cortos en ciudad sin sobrecargar el consumo.',
          ejemplosAutos: ['Renault Clio / Sandero 1.0', 'Volkswagen Polo / Gol 1.0', 'Hyundai i10 / Grand i10', 'Toyota Yaris 1.2 / Etios'],
          rendimientoYCombustible: 'Rendimiento mixto de referencia ~5.4 L/100 km (18.5 km/L). Alta compatibilidad con Gasolina corriente y Gas GLP / LPG.',
        },
        consumoBaseL100: 5.4,
        baseL100: 5.4,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'comp_14_16_std',
        key: 'comp_14_16_std',
        nombreComun: 'Motor 1.4L - 1.6L Estándar',
        name: 'Motor 1.4L - 1.6L Estándar',
        cc: '1.390 - 1.598 cc',
        displacement: '1.390 - 1.598 cc',
        cilindrosPotencia: '4 Cilindros · 90 - 115 CV / HP',
        powerCV: '90 - 115 CV / HP',
        descripcionBreve: 'Mecánica clásica confiable con excelente fuerza tanto en subidas como en avenidas rápidas.',
        description: 'Mecánica clásica confiable con excelente fuerza tanto en subidas como en avenidas rápidas.',
        detalleInfo: {
          tipoManejo: 'Uso mixto ciudad y carretera, fácil adelantamiento y respuesta estable con el aire acondicionado encendido.',
          ejemplosAutos: ['Chevrolet Onix / Aveo 1.4-1.5', 'Ford Fiesta 1.6', 'Peugeot 208 1.6', 'Seat Ibiza / VW Fox 1.6'],
          rendimientoYCombustible: 'Rendimiento promedio ~6.2 L/100 km (16.1 km/L). Óptima durabilidad con Gas GLP / LPG o Gasolina.',
        },
        consumoBaseL100: 6.2,
        baseL100: 6.2,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'comp_16_20_sport',
        key: 'comp_16_20_sport',
        nombreComun: 'Motor 1.6L - 2.0L Ágil / Deportivo',
        name: 'Motor 1.6L - 2.0L Ágil / Deportivo',
        cc: '1.598 - 1.998 cc',
        displacement: '1.598 - 1.998 cc',
        cilindrosPotencia: '4 Cilindros · 125 - 150 CV / HP',
        powerCV: '125 - 150 CV / HP',
        descripcionBreve: 'Mayor aceleración y elasticidad para viajes constantes en autopista con chasis compacto.',
        description: 'Mayor aceleración y elasticidad para viajes constantes en autopista con chasis compacto.',
        detalleInfo: {
          tipoManejo: 'Conducción en vías rápidas, montaña y adelantamientos seguros a velocidad de crucero.',
          ejemplosAutos: ['Volkswagen Golf 1.4-2.0', 'Suzuki Swift Sport 1.4', 'Kia Rio 1.6', 'Mini Cooper 1.5-2.0'],
          rendimientoYCombustible: 'Rendimiento promedio ~6.8 L/100 km (14.7 km/L). Gasolina Extra/Premium o Gas GLP.',
        },
        consumoBaseL100: 6.8,
        baseL100: 6.8,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'comp_custom',
        key: 'comp_custom',
        nombreComun: 'Personalizado de Tablero',
        name: 'Personalizado de Tablero',
        cc: 'Ajuste manual directo',
        displacement: 'Ajuste manual directo',
        cilindrosPotencia: 'Calibración libre de usuario',
        powerCV: 'Calibración libre de usuario',
        descripcionBreve: 'Consumo mixto personalizado según el odómetro o computador de tu auto.',
        description: 'Consumo mixto personalizado según el odómetro o computador de tu auto.',
        detalleInfo: {
          tipoManejo: 'Configuración personalizada para cualquier versión o modificación particular.',
          ejemplosAutos: ['Cualquier modelo compacto con consumo calibrado'],
          rendimientoYCombustible: 'Configuración libre en litros por 100 km o kilómetros por litro.',
        },
        consumoBaseL100: 5.8,
        baseL100: 5.8,
      },
    ],
  },

  sedan: {
    type: 'sedan',
    label: 'Sedán / Mediano / Berlina',
    shortLabel: 'Sedán',
    icon: '🚘',
    defaultBaseL100: 7.2,
    description: 'Sedanes y familiares con carrocería alargada y maletero independiente',
    engines: [
      {
        id: 'sedan_16_std',
        key: 'sedan_16_std',
        nombreComun: 'Motor 1.6L Estándar',
        name: 'Motor 1.6L Estándar',
        cc: '1.598 cc',
        displacement: '1.598 cc',
        cilindrosPotencia: '4 Cilindros · 102 - 115 CV / HP',
        powerCV: '102 - 115 CV / HP',
        descripcionBreve: 'Motor convencional de alta durabilidad, bajo costo de repuestos y compatible con gas GLP/LPG.',
        description: 'Motor convencional de alta durabilidad, bajo costo de repuestos y compatible con gas GLP/LPG.',
        detalleInfo: {
          tipoManejo: 'Uso diario familiar, transporte particular y plataformas de movilidad con balance óptimo de durabilidad.',
          ejemplosAutos: ['Skoda Octavia 1.6', 'Nissan Versa / Sentra 1.6', 'Renault Logan / Megane 1.6', 'Toyota Corolla 1.6'],
          rendimientoYCombustible: 'Consumo mixto ~7.2 L/100 km (13.9 km/L). Excepcional economía y adaptación para Gas GLP / LPG.',
        },
        consumoBaseL100: 7.2,
        baseL100: 7.2,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'sedan_18_20_med',
        key: 'sedan_18_20_med',
        nombreComun: 'Motor 1.8L - 2.0L Mediano',
        name: 'Motor 1.8L - 2.0L Mediano',
        cc: '1.798 - 1.998 cc',
        displacement: '1.798 - 1.998 cc',
        cilindrosPotencia: '4 Cilindros · 140 - 165 CV / HP',
        powerCV: '140 - 165 CV / HP',
        descripcionBreve: 'Marcha suave y silenciosa con potencia de reserva para autopista y viajes largos.',
        description: 'Marcha suave y silenciosa con potencia de reserva para autopista y viajes largos.',
        detalleInfo: {
          tipoManejo: 'Viajes intermunicipales, confort familiar en carretera y excelente capacidad de carga.',
          ejemplosAutos: ['Mazda 3 / 6 2.0', 'Toyota Corolla 1.8-2.0', 'Honda Civic 2.0', 'Volkswagen Jetta / Vento 2.0'],
          rendimientoYCombustible: 'Consumo promedio ~8.2 L/100 km (12.2 km/L). Gasolina y Gas GLP.',
        },
        consumoBaseL100: 8.2,
        baseL100: 8.2,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'sedan_25_30_pot',
        key: 'sedan_25_30_pot',
        nombreComun: 'Motor 2.5L - 3.0L Potente / V6',
        name: 'Motor 2.5L - 3.0L Potente / V6',
        cc: '2.488 - 2.998 cc',
        displacement: '2.488 - 2.998 cc',
        cilindrosPotencia: '4 o 6 Cilindros · 185 - 250 CV / HP',
        powerCV: '185 - 250 CV / HP',
        descripcionBreve: 'Gran cilindrada y fuerza constante para berlinas de representación y velocidad estable.',
        description: 'Gran cilindrada y fuerza constante para berlinas de representación y velocidad estable.',
        detalleInfo: {
          tipoManejo: 'Altas velocidades de crucero, adelantamientos instantáneos y máxima comodidad en trayectos largos.',
          ejemplosAutos: ['Toyota Camry 2.5-3.5 V6', 'Nissan Altima / Maxima', 'Audi A4 / A6 2.0-3.0', 'BMW Serie 3 / 5'],
          rendimientoYCombustible: 'Consumo promedio ~9.8 L/100 km (10.2 km/L). Gasolina y Gas GLP.',
        },
        consumoBaseL100: 9.8,
        baseL100: 9.8,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'sedan_custom',
        key: 'sedan_custom',
        nombreComun: 'Personalizado de Tablero',
        name: 'Personalizado de Tablero',
        cc: 'Ajuste manual directo',
        displacement: 'Ajuste manual directo',
        cilindrosPotencia: 'Calibración libre de usuario',
        powerCV: 'Calibración libre de usuario',
        descripcionBreve: 'Consumo mixto personalizado según el odómetro o computador de tu sedán.',
        description: 'Consumo mixto personalizado según el odómetro o computador de tu sedán.',
        detalleInfo: {
          tipoManejo: 'Personalizado para cualquier sedán o berlina.',
          ejemplosAutos: ['Cualquier sedán con consumo medido'],
          rendimientoYCombustible: 'Configuración libre en litros por 100 km o kilómetros por litro.',
        },
        consumoBaseL100: 7.5,
        baseL100: 7.5,
      },
    ],
  },

  suv: {
    type: 'suv',
    label: 'Grande / SUV / Crossover',
    shortLabel: 'SUV',
    icon: '🚙',
    defaultBaseL100: 8.8,
    description: 'Camionetas familiares elevadas, 4x2 y 4x4',
    engines: [
      {
        id: 'suv_10_13_turbo',
        key: 'suv_10_13_turbo',
        nombreComun: 'Motor 1.0L - 1.3L Turbo Urbano',
        name: 'Motor 1.0L - 1.3L Turbo Urbano',
        cc: '999 - 1.332 cc',
        displacement: '999 - 1.332 cc',
        cilindrosPotencia: '3 o 4 Cilindros · 100 - 130 CV / HP',
        powerCV: '100 - 130 CV / HP',
        descripcionBreve: 'Bajo consumo para camionetas compactas familiares en recorridos de ciudad y planicie.',
        description: 'Bajo consumo para camionetas compactas familiares en recorridos de ciudad y planicie.',
        detalleInfo: {
          tipoManejo: 'Uso urbano diario, tráfico denso y viajes ligeros en familia.',
          ejemplosAutos: ['Renault Duster 1.3 Turbo', 'Chevrolet Tracker 1.2 Turbo', 'Volkswagen T-Cross / Nivus 1.0', 'Fiat Pulse 1.0'],
          rendimientoYCombustible: 'Consumo mixto ~6.8 L/100 km (14.7 km/L). Gasolina y Gas GLP / LPG.',
        },
        consumoBaseL100: 6.8,
        baseL100: 6.8,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'suv_16_20_fam',
        key: 'suv_16_20_fam',
        nombreComun: 'Motor 1.6L - 2.0L Mediano Familiar (4x2)',
        name: 'Motor 1.6L - 2.0L Mediano Familiar (4x2)',
        cc: '1.598 - 1.998 cc',
        displacement: '1.598 - 1.998 cc',
        cilindrosPotencia: '4 Cilindros · 140 - 165 CV / HP',
        powerCV: '140 - 165 CV / HP',
        descripcionBreve: 'Equilibrio probado de fuerza y durabilidad para camionetas familiares con tracción delantera.',
        description: 'Equilibrio probado de fuerza y durabilidad para camionetas familiares con tracción delantera.',
        detalleInfo: {
          tipoManejo: 'Paseos familiares, equipaje completo y conducción confortable tanto en ciudad como en carretera.',
          ejemplosAutos: ['Kia Sportage 2.0', 'Hyundai Tucson 2.0', 'Mazda CX-30 / CX-5 2.0', 'Nissan Qashqai / Kicks 1.6-2.0'],
          rendimientoYCombustible: 'Consumo promedio ~8.8 L/100 km (11.4 km/L). Gasolina y Gas GLP.',
        },
        consumoBaseL100: 8.8,
        baseL100: 8.8,
        fuelRecommendation: 'Gasolina / Gas GLP',
      },
      {
        id: 'suv_20_25_4x4',
        key: 'suv_20_25_4x4',
        nombreComun: 'Motor 2.0L - 2.5L Tracción Integral (4x4)',
        name: 'Motor 2.0L - 2.5L Tracción Integral (4x4)',
        cc: '1.998 - 2.488 cc',
        displacement: '1.998 - 2.488 cc',
        cilindrosPotencia: '4 Cilindros · 170 - 210 CV / HP',
        powerCV: '170 - 210 CV / HP',
        descripcionBreve: 'Potencia superior y agarre total en carretera húmeda, pendientes pronunciadas y caminos mixtos.',
        description: 'Potencia superior y agarre total en carretera húmeda, pendientes pronunciadas y caminos mixtos.',
        detalleInfo: {
          tipoManejo: 'Terrenos ondulados, climas de lluvia o nieve, y viajes con carga completa.',
          ejemplosAutos: ['Toyota RAV4 2.5 4x4', 'Subaru Forester / Outback 2.5 AWD', 'Ford Escape 2.0-2.5 4x4', 'Honda CR-V 2.4 AWD'],
          rendimientoYCombustible: 'Consumo promedio ~10.2 L/100 km (9.8 km/L). Gasolina y Diésel.',
        },
        consumoBaseL100: 10.2,
        baseL100: 10.2,
        fuelRecommendation: 'Gasolina / Diésel',
      },
      {
        id: 'suv_30_40_v6',
        key: 'suv_30_40_v6',
        nombreComun: 'Motor 3.0L - 4.0L V6 Gran Camioneta',
        name: 'Motor 3.0L - 4.0L V6 Gran Camioneta',
        cc: '2.995 - 3.956 cc',
        displacement: '2.995 - 3.956 cc',
        cilindrosPotencia: '6 Cilindros · 240 - 290 CV / HP',
        powerCV: '240 - 290 CV / HP',
        descripcionBreve: 'Gran cilindrada para camionetas de 7 pasajeros con chasis reforzado y capacidad de remolque.',
        description: 'Gran cilindrada para camionetas de 7 pasajeros con chasis reforzado y capacidad de remolque.',
        detalleInfo: {
          tipoManejo: 'Viajes de expedición, 7 pasajeros con equipaje y arrastre de remolque en carretera abierta.',
          ejemplosAutos: ['Toyota Prado / 4Runner 4.0 V6', 'Ford Explorer 3.5 V6', 'Jeep Grand Cherokee 3.6', 'Chevrolet Traverse 3.6'],
          rendimientoYCombustible: 'Consumo promedio ~12.5 L/100 km (8.0 km/L). Gasolina y Diésel.',
        },
        consumoBaseL100: 12.5,
        baseL100: 12.5,
        fuelRecommendation: 'Gasolina / Diésel',
      },
      {
        id: 'suv_custom',
        key: 'suv_custom',
        nombreComun: 'Personalizado de Tablero',
        name: 'Personalizado de Tablero',
        cc: 'Ajuste manual directo',
        displacement: 'Ajuste manual directo',
        cilindrosPotencia: 'Calibración libre de usuario',
        powerCV: 'Calibración libre de usuario',
        descripcionBreve: 'Consumo mixto personalizado según el computador de tu camioneta.',
        description: 'Consumo mixto personalizado según el computador de tu camioneta.',
        detalleInfo: {
          tipoManejo: 'Personalizado para cualquier SUV o camioneta.',
          ejemplosAutos: ['Cualquier SUV con registro de consumo directo'],
          rendimientoYCombustible: 'Configuración libre en litros por 100 km o kilómetros por litro.',
        },
        consumoBaseL100: 9.0,
        baseL100: 9.0,
      },
    ],
  },

  pickup: {
    type: 'pickup',
    label: 'Pickup / Camioneta 4x4',
    shortLabel: 'Pickup',
    icon: '🛻',
    defaultBaseL100: 9.8,
    description: 'Camionetas con platón de carga y tracción reforzada',
    engines: [
      {
        id: 'pick_20_24_diesel',
        key: 'pick_20_24_diesel',
        nombreComun: 'Motor 2.0L - 2.4L Diésel Trabajo (4x2)',
        name: 'Motor 2.0L - 2.4L Diésel Trabajo (4x2)',
        cc: '1.995 - 2.393 cc',
        displacement: '1.995 - 2.393 cc',
        cilindrosPotencia: '4 Cilindros Turbodiésel · 140 - 160 CV / HP',
        powerCV: '140 - 160 CV / HP',
        descripcionBreve: 'Excelente economía de combustible para trabajo diario, transporte de carga media y bajo costo por km.',
        description: 'Excelente economía de combustible para trabajo diario, transporte de carga media y bajo costo por km.',
        detalleInfo: {
          tipoManejo: 'Reparto comercial diario, empresas de servicio y transporte interurbano de media carga.',
          ejemplosAutos: ['Toyota Hilux 2.4 4x2', 'Nissan Frontier / NP300 2.5 Diésel', 'Ford Ranger 2.2 Diésel', 'Mitsubishi L200 2.4'],
          rendimientoYCombustible: 'Consumo promedio ~8.5 L/100 km (11.8 km/L). Combustible Diésel / ACPM.',
        },
        consumoBaseL100: 8.5,
        baseL100: 8.5,
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        id: 'pick_28_32_diesel',
        key: 'pick_28_32_diesel',
        nombreComun: 'Motor 2.8L - 3.2L Diésel Alto Torque (4x4)',
        name: 'Motor 2.8L - 3.2L Diésel Alto Torque (4x4)',
        cc: '2.755 - 3.198 cc',
        displacement: '2.755 - 3.198 cc',
        cilindrosPotencia: '4 o 5 Cilindros Turbodiésel · 190 - 210 CV / HP',
        powerCV: '190 - 210 CV / HP',
        descripcionBreve: 'Máxima fuerza de arrastre para trochas difíciles, pendientes pronunciadas y carga de 1 tonelada.',
        description: 'Máxima fuerza de arrastre para trochas difíciles, pendientes pronunciadas y carga de 1 tonelada.',
        detalleInfo: {
          tipoManejo: 'Trabajo pesado, minería, fincas rurales, arrastre y tracción en barro o terrenos escarpados.',
          ejemplosAutos: ['Toyota Hilux 2.8 4x4', 'Ford Ranger 3.2', 'Chevrolet D-Max 3.0', 'Volkswagen Amarok 2.0-3.0 V6 TDI'],
          rendimientoYCombustible: 'Consumo promedio ~10.2 L/100 km (9.8 km/L). Combustible Diésel / ACPM.',
        },
        consumoBaseL100: 10.2,
        baseL100: 10.2,
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        id: 'pick_35_57_v8',
        key: 'pick_35_57_v8',
        nombreComun: 'Motor 3.5L - 5.7L V6 / V8 Gasolina Fuerte',
        name: 'Motor 3.5L - 5.7L V6 / V8 Gasolina Fuerte',
        cc: '3.497 - 5.654 cc',
        displacement: '3.497 - 5.654 cc',
        cilindrosPotencia: '6 u 8 Cilindros · 350 - 400 CV / HP',
        powerCV: '350 - 400 CV / HP',
        descripcionBreve: 'Potencia bruta americana con aceleración inmediata y gran capacidad de tiro.',
        description: 'Potencia bruta americana con aceleración inmediata y gran capacidad de tiro.',
        detalleInfo: {
          tipoManejo: 'Remolques pesados en autopista, caballos de fuerza directos y aceleración contundente.',
          ejemplosAutos: ['Ford F-150 V6/V8', 'RAM 1500 5.7 HEMI', 'Chevrolet Silverado V8', 'Toyota Tundra 3.5-5.7'],
          rendimientoYCombustible: 'Consumo promedio ~13.8 L/100 km (7.2 km/L). Combustible Gasolina.',
        },
        consumoBaseL100: 13.8,
        baseL100: 13.8,
        fuelRecommendation: 'Gasolina',
      },
      {
        id: 'pick_custom',
        key: 'pick_custom',
        nombreComun: 'Personalizado de Tablero',
        name: 'Personalizado de Tablero',
        cc: 'Ajuste manual directo',
        displacement: 'Ajuste manual directo',
        cilindrosPotencia: 'Calibración libre de usuario',
        powerCV: 'Calibración libre de usuario',
        descripcionBreve: 'Consumo mixto personalizado según el odómetro de tu pickup.',
        description: 'Consumo mixto personalizado según el odómetro de tu pickup.',
        detalleInfo: {
          tipoManejo: 'Personalizado para cualquier pickup.',
          ejemplosAutos: ['Cualquier pickup con odómetro verificado'],
          rendimientoYCombustible: 'Configuración libre en litros por 100 km o kilómetros por litro.',
        },
        consumoBaseL100: 10.0,
        baseL100: 10.0,
      },
    ],
  },

  van: {
    type: 'van',
    label: 'Furgón / Utilitario / Van',
    shortLabel: 'Furgón',
    icon: '🚐',
    defaultBaseL100: 8.6,
    description: 'Vehículos comerciales de transporte y logística cerrada',
    engines: [
      {
        id: 'van_15_16_diesel',
        key: 'van_15_16_diesel',
        nombreComun: 'Motor 1.5L - 1.6L Diésel Ligero Reparto',
        name: 'Motor 1.5L - 1.6L Diésel Ligero Reparto',
        cc: '1.499 - 1.598 cc',
        displacement: '1.499 - 1.598 cc',
        cilindrosPotencia: '4 Cilindros Turbodiésel · 95 - 120 CV / HP',
        powerCV: '95 - 120 CV / HP',
        descripcionBreve: 'Furgonetas pequeñas para mensajería, paquetería y logística urbana con mínimo gasto.',
        description: 'Furgonetas pequeñas para mensajería, paquetería y logística urbana con mínimo gasto.',
        detalleInfo: {
          tipoManejo: 'Distribución urbana de última milla, tráfico de ciudad constante y entregas a domicilio.',
          ejemplosAutos: ['Peugeot Partner / Rifter 1.6 HDI', 'Renault Kangoo 1.5 dCi', 'Citroën Berlingo', 'Fiat Fiorino / Doblò'],
          rendimientoYCombustible: 'Consumo mixto ~6.2 L/100 km (16.1 km/L). Combustible Diésel / ACPM.',
        },
        consumoBaseL100: 6.2,
        baseL100: 6.2,
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        id: 'van_20_23_diesel',
        key: 'van_20_23_diesel',
        nombreComun: 'Motor 2.0L - 2.3L Diésel Utilitario Medio',
        name: 'Motor 2.0L - 2.3L Diésel Utilitario Medio',
        cc: '1.968 - 2.298 cc',
        displacement: '1.968 - 2.298 cc',
        cilindrosPotencia: '4 Cilindros Turbodiésel · 130 - 150 CV / HP',
        powerCV: '130 - 150 CV / HP',
        descripcionBreve: 'Volumen medio estándar para transporte interurbano de mercancías y pallets con excelente durabilidad.',
        description: 'Volumen medio estándar para transporte interurbano de mercancías y pallets con excelente durabilidad.',
        detalleInfo: {
          tipoManejo: 'Rutas intermunicipales, carga de volumen cerrado y trabajo continuo de logística.',
          ejemplosAutos: ['Ford Transit Custom 2.0', 'Renault Master / Trafic 2.0-2.3', 'Volkswagen Transporter / Crafter', 'Mercedes-Benz Vito'],
          rendimientoYCombustible: 'Consumo promedio ~8.6 L/100 km (11.6 km/L). Combustible Diésel / ACPM.',
        },
        consumoBaseL100: 8.6,
        baseL100: 8.6,
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        id: 'van_30_heavy',
        key: 'van_30_heavy',
        nombreComun: 'Motor 3.0L Diésel Carga Pesada',
        name: 'Motor 3.0L Diésel Carga Pesada',
        cc: '2.998 cc',
        displacement: '2.998 cc',
        cilindrosPotencia: '4 Cilindros Turbodiésel · 170 - 190 CV / HP',
        powerCV: '170 - 190 CV / HP',
        descripcionBreve: 'Chasis cabina reforzado para cargas pesadas y furgón cerrado de hasta 3.500 kg de peso bruto.',
        description: 'Chasis cabina reforzado para cargas pesadas y furgón cerrado de hasta 3.500 kg de peso bruto.',
        detalleInfo: {
          tipoManejo: 'Carga pesada a máxima capacidad, rutas de montaña con peso y uso industrial exigente.',
          ejemplosAutos: ['Iveco Daily 3.0', 'Mercedes-Benz Sprinter 3.0', 'Fiat Ducato Maxi', 'Renault Master Chasis'],
          rendimientoYCombustible: 'Consumo promedio ~11.2 L/100 km (8.9 km/L). Combustible Diésel / ACPM.',
        },
        consumoBaseL100: 11.2,
        baseL100: 11.2,
        fuelRecommendation: 'Diésel / ACPM',
      },
      {
        id: 'van_custom',
        key: 'van_custom',
        nombreComun: 'Personalizado de Tablero',
        name: 'Personalizado de Tablero',
        cc: 'Ajuste manual directo',
        displacement: 'Ajuste manual directo',
        cilindrosPotencia: 'Calibración libre de usuario',
        powerCV: 'Calibración libre de usuario',
        descripcionBreve: 'Consumo mixto personalizado según el odómetro de tu furgón.',
        description: 'Consumo mixto personalizado según el odómetro de tu furgón.',
        detalleInfo: {
          tipoManejo: 'Personalizado para cualquier furgón o van.',
          ejemplosAutos: ['Cualquier utilitario con consumo verificado'],
          rendimientoYCombustible: 'Configuración libre en litros por 100 km o kilómetros por litro.',
        },
        consumoBaseL100: 8.6,
        baseL100: 8.6,
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
        id: 'custom_direct',
        key: 'custom_direct',
        nombreComun: 'Calibración Libre de Odómetro',
        name: 'Calibración Libre de Odómetro',
        cc: 'Ajuste manual directo',
        displacement: 'Ajuste manual directo',
        cilindrosPotencia: 'Calibración libre de usuario',
        powerCV: 'Calibración libre de usuario',
        descripcionBreve: 'Calibra el consumo base exacto según los registros de tu computador de a bordo.',
        description: 'Calibra el consumo base exacto según los registros de tu computador de a bordo.',
        detalleInfo: {
          tipoManejo: 'Cualquier configuración vehicular personalizada.',
          ejemplosAutos: ['Vehículo personalizado con computador de a bordo'],
          rendimientoYCombustible: 'Configuración libre en litros por 100 km o kilómetros por litro.',
        },
        consumoBaseL100: 8.0,
        baseL100: 8.0,
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
    const defaultEng = category.engines[0];

    const engineKey = localStorage.getItem('litrometrik_active_engine_key') || defaultEng.key;
    const engineName = localStorage.getItem('litrometrik_active_engine_name');

    // Buscar motor concordante por nombre o key
    const foundEng =
      (engineName ? category.engines.find((e) => e.nombreComun === engineName || e.name === engineName) : null) ||
      category.engines.find((e) => e.key === engineKey || e.id === engineKey) ||
      defaultEng;

    const storedBase = parseFloat(localStorage.getItem('litrometrik_active_base_l100') || '');
    const baseL100 = !isNaN(storedBase) && storedBase > 0 ? storedBase : foundEng.consumoBaseL100;

    const resolvedEngineName = foundEng.nombreComun;
    const transmission = (localStorage.getItem('litrometrik_active_transmission') || 'manual') as 'manual' | 'automatic';

    const rawVehicleModelName =
      localStorage.getItem('litrometrik_user_vehicle_model') ||
      localStorage.getItem('litrometrik_active_vehicle_model');

    const defaultModelName = `${category.shortLabel} (${resolvedEngineName})`;

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
      displacement: foundEng.cc,
      baseL100,
      transmission,
      vehicleModelName,
      carPhotoUrl,
      fuelType,
    };
  } catch (_) {
    return {
      vehicleType: 'sedan',
      engineKey: 'sedan_16_std',
      engineName: 'Motor 1.6L Estándar',
      displacement: '1.598 cc',
      baseL100: 7.2,
      transmission: 'manual',
      vehicleModelName: 'Sedán (Motor 1.6L Estándar)',
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
    category.engines.find((e) => e.nombreComun === next.engineName || e.name === next.engineName) ||
    category.engines.find((e) => e.key === next.engineKey || e.id === next.engineKey) ||
    category.engines[0];

  if (matchEng) {
    next.engineKey = matchEng.key;
    next.engineName = matchEng.nombreComun;
    next.displacement = matchEng.cc;
    if (!partial.baseL100) {
      next.baseL100 = matchEng.consumoBaseL100;
    }
  }

  if (!partial.vehicleModelName || partial.vehicleModelName.includes('(')) {
    next.vehicleModelName = `${category.shortLabel} (${next.engineName})`;
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
