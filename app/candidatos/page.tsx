"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Candidato = {
  id: string
  nome: string
  telefone: string | null
  cargo_id: string | null
  status: string
  cargos?: {
    nome: string
  } | null
}

type Cargo = {
  id: string
  nome: string
}

export default function CandidatosPage() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cargoId, setCargoId] = useState("")

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {

    const { data: candidatosData } = await supabase
      .from("candidatos")
      .select("id,nome,telefone,cargo_id,status,cargos(nome)")
      .order("created_at", { ascending: false })

    const { data: cargosData } = await supabase
      .from("cargos")
      .select("id,nome")
      .order("nome")

    setCandidatos((candidatosData || []) as unknown as Candidato[])
    setCargos((cargosData || []) as Cargo[])

    if (cargosData && cargosData.length > 0) {
      setCargoId(cargosData[0].id)
    }
  }

  async function adicionarCandidato() {

    if (!nome) {
      alert("Informe o nome")
      return
    }

    const { error } = await supabase.from("candidatos").insert([
      {
        nome,
        telefone,
        cargo_id: cargoId,
        status: "novo",
      },
    ])

    if (error) {
      alert("Erro ao adicionar candidato")
      return
    }

    setNome("")
    setTelefone("")
    carregarDados()
  }

  async function virarFreelancer(candidato: Candidato) {

    const { error } = await supabase.from("freelancers").insert([
      {
        nome: candidato.nome,
        telefone: candidato.telefone,
        cargo_id: candidato.cargo_id,
        ativo: true,
      },
    ])

    if (error) {
      alert("Erro ao criar freelancer")
      return
    }

    await supabase
      .from("candidatos")
      .delete()
      .eq("id", candidato.id)

    carregarDados()
  }

  async function remover(id: string) {

    const confirmar = window.confirm("Remover candidato?")

    if (!confirmar) return

    await supabase
      .from("candidatos")
      .delete()
      .eq("id", id)

    carregarDados()
  }

  return (
    <div className="space-y-8 p-6">

      <h1 className="text-4xl font-bold text-[#1E5AA8]">
        Candidatos
      </h1>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">

        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Novo candidato
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
          onClick={adicionarCandidato}
          className="mt-6 rounded-xl bg-[#1E5AA8] px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Adicionar candidato
        </button>

      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">

        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Candidatos cadastrados
        </h2>

        <div className="mt-6 space-y-3">

          {candidatos.map((candidato) => (

            <div
              key={candidato.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
            >

              <div>

                <p className="font-semibold text-gray-900">
                  {candidato.nome}
                </p>

                <p className="text-sm text-gray-500">
                  {candidato.telefone || "Sem telefone"}
                </p>

                <p className="text-sm text-gray-600">
                  {candidato.cargos?.nome}
                </p>

              </div>

              <div className="flex gap-2">

                <button
                  onClick={() => virarFreelancer(candidato)}
                  className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-100"
                >
                  Aprovar
                </button>

                <button
                  onClick={() => remover(candidato.id)}
                  className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Remover
                </button>

              </div>

            </div>

          ))}

        </div>

      </section>

    </div>
  )
}