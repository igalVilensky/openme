import { DashboardHeader } from "../dashboard-header";
import { EndpointList } from "./endpoint-list";

export default function DashboardEndpointsPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardHeader active="endpoints" />

        <section className="py-10">
          <EndpointList />
        </section>
      </div>
    </main>
  );
}
