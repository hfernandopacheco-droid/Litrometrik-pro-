export type CountryCode = 'PL' | 'CO' | 'MX' | 'ES';

export interface VehicleCategoryData {
  ejemplos: string;
  motor: string;
  consumo: string;
  base: number;
  min: number;
  max: number;
  queEs?: string;
}

export interface CarModelSpec {
  id: string;
  brand: string;
  model: string;
  engine: string;
  displacementL: string;
  bodyType: 'compact' | 'sedan' | 'suv' | 'van' | 'pickup';
  defaultFuel: 'LPG' | 'GLP' | 'Gasolina' | 'Gasolina 98' | 'Diésel' | 'GNV';
  badge?: string;
}

export interface CountryLegalTramite {
  id: string;
  title: string;
  tramiteType: string;
  entity: string;
  frequency: string;
  defaultCost: number;
  description: string;
}

export interface CountryMaintenanceTemplate {
  id: string;
  serviceType: string;
  productBrand: string;
  workshop: string;
  intervalKm: number;
  defaultCost: number;
  notes: string;
}

export interface CountryTireInfo {
  tipoPredeterminado: string;
  marcasPopulares: string[];
  presionDelanteraPsi: number;
  presionTraseraPsi: number;
  almacenajeOTaller: string;
}

export interface CountryInfo {
  codigo: CountryCode;
  nombre: string;
  bandera: string;
  moneda: string;
  unidadPrecio: string;
  unidadConsumo: string;
  gasolineras: string[];
  preciosDefecto: {
    gasolina: number;
    diesel: number;
    lpg: number;
  };
  etiquetasCombustible: {
    gasolina: string;
    diesel: string;
    lpg: string;
  };
  Compacto: VehicleCategoryData;
  Sedan: VehicleCategoryData;
  SUV: VehicleCategoryData;
  cars: CarModelSpec[];
  tramitesLegales: CountryLegalTramite[];
  mantenimientosTipicos: CountryMaintenanceTemplate[];
  neumaticosInfo: CountryTireInfo;
  ciudadesRutasEjemplo: string[];
}

export const DATA_PAIS: Record<CountryCode, CountryInfo> = {
  // =========================================================================
  // 1. POLONIA 🇵🇱
  // =========================================================================
  PL: {
    codigo: 'PL',
    nombre: 'Polonia',
    bandera: '🇵🇱',
    moneda: 'PLN',
    unidadPrecio: 'PLN/L',
    unidadConsumo: 'L/100km',
    gasolineras: ['Orlen', 'BP Polska', 'Shell Polska', 'Circle K', 'Moya', 'Lotos', 'Amic Energy', 'Avia'],
    preciosDefecto: { gasolina: 6.09, diesel: 6.15, lpg: 2.89 },
    etiquetasCombustible: { gasolina: 'Gasolina Pb95', diesel: 'Diésel ON', lpg: 'Gas LPG' },
    ciudadesRutasEjemplo: ['Varsovia a Cracovia (A4)', 'Gdansk a Varsovia (S7)', 'Wrocław a Poznań (S5)'],
    Compacto: {
      ejemplos: "Toyota Yaris, Fiat 500, Skoda Fabia",
      motor: "1.0-1.4L",
      consumo: "5.5-7.0",
      base: 6.0,
      min: 4.8,
      max: 7.5,
      queEs: "Compacto / Urbano: Auto pequeño, ágil en ciudad y muy fácil de parquear"
    },
    Sedan: {
      ejemplos: "Skoda Octavia, Toyota Corolla, VW Passat",
      motor: "1.5-2.0L",
      consumo: "7.5-9.0",
      base: 8.5,
      min: 6.5,
      max: 10.0,
      queEs: "Sedán / Mediano: Auto familiar estándar, cómodo para viajes largos y autopistas A4/A1"
    },
    SUV: {
      ejemplos: "Dacia Duster, Toyota RAV4, Kia Sportage, Hyundai Tucson",
      motor: "1.6-3.0L",
      consumo: "9.5-11.0",
      base: 10.5,
      min: 8.5,
      max: 13.5,
      queEs: "Grande / SUV / Camioneta Alta: Carro alto, familiar, 4x4, baúl grande"
    },
    cars: [
      { id: 'pl-mazda-3-16-glp', brand: 'Mazda', model: 'Mazda 3 1.6 MPI (LPG)', engine: '1.6L MZR 105 CV Gas LPG / PB', displacementL: '1.6', bodyType: 'sedan', defaultFuel: 'LPG', badge: 'Mazda 1.6 LPG' },
      { id: 'pl-skoda-octavia-glp', brand: 'Skoda', model: 'Octavia 1.6 MPI (LPG)', engine: '1.6L MPI 102 CV Gas LPG', displacementL: '1.6', bodyType: 'sedan', defaultFuel: 'LPG', badge: 'Top Ventas LPG' },
      { id: 'pl-toyota-corolla-hybrid', brand: 'Toyota', model: 'Corolla 1.8 Hybrid', engine: '1.8L Hybrid 140 CV', displacementL: '1.8', bodyType: 'sedan', defaultFuel: 'Gasolina', badge: 'Híbrido Ahorro' },
      { id: 'pl-dacia-duster-glp', brand: 'Dacia', model: 'Duster 1.0 ECO-G (LPG)', engine: '1.0L TCe ECO-G 100 CV Bi-Fuel LPG', displacementL: '1.0', bodyType: 'suv', defaultFuel: 'LPG', badge: 'LPG Original' },
      { id: 'pl-vw-golf-tdi', brand: 'Volkswagen', model: 'Golf 2.0 TDI', engine: '2.0L TDI 150 CV', displacementL: '2.0', bodyType: 'compact', defaultFuel: 'Diésel' },
      { id: 'pl-kia-sportage', brand: 'Kia', model: 'Sportage 1.6 T-GDI', engine: '1.6L Turbo T-GDI 150 CV', displacementL: '1.6', bodyType: 'suv', defaultFuel: 'Gasolina' }
    ],
    tramitesLegales: [
      {
        id: 'pl_badanie_skp',
        title: 'Badanie Techniczne (Przegląd SKP)',
        tramiteType: 'Przegląd',
        entity: 'Stacja Kontroli Pojazdów (SKP)',
        frequency: 'Anual (12 meses)',
        defaultCost: 99.00,
        description: 'Inspección técnica anual obligatoria en Polonia. Incluye revisión de frenos, gases y prueba de estanqueidad para instalación LPG.'
      },
      {
        id: 'pl_ubezpieczenie_oc',
        title: 'Ubezpieczenie Komunikacyjne OC / AC',
        tramiteType: 'OC / AC',
        entity: 'PZU Ubezpieczenia / Warta',
        frequency: 'Anual (12 meses)',
        defaultCost: 780.00,
        description: 'Seguro de responsabilidad civil automotriz obligatorio (Odpowiedzialność Cywilna) con opción de AutoCasco y asistencia.'
      },
      {
        id: 'pl_dozor_tdt_lpg',
        title: 'Dozór Techniczny Zbiornika LPG (TDT)',
        tramiteType: 'Homologación Gas',
        entity: 'Transportowy Dozór Techniczny (TDT)',
        frequency: 'Cada 10 años',
        defaultCost: 250.00,
        description: 'Certificación oficial de legalidad y prueba de presión del tanque de gas LPG / Autogaz.'
      },
      {
        id: 'pl_dowod_rejestracyjny',
        title: 'Dowód Rejestracyjny & Tablice',
        tramiteType: 'Registro Vehicular',
        entity: 'Wydział Komunikacji Urząd Miasta',
        frequency: 'Permanente',
        defaultCost: 161.50,
        description: 'Tarjeta de circulación y permiso administrativo de circulación oficial polaco.'
      }
    ],
    mantenimientosTipicos: [
      {
        id: 'pl_maint_aceite',
        serviceType: 'Cambio de Aceite & Filtros',
        productBrand: 'Motul 8100 X-cess 5W40 + Mann Filter',
        workshop: 'AutoSerwis Kraków',
        intervalKm: 12000,
        defaultCost: 320.00,
        notes: 'Aceite sintético de alto rendimiento para clima frío de Europa Central y autopista.'
      },
      {
        id: 'pl_maint_glp',
        serviceType: 'Filtros y Calibración LPG',
        productBrand: 'Certools F-779/D Bulpren + KME Diego',
        workshop: 'LPG Serwis Katowice',
        intervalKm: 15000,
        defaultCost: 150.00,
        notes: 'Sustitución de filtros de fase líquida y gaseosa para instalación de Autogaz.'
      },
      {
        id: 'pl_maint_frenos',
        serviceType: 'Frenos y Pastillas Delanteras',
        productBrand: 'Brembo Prime / ATE Ceramic',
        workshop: 'Norauto Warszawa',
        intervalKm: 35000,
        defaultCost: 280.00,
        notes: 'Pastillas y revisión de líquido de frenos DOT4 para frenadas seguras en lluvia o nieve.'
      }
    ],
    neumaticosInfo: {
      tipoPredeterminado: 'Invierno (Zimowe) / Całoroczne',
      marcasPopulares: ['Michelin Alpin 6', 'Dębica Frigo HP2', 'Nokian WR Snowproof', 'Goodyear Vector 4Seasons'],
      presionDelanteraPsi: 32,
      presionTraseraPsi: 34,
      almacenajeOTaller: 'Hotel Opon Serwis Warszawa'
    }
  },

  // =========================================================================
  // 2. COLOMBIA 🇨🇴
  // =========================================================================
  CO: {
    codigo: 'CO',
    nombre: 'Colombia',
    bandera: '🇨🇴',
    moneda: 'COP',
    unidadPrecio: 'COP/L',
    unidadConsumo: 'L/100km',
    gasolineras: ['Terpel', 'Primax', 'Texaco', 'Biomax', 'Petromil', 'Mobil Colombia', 'Esso', 'Brio'],
    preciosDefecto: { gasolina: 4200, diesel: 4350, lpg: 2400 },
    etiquetasCombustible: { gasolina: 'Gasolina Corriente', diesel: 'Diésel / ACPM', lpg: 'Gas GNV / LPG Vehicular' },
    ciudadesRutasEjemplo: ['Bogotá a Medellín (Autopista Medellín)', 'Cali a Buenaventura', 'Barranquilla a Cartagena (Vía al Mar)'],
    Compacto: {
      ejemplos: "Renault Kwid, Kia Picanto, Chevrolet Spark GT",
      motor: "1.0-1.4L",
      consumo: "5.8-7.0",
      base: 6.2,
      min: 5.0,
      max: 7.8,
      queEs: "Compacto / Urbano: Carro pequeño rendidor para trancones de Bogotá, Medellín y Cali"
    },
    Sedan: {
      ejemplos: "Mazda 3, Chevrolet Onix Turbo, Renault Logan, Toyota Corolla",
      motor: "1.6-2.5L",
      consumo: "7.8-9.2",
      base: 8.2,
      min: 6.8,
      max: 10.5,
      queEs: "Sedán / Mediano: Carro espacioso para la familia, autopistas y subidas de cordillera"
    },
    SUV: {
      ejemplos: "Renault Duster, Toyota Hilux, Fortuner, Tracker, Mazda CX-30",
      motor: "1.6-4.0L Diésel/Gasolina",
      consumo: "9.5-12.5",
      base: 11.0,
      min: 8.5,
      max: 14.5,
      queEs: "Grande / SUV / Camioneta: Carro alto familiar, 4x4, apto para trocha y carretera de montaña"
    },
    cars: [
      { id: 'co-renault-duster-16', brand: 'Renault', model: 'Duster 1.6 16V', engine: '1.6L 16V 115 HP Gasolina', displacementL: '1.6', bodyType: 'suv', defaultFuel: 'Gasolina', badge: 'Camioneta #1' },
      { id: 'co-mazda-cx30-20', brand: 'Mazda', model: 'Mazda CX-30 2.0L MHEV', engine: '2.0L Skyactiv-G Híbrido Ligero', displacementL: '2.0', bodyType: 'suv', defaultFuel: 'Gasolina', badge: 'Líder en Ventas' },
      { id: 'co-toyota-hilux-diesel', brand: 'Toyota', model: 'Hilux 2.4 / 2.8 D-4D', engine: '2.8L Turbo Diésel 201 HP', displacementL: '2.8', bodyType: 'pickup', defaultFuel: 'Diésel', badge: 'Trabajo Pesado' },
      { id: 'co-chevrolet-onix-turbo', brand: 'Chevrolet', model: 'Onix Turbo 1.0L', engine: '1.0L Turbo 3-Cilindros 115 HP', displacementL: '1.0', bodyType: 'sedan', defaultFuel: 'Gasolina' },
      { id: 'co-kia-picanto-125', brand: 'Kia', model: 'Picanto 1.25 X-Line', engine: '1.25L CVVT 84 HP', displacementL: '1.2', bodyType: 'compact', defaultFuel: 'Gasolina' },
      { id: 'co-toyota-corolla-cross', brand: 'Toyota', model: 'Corolla Cross 1.8 Híbrido', engine: '1.8L Híbrido 122 HP Sin Pico y Placa', displacementL: '1.8', bodyType: 'suv', defaultFuel: 'Gasolina', badge: 'Exento Pico y Placa' }
    ],
    tramitesLegales: [
      {
        id: 'co_soat_sura',
        title: 'SOAT Seguro Obligatorio (RUNT)',
        tramiteType: 'SOAT',
        entity: 'Seguros SURA / RUNT',
        frequency: 'Anual (12 meses)',
        defaultCost: 650000,
        description: 'Seguro Obligatorio de Accidentes de Tránsito reglamentario en Colombia, registrado en el RUNT.'
      },
      {
        id: 'co_tecnomecanica_cda',
        title: 'Revisión Técnico-Mecánica y Emisiones (RTM)',
        tramiteType: 'Tecnomecánica',
        entity: 'CDA Autorizado Ministerio de Transporte',
        frequency: 'Anual (autos particulares > 5 años)',
        defaultCost: 310000,
        description: 'Inspección técnico-mecánica y de gases contaminantes en Centros de Diagnóstico Automotor (CDA).'
      },
      {
        id: 'co_impuesto_vehicular',
        title: 'Impuesto de Vehículos Automotores',
        tramiteType: 'Impuestos',
        entity: 'Gobernación / Secretaría de Hacienda',
        frequency: 'Anual',
        defaultCost: 450000,
        description: 'Impuesto departamental y distrital sobre vehículos según avalúo comercial del Ministerio de Transporte.'
      },
      {
        id: 'co_certificacion_gas',
        title: 'Certificación Anual Kit Gas GNV/LPG',
        tramiteType: 'Certificación Gas',
        entity: 'Organismo de Certificación Acreditado (ONAC)',
        frequency: 'Anual',
        defaultCost: 120000,
        description: 'Revisión anual obligatoria de fugas, válvula y cilindro para vehículos a gas vehicular en Colombia.'
      }
    ],
    mantenimientosTipicos: [
      {
        id: 'co_maint_aceite',
        serviceType: 'Cambio de Aceite & Filtros',
        productBrand: 'Mobil Super 2000 10W30 / Terpel Oiltec',
        workshop: 'Serviteca Terpel / Coéxito Bogotá',
        intervalKm: 8000,
        defaultCost: 280000,
        notes: 'Cambio preventivo de aceite para tráfico pesado y pendientes colombianas.'
      },
      {
        id: 'co_maint_sincronizacion',
        serviceType: 'Sincronización & Limpieza Inyectores',
        productBrand: 'Bujías NGK Láser + Limpiador Inyección',
        workshop: 'Taller Especializado El Campín',
        intervalKm: 25000,
        defaultCost: 350000,
        notes: 'Limpieza con ultrasonido y ajuste de ralentí para altitud (2.600 msnm).'
      },
      {
        id: 'co_maint_frenos_susp',
        serviceType: 'Pastillas de Freno & Suspensión',
        productBrand: 'Incolbest Cerámica / Amortiguadores Gabriel',
        workshop: 'Serviteca Goodyear Calle 80',
        intervalKm: 30000,
        defaultCost: 420000,
        notes: 'Cambio de pastillas y alineación 3D para resistir baches e irregularidades viales.'
      }
    ],
    neumaticosInfo: {
      tipoPredeterminado: 'Todo Terreno / Mixtas All-Terrain',
      marcasPopulares: ['Goodyear Assurance MaxGuard', 'Michelin Primacy 4', 'Pirelli Scorpion', 'Hankook Dynapro'],
      presionDelanteraPsi: 32,
      presionTraseraPsi: 32,
      almacenajeOTaller: 'Serviteca Autorizada Medellín'
    }
  },

  // =========================================================================
  // 3. MÉXICO 🇲🇽
  // =========================================================================
  MX: {
    codigo: 'MX',
    nombre: 'México',
    bandera: '🇲🇽',
    moneda: 'MXN',
    unidadPrecio: 'MXN/L',
    unidadConsumo: 'L/100km',
    gasolineras: ['Pemex', 'OXXO Gas', 'BP México', 'Mobil México', 'Shell México', 'G500', 'Petro-7', 'TotalEnergies'],
    preciosDefecto: { gasolina: 23.80, diesel: 24.50, lpg: 12.80 },
    etiquetasCombustible: { gasolina: 'Gasolina Magna 87', diesel: 'Diésel', lpg: 'Gas LP Automotriz' },
    ciudadesRutasEjemplo: ['CDMX a Querétaro (Autopista 57)', 'Guadalajara a Puerto Vallarta', 'Monterrey a Saltillo'],
    Compacto: {
      ejemplos: "Nissan March, Chevrolet Aveo, Kia Rio",
      motor: "1.2-1.6L",
      consumo: "6.0-7.2",
      base: 6.5,
      min: 5.2,
      max: 8.0,
      queEs: "Compacto / Urbano: Auto citadino ahorrador de combustible en el tráfico del periférico"
    },
    Sedan: {
      ejemplos: "Nissan Versa, VW Jetta, Nissan Sentra",
      motor: "1.6-2.0L",
      consumo: "7.8-9.5",
      base: 8.5,
      min: 6.8,
      max: 10.5,
      queEs: "Sedán / Mediano: Auto de 4 puertas con buen baúl y confort para autopista y familia"
    },
    SUV: {
      ejemplos: "Honda CR-V, Toyota RAV4, Mazda CX-5, Kia Seltos",
      motor: "2.0-2.5L",
      consumo: "9.8-12.0",
      base: 10.8,
      min: 8.5,
      max: 14.0,
      queEs: "Grande / SUV / Camioneta: Camioneta familiar espaciosa, apta para baches y carretera"
    },
    cars: [
      { id: 'mx-nissan-versa-16', brand: 'Nissan', model: 'Versa 1.6L', engine: '1.6L 4-Cilindros 118 HP', displacementL: '1.6', bodyType: 'sedan', defaultFuel: 'Gasolina', badge: 'Auto #1 en México' },
      { id: 'mx-vw-jetta-14t', brand: 'Volkswagen', model: 'Jetta 1.4 TSI Turbo', engine: '1.4L TSI Turbo 150 HP', displacementL: '1.4', bodyType: 'sedan', defaultFuel: 'Gasolina', badge: 'Clásico Mexicano' },
      { id: 'mx-nissan-march-16', brand: 'Nissan', model: 'March 1.6L', engine: '1.6L 4-Cilindros 106 HP', displacementL: '1.6', bodyType: 'compact', defaultFuel: 'Gasolina' },
      { id: 'mx-toyota-rav4-hybrid', brand: 'Toyota', model: 'RAV4 2.5 Híbrida', engine: '2.5L Híbrido 219 HP Sin Verificación', displacementL: '2.5', bodyType: 'suv', defaultFuel: 'Gasolina', badge: 'Holo Exento' },
      { id: 'mx-chevrolet-silverado-v8', brand: 'Chevrolet', model: 'Silverado 5.3 V8 (Gas LP)', engine: '5.3L V8 355 HP Bi-Fuel Gas LP', displacementL: '4.0', bodyType: 'pickup', defaultFuel: 'GLP', badge: 'V8 / Gas LP' },
      { id: 'mx-nissan-np300-diesel', brand: 'Nissan', model: 'NP300 2.5L Diésel', engine: '2.5L Turbo Diésel 161 HP', displacementL: '2.5', bodyType: 'pickup', defaultFuel: 'Diésel', badge: 'Trabajo Rudo' }
    ],
    tramitesLegales: [
      {
        id: 'mx_verificacion_sedema',
        title: 'Verificación Vehicular Ambiental (Holograma)',
        tramiteType: 'Verificación',
        entity: 'Verificentro Autorizado (SEDEMA)',
        frequency: 'Semestral (Cada 6 meses)',
        defaultCost: 708.00,
        description: 'Prueba de emisiones contaminantes para circular en CDMX, Edomex y zona megalopolitana (Hoy No Circula).'
      },
      {
        id: 'mx_seguro_qualitas',
        title: 'Póliza de Seguro de Auto (Cobertura Amplia)',
        tramiteType: 'Seguro',
        entity: 'Quálitas Compañía de Seguros / GNP',
        frequency: 'Anual (12 meses)',
        defaultCost: 8200.00,
        description: 'Seguro con responsabilidad civil obligatoria en carreteras federales y cobertura contra robo total.'
      },
      {
        id: 'mx_tenencia_refrendo',
        title: 'Pago de Tenencia y Refrendo de Placas',
        tramiteType: 'Impuestos',
        entity: 'Secretaría de Finanzas Estatal',
        frequency: 'Anual (Primer trimestre)',
        defaultCost: 688.00,
        description: 'Derecho anual por uso de placas y control vehicular ante el gobierno estatal.'
      },
      {
        id: 'mx_dictamen_gas_lp',
        title: 'Dictamen de Seguridad Tanque Gas LP',
        tramiteType: 'Dictamen Gas',
        entity: 'Unidad de Verificación Autorizada',
        frequency: 'Anual',
        defaultCost: 950.00,
        description: 'Certificado de hermeticidad y vida útil del tanque de carburación Gas LP.'
      }
    ],
    mantenimientosTipicos: [
      {
        id: 'mx_maint_afinacion',
        serviceType: 'Afinación Mayor & Aceite',
        productBrand: 'Castrol GTX 20W50 / Quaker State + Filtros Gonher',
        workshop: 'Taller Autorizado Insurgentes CDMX',
        intervalKm: 10000,
        defaultCost: 1650.00,
        notes: 'Cambio de bujías de platino, lavado de cuerpo de aceleración y aceite.'
      },
      {
        id: 'mx_maint_gas_lp',
        serviceType: 'Servicio Vaporizador & Filtro Gas LP',
        productBrand: 'Kit Reparación Impco / Lovato Gas LP',
        workshop: 'Carburación Gas LP Naucalpan',
        intervalKm: 20000,
        defaultCost: 850.00,
        notes: 'Drenado de impurezas y sustitución de diafragma vaporizador.'
      },
      {
        id: 'mx_maint_frenos',
        serviceType: 'Balatas y Rectificado de Discos',
        productBrand: 'Balatas Fritec Cerámicas / Duralast',
        workshop: 'Midas México / AutoZone',
        intervalKm: 30000,
        defaultCost: 1400.00,
        notes: 'Rectificado de discos y balatas nuevas para frenado en pendientes y topes.'
      }
    ],
    neumaticosInfo: {
      tipoPredeterminado: 'Toda Temporada (All-Season)',
      marcasPopulares: ['Bridgestone Ecopia EP422', 'Michelin Defender', 'Continental PowerContact', 'Tornel'],
      presionDelanteraPsi: 33,
      presionTraseraPsi: 33,
      almacenajeOTaller: 'Llantera Servifácil CDMX'
    }
  },

  // =========================================================================
  // 4. ESPAÑA 🇪🇸
  // =========================================================================
  ES: {
    codigo: 'ES',
    nombre: 'España',
    bandera: '🇪🇸',
    moneda: 'EUR',
    unidadPrecio: '€/L',
    unidadConsumo: 'L/100km',
    gasolineras: ['Repsol', 'Cepsa', 'BP España', 'Galp', 'Shell España', 'Ballenoil', 'Plenoil', 'Petronor'],
    preciosDefecto: { gasolina: 1.58, diesel: 1.45, lpg: 0.95 },
    etiquetasCombustible: { gasolina: 'Gasolina 95', diesel: 'Diésel / Gasóleo A', lpg: 'Autogás LPG' },
    ciudadesRutasEjemplo: ['Madrid a Valencia (A-3)', 'Barcelona a Zaragoza (AP-2)', 'Sevilla a Málaga (A-92)'],
    Compacto: {
      ejemplos: "Seat Ibiza, Renault Clio, Peugeot 208",
      motor: "1.0-1.2L",
      consumo: "5.2-6.5",
      base: 5.8,
      min: 4.5,
      max: 7.2,
      queEs: "Compacto / Utilitario: Coche maniobrable para ciudad y rondas con distintivo ambiental ECO"
    },
    Sedan: {
      ejemplos: "Seat León, Peugeot 308, Golf, Corolla",
      motor: "1.5-2.0L",
      consumo: "6.8-8.2",
      base: 7.5,
      min: 6.0,
      max: 9.5,
      queEs: "Sedán / Berlina: Coche equilibrado para autovías y trayectos largos con bajo consumo"
    },
    SUV: {
      ejemplos: "Seat Ateca, Cupra Formentor, Hyundai Tucson, Qashqai",
      motor: "1.6-2.0L",
      consumo: "8.5-10.2",
      base: 9.2,
      min: 7.5,
      max: 12.5,
      queEs: "Grande / SUV / Crossover: Vehículo elevado, mayor visibilidad y habitabilidad para familia"
    },
    cars: [
      { id: 'es-seat-ibiza-tsi', brand: 'Seat', model: 'Ibiza 1.0 TSI', engine: '1.0L TSI 110 CV Gasolina', displacementL: '1.0', bodyType: 'compact', defaultFuel: 'Gasolina', badge: 'Top España' },
      { id: 'es-dacia-sandero-glp', brand: 'Dacia', model: 'Sandero 1.0 ECO-G (LPG)', engine: '1.0L ECO-G 100 CV Etiqueta ECO LPG', displacementL: '1.0', bodyType: 'compact', defaultFuel: 'LPG', badge: 'N°1 Ventas LPG' },
      { id: 'es-toyota-corolla-hybrid', brand: 'Toyota', model: 'Corolla 1.8 Hybrid', engine: '1.8L Híbrido 140 CV Etiqueta ECO', displacementL: '1.8', bodyType: 'compact', defaultFuel: 'Gasolina', badge: 'Etiqueta ECO' },
      { id: 'es-cupra-formentor-tsi', brand: 'Cupra', model: 'Formentor 1.5 TSI', engine: '1.5L TSI 150 CV', displacementL: '1.5', bodyType: 'suv', defaultFuel: 'Gasolina' },
      { id: 'es-renault-clio-glp', brand: 'Renault', model: 'Clio 1.0 TCe LPG', engine: '1.0L Turbo LPG 100 CV', displacementL: '1.0', bodyType: 'compact', defaultFuel: 'LPG' },
      { id: 'es-hyundai-tucson-crdi', brand: 'Hyundai', model: 'Tucson 1.6 CRDi 48V', engine: '1.6L Diésel Mild-Hybrid 136 CV', displacementL: '1.6', bodyType: 'suv', defaultFuel: 'Diésel' }
    ],
    tramitesLegales: [
      {
        id: 'es_itv_applus',
        title: 'Inspección Técnica de Vehículos (ITV)',
        tramiteType: 'ITV',
        entity: 'Estación ITV Oficial (Applus+ / TÜV)',
        frequency: 'Cada 2 años (Anual tras 10 años)',
        defaultCost: 48.00,
        description: 'Revisión periódica oficial de seguridad y emisiones. Incluye distintivo adhesivo para el parabrisas.'
      },
      {
        id: 'es_seguro_mapfre',
        title: 'Seguro del Automóvil (Terceros Ampliado)',
        tramiteType: 'Seguro',
        entity: 'Mapfre España / Mutua Madrileña',
        frequency: 'Anual (12 meses)',
        defaultCost: 320.00,
        description: 'Póliza anual con responsabilidad civil obligatoria, lunas, incendio y asistencia en carretera.'
      },
      {
        id: 'es_ivtm_rodaje',
        title: 'Impuesto de Tracción Mecánica (IVTM / Rodaje)',
        tramiteType: 'Impuestos',
        entity: 'Ayuntamiento Municipal',
        frequency: 'Anual',
        defaultCost: 68.00,
        description: 'Tasa municipal anual obligatoria según los caballos fiscales (CVF) del motor.'
      },
      {
        id: 'es_revision_glp',
        title: 'Inspección y Estanqueidad Autogás LPG',
        tramiteType: 'Revisión LPG',
        entity: 'Taller Homologado Instalador LPG',
        frequency: 'Anual / Cada 20.000 km',
        defaultCost: 75.00,
        description: 'Certificado de revisión de válvulas, electroválvula de corte y estanqueidad del circuito de gas.'
      }
    ],
    mantenimientosTipicos: [
      {
        id: 'es_maint_aceite',
        serviceType: 'Cambio de Aceite & Filtros',
        productBrand: 'Repsol Elite 5W30 Long Life + Filtro Bosch',
        workshop: 'Midas Madrid / Norauto',
        intervalKm: 15000,
        defaultCost: 140.00,
        notes: 'Aceite sintético Low SAPS compatible con filtro antipartículas DPF/FAP.'
      },
      {
        id: 'es_maint_frenos',
        serviceType: 'Pastillas de Freno Delanteras',
        productBrand: 'Brembo P 85 020 / Ferodo',
        workshop: 'Feu Vert Barcelona',
        intervalKm: 35000,
        defaultCost: 110.00,
        notes: 'Sustitución de pastillas delanteras y comprobación de líquido DOT4.'
      },
      {
        id: 'es_maint_autogas',
        serviceType: 'Filtro Fase Gaseosa LPG',
        productBrand: 'Filtro Gas Landi Renzo / BRC',
        workshop: 'Taller Gas AutoGas Alcalá',
        intervalKm: 20000,
        defaultCost: 65.00,
        notes: 'Sustitución de cartucho filtrante para protección de los inyectores de gas.'
      }
    ],
    neumaticosInfo: {
      tipoPredeterminado: '4 Estaciones (All Season) / Verano',
      marcasPopulares: ['Michelin CrossClimate 2', 'Continental AllSeasonContact', 'Pirelli Cinturato', 'Bridgestone Turanza'],
      presionDelanteraPsi: 33,
      presionTraseraPsi: 32,
      almacenajeOTaller: 'Euromaster Madrid'
    }
  }
};

export function detectDefaultCountry(): CountryCode {
  try {
    const saved = localStorage.getItem('litrometrik_selected_country');
    if (saved && (saved in DATA_PAIS)) {
      return saved as CountryCode;
    }
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Bogota') || tz.includes('Colombia')) return 'CO';
    if (tz.includes('Mexico') || tz.includes('Cancun') || tz.includes('Tijuana') || tz.includes('Monterrey')) return 'MX';
    if (tz.includes('Madrid') || tz.includes('Canary')) return 'ES';
    if (tz.includes('Warsaw') || tz.includes('Poland')) return 'PL';
  } catch (e) {}
  return 'PL';
}
