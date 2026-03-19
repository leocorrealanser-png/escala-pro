"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Fixo = {
  id: string
  nome: string
  telefone: string | null
  cargo_id: string | null
  ativo: boolean | null
  cargos?: {
    nome: string
  } | null
}

type Cargo = {
  id: string
  nome: string
}

export default function FixosPage() {
  const [fixos, setFixos] = useState<Fixo[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cargoId, setCargoId] = useState("")

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)

    const { data: fixosData } = await supabase
      .from("fixos")
      .select("id,nome,telefone,cargo_id,ativo,cargos(nome)")
      .order("nome")

    const { data: cargosData } = await supabase
      .from("cargos")
      .select("id,nome")
      .order("nome")


    setFixos((fixosData || []) as unknown as Fixo[])
    setCargos((cargosData || []) as Cargo[])

    if (cargosData && cargosData.length > 0) {
      setCargoId(cargosData[0].id)
    }

    setLoading(false)
  }

  async function adicionarFixo() {
    if (!nome) {
      alert("Informe o nome")
      return
    }

    const { error } = await supabase.from("fixos").insert([
      {
        nome,
        telefone,
        cargo_id: cargoId,
        ativo: true,
      },
    ])

    if (error) {
      alert("Erro ao adicionar funcionário")
      return
    }

    setNome("")
    setTelefone("")
    await carregarDados()
  }

  async function removerFixo(id: string) {
    const confirmar = window.confirm("Deseja remover este funcionário?")

    if (!confirmar) return

    const { error } = await supabase.from("fixos").delete().eq("id", id)

    if (error) {
      alert("Erro ao remover funcionário")
      return
    }

    await carregarDados()
  }

  return (
    <div className="space-y-8 p-6">

      <h1 className="text-4xl font-bold text-[#1E5AA8]">
        Funcionários Fixos
      </h1>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Adicionar funcionário fixo
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">

          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />

          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          />

          <select
            value={cargoId}
            onChange={(e) => setCargoId(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-500"
          >
            {cargos.map((cargo) => (
              <option key={cargo.id} value={cargo.id}>
                {cargo.nome}
              </option>
            ))}
          </select>

        </div>

        <button
          onClick={adicionarFixo}
          className="mt-6 rounded-xl bg-[#1E5AA8] px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Adicionar fixo
        </button>

      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Funcionários cadastrados
        </h2>

        {loading ? (
          <p className="mt-4 text-gray-500">Carregando...</p>
        ) : fixos.length === 0 ? (
          <p className="mt-4 text-gray-500">
            Nenhum funcionário cadastrado
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {fixos.map((fixo) => (
              <div
                key={fixo.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {fixo.nome}
                  </p>

                  <p className="text-sm text-gray-500">
                    {fixo.telefone || "Sem telefone"}
                  </p>

                  <p className="text-sm text-gray-600">
                    {fixo.cargos?.nome || "Sem cargo"}
                  </p>
                </div>

                <button
                  onClick={() => removerFixo(fixo.id)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}