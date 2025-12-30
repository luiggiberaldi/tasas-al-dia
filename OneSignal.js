import OneSignal from 'react-onesignal';

export default async function runOneSignal() {
  try {
    await OneSignal.init({ 
      appId: "TU_APP_ID_AQUI", // <--- PEGA TU APP ID DE ONESIGNAL AQUÍ
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: true, // Muestra la campanita roja de suscripción automáticamente
      },
      // Esto hace que funcione en PWA
      serviceWorkerPath: 'OneSignalSDKWorker.js', 
      serviceWorkerParam: { scope: '/' } 
    });
    console.log("✅ OneSignal Inicializado");
  } catch (err) {
    console.error("❌ Error OneSignal", err);
  }
}