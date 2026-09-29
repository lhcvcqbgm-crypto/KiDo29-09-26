import React from 'react';

export const ViewSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-pulse select-none font-sans py-2">
      {/* Top Banner Skeleton */}
      <div className="w-full h-28 rounded-3xl bg-slate-200/80 border border-slate-200" />

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="h-36 rounded-3xl bg-slate-200/70 border border-slate-200" />
        <div className="h-36 rounded-3xl bg-slate-200/70 border border-slate-200" />
        <div className="h-36 rounded-3xl bg-slate-200/70 border border-slate-200 hidden lg:block" />
      </div>

      {/* Large Content Block Skeleton */}
      <div className="w-full h-64 rounded-3xl bg-slate-200/60 border border-slate-200" />
    </div>
  );
};
