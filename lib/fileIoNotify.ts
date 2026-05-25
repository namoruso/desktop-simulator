import { useProcessStore } from '@/store/useProcessStore';

/** After a file operation, simulate disk I/O wait on the running process. */
export function notifyFileIoComplete() {
  const { scheduler, processes } = useProcessStore.getState();
  let pid = scheduler.currentPid;
  if (!pid) {
    const running = [...processes.values()].find((p) => p.state === 'running');
    pid = running?.pid ?? null;
  }
  if (pid) {
    useProcessStore.getState().triggerIoWait(pid, 60);
  }
}
