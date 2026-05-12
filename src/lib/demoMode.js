/**
 * demoMode.js — Singleton pour activer le mode démo sans session Supabase.
 * Évite la dépendance circulaire LoginScreen ↔ AppNavigator.
 */

let _activator = () => {};

export function setDemoModeActivator(fn) {
  _activator = fn;
}

export function activateDemoMode() {
  _activator();
}
