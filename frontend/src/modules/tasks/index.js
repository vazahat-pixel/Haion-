import { queryKeys } from '@/services/api/queryKeys';
import { tasksService } from '@/services/tasks.service';
import { createListTable } from '../shared/createListTable';
import { createDetailView } from '../shared/createDetailView';
import { taskColumns, taskDetailFields } from './columns.config';

export const TaskTable = createListTable({
  service: tasksService,
  queryKey: queryKeys.tasks.list,
  columns: taskColumns,
  basePath: '/employee/tasks',
});

export const TaskDetail = createDetailView({
  service: tasksService,
  queryKey: queryKeys.tasks.detail,
  fields: taskDetailFields,
});
