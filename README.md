# Kalendarz domowy

Wspólny kalendarz rodzinny (Next.js + React) łączący dwa konta Google Calendar
w jeden widok, wspólną listę zadań i (docelowo) integrację z Trello. Pomyślany
pod tablet powieszony na ścianie, dostępny też z innych urządzeń w sieci
domowej.

## Jak to działa

- Logujesz się raz przez Google (Ty i żona, osobno, w `/settings`) —
  aplikacja zapamiętuje tokeny OAuth po stronie serwera (SQLite), więc na
  co dzień nikt nie musi się logować na tablecie.
- Strona główna pokazuje scalone wydarzenia z obu kalendarzy Google (kolor =
  właściciel) oraz wspólną listę zadań (przechowywaną lokalnie w bazie
  aplikacji, niezależnie od Google Tasks).
- Dodawanie wydarzeń zapisuje się bezpośrednio na koncie Google wybranej
  osoby — więc synchronizuje się automatycznie z telefonem/Kalendarzem
  Google każdego z Was.

## 1. Konfiguracja Google Cloud

1. Wejdź na https://console.cloud.google.com/ i utwórz nowy projekt.
2. **APIs & Services → Library** — włącz:
   - Google Calendar API
   - Google Tasks API (przyda się w przyszłości)
3. **APIs & Services → OAuth consent screen** — typ "External", dodaj siebie
   i żonę jako testerów (jeśli aplikacja nie jest zweryfikowana, tylko
   dodani testerzy będą mogli się zalogować).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Typ: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `http://<adres-ip-serwera-w-domu>:3000/api/auth/callback/google`
       (dodaj po ustaleniu IP serwera w sieci lokalnej)
5. Skopiuj **Client ID** i **Client secret**.

## 2. Uruchomienie lokalne (development)

```bash
cp .env.example .env
# uzupełnij GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET i wygeneruj AUTH_SECRET:
openssl rand -base64 32

npm install
npx prisma migrate deploy
npm run dev
```

Otwórz http://localhost:3000, przejdź do `/settings` i połącz konto Google
(dla drugiej osoby: wyloguj sesję i zaloguj ponownie z jej konta).

## 3. Uruchomienie w Dockerze (zalecane do stałego działania w domu)

Działa identycznie na Linux/macOS/Windows (byle był zainstalowany Docker).

```bash
cp .env.example .env
# uzupełnij GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET
# ustaw AUTH_URL na adres, pod którym appka będzie dostępna w sieci domowej,
# np. AUTH_URL="http://192.168.1.50:3000"

docker compose up -d --build
```

Aplikacja będzie dostępna pod `http://localhost:3000` na maszynie hosta oraz
pod `http://<IP-hosta>:3000` z innych urządzeń w tej samej sieci lokalnej
(np. z tabletu, telefonu, laptopa). Dane (baza SQLite z tokenami i listą
zadań) trzymane są w nazwanym wolumenie Dockera `calendar-data`, więc
przetrwają restart/aktualizację kontenera.

Przydatne komendy:

```bash
docker compose logs -f      # podgląd logów
docker compose down         # zatrzymanie (dane zostają w wolumenie)
docker compose up -d --build  # przebudowanie po zmianach w kodzie
```

## 4. Dostęp z tabletu na ścianie

1. Znajdź lokalny adres IP komputera/serwera, na którym działa kontener
   (np. `ip addr` / `ipconfig`).
2. Na tablecie otwórz przeglądarkę pod adresem `http://<IP>:3000` i dodaj
   stronę do ekranu głównego (na Androidzie/iOS: "Dodaj do ekranu
   głównego") — będzie działać jak prosta aplikacja w trybie pełnoekranowym.
3. Warto ustawić w tablecie tryb "bez wygaszania" / kiosk, jeśli ma wisieć
   na ścianie na stałe.

## Struktura projektu

- `src/app` — strony Next.js (App Router) i API routes.
- `src/components` — komponenty UI (kalendarz, lista zadań, dialog dodawania).
- `src/lib/google.ts` — klient Google Calendar/Tasks z odświeżaniem tokenów.
- `src/auth.ts` — konfiguracja NextAuth (Google OAuth, zapis kont w bazie).
- `prisma/schema.prisma` — model danych (konta, sesje, wspólne todo, miejsce
  na przyszłą integrację z Trello).

## Plany na przyszłość

- Integracja z Trello (struktura bazy już przygotowana w
  `TrelloConnection`).
- Zmieniające się zdjęcia (np. digital photo frame) jako tło/wygaszacz.
