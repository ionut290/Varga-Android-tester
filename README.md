# Varga Android Tester

Desktop tester per eseguire build Android in un dispositivo virtuale senza modificare l'app testata.

## Versione 0.2
- verifica ADB, Emulator, Java, sdkmanager e avdmanager
- creazione guidata di un Pixel 7 virtuale
- download della system image Android tramite sdkmanager
- attesa automatica del completamento del boot
- installazione APK tramite ADB
- installazione AAB tramite bundletool.jar
- rilevamento e apertura dell'app installata
- screenshot reale dell'emulatore

## Requisiti
Installa Android Studio/Android SDK, Node.js e Java. Gli strumenti Android devono essere raggiungibili dal PATH. Per i file AAB serve anche bundletool.jar.

## Avvio
```bash
npm install
npm start
```

### Flusso
1. Controlla gli strumenti.
2. Crea o seleziona il dispositivo virtuale.
3. Avvia Android e attendi che sia pronto.
4. Seleziona APK/AAB e installalo.
5. Apri l'app.
6. Cattura lo screenshot per verificare visivamente il layout.
