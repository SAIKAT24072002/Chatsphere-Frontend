import { useNavigate } from "react-router-dom";

export default function ErrorPage({ code = 404, message = "Page Not Found", description = "The page you are looking for does not exist or has been moved." }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-800/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center card p-8 border border-surface-800/60 shadow-2xl shadow-brand-500/5">
        <div className="w-16 h-16 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 shadow-inner animate-pulse">
          {code}
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{message}</h1>
        <p className="text-slate-400 text-sm mb-8">{description}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost px-5 py-2.5 border border-surface-800 text-xs font-semibold rounded-xl"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-xl shadow-lg shadow-brand-600/25"
          >
            Home
          </button>
        </div>
      </div>
    </div>
  );
}
