"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  AlertCircle,
  Loader2
} from "lucide-react";

const GET_TASKS = gql`
  query GetTasksByPatient($patientId: UUID!) {
    careNavigationCases(where: { patientId: { eq: $patientId } }) {
      caseId
      tasks {
        taskId
        description
        dueDate
        status
        assignedTo {
          firstName
          lastName
        }
      }
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: CreateNavigationTaskCommandInput!) {
    createNavigationTask(command: $input)
  }
`;

const UPDATE_TASK_STATUS = gql`
  mutation UpdateTaskStatus($taskId: UUID!, $status: NavigationTaskStatus!) {
    updateNavigationTaskStatus(taskId: $taskId, status: $status)
  }
`;

interface Props {
  patientId: string;
}

export default function TaskManagement({ patientId }: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState("");
  
  const { data, loading, refetch } = useQuery(GET_TASKS, {
    variables: { patientId },
    skip: !patientId
  });

  const [createTask] = useMutation(CREATE_TASK, {
    onCompleted: () => {
      setNewTask("");
      setIsAdding(false);
      refetch();
    }
  });

  const [updateStatus] = useMutation(UPDATE_TASK_STATUS, {
    onCompleted: () => refetch()
  });

  const activeCase = data?.careNavigationCases?.[0];
  const tasks = activeCase?.tasks || [];

  const handleAddTask = () => {
    if (!newTask.trim() || !activeCase) return;
    createTask({
      variables: {
        input: {
          caseId: activeCase.caseId,
          description: newTask,
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days default
          assignedToId: "00000000-0000-0000-0000-000000000000" // System for now
        }
      }
    });
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    updateStatus({
      variables: {
        taskId,
        status: currentStatus === 'Completed' ? 'Pending' : 'Completed'
      }
    });
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-[2.5rem] p-8 border border-[var(--card-border)] shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Clinical Coordination Tasks
          </h2>
          <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mt-1">Care Navigation Worklist</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {isAdding && (
        <div className="mb-6 space-y-3 animate-in slide-in-from-top duration-300">
           <input 
             autoFocus
             value={newTask}
             onChange={e => setNewTask(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleAddTask()}
             placeholder="What needs to be done? (e.g. Order O2 Tank)"
             className="w-full premium-input rounded-2xl py-4 px-6 text-sm text-white"
           />
           <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cancel</button>
              <button onClick={handleAddTask} className="px-6 py-2 bg-emerald-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-600/20">Create Task</button>
           </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-emerald-400 animate-spin" /></div>
        ) : tasks.length > 0 ? (
          tasks.map((task: any) => (
            <div 
              key={task.taskId} 
              className={`p-5 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer
                ${task.status === 'Completed' ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
              onClick={() => toggleTask(task.taskId, task.status)}
            >
              <div className="flex items-center gap-4">
                 {task.status === 'Completed' ? (
                   <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                 ) : (
                   <Circle className="w-6 h-6 text-slate-700 group-hover:text-slate-500" />
                 )}
                 <div>
                    <p className={`text-sm font-bold ${task.status === 'Completed' ? 'line-through text-slate-500' : 'text-white'}`}>{task.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                       <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1">
                         <Clock className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString()}
                       </span>
                       <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest">
                         Assigned: {task.assignedTo?.firstName || "System"}
                       </span>
                    </div>
                 </div>
              </div>
              <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter
                ${task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {task.status}
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center opacity-30 border-2 border-dashed border-white/5 rounded-[2rem]">
            <AlertCircle className="w-8 h-8 mx-auto mb-3" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white">No active tasks for this case</p>
          </div>
        )}
      </div>
    </div>
  );
}
