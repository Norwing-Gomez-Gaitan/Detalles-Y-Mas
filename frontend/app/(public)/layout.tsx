import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

async function getConfig() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${backendUrl}/api/public/configuracion`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return {
      nombre: "Detalles y Más",
      lema: "Hecho con amor para cada ocasión",
      whatsapp: "8485-6722",
      telefono: "8485-6722",
      instagram: "@detallesymas.ni",
      facebook: "https://www.facebook.com/Aracelly82",
      direccion_cobertura: "Managua, Nicaragua. Envíos y entregas a todo el país.",
      horario: "Lunes a Sábado: 8:00 AM - 6:00 PM",
    };
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getConfig();

  return (
    <div className="flex flex-col min-h-screen bg-crema text-chocolate">
      <Navbar whatsapp={config.whatsapp} />
      <main className="flex-1">{children}</main>
      <Footer config={config} />
    </div>
  );
}

