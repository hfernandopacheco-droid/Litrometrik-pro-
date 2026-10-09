/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CalcularView } from './components/CalcularView';
import { TripHistory } from './components/TripHistory';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { SidebarDrawer, ModuleKey } from './components/SidebarDrawer';
import { CategoryDetailView } from './components/ModuleViewModal';
import { FuelStatisticsModal } from './components/FuelStatisticsModal';
import { UserWazerProfileModal } from './components/UserWazerProfileModal';
import { BottomTabBar, MainAppTab } from './components/BottomTabBar';
import { ModoMarchaView } from './components/ModoMarchaView';
import { GarajeView } from './components/GarajeView';
import { NubeView } from './components/NubeView';
import { NativeStatusBar } from './components/NativeStatusBar';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { SplashScreen } from './components/SplashScreen';
import { UpdateBanner } from './components/UpdateBanner';
import { CalculatorInputs, SavedTrip } from './types';
import { calculateTrip } from './utils/calculator';
import { detectDefaultCountry, DATA_PAIS, CountryCode } from './utils/countryData';
import { auth, subscribeToAuth, getStoredActiveUser } from './utils/firebaseAuth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  saveCloudRecord,
  deleteCloudRecord,
  subscribeToCloudCollection,
  fetchCloudRecords,
  getCloudVehicleConfig,
} from './utils/firestoreService';
import {
  subscribeToSupabaseAuth,
  getSupabaseProfile,
  getSupabaseFuelSettings,
  getSupabaseTrips,
  insertSupabaseTrip,
  deleteSupabaseTrip,
  clearSupabaseTrips,
  signOutSupabase,
} from './utils/supabaseClient';

export default function App() {
  const initialCountry = detectDefaultCountry();
  const initialCountryData = DATA_PAIS[initialCountry] || DATA_PAIS.PL;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isDesktopFrame, setIsDesktopFrame] = useState(false);

  useEffect(() => {
    // 0. Initial check from stored session
    const stored = getStoredActiveUser();
    if (stored) {
      setCurrentUser(stored);
    }

    // 1. Cloud Firestore / Firebase Auth listener
    const unsubFirebase = subscribeToAuth((fbUser) => {
      if (fbUser) {
        setCurrentUser(fbUser);
      }
    });

    // 2. Supabase Auth Listener (if configured)
    const unsubSupabase = subscribeToSupabaseAuth(async (sbUser) => {
      if (sbUser) {
        const appUser = {
          uid: sbUser.id,
          id: sbUser.id,
          email: sbUser.email,
          displayName: sbUser.user_metadata?.nombre || sbUser.email?.split('@')[0] || 'Conductor',
        };
        setCurrentUser(appUser);
        localStorage.setItem('litrometrik_active_user', JSON.stringify(appUser));
        localStorage.setItem('litrometrik_active_user_session', JSON.stringify(appUser));

        // Load profile from Supabase
        try {
          const profile = await getSupabaseProfile(sbUser.id);
          if (profile?.nombre) {
            localStorage.setItem('wazer_nickname', profile.nombre);
          }
        } catch (_) {}

        // Load fuel settings from Supabase
        try {
          const fuelConfig = await getSupabaseFuelSettings(sbUser.id);
          if (fuelConfig) {
            if (fuelConfig.saldo_tanque !== undefined && fuelConfig.saldo_tanque !== null) {
              localStorage.setItem('litrometrik_fuel_balance_pln', fuelConfig.saldo_tanque.toString());
              window.dispatchEvent(new Event('fuel-storage-updated'));
            }
          }
        } catch (_) {}

        // Load trips from Supabase
        try {
          const cloudTrips = await getSupabaseTrips(sbUser.id);
          if (cloudTrips && cloudTrips.length > 0) {
            const mapped: SavedTrip[] = cloudTrips.map((ct: any) => ({
              id: ct.id,
              date: ct.fecha || new Date().toISOString().split('T')[0],
              routeName: ct.nombre_ruta || 'Viaje Registrado',
              country: (ct.pais as CountryCode) || 'PL',
              vehicleType: 'sedan',
              transmission: 'manual',
              fuelType: ct.combustible_usado || 'Gas GLP / LPG',
              routeType: 'mixto',
              distanceKm: Number(ct.distancia_km) || 0,
              isRoundTrip: false,
              isACActive: false,
              coldStartLpg: false,
              pricePerLiter: Number(ct.precio_por_litro) || 0,
              totalLiters: Number(ct.litros_consumidos) || 0,
              totalCostPLN: Number(ct.costo_total) || 0,
              costPerKm: ct.distancia_km ? Number(ct.costo_total) / Number(ct.distancia_km) : 0,
              savingsVsGasoline: 0,
            }));
            setSavedTrips(mapped);
          } else {
            // Fresh account starts clean
            setSavedTrips([]);
          }
        } catch (_) {
          setSavedTrips([]);
        }
      } else {
        // Fallback to local stored user
        const localUser = getStoredActiveUser();
        if (localUser) {
          setCurrentUser(localUser);
        } else {
          setCurrentUser(null);
          setSavedTrips([]);
        }
      }
      setAuthLoading(false);
    });

    return () => {
      unsubSupabase();
      unsubFirebase();
    };
  }, []);

  // Inputs state
  const [inputs, setInputs] = useState<CalculatorInputs>({
    country: initialCountry,
    vehicleType: 'sedan',
    customBaseConsumption: initialCountryData.Sedan.base,
    transmission: 'manual',
    fuelType: 'gasolina',
    routeType: 'mixto',
    distanceKm: 150,
    isRoundTrip: false,
    isACActive: false,
    coldStartLpg: true,
    pricePerLiter: initialCountryData.preciosDefecto.gasolina,
    referenceGasolinePrice: initialCountryData.preciosDefecto.gasolina,
    routeName: `Viaje Estándar (${initialCountryData.nombre})`,
  });

  // Saved trips state
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>(() => {
    try {
      const stored = localStorage.getItem('fuel_trips_pln');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading saved trips', e);
    }
    return [];
  });

  // Real-time Firestore sync for trips and vehicle config across devices
  useEffect(() => {
    if (!currentUser?.uid || currentUser.uid === 'guest' || currentUser.uid === 'guest_user') return;
    
    // Immediate initial fetch of saved trips
    fetchCloudRecords(currentUser.uid, 'viajes').then((trips) => {
      setSavedTrips(trips || []);
    });

    // Sync vehicle config and fuel balance from cloud
    getCloudVehicleConfig(currentUser.uid).then((vConfig) => {
      if (vConfig) {
        if (typeof vConfig.fuelBalance === 'number') {
          localStorage.setItem('litrometrik_fuel_balance_pln', vConfig.fuelBalance.toString());
          window.dispatchEvent(new Event('fuel-storage-updated'));
        }
      }
    });

    const unsub = subscribeToCloudCollection(currentUser.uid, 'viajes', (cloudTrips) => {
      setSavedTrips(cloudTrips || []);
    });
    return () => {
      unsub && unsub();
    };
  }, [currentUser]);

  // Modals & View state
  const [currentTab, setCurrentTab] = useState<MainAppTab>('marcha');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleKey | null>(null);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Save trips to localStorage backup whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('fuel_trips_pln', JSON.stringify(savedTrips));
    } catch (e) {
      console.error('Error saving trips', e);
    }
  }, [savedTrips]);

  // Synchronize country change across all tabs in real-time
  useEffect(() => {
    const handleCountryEvt = (e: any) => {
      const c = e.detail?.country as CountryCode;
      if (c && DATA_PAIS[c]) {
        const nextCountryData = DATA_PAIS[c];
        setInputs((prev) => ({
          ...prev,
          country: c,
          pricePerLiter: nextCountryData.preciosDefecto[prev.fuelType === 'diesel' ? 'diesel' : prev.fuelType === 'lpg' || prev.fuelType === 'glp' ? 'lpg' : 'gasolina'],
          referenceGasolinePrice: nextCountryData.preciosDefecto.gasolina,
          routeName: `Viaje en ${nextCountryData.nombre}`,
        }));
      }
    };
    window.addEventListener('litrometrik-country-changed', handleCountryEvt);
    return () => window.removeEventListener('litrometrik-country-changed', handleCountryEvt);
  }, []);

  // Synchronize fuel price updates across all tabs in real-time
  useEffect(() => {
    const handlePriceEvt = (e: any) => {
      const { fuel, price } = e.detail || {};
      if (fuel && typeof price === 'number') {
        setInputs((prev) => {
          const isMatchingFuel =
            (prev.fuelType === 'gasolina' && fuel === 'Gasolina Pb95') ||
            (prev.fuelType === 'diesel' && fuel === 'Diésel ON') ||
            ((prev.fuelType === 'lpg' || prev.fuelType === 'glp') && fuel === 'Gas GLP / LPG');
          if (isMatchingFuel) {
            return { ...prev, pricePerLiter: price };
          }
          return prev;
        });
      }
    };
    window.addEventListener('litrometrik-prices-updated', handlePriceEvt);
    return () => window.removeEventListener('litrometrik-prices-updated', handlePriceEvt);
  }, []);

  const handleInputsChange = (newInputs: Partial<CalculatorInputs>) => {
    if (newInputs.country && newInputs.country !== inputs.country) {
      const nextCountryData = DATA_PAIS[newInputs.country] || DATA_PAIS.PL;
      try {
        localStorage.setItem('litrometrik_selected_country', newInputs.country);
        localStorage.setItem('litrometrik_jurisdiction_country', newInputs.country);
      } catch (e) {}

      setInputs((prev) => ({
        ...prev,
        ...newInputs,
        country: newInputs.country!,
        pricePerLiter: nextCountryData.preciosDefecto[prev.fuelType === 'diesel' ? 'diesel' : prev.fuelType === 'lpg' || prev.fuelType === 'glp' ? 'lpg' : 'gasolina'],
        referenceGasolinePrice: nextCountryData.preciosDefecto.gasolina,
        routeName: `Viaje en ${nextCountryData.nombre}`,
      }));
      window.dispatchEvent(new CustomEvent('litrometrik-country-changed', { detail: { country: newInputs.country } }));
      return;
    }
    setInputs((prev) => ({ ...prev, ...newInputs }));
  };

  const handleSaveTrip = (newTrip: SavedTrip) => {
    setSavedTrips((prev) => [newTrip, ...prev]);

    // Persist to Supabase if user logged in
    if (currentUser?.uid && currentUser.uid !== 'guest' && currentUser.uid !== 'guest_user') {
      insertSupabaseTrip(currentUser.uid, {
        distancia_km: newTrip.distanceKm,
        litros_consumidos: newTrip.totalLiters,
        costo_total: newTrip.totalCostPLN,
        combustible_usado: newTrip.fuelType,
        precio_por_litro: newTrip.pricePerLiter,
        nombre_ruta: newTrip.routeName,
      }).catch((e) => console.warn('Supabase trip insert warning:', e));

      saveCloudRecord(currentUser.uid, 'viajes', newTrip);
    }
  };

  const handleDeleteTrip = (id: string) => {
    setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    if (currentUser?.uid && currentUser.uid !== 'guest' && currentUser.uid !== 'guest_user') {
      deleteSupabaseTrip(id).catch((e) => console.warn('Supabase trip delete warning:', e));
      deleteCloudRecord(currentUser.uid, 'viajes', id);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas vaciar todo el historial de viajes?')) {
      if (currentUser?.uid && currentUser.uid !== 'guest' && currentUser.uid !== 'guest_user') {
        clearSupabaseTrips(currentUser.uid).catch((e) => console.warn('Supabase trips clear warning:', e));
        savedTrips.forEach((t) => deleteCloudRecord(currentUser.uid, 'viajes', t.id));
      }
      setSavedTrips([]);
    }
  };

  const handleLoadTrip = (trip: SavedTrip) => {
    setInputs({
      country: inputs.country,
      vehicleType: trip.vehicleType as any,
      customBaseConsumption: 8.0,
      transmission: trip.transmission as any,
      fuelType: trip.fuelType as any,
      routeType: trip.routeType as any,
      distanceKm: trip.isRoundTrip ? trip.distanceKm / 2 : trip.distanceKm,
      isRoundTrip: trip.isRoundTrip,
      isACActive: trip.isACActive,
      coldStartLpg: trip.coldStartLpg,
      pricePerLiter: trip.pricePerLiter,
      referenceGasolinePrice: inputs.referenceGasolinePrice,
      routeName: trip.routeName,
    });
    setIsHistoryOpen(false);
    setCurrentTab('calcular');
  };

  const handleReset = () => {
    const cData = DATA_PAIS[inputs.country] || DATA_PAIS.PL;
    setInputs({
      country: inputs.country,
      vehicleType: 'sedan',
      customBaseConsumption: cData.Sedan.base,
      transmission: 'manual',
      fuelType: 'gasolina',
      routeType: 'mixto',
      distanceKm: 150,
      isRoundTrip: false,
      isACActive: false,
      coldStartLpg: true,
      pricePerLiter: cData.preciosDefecto.gasolina,
      referenceGasolinePrice: cData.preciosDefecto.gasolina,
      routeName: `Nuevo Viaje (${cData.nombre})`,
    });
  };

  const totalKmCalculated = Math.round(savedTrips.reduce((acc, t) => acc + (t.distanceKm || 0), 0));

  // ---------------- AUTH GATE VIEW (FIRST SCREEN ON OPENING) ----------------
  if (authLoading) {
    return <SplashScreen />;
  }

  if (!currentUser) {
    return (
      <AuthGate
        onAuthSuccess={(authUser) => {
          const u = authUser || getStoredActiveUser();
          if (u) {
            setCurrentUser(u);
          }
        }}
      />
    );
  }

  // ---------------- MAIN APPLICATION VIEW ----------------
  const appContent = (
    <div className="min-h-screen bg-[#080B11] text-slate-100 font-sans antialiased selection:bg-[#FF4F00] selection:text-white pb-24 w-full overflow-x-hidden touch-pan-y relative">
      {/* Native Smartphone Top Status Bar (Only in Desktop Simulator Frame) */}
      {isDesktopFrame && (
        <NativeStatusBar
          isGPSActive={true}
          gpsAccuracy={3}
          isCloudConnected={Boolean(currentUser?.uid && currentUser.uid !== 'guest' && currentUser.uid !== 'guest_user')}
          isDesktopFrame={isDesktopFrame}
          onToggleFrame={() => setIsDesktopFrame(!isDesktopFrame)}
          onOpenCloud={() => {
            setIsAuthModalOpen(true);
          }}
        />
      )}

      {/* Google Maps Quota Exhausted Banner */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* App Update Notification Banner */}
      <UpdateBanner />

      {/* ---------------- 1. SUB-VIEWS / DRILL-DOWN MODALS ---------------- */}
      {activeModule && activeModule !== 'stats' && activeModule !== 'wazerProfile' ? (
        <CategoryDetailView
          moduleKey={activeModule}
          onBack={() => setActiveModule(null)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          selectedCountry={inputs.country}
          onCountryChange={(c) => handleInputsChange({ country: c })}
        />
      ) : activeModule === 'stats' ? (
        <FuelStatisticsModal
          isOpen={true}
          onClose={() => setActiveModule(null)}
          onBackToCategories={() => setActiveModule(null)}
          selectedCountry={inputs.country}
          onCountryChange={(c) => handleInputsChange({ country: c })}
        />
      ) : activeModule === 'wazerProfile' ? (
        <UserWazerProfileModal
          isOpen={true}
          onClose={() => setActiveModule(null)}
          totalKmCalculated={totalKmCalculated}
        />
      ) : (
        /* ---------------- 2. MAIN 4 NATIVE MOBILE TABS (PERSISTENT MOUNTED IN BACKGROUND) ---------------- */
        <>
          <div className={currentTab === 'marcha' ? 'contents' : 'hidden'}>
            {/* TAB 1: MODO EN MARCHA (Tacómetro & Sensor GPS Real) */}
            <ModoMarchaView
              selectedCountry={inputs.country}
              onCountryChange={(c) => handleInputsChange({ country: c })}
              onOpenHistory={() => setIsHistoryOpen(true)}
              currentUser={currentUser}
            />
          </div>

          <div className={currentTab === 'calcular' ? 'contents' : 'hidden'}>
            {/* TAB 2: CALCULADORA NATIVA MÓVIL */}
            <CalcularView
              inputs={inputs}
              onChange={handleInputsChange}
              onSaveTrip={handleSaveTrip}
              onReset={handleReset}
              onOpenHistory={() => setIsHistoryOpen(true)}
              currentUser={currentUser}
            />
          </div>

          <div className={currentTab === 'bitacora' ? 'contents' : 'hidden'}>
            {/* TAB 3: BITÁCORA DE REPOSTAJE & CONSUMO */}
            <CategoryDetailView
              moduleKey="refuels"
              onBack={() => setCurrentTab('marcha')}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              selectedCountry={inputs.country}
              onCountryChange={(c) => handleInputsChange({ country: c })}
            />
          </div>

          <div className={currentTab === 'garaje' ? 'contents' : 'hidden'}>
            {/* TAB 4: MI GARAJE (Mantenimientos, Neumáticos, Trámites) */}
            <GarajeView
              selectedCountry={inputs.country}
              onCountryChange={(c) => handleInputsChange({ country: c })}
              currentUser={currentUser}
              onSelectCategory={(cat) => {
                const keyMap: Record<string, ModuleKey> = {
                  mantenimiento: 'maintenance',
                  neumaticos: 'tires',
                  tramites: 'legal',
                };
                setActiveModule(keyMap[cat] || 'maintenance');
              }}
            />
          </div>
        </>
      )}

      {/* ---------------- 3. FIXED BOTTOM TAB BAR (4 Tabs + Central Waze km/h Button) ---------------- */}
      <BottomTabBar
        activeTab={currentTab}
        onTabChange={(newTab) => {
          setActiveModule(null);
          setCurrentTab(newTab);
        }}
        onWazeCenterPress={() => {
          setActiveModule(null);
          if (currentTab !== 'marcha') {
            setCurrentTab('marcha');
          } else {
            window.dispatchEvent(new CustomEvent('litrometrik-toggle-marcha'));
          }
        }}
      />

      {/* Persistent Modals & Drawers */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

      <TripHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        trips={savedTrips}
        onDeleteTrip={handleDeleteTrip}
        onClearHistory={handleClearHistory}
        onLoadTrip={handleLoadTrip}
      />

      <SidebarDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSelectModule={(key) => {
          if (key === 'stats') {
            setCurrentTab('marcha');
          } else if (key === 'refuels') {
            setCurrentTab('bitacora');
          } else if (key === 'wazerProfile') {
            setActiveModule('wazerProfile');
          } else {
            setCurrentTab('garaje');
            setActiveModule(key);
          }
        }}
      />
    </div>
  );

  // If desktop frame toggle is active on larger screens
  if (isDesktopFrame) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[430px] h-[92vh] max-h-[920px] bg-[#080B11] rounded-[52px] shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_0_12px_#1E293B,0_0_0_14px_#334155] overflow-hidden flex flex-col relative border-4 border-slate-700/60">
          {/* Hardware Camera Notch / Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full bg-black z-50 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 ml-16" />
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {appContent}
          </div>
        </div>
      </div>
    );
  }

  return appContent;
}
