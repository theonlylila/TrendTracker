import { loadDashboardData } from "@/app/actions";
import { TrainingTrends } from "@/components/training/TrainingTrends";

export const dynamic = "force-dynamic";

export default async function TrainingPage() {
  const data = await loadDashboardData();

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-5 py-10">
        <TrainingTrends data={data} />
      </div>
    </main>
  );
}
