"use client";

type Account = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

const FALLBACK_COLORS = ["#2563eb", "#db2777", "#16a34a", "#ea580c"];

export default function AccountSidebar({
  open,
  onClose,
  accounts,
  activeAccountIds,
  onToggleAccount,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  activeAccountIds: Set<string> | null;
  onToggleAccount: (accountId: string) => void;
}) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 flex h-full w-72 flex-col gap-4 bg-white p-4 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kalendarze</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij panel"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {accounts.map((a, i) => {
            const isActive = activeAccountIds === null || activeAccountIds.has(a.id);
            const fallbackColor = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onToggleAccount(a.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                    isActive ? "bg-gray-50 hover:bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full"
                    style={{ opacity: isActive ? 1 : 0.35 }}
                  >
                    {a.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center text-sm font-medium text-white"
                        style={{ background: fallbackColor }}
                      >
                        {(a.name ?? a.email ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <span
                    className={`flex-1 font-medium ${isActive ? "text-gray-900" : "text-gray-400"}`}
                  >
                    {a.name ?? a.email}
                  </span>
                  <span
                    className={`h-5 w-5 shrink-0 rounded-full border-2 transition ${
                      isActive ? "border-blue-600 bg-blue-600" : "border-gray-300"
                    }`}
                  >
                    {isActive && (
                      <svg viewBox="0 0 16 16" className="h-full w-full p-0.5" fill="none">
                        <path
                          d="M3 8.5L6.5 12L13 4.5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
          {accounts.length === 0 && (
            <li className="p-2 text-sm text-gray-400">Brak połączonych kont.</li>
          )}
        </ul>
      </aside>
    </>
  );
}
