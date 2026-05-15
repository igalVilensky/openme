import Link from "next/link";

import { LogoutButton } from "../../logout-button";
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
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
          <Link href="/dashboard/inbox" className="text-base font-semibold">
            Inbox
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="rounded-md border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium transition hover:border-[var(--accent)]"
            >
              Demo profile
            </Link>
            <LogoutButton />
          </div>
        </header>

        <SubmissionDetail submissionId={submissionId} />
      </div>
    </main>
  );
}
