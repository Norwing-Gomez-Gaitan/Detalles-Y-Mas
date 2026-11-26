"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  // Paso actual: "credentials" o "2fa"
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");

  // Campos
  const [email, setEmail] = useState("left4deadchele@gmail.com");
  const [password, setPassword] = useState("Hola1212");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  // Estados
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Paso 1: Enviar credenciales (correo y contraseña)
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setLoading(true);

    try {
      const res = await apiFetch("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.require2FA) {
        setStep("2fa");
        if (res.devCode) {
          setDevCode(res.devCode);
          setCode(res.devCode);
          setMensaje(`Código de prueba generado: ${res.devCode} (autocompletado). También puedes verlo en la consola del backend.`);
        } else {
          setMensaje(`Te hemos enviado un código de confirmación a ${res.email || email}. Revisa tu bandeja de entrada o spam.`);
        }
      } else if (res.token) {
        // En caso de que no requiera 2FA
        localStorage.setItem("admin_token", res.token);
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifique sus credenciales.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código recibido por correo
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch("/api/admin/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim(),
          codigo: code.trim(),
        }),
      });

      if (res.token) {
        localStorage.setItem("admin_token", res.token);
        setMensaje("¡Acceso autorizado! Redirigiendo al panel...");
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || "Código incorrecto o expirado.");
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResendCode = async () => {
    setError(null);
    setResending(true);
    try {
      const res = await apiFetch("/api/admin/auth/resend-code", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.devCode) {
        setDevCode(res.devCode);
        setCode(res.devCode);
        setMensaje(`Nuevo código de prueba generado: ${res.devCode} (autocompletado).`);
      } else {
        setMensaje(res.mensaje || "Se ha enviado un nuevo código a tu correo.");
      }
    } catch (err: any) {
      setError(err.message || "Error al reenviar el código.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-crema">
      <div className="max-w-md w-full bg-marfil rounded-artesanal shadow-xl border border-kraft p-8 space-y-6">
        {/* Logo y Encabezado */}
        <div className="text-center space-y-3">
          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-dorado shadow-sm">
            <Image
              src="/logo.png"
              alt="Detalles y Más Logo"
              fill
              sizes="80px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-borgona">
              Panel Administrativo
            </h1>
            <p className="text-xs text-cacao font-medium mt-1">
              Detalles y Más • Acceso Protegido
            </p>
          </div>
        </div>

        {/* Mensaje de Éxito / Info */}
        {mensaje && (
          <div className="p-3 bg-[#EAF3E6] border border-estado-exito/30 text-estado-exito text-xs rounded-lg flex items-start gap-2 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{mensaje}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-3 bg-rosa-soft text-estado-error text-xs rounded-lg flex items-start gap-2 border border-rosa-pastel animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === "credentials" ? (
          /* ========================================================= */
          /* PASO 1: CORREO Y CONTRASEÑA                                */
          /* ========================================================= */
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-chocolate uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="left4deadchele@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-crema/40 border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona focus:border-borgona outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-chocolate uppercase tracking-wider mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cacao absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-crema/40 border border-kraft rounded-lg text-sm text-chocolate focus:ring-2 focus:ring-borgona focus:border-borgona outline-none transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-borgona hover:bg-borgona-dark text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center text-xs text-cacao/70 border-t border-kraft/40 pt-4">
              Usuario admin configurado:{" "}
              <span className="font-semibold text-chocolate">
                left4deadchele@gmail.com
              </span>
            </div>
          </form>
        ) : (
          /* ========================================================= */
          /* PASO 2: CÓDIGO DE CONFIRMACIÓN POR CORREO (2FA)           */
          /* ========================================================= */
          <form onSubmit={handleVerifyCodeSubmit} className="space-y-5 animate-fadeIn">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-rosa-soft border border-rosa-pastel text-borgona mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-lg font-bold text-chocolate">
                Código de Confirmación
              </h2>
              <p className="text-xs text-cacao">
                Ingresa el código de 6 dígitos que enviamos a:
                <br />
                <strong className="text-chocolate font-medium">{email}</strong>
              </p>
            </div>

            {devCode && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1 text-borgona">
                  <span>💡 Código de prueba: {devCode}</span>
                </div>
                <p className="text-[11px] text-cacao leading-relaxed">
                  (SMTP no configurado en backend/.env. Puedes usar este código directamente para ingresar. Para recibir correos reales en tu Gmail, configura tu Contraseña de Aplicación en backend/.env).
                </p>
              </div>
            )}

            <div>
              <input
                type="text"
                required
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="w-full text-center py-3 text-2xl font-mono font-bold tracking-[0.5em] bg-crema/60 border-2 border-borgona/40 rounded-lg text-borgona focus:border-borgona focus:ring-2 focus:ring-borgona/20 outline-none transition-all"
              />
              <p className="text-[11px] text-cacao text-center mt-1">
                El código expirará en 15 minutos.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length < 4}
              className="w-full bg-borgona hover:bg-borgona-dark text-white font-bold py-3 rounded-lg shadow-md transition-all active:scale-98 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando código...</span>
                </>
              ) : (
                <span>Entrar al Dashboard</span>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-kraft/40">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setCode("");
                  setError(null);
                  setMensaje(null);
                }}
                className="flex items-center gap-1 text-cacao hover:text-chocolate font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="flex items-center gap-1 text-borgona hover:underline font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                <span>Reenviar código</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
