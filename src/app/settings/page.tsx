import { auth, signIn, signOut } from "@/auth";
import { getLinkedGoogleAccounts } from "@/lib/google";
import Link from "next/link";
import WeatherLocationSettingsLoader from "@/components/WeatherLocationSettingsLoader";

export default async function SettingsPage() {
  const session = await auth();
  const linkedAccounts = await getLinkedGoogleAccounts();

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Ustawienia</h1>
        <Link href="/" className="text-blue-600 hover:underline">
          ← Wróć do kalendarza
        </Link>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Połączone konta Google</h2>
        <p className="text-gray-500">
          Każdy domownik loguje się tutaj raz, żeby jego kalendarz i zadania Google
          pojawiły się na wspólnym ekranie.
        </p>

        <ul className="flex flex-col gap-2">
          {linkedAccounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
            >
              {a.user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.user.image} alt="" className="h-10 w-10 rounded-full" />
              )}
              <div className="flex-1">
                <p className="font-medium">{a.user.name}</p>
                <p className="text-sm text-gray-500">{a.user.email}</p>
              </div>
            </li>
          ))}
          {linkedAccounts.length === 0 && (
            <li className="text-gray-500">Brak połączonych kont.</li>
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
              className="rounded-full bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700"
            >
              Połącz konto Google
            </button>
          </form>
        )}

        {session?.user && (
          <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
            <p>
              Zalogowano jako <strong>{session.user.email}</strong>
            </p>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button type="submit" className="text-sm text-gray-500 underline">
                Wyloguj tę sesję
              </button>
            </form>
          </div>
        )}

        <p className="text-sm text-gray-400">
          Aby dodać drugie konto (np. żony), wyloguj tę sesję przeglądarki i zaloguj
          ponownie z drugiego konta Google — oba pozostaną połączone z aplikacją.
        </p>
      </section>

      <section className="flex flex-col gap-3 border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold">Pogoda</h2>
        <p className="text-gray-500">
          Widget pogody nad kalendarzem domyślnie pokazuje lokalizację skonfigurowaną
          na serwerze. Możesz zamiast tego użyć lokalizacji tego konkretnego
          urządzenia (np. tabletu), jeśli różni się od domyślnej.
        </p>
        <WeatherLocationSettingsLoader />
      </section>

      <section className="flex flex-col gap-3 border-t border-gray-200 pt-6">
        <h2 className="text-xl font-semibold">Trello (wkrótce)</h2>
        <p className="text-gray-500">
          Miejsce na integrację z Twoimi zadaniami Trello — pojawi się tutaj w
          kolejnym etapie.
        </p>
      </section>
    </main>
  );
}
