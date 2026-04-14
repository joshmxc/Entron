import LoginForm from "./LoginForm";

export const metadata = { title: "Login — Entron" };

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-entron-dark px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-entron-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Entron</h1>
          <p className="text-slate-400 mt-1 text-sm">Event Guest Management</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
