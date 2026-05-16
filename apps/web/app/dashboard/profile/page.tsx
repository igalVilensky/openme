import { DashboardHeader } from "../dashboard-header";
import { ProfileEditor } from "./profile-editor";

export default function DashboardProfilePage() {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <DashboardHeader active="profile" />

        <section className="py-10">
          <ProfileEditor />
        </section>
      </div>
    </main>
  );
}
