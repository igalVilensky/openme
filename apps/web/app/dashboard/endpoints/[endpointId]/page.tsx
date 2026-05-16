import { DashboardHeader } from "../../dashboard-header";
import { EndpointDetailEditor } from "./endpoint-detail-editor";

type DashboardEndpointDetailPageProps = {
  params: Promise<{
    endpointId: string;
  }>;
};

export default async function DashboardEndpointDetailPage({
  params,
}: DashboardEndpointDetailPageProps) {
  const { endpointId } = await params;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardHeader active="endpoints" />

        <EndpointDetailEditor endpointId={endpointId} />
      </div>
    </main>
  );
}
