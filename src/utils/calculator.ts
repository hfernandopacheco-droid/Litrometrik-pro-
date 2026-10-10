import { CalculatorInputs, CalculationResult } from '../types';
import { DATA_PAIS } from './countryData';

export interface FuelComparisonItem {
  key: 'gasolina' | 'diesel' | 'glp';
  label: string;
  subLabel: string;
  rateL100: number;
  totalLiters: number;
  pricePerLiter: number;
  totalCost: number;
  percent: number; // 0 - 100 relative to most expensive
  colorHex: string;
  glowClass: string;
  gradientClass: string;
}

export interface DetailedCalculations {
  effectiveDistance: number;
  activeBaseConsumption: number;
  transmissionFactor: number;
  fuelFactor: number;
  routeFactor: number;
  acAddon: number;
  finalConsumptionL100: number;
  totalLiters: number;
  fuelCost: number;
  coldStartCost: number;
  totalCostMoney: number;
  costPerKm: number;
  costPer10Km: number;
  garrafas20L: number;
  currency: string;
  comparativa: {
    gasolina: FuelComparisonItem;
    diesel: FuelComparisonItem;
    glp: FuelComparisonItem;
    maxCost: number;
    savingGlpVsGas: number;
    savingGlpVsDiesel: number;
    percentSavedVsGas: number;
  };
}

/**
 * Pure reactive calculation engine.
 * Guarantees zero stale closures and immediate real-time sync across all inputs.
 */
export function calculateDetailedTrip(inputs: CalculatorInputs): DetailedCalculations {
  const {
    country = 'PL',
    vehicleType,
    customBaseConsumption,
    transmission,
    fuelType,
    routeType,
    distanceKm,
    isRoundTrip,
    isACActive,
    coldStartLpg,
    pricePerLiter,
    referenceGasolinePrice,
  } = inputs;

  const countryConfig = DATA_PAIS[country] || DATA_PAIS.PL;
  const currency = countryConfig.moneda;

  // 1. Base consumption
  let activeBaseConsumption = 8.5;
  if (customBaseConsumption && customBaseConsumption > 0) {
    activeBaseConsumption = customBaseConsumption;
  } else {
    switch (vehicleType) {
      case 'compact':
        activeBaseConsumption = 6.0;
        break;
      case 'sedan':
        activeBaseConsumption = 8.5;
        break;
      case 'suv':
        activeBaseConsumption = 10.5;
        break;
      case 'van':
        activeBaseConsumption = 9.8;
        break;
      case 'pickup':
        activeBaseConsumption = 10.5;
        break;
      case 'custom':
        activeBaseConsumption = 8.0;
        break;
      default:
        activeBaseConsumption = 8.5;
        break;
    }
  }

  // 2. Multipliers
  const transmissionFactor = transmission === 'automatic' ? 1.08 : 1.0;

  let fuelFactor = 1.0;
  if (fuelType === 'diesel') fuelFactor = 0.85;
  else if (fuelType === 'lpg' || fuelType === 'glp') fuelFactor = 1.20;
  else if (fuelType === 'hibrido') fuelFactor = 0.75;
  else if (fuelType === 'gnc') fuelFactor = 0.90;
  else fuelFactor = 1.0;

  let routeFactor = 1.0;
  if (routeType === 'carretera') routeFactor = 0.85;
  else if (routeType === 'ciudad') routeFactor = 1.25;
  else routeFactor = 1.0;

  const acAddon = isACActive ? 0.6 : 0.0;

  // 3. Effective distance (Trip legs)
  const legs = isRoundTrip ? 2 : 1;
  const effectiveDistance = Math.max(0, distanceKm || 0) * legs;

  // 4. Final consumption for currently selected setup
  const finalConsumptionL100 = (activeBaseConsumption * transmissionFactor * fuelFactor * routeFactor) + acAddon;
  const totalLiters = (effectiveDistance * finalConsumptionL100) / 100;

  const activePrice = pricePerLiter > 0 ? pricePerLiter : countryConfig.preciosDefecto.gasolina;
  const fuelCost = totalLiters * activePrice;

  // 5. Cold start for LPG (0.3L gasoline per leg)
  const isLpgSelected = fuelType === 'lpg' || fuelType === 'glp';
  const officialGasPrice = countryConfig.preciosDefecto.gasolina;
  const gasPriceToUse = referenceGasolinePrice > 0 ? referenceGasolinePrice : officialGasPrice;

  const coldStartCost = isLpgSelected && coldStartLpg ? 0.3 * gasPriceToUse * legs : 0;
  const totalCostMoney = fuelCost + coldStartCost;
  const costPerKm = effectiveDistance > 0 ? totalCostMoney / effectiveDistance : 0;
  const costPer10Km = costPerKm * 10;
  const garrafas20L = totalLiters / 20;

  // 6. LIVE COMPARISON ENGINE (Gasolina Pb95 vs Diésel ON vs Gas LPG)
  // Determine realistic prices for the 3 fuels
  const priceGas = fuelType === 'gasolina' && pricePerLiter > 0 ? pricePerLiter : officialGasPrice;
  const priceDie = fuelType === 'diesel' && pricePerLiter > 0 ? pricePerLiter : countryConfig.preciosDefecto.diesel;
  const priceGlp = isLpgSelected && pricePerLiter > 0 ? pricePerLiter : countryConfig.preciosDefecto.lpg;

  // Fuel 1: Gasolina Pb95 (factor x1.0)
  const rateGas = (activeBaseConsumption * transmissionFactor * 1.0 * routeFactor) + acAddon;
  const litGas = (effectiveDistance * rateGas) / 100;
  const costGas = litGas * priceGas;

  // Fuel 2: Diésel ON (factor x0.85)
  const rateDie = (activeBaseConsumption * transmissionFactor * 0.85 * routeFactor) + acAddon;
  const litDie = (effectiveDistance * rateDie) / 100;
  const costDie = litDie * priceDie;

  // Fuel 3: Gas LPG (factor x1.20 + 0.3L gasoline cold start per leg)
  const rateGlp = (activeBaseConsumption * transmissionFactor * 1.20 * routeFactor) + acAddon;
  const litGlp = (effectiveDistance * rateGlp) / 100;
  const coldStartGlp = 0.3 * priceGas * legs;
  const costGlp = (litGlp * priceGlp) + coldStartGlp;

  // Maximum cost for scale
  const maxCost = Math.max(costGas, costDie, costGlp, 0.01);

  const pctGas = Math.min(100, Math.max(12, Math.round((costGas / maxCost) * 100)));
  const pctDie = Math.min(100, Math.max(12, Math.round((costDie / maxCost) * 100)));
  const pctGlp = Math.min(100, Math.max(12, Math.round((costGlp / maxCost) * 100)));

  const savingGlpVsGas = Math.max(0, costGas - costGlp);
  const savingGlpVsDiesel = Math.max(0, costDie - costGlp);
  const percentSavedVsGas = costGas > 0 ? Math.round((savingGlpVsGas / costGas) * 100) : 0;

  const itemGasolina: FuelComparisonItem = {
    key: 'gasolina',
    label: countryConfig.etiquetasCombustible?.gasolina || 'Gasolina Pb95',
    subLabel: 'Consumo Estándar x1.0',
    rateL100: rateGas,
    totalLiters: litGas,
    pricePerLiter: priceGas,
    totalCost: costGas,
    percent: pctGas,
    colorHex: '#FF6B00',
    glowClass: 'shadow-[0_0_15px_rgba(255,107,0,0.45)]',
    gradientClass: 'bg-gradient-to-r from-[#FF4F00] via-[#FF6B00] to-[#FFA000]',
  };

  const itemDiesel: FuelComparisonItem = {
    key: 'diesel',
    label: countryConfig.etiquetasCombustible?.diesel || 'Diésel ON',
    subLabel: '-15% Consumo en Ruta',
    rateL100: rateDie,
    totalLiters: litDie,
    pricePerLiter: priceDie,
    totalCost: costDie,
    percent: pctDie,
    colorHex: '#00B4D8',
    glowClass: 'shadow-[0_0_15px_rgba(0,180,216,0.45)]',
    gradientClass: 'bg-gradient-to-r from-[#0077B6] via-[#00B4D8] to-[#90E0EF]',
  };

  const itemGlp: FuelComparisonItem = {
    key: 'glp',
    label: countryConfig.etiquetasCombustible?.lpg || 'Gas LPG / Autogas',
    subLabel: 'Máximo Ahorro Económico',
    rateL100: rateGlp,
    totalLiters: litGlp,
    pricePerLiter: priceGlp,
    totalCost: costGlp,
    percent: pctGlp,
    colorHex: '#10B981',
    glowClass: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]',
    gradientClass: 'bg-gradient-to-r from-[#059669] via-[#10B981] to-[#34D399]',
  };

  return {
    effectiveDistance,
    activeBaseConsumption,
    transmissionFactor,
    fuelFactor,
    routeFactor,
    acAddon,
    finalConsumptionL100,
    totalLiters,
    fuelCost,
    coldStartCost,
    totalCostMoney,
    costPerKm,
    costPer10Km,
    garrafas20L,
    currency,
    comparativa: {
      gasolina: itemGasolina,
      diesel: itemDiesel,
      glp: itemGlp,
      maxCost,
      savingGlpVsGas,
      savingGlpVsDiesel,
      percentSavedVsGas,
    },
  };
}

/**
 * Backwards compatibility wrapper for calculateTrip
 */
export function calculateTrip(inputs: CalculatorInputs): CalculationResult {
  const d = calculateDetailedTrip(inputs);
  return {
    effectiveDistance: d.effectiveDistance,
    baseConsumption: d.activeBaseConsumption,
    finalConsumptionL100: d.finalConsumptionL100,
    totalLiters: d.totalLiters,
    fuelCost: d.fuelCost,
    coldStartCost: d.coldStartCost,
    totalCostPLN: d.totalCostMoney,
    costPerKm: d.costPerKm,
    referenceCostPLN: d.comparativa.gasolina.totalCost,
    savingsVsGasoline: d.comparativa.savingGlpVsGas,
    currency: d.currency,
  };
}
