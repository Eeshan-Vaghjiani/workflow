import { useEffect, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import TaskAssignmentPanel from '@/components/tasks/TaskAssignmentPanel';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Assignment {
  id: number;
  title: string;
  group_id: number;
}

interface Props {
  groupId: number;
  assignmentId: number;
  assignment: Assignment;
}

export default function TaskAssignmentPage({ groupId, assignmentId, assignment }: Props) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: 'Groups',
      href: '/groups',
    },
    {
      title: 'Assignments',
      href: `/groups/${groupId}/assignments`,
    },
    {
      title: assignment.title,
      href: `/groups/${groupId}/assignments/${assignmentId}`,
    },
    {
      title: 'Task Assignments',
      href: `/groups/${groupId}/assignments/${assignmentId}/task-assignments`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Task Assignments" />
      <div className="flex h-full flex-1 flex-col gap-4 p-4">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{assignment.title} - Task Assignments</h1>
            <p className="text-gray-500">View and manage task assignments for this assignment</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => window.location.href = route('group-tasks.create', { group: groupId, assignment: assignmentId })}
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        </div>

        <TaskAssignmentPanel
          groupId={groupId}
          assignmentId={assignmentId}
          onAssignmentChange={() => {
            // Optional: force reload or update other components
          }}
        />
      </div>
    </AppLayout>
  );
} 