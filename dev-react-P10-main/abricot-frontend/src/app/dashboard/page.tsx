import Link from 'next/link';
import { getDashboardSnapshot } from '@/lib/dashboardQueries';
import { getCurrentUserId } from '@/lib/projectPermissions';
import DashboardLayout, { type DashboardViewMode } from '@/components/dashboard/DashboardLayout';
import TaskListSection from '@/components/dashboard/TaskListSection';
import KanbanSection from '@/components/dashboard/KanbanSection';
const DASHBOARD_VIEW_MODES: DashboardViewMode[] = ['liste', 'kanban'];

function parseDashboardViewMode(raw: string | undefined): DashboardViewMode {
  if (raw === 'projets') return 'liste';
  if (raw && DASHBOARD_VIEW_MODES.includes(raw as DashboardViewMode))
    return raw as DashboardViewMode;
  return 'liste';
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { vue: vueRaw } = await searchParams;
  const activeView = parseDashboardViewMode(vueRaw);
  const uid = await getCurrentUserId();
  if (!uid) {
    return (
      <DashboardLayout userLabel="Invité" activeView={activeView}>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/90 p-10 text-center text-gray-800">
          <p className="text-lg font-semibold">Aucun utilisateur en base</p>
          <p className="mt-2 text-sm text-gray-600">
            Créez un compte sur{' '}
            <Link href="/register" className="font-medium text-[#E86B32] underline">
              la page d&apos;inscription
            </Link>{' '}
            ou exécutez le script de seed pour pouvoir utiliser le tableau de bord.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const data = await getDashboardSnapshot(uid);

  return (
    <DashboardLayout userLabel={data.userLabel} activeView={activeView}>
      {activeView === 'liste' && <TaskListSection tasks={data.tasks} />}
      {activeView === 'kanban' && <KanbanSection byStatus={data.monthTasksByStatus} />}
    </DashboardLayout>
  );
}
