# Guida: build iOS con GitHub Actions e installazione su iPhone

Questa guida ti accompagna passo passo: dal push del progetto su GitHub fino all’installazione dell’app sul tuo iPhone con **AltStore** o **Sideloadly** (senza Mac e senza certificati Apple nel workflow).

---

## Cosa serve

- Account **GitHub**
- **iPhone** e cavo USB
- **Windows** (o Mac) con **AltStore** oppure **Sideloadly** installato
- **Apple ID** (gratuito) per re-firmare l’app con AltStore/Sideloadly

---

## Parte 1 – Push del progetto su GitHub

### 1.1 Crea un repository su GitHub

1. Vai su [github.com](https://github.com) e fai login.
2. Clicca **“+”** in alto a destra → **“New repository”**.
3. Nome esempio: `dialmap-connect`.
4. Scegli **Public**, **non** inizializzare con README (se il progetto ce l’ha già).
5. Clicca **“Create repository”**.

### 1.2 Carica il progetto

Sul PC, nella cartella del progetto (dove c’è `package.json`):

```powershell
git init
git add .
git commit -m "Initial commit - Android + iOS workflow"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/dialmap-connect.git
git push -u origin main
```

Sostituisci `TUO-USERNAME` con il tuo username GitHub e `dialmap-connect` con il nome del repo se diverso.

---

## Parte 2 – Eseguire la build iOS su GitHub Actions

### 2.1 Dove si trova il workflow

Il file del workflow è:

**`.github/workflows/build-ios.yml`**

Viene eseguito:

- **Automaticamente** a ogni push su `main` (o `master`).
- **Manualmente** da: repo → **Actions** → **Build iOS** → **Run workflow**.

### 2.2 Avviare la build

- **Opzione A:** fai un push su `main` (es. un piccolo commit e push).
- **Opzione B:** vai su **Actions** → **Build iOS** → **Run workflow** → **Run workflow**.

### 2.3 Controllare il risultato

1. Vai nella scheda **Actions** del repository.
2. Clicca sull’ultima run **“Build iOS”**.
3. Attendi che il job **“Build IPA”** sia **verde** (completato).
4. In fondo alla pagina, nella sezione **Artifacts**, compare **“ios-ipa”**.

### 2.4 Scaricare l’IPA

1. Clicca su **“ios-ipa”** per scaricare lo zip.
2. Decomprimi lo zip: troverai **`DialRoad.ipa`**.

Se la build fallisce, apri il job e leggi i log del passo che è in errore (es. “Build .app” o “Create IPA”).

---

## Parte 3 – Installare l’app sull’iPhone con AltStore (Windows)

### 3.1 Installare AltServer e AltStore

1. Vai su [altstore.io](https://altstore.io) e scarica **AltServer per Windows**.
2. Installa **AltServer** sul PC.
3. Installa **iCloud per Windows** e **iTunes** (da Microsoft Store o da Apple), se richiesto da AltStore.
4. Collega l’**iPhone** al PC con il cavo USB.
5. Apri **AltServer** (icona nella system tray) → **Install AltStore** → seleziona il tuo **iPhone**.
6. Sul telefono: se richiesto, **Fidati di questo computer** e inserisci il codice del dispositivo.
7. Sul iPhone viene installata l’app **AltStore**.

### 3.2 Installare la tua IPA (DialRoad)

1. Trasferisci il file **`DialRoad.ipa`** sul PC (es. nella cartella Download).
2. Apri **AltStore** sull’iPhone.
3. Nella scheda **“My Apps”** tocca **“+”** (in alto) e scegli **“Install .ipa”** (o simile).
4. Seleziona **DialRoad.ipa** (puoi usare “Apri con…” da un file manager che veda l’IPA, se AltStore lo supporta), oppure invia l’IPA al telefono (email, cloud, ecc.) e aprilo con AltStore.
5. Inserisci il tuo **Apple ID** e la **password** quando richiesto (puoi usare una “App-specific password” da appleid.apple.com).
6. Attendi l’installazione: l’icona **DialRoad** apparirà sulla home.

**Nota:** con Apple ID gratuito l’app dura **7 giorni**; dopo va “rinnovata” da AltStore (collega di nuovo l’iPhone al PC e apri AltServer, oppure usa il refresh via WiFi se lo hai attivato).

---

## Parte 3 (alternativa) – Installare con Sideloadly (Windows)

1. Scarica **Sideloadly** da [sideloadly.io](https://sideloadly.io) e installalo.
2. Collega l’**iPhone** al PC con il cavo USB.
3. Apri **Sideloadly**.
4. Trascina il file **`DialRoad.ipa`** nell’app oppure selezionalo con “Select IPA”.
5. Sideloadly mostrerà il tuo dispositivo; inserisci il tuo **Apple ID** (e password / app-specific password).
6. Clicca **“Start”** e attendi l’installazione sull’iPhone.

Anche con Sideloadly, con account gratuito l’app di solito va reinstallata/rinnovata ogni **7 giorni**.

---

## Riepilogo passi

| Step | Dove | Cosa fare |
|------|------|-----------|
| 1 | GitHub | Creare repo e fare push del progetto |
| 2 | GitHub Actions | Eseguire “Build iOS” (push su main o Run workflow) |
| 3 | GitHub Actions | Scaricare l’artifact **ios-ipa** e estrarre `DialRoad.ipa` |
| 4 | Windows + iPhone | Installare AltStore (o Sideloadly) e usarlo per installare `DialRoad.ipa` |

---

## Problemi comuni

- **Build fallita su “Add iOS platform”:** di solito è ignorata (`continue-on-error`). Se fallisce “Sync Capacitor iOS”, controlla che `npm run build` funzioni in locale.
- **Build fallita su “Build .app”:** controlla i log di `xcodebuild`; a volte Xcode sui runner GitHub ha versioni diverse. Puoi provare a specificare una versione di Xcode nel workflow (es. con `maxim-lobanov/setup-xcode`).
- **AltStore/Sideloadly non vedono l’IPA:** assicurati di aver decompresso lo zip e di usare il file **.ipa**, non lo zip.
- **“Untrusted Enterprise Developer”:** su iPhone vai in **Impostazioni → Generali → VPN e gestione dispositivo** e “Fidati” del profilo del tuo Apple ID.

Se vuoi in seguito usare **TestFlight** o **certificati Apple** nel workflow, si può aggiungere un secondo job o un workflow separato con firma (certificato + provisioning profile in GitHub Secrets).
