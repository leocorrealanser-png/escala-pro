"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

type Cargo = {
  id: string
  nome: string
}

export default function CargosPage() {
  const [nome, setNome] = useState("")
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(false)

  async function carregarCargos() {
    const { data, error } = await supabase
      .from("cargos")
      .select("*")
      .order("nome", { ascending: true })

    if (!error && data) {
      setCargos(data)
    }
  }

  useEffect(() => {
    carregarCargos()
  }, [])

  async function cadastrarCargo(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.from("cargos").insert([
      {
        nome,
      },
    ])

    if (!error) {
      setNome("")
      await carregarCargos()
    } else {
      alert("Erro ao cadastrar cargo.")
    }

    setLoading(false)
  }

  async function excluirCargo(id: string) {
    const { error } = await supabase.from("cargos").delete().eq("id", id)

    if (!error) {
      await carregarCargos()
    } else {
      alert("Erro ao excluir cargo.")
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-[#1E5AA8]">Cargos</h1>

      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-[#1E5AA8]">
          Cadastrar cargo
        </h2>

        <form onSubmit={cadastrarCargo} className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nome do cargo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded-xl border px-4 py-3 text-gray-800 outline-none focus:border-[#1E5AA8]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#C92A2A] px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Cadastrando..." : "Cadastrar cargo"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold text-[#1E5AA8]">
          Lista de cargos
        </h2>

        {cargos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                  <th className="py-3 pr-4">Nome</th>
                  <th className="py-3 pr-4">Ação</th>
                </tr>
              </thead>

              <tbody>
                {cargos.map((cargo) => (
                  <tr
                    key={cargo.id}
                    className="border-b border-slate-100 text-sm text-gray-800"
                  >
                    <td className="py-4 pr-4 font-semibold text-[#1E5AA8]">
                      {cargo.nome}
                    </td>
                    <td className="py-4 pr-4">
                      <button
                        onClick={() => excluirCargo(cargo.id)}
                        className="rounded-lg bg-[#C92A2A] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-700">Nenhum cargo cadastrado ainda.</p>
        )}
      </div>
    </div>
  )
}