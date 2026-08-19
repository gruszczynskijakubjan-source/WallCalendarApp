import { auth, signIn, signOut } from "@/auth";
import { getLinkedGoogleAccounts } from "@/lib/google";
import Link from "next/link";
import WeatherLocationSettingsLoader from "@/components/WeatherLocationSettingsLoader";
import AccountPhotoUpload from "@/components/AccountPhotoUpload";
import ThemeSwitcherLoader from "@/components/ThemeSwitcherLoader";
import PhotoManager from "@/components/PhotoManager";
import NotificationSettingsLoader from "@/components/NotificationSettingsLoader";
import TrelloSettings from "@/components/TrelloSettings";
import EweLinkSettings from "@/components/EweLinkSettings";

export default async function SettingsPage() {
  const session = await auth();
  const linkedAccounts = await getLinkedGoogleAccounts();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Ustawienia</h1>
        <Link href="/" className="text-accent-teal hover:underline">
          ← Wróć do kalendarza
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Połączone konta Google</h2>
        <p className="text-foreground/50">
          Każdy domownik loguje się tutaj raz, żeby jego kalendarz i zadania Google
          pojawiły się na wspólnym ekranie.
        </p>

        <ul className="flex flex-col gap-2">
          {linkedAccounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-border p-3"
            >
              {(a.user.customImage ?? a.user.image) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.user.customImage ?? a.user.image ?? undefined}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{a.user.name}</p>
                <p className="text-sm text-foreground/50">{a.user.email}</p>
              </div>
              <AccountPhotoUpload
                accountId={a.id}
                hasCustomImage={Boolean(a.user.customImage)}
              />
            </li>
          ))}
          {linkedAccounts.length === 0 && (
            <li className="text-foreground/50">Brak połączonych kont.</li>
          )}
        </ul>

        {!session?.user && (
          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <button
              type="submit"
              className="rounded-full bg-accent-teal px-6 py-3 text-lg font-medium text-white hover:brightness-95"
            >
              Połącz konto Google
            </button>
          </form>
        )}

        {session?.user && (
          <div className="flex items-center justify-between rounded-xl bg-accent-teal/10 p-4">
            <p>
              Zalogowano jako <strong>{session.user.email}</strong>
            </p>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button type="submit" className="text-sm text-foreground/50 underline">
                Wyloguj tę sesję
              </button>
            </form>
          </div>
        )}

        <p className="text-sm text-foreground/40">
          Aby dodać drugie konto (np. żony), wyloguj tę sesję przeglądarki i zaloguj
          ponownie z drugiego konta Google — oba pozostaną połączone z aplikacją.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Motyw</h2>
        <p className="text-foreground/50">
          Domyślnie dopasowuje się do aktualnej pory roku, ale możesz go zmienić
          ręcznie w dowolnym momencie.
        </p>
        <ThemeSwitcherLoader />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Pogoda</h2>
        <p className="text-foreground/50">
          Widget pogody nad kalendarzem domyślnie pokazuje lokalizację skonfigurowaną
          na serwerze. Możesz zamiast tego użyć lokalizacji tego konkretnego
          urządzenia (np. tabletu), jeśli różni się od domyślnej.
        </p>
        <WeatherLocationSettingsLoader />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Powiadomienia</h2>
        <p className="text-foreground/50">
          Wyskakujące przypomnienie na tym urządzeniu 15 minut przed każdym wydarzeniem
          — działa bez telefonu w zasięgu, dopóki ta strona jest otwarta w przeglądarce.
        </p>
        <NotificationSettingsLoader />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Ramka cyfrowa</h2>
        <p className="text-foreground/50">
          Dodaj zdjęcia rodzinne, żeby móc uruchomić pełnoekranowy pokaz slajdów
          (przycisk 🖼️ obok kalendarza).
        </p>
        <PhotoManager />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Trello — lista zakupów</h2>
        <p className="text-foreground/50">
          Połącz konto Trello i wskaż tablicę oraz listę, która ma pojawić się jako
          &quot;Lista zakupów&quot; obok listy zadań na głównym ekranie.
        </p>
        <TrelloSettings />
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">eWeLink — inteligentny dom</h2>
        <p className="text-foreground/50">
          Połącz konto eWeLink (Sonoff), żeby zobaczyć i sterować swoimi urządzeniami
          smart home wprost z panelu bocznego.
        </p>
        <EweLinkSettings />
      </section>
    </main>
  );
}
