import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="relative z-10">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl",
              headerTitle: "text-white font-bold",
              headerSubtitle: "text-zinc-400",
              socialButtonsBlockButton: "bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 transition-colors",
              dividerLine: "bg-zinc-800",
              dividerText: "text-zinc-500",
              formFieldLabel: "text-zinc-300",
              formFieldInput: "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-violet-500 focus:border-violet-500 rounded-lg",
              formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white rounded-lg shadow-lg shadow-violet-500/20 transition-colors",
              footerActionLink: "text-violet-400 hover:text-violet-300",
              identityPreviewEditButtonIcon: "text-violet-400",
            },
          }}
        />
      </div>
    </div>
  )
}
