# Free Map Genie — lokalny build dla Vivaldi

## Baza

Upstream: https://github.com/V1P3R-FMG/free-map-genie
Gałąź v3, commit e25530cc007e1daec793247c1c79dce5fb19e21b.
To nowszy kod niż wydanie v3.0.0-beta; zawiera m.in. scalony PR #106.

## Instalacja

1. Wyeksportuj ważne dane z dotychczasowego rozszerzenia. Nie usuwaj danych witryn MapGenie ani starego rozszerzenia przed wykonaniem kopii.
2. Wyłącz dotychczasową wersję Free Map Genie, aby dwie kopie nie działały jednocześnie.
3. Otwórz `vivaldi://extensions` i włącz tryb programisty.
4. Kliknij „Załaduj rozpakowane” i wskaż podkatalog `extension` tego projektu.
5. Rozszerzenie otworzy przypiętą kartę techniczną „FMG — Vivaldi backend”. Pozostaw ją otwartą. Zastępuje niedziałający w Vivaldi dokument offscreen; nie jest to poprawka kodu samej przeglądarki.
6. Zaloguj się normalnie na swoje konto MapGenie i odśwież mapę. W Profiles można później korzystać z profili Guest.

Build nie był instalowany w Twoim zwykłym profilu przeglądarki. W razie problemu wyłącz go i ponownie włącz poprzednią wersję; nie czyść danych witryny jako pierwszego kroku diagnostycznego.

## Zmiany

- Opt-in `FMG_VIVALDI_COMPAT=1`: backend w nieaktywnej przypiętej karcie rozszerzenia zamiast offscreen; karta nie podlega automatycznemu odrzucaniu.
- Utrzymanie globalnego routingu usług backendu mimo obecności sender.tab.
- Odtworzenie technicznej karty po jej zwykłym zamknięciu oraz po zamknięciu jej okna, jeśli pozostało inne okno przeglądarki. Bez otwierania nowego okna podczas wyjścia z Vivaldi.
- Ponowne wykorzystanie istniejącej karty przy starcie i przeładowanie jej, jeśli była odrzucona (discarded).
- Obsługa obecnego `map.<hash>.js` i starego `map.js?id=…` zarówno w regule blokowania, jak i reaktywacji skryptu; ochrona przed podwójnym wstrzyknięciem.
- Nie scalano opcjonalnych PR-ów #107 ani #117. #107 zmienia schemat bazy i dodaje zapamiętywanie filtrów; #117 usuwa przestarzałe listenery unload, ale nie naprawia problemu offscreen.

## Weryfikacja

Vivaldi 8.2.4133.94 stable, osobne profile testowe.

Potwierdzone przed zmianą: all_frames działa w ramce zwykłej karty rozszerzenia, ale nie w ramce dokumentu offscreen. Oryginalny build v3: TestService odpowiada, BackendService.getProfiles kończy się timeoutem.

Po zmianie: RPC tła i backendu, tworzenie profilu Guest, zapis i odczyt znalezionej lokalizacji w prawdziwej bazie IndexedDB, działanie między kartami, utrzymanie danych po przeładowaniu popupu, zapis/odczyt localStorage przez ramkę StorageService, odtworzenie backendu po zamknięciu karty — PASS. Żywa anonimowa mapa Factory ładuje canvas i wstrzykuje obecną wersję skryptu z parametrem ready.

Test obsługi adresów skryptów wykazał przed zmianą brak reaktywacji map.<hash>.js. Po zmianie sprawdza oba formaty, brak podwójnego wstrzyknięcia i rozróżnienie blokowanego oryginału od dozwolonej kopii ready.

**Niepotwierdzone:** pełny przebieg po rzeczywistym zalogowaniu (klikanie markerów i notatek w interfejsie), wszystkie gry, migracja Twoich dotychczasowych danych i pełny restart przeglądarki. Test RPC nie zastępuje testu zalogowanego interfejsu. Anonimowa mapa nie potwierdza działania funkcji konta.

Build produkcyjny kończy się powodzeniem. Upstream `npm run compile` ma problem konfiguracji TypeScript project references (TS6305); nie jest raportowany jako zielony. Nie uruchamiano pełnego zestawu E2E wymagającego konta.

## Odtworzenie buildu

Repo używa yarn.lock. Do pierwszej instalacji w tej sesji użyto npm z `--legacy-peer-deps --ignore-scripts` z powodu istniejącego konfliktu peer dependency React 19 / react-redux-toastr. package-lock.json zapisuje faktycznie rozwiązane zależności; upstream yarn.lock nie został zmieniony.

```sh
npm ci --legacy-peer-deps --ignore-scripts
npx wxt prepare
FMG_VIVALDI_COMPAT=1 npm run build
node test-script-compat.mjs
node test-vivaldi.mjs .output/chrome-mv3
```

Gotowy katalog instalacyjny `extension` jest kopią przetestowanego buildu; kolejne `npm run build` aktualizuje `.output/chrome-mv3`, nie `extension` automatycznie.
