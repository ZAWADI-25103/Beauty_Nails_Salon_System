"use client"
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { useTasks, useUpdateTask, useDeleteTask } from '@/lib/hooks/useTasks';
import CreateTaskModal from './modals/CreateTaskModal';

export default function TasksManagement() {
  const { data, isLoading } = useTasks({ page: 1, limit: 6 });
  const tasks = data?.tasks || [];

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const markCompleted = (id: string) => {
    updateTask.mutate({ id, payload: { status: 'completed', completedAt: new Date().toISOString() } });
  };

  const onDelete = (id: string) => {
    if (!confirm('Supprimer la tâche ?')) return;
    deleteTask.mutate(id);
  };

  return (
    <Card className="p-4 sm:p-8 hover:shadow-lg transition-all border border-pink-100 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-400 shadow-xl rounded-2xl bg-white dark:bg-gray-950">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center">
            <Badge className="bg-pink-500 hover:bg-pink-600 text-white border-0 w-2 h-2 p-0 rounded-full" />
          </div>
          <h3 className="text-xl  text-gray-900 dark:text-gray-100">Tâches récentes</h3>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CreateTaskModal triggerLabel="+ Nouvelle tâche" />
          <Button variant="ghost" size="sm" className="rounded-full dark:text-gray-400 dark:hover:bg-gray-800">Voir tout</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 animate-pulse">Chargement des tâches...</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p className="text-lg text-gray-500 dark:text-gray-400">Aucune tâche trouvée.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {tasks.map((t: any) => (
            <li key={t.id} className="flex flex-col sm:flex-row items-start justify-between gap-4 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-pink-100 dark:hover:border-pink-900/30 transition-all">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className=" text-gray-900 dark:text-gray-100">{t.title}</h4>
                  <Badge className={`${t.priority === 'high' ? 'bg-orange-500' : t.priority === 'urgent' ? 'bg-red-600' : 'bg-gray-400'} text-white border-0 text-[10px] px-2 py-0.5 uppercase  tracking-wider`}>
                    {t.priority}
                  </Badge>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">{t.description || '-'}</p>
                <div className="flex flex-wrap items-center gap-3 mt-4 text-[11px] text-gray-500 dark:text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                    Assigné: <span className="text-gray-700 dark:text-gray-300 ">{t.assignedTo?.user?.name || '—'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-950 rounded-lg border border-gray-100 dark:border-gray-800">
                    Par: <span className="text-gray-700 dark:text-gray-300 ">{t.createdBy?.name || '—'}</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700">
                <Badge className={`${t.status === 'completed' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'} text-white border-0 `}>
                  {t.status}
                </Badge>
                <div className="flex items-center gap-2">
                  {t.status !== 'completed' && (
                    <Button size="sm" onClick={() => markCompleted(t.id)} className="bg-linear-to-r from-pink-500 to-purple-500 text-white rounded-full h-8 px-4 text-base ">
                      Compléter
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => onDelete(t.id)} className="rounded-full h-8 px-4 text-base  bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-0 hover:bg-red-500 hover:text-white">
                    Supprimer
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
