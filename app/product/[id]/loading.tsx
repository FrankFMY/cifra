export default function Loading() {
  return (
    <div className="bg-black min-h-screen flex flex-col items-center p-4 sm:p-8 animate-pulse">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="space-y-6">
          <div className="aspect-4/3 rounded-2xl bg-zinc-900 border border-zinc-800"></div>
        </div>
        
        <div className="space-y-6">
          <div className="h-8 w-3/4 bg-zinc-900 rounded"></div>
          <div className="h-4 w-full bg-zinc-900 rounded"></div>
          <div className="h-4 w-5/6 bg-zinc-900 rounded"></div>
          <div className="h-10 w-32 bg-zinc-900 rounded mt-8"></div>
        </div>
      </div>
    </div>
  );
}

