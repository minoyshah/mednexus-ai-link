import { Capacitor } from "@capacitor/core";

/**
 * Native-shell bootstrap for the iOS/Android (Capacitor) builds. No-ops on the
 * web so the PWA/dev experience is untouched. Imported dynamically from
 * main.tsx only when running inside a native shell, keeping the plugins out
 * of the web bundle's critical path.
 */
export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
    import("@capacitor/status-bar"),
    import("@capacitor/splash-screen"),
    import("@capacitor/app"),
  ]);

  // Light canvas behind a dark-content status bar (matches --background).
  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (Capacitor.getPlatform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#F7F8FA" });
    }
  } catch {
    /* plugin unavailable — never block boot */
  }

  // Android hardware back: leave the app only from the root screen.
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.exitApp();
  });

  await SplashScreen.hide().catch(() => {});
}
