# Varga Android Tester

Applicazione desktop per avviare un Android Emulator e verificare visivamente build Android senza modificare l'app testata.

## Prima versione
- controllo ADB / Android Emulator / bundletool
- elenco degli AVD disponibili
- avvio del dispositivo virtuale
- selezione APK/AAB
- installazione APK tramite ADB
- acquisizione screenshot del dispositivo

## Avvio
Richiede Node.js, Android Studio/Android SDK e almeno un AVD configurato.

```bash
npm install
npm start
```

Il supporto AAB completo e l'automazione della creazione dell'AVD saranno aggiunti nelle versioni successive.
