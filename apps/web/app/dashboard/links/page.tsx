import { DashboardHeader } from "../dashboard-header";
import { LinkEditor } from "./link-editor";

export default function DashboardLinksPage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <DashboardHeader active="links" />

        <section className="py-10">
          <LinkEditor />
        </section>
      </div>
    </main>
  );
}
