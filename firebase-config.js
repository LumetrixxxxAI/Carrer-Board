/* Datos del proyecto de Firebase de Career Board.
   Dónde sacarlos: Consola de Firebase › ⚙ Configuración del proyecto › Tus apps › (app web) › "Configuración del SDK" › Config.

   Estos datos NO son secretos: Google los hizo para ir dentro de la web. Lo que protege la cuenta es
   la lista de "Dominios autorizados" de Authentication (y, cuando guardemos datos, las reglas de Firestore).

   Mientras apiKey esté vacío, la app usa el login simulado del boceto. */
window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
