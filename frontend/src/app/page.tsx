import Link from "next/link"
import { ArrowRight, CheckCircle2, ListTodo, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-500 shadow-xl shadow-violet-500/20">
            <ListTodo className="h-8 w-8" />
          </div>
          
          <h1 className="bg-gradient-to-br from-white via-white to-zinc-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            Task Management,<br />Reimagined.
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            The premium collaborative to-do list for small teams. Keep your projects on track with powerful organization, real-time updates, and an elegant interface.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-base shadow-violet-500/25">
                Go to App
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-3 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
            <ListTodo className="h-10 w-10 text-violet-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-200">Smart Organization</h3>
            <p className="text-zinc-500 mt-2 text-sm">Sort, filter, and categorize tasks with ease using our advanced tagging system.</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
            <Users className="h-10 w-10 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-200">Team Collaboration</h3>
            <p className="text-zinc-500 mt-2 text-sm">Assign tasks, leave comments, and track progress together in real-time.</p>
          </div>
          <div className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-zinc-200">Goal Tracking</h3>
            <p className="text-zinc-500 mt-2 text-sm">Monitor your team's velocity and celebrate completed milestones.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
