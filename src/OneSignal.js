import OneSignal from 'react-onesignal';

export default async function runOneSignal() {
  try {
    await OneSignal.init({ 
      appId: "c3c60e6d-0479-489a-9f05-f6bdf915c166", // ✅ Tu ID Configurado
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true, // Muestra la campanita roja de suscripción
      },
      // Configuración vital para PWA
      serviceWorkerPath: 'OneSignalSDKWorker.js', 
      serviceWorkerParam: { scope: '/' } 
    });
    console.log("✅ OneSignal Inicializado correctamente");
  } catch (err) {
    console.error("❌ Error al iniciar OneSignal", err);
  }
}