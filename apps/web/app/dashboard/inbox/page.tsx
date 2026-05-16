import { DashboardHeader } from "../dashboard-header";
import { InboxList } from "./inbox-list";

export default function DashboardInboxPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardHeader active="inbox" />

        <section className="py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--accent)]">
                Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[0]">
                Inbox
              </h1>
            </div>
            <div className="rounded-md bg-[#f2efe7] px-4 py-3 text-sm text-[var(--muted)]">
              Owner inbox
            </div>
          </div>

          <div className="mt-8">
            <InboxList />
          </div>
        </section>
      </div>
    </main>
  );
}
