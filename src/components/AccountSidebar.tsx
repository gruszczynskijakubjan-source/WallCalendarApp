"use client";

type Account = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  color?: string;
};

const FALLBACK_COLORS = [
  "var(--accent-coral)",
  "var(--accent-teal)",
  "var(--accent-gold)",
  "var(--accent-plum)",
];

export default function AccountSidebar({
  open,
  onClose,
  accounts,
  activeAccountIds,
  onToggleAccount,
  onOpenSlideshow,
  onOpenTimer,
  onOpenDevices,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  activeAccountIds: Set<string> | null;
  onToggleAccount: (accountId: string) => void;
  onOpenSlideshow: () => void;
  onOpenTimer: () => void;
  onOpenDevices: () => void;
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
        className={`fixed top-0 left-0 z-40 flex h-full w-72 flex-col gap-4 bg-surface p-4 shadow-xl transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kalendarze</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij panel"
            className="rounded-full p-2 text-foreground/50 hover:bg-surface-muted"
          >
            ✕
          </button>
        </div>

        <ul className="flex flex-col gap-1">
          {accounts.map((a, i) => {
            const isActive = activeAccountIds === null || activeAccountIds.has(a.id);
            const fallbackColor = a.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onToggleAccount(a.id)}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                    isActive ? "bg-surface-muted hover:bg-border" : "hover:bg-surface-muted"
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
                    className={`flex-1 font-medium ${isActive ? "text-foreground" : "text-foreground/40"}`}
                  >
                    {a.name ?? a.email}
                  </span>
                  <span
                    className={`h-5 w-5 shrink-0 rounded-full border-2 transition ${
                      isActive ? "border-accent-teal bg-accent-teal" : "border-border"
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
            <li className="p-2 text-sm text-foreground/40">Brak połączonych kont.</li>
          )}
        </ul>

        <div className="mt-2 flex flex-col gap-1 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSlideshow();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left font-medium hover:bg-surface-muted"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none">
              <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
              <path
                d="M3 15l4.5-4.5a1 1 0 0 1 1.4 0L13 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="9" r="1.5" fill="currentColor" />
            </svg>
            Ramka cyfrowa
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTimer();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left font-medium hover:bg-surface-muted"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none">
              <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M12 9v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M10 2h4M12 2v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Timer kuchenny
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDevices();
            }}
            className="flex w-full items-center gap-3 rounded-xl p-2 text-left font-medium hover:bg-surface-muted"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none">
              <path
                d="M4 12h16M4 12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2M4 12a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7" cy="8" r="1" fill="currentColor" />
              <circle cx="7" cy="16" r="1" fill="currentColor" />
            </svg>
            Urządzenia domowe
          </button>
        </div>
      </aside>
    </>
  );
}
