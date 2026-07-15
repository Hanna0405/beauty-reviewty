export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full max-w-full min-w-0 overflow-x-hidden bg-[#f9f1f3]">
      <div className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6">{children}</div>
    </div>
  );
}
