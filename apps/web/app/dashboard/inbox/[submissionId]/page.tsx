import { DashboardHeader } from "../../dashboard-header";
import { SubmissionDetail } from "./submission-detail";

type DashboardInboxDetailPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export default async function DashboardInboxDetailPage({
  params,
}: DashboardInboxDetailPageProps) {
  const { submissionId } = await params;

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <DashboardHeader active="inbox" />

        <SubmissionDetail submissionId={submissionId} />
      </div>
    </main>
  );
}
