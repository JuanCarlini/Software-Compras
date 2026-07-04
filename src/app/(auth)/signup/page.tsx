import { SignupForm } from "@/views/signup-form"

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-xl">G1</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Gestión Uno</h1>
        <p className="text-slate-600">Crear una nueva cuenta</p>
      </div>
      <SignupForm />
    </div>
  )
}
