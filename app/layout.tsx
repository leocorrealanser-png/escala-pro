import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "EscalaPro",
  description: "Sistema de gestão de escala e freelancers",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#F8FAFC] text-[#1F2937]">
        <div className="flex min-h-screen">
          <aside className="flex w-64 flex-col bg-[#1E5AA8] text-white shadow-lg">
            <div className="border-b border-white/20 px-6 py-6">
              <h1 className="text-3xl font-extrabold tracking-tight">
                EscalaPro
              </h1>
              <p className="mt-2 text-sm text-white/80">
                Gestão de escala e freelancers
              </p>
            </div>

            <nav className="flex flex-col gap-2 p-4">
              <Link
                href="/"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Dashboard
              </Link>

              <Link
                href="/escalas"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Escalas
              </Link>

              <Link
                href="/planejamento"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Planejamento
              </Link>

              <Link
                href="/fixos"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Fixos
              </Link>

              <Link
                href="/cargos"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Cargos
              </Link>

              <Link
                href="/freelancers"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Freelancers
              </Link>

              <Link
                href="/candidatos"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Candidatos
              </Link>

              <Link
                href="/ausencias"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Ausências
              </Link>

              <Link
                href="/ajuda"
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-white/15"
              >
                Ajuda
              </Link>
            </nav>

            <div className="mt-auto p-4">
              <div className="rounded-2xl bg-[#C92A2A] px-4 py-4 text-sm shadow-md">
                <p className="font-semibold">Painel operacional</p>
                <p className="mt-1 text-white/90">
                  Controle sua equipe com rapidez.
                </p>
              </div>
            </div>
          </aside>

          <main className="flex-1 bg-[#F8FAFC] p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}