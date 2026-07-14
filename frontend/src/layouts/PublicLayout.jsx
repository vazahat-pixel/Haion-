import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-surface-1">
      <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-6 sm:max-w-2xl sm:py-8 lg:max-w-3xl">
        <Outlet />
      </div>
    </div>
  );
}
