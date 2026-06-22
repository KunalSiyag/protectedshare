import { checkPasswordStrength } from "../lib/password";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

export function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, color, suggestions } = checkPasswordStrength(password);

  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          {score >= 3 ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : score >= 2 ? (
            <Shield className="h-3.5 w-3.5 text-yellow-500" />
          ) : (
            <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
          )}
          <span>Password Strength:</span>
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider text-white ${color}`}
        >
          {label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map((step) => {
          const active = score >= step;
          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${
                active ? color : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          );
        })}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <ul className="text-[10px] text-zinc-500 dark:text-zinc-500 space-y-0.5 list-disc pl-3.5 leading-normal">
          {suggestions.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
