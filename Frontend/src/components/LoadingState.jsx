import { LoaderCircle, Wallet } from "lucide-react";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-neutral-800 ${className}`} />
);

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-[#0a0a0a]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
          <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-neutral-300">
          <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600" />
          Preparing your workspace...
        </div>
      </div>
    </div>
  );
}

export function ButtonLoadingLabel({ children }) {
  return <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />{children}</span>;
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] p-4 md:p-6" aria-label="Loading dashboard" role="status">
      <span className="sr-only">Loading dashboard</span>
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2"><Skeleton className="h-6 w-44" /><Skeleton className="h-3 w-60" /></div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#0a0a0a]"><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-7 w-32" /></div>)}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2].map((item) => <div key={item} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#0a0a0a]"><Skeleton className="h-4 w-36" /><Skeleton className="mt-5 h-56 w-full" /></div>)}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-[#0a0a0a]"><Skeleton className="h-4 w-36" /><div className="mt-5 space-y-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-10 w-full" />)}</div></div>
        </div>
        <div className="space-y-5 xl:col-span-4"><Skeleton className="h-40 w-full" />{[1, 2].map((item) => <Skeleton key={item} className="h-36 w-full" />)}</div>
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 4 }) {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8" aria-label="Loading page" role="status">
      <span className="sr-only">Loading content</span>
      <Skeleton className="h-7 w-52" /><Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#0a0a0a]">
        <Skeleton className="h-10 w-full" />
        <div className="mt-5 space-y-4">{Array.from({ length: rows }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div>
      </div>
    </div>
  );
}
