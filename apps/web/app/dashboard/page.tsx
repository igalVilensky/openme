import { DashboardHome } from "./dashboard-home";
import { DashboardHeader } from "./dashboard-header";

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardHeader active="dashboard" />

        <section className="py-10">
          <DashboardHome />
        </section>
      </div>
    </main>
  );
}
