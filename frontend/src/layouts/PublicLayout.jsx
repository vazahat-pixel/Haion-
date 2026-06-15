import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-1 p-4">
      <Outlet />
    </div>
  );
}
