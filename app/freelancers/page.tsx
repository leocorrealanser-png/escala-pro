"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type FreelancerCargo = {
  cargo_id: string
  cargos?: {
    id: string
    nome: string
  } | null
}

type Freelancer = {
  id: string
  nome: string
  telefone: string | null
  ativo: boolean | null
  freelancer_cargos?: FreelancerCargo[]
}

type Cargo = {
  id: string
  nome: string
}

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)

  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)

    const { data: freelancersData, error: freelancersError } = await supabase
      .from("freelancers")
      .select(`
        id,
        nome,
        telefone,
        ativo,
        freelancer_cargos (
          cargo_id,
          cargos (
            id,
            nome
          )
        )
      `)
      .order("nome")

    const { data: cargosData, error: cargosError } = await supabase
      .from("cargos")
      .select("id,nome")
      .order("nome")

    if (freelancersError) {
      console.error(freelancersError)
      alert("Erro ao carregar freelancers")
      setLoading(false)
      return
    }

    if (cargosError) {
      console.error(cargosError)
      alert("Erro ao carregar cargos")
      setLoading(false)
      return
    }

    setFreelancers((freelancersData || []) as unknown as Freelancer[])
    setCargos((cargosData || []) as Cargo[])
    setLoading(false)
  }

  function alternarCargo(cargoId: string) {
    setCargosSelecionados((prev) =>
      prev.includes(cargoId)
        ? prev.filter((id) => id !== cargoId)
        : [...prev, cargoId]
    )
  }

  async function adicionarFreelancer() {
    if (!nome.trim()) {
      alert("Informe o nome")
      return
    }

    if (cargosSelecionados.length === 0) {
      alert("Selecione pelo menos um cargo")
      return
    }

    const { data: freelancerInserido, error: freelancerError } = await supabase
      .from("freelancers")
      .insert([
        {
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          ativo: true,
        },
      ])
      .select("id")
      .single()

    if (freelancerError || !freelancerInserido) {
      console.error(freelancerError)
      alert("Erro ao adicionar freelancer")
      return
    }

    const relacoes = cargosSelecionados.map((cargoId) => ({
      freelancer_id: freelancerInserido.id,
      cargo_id: cargoId,
    }))

    const { error: cargosRelacaoError } = await supabase
      .from("freelancer_cargos")
      .insert(relacoes)

    if (cargosRelacaoError) {
      console.error(cargosRelacaoError)
      alert("Freelancer criado, mas houve erro ao salvar os cargos")
      return
    }

    setNome("")
    setTelefone("")
    setCargosSelecionados([])
    await carregarDados()
  }

  async function removerFreelancer(id: string) {
    const confirmar = window.confirm("Deseja remover este freelancer?")

    if (!confirmar) return

    const { error } = await supabase
      .from("freelancers")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(error)
      alert("Erro ao remover freelancer")
      return
    }

    await carregarDados()
  }

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-4xl font-bold text-[#1E5AA8]">Freelancers</h1>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Adicionar freelancer
        </h2>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Cargos que o freelancer pode exercer
          </p>

          {cargos.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum cargo cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {cargos.map((cargo) => {
                const selecionado = cargosSelecionados.includes(cargo.id)

                return (
                  <label
                    key={cargo.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                      selecionado
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => alternarCargo(cargo.id)}
                      className="h-4 w-4"
                    />
                    <span className="font-medium text-gray-900">
                      {cargo.nome}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <button
          onClick={adicionarFreelancer}
          className="mt-6 rounded-xl bg-[#1E5AA8] px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Adicionar freelancer
        </button>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Freelancers cadastrados
        </h2>

        {loading ? (
          <p className="mt-4 text-gray-500">Carregando...</p>
        ) : freelancers.length === 0 ? (
          <p className="mt-4 text-gray-500">Nenhum freelancer cadastrado</p>
        ) : (
          <div className="mt-6 space-y-3">
            {freelancers.map((freelancer) => {
              const nomesCargos =
                freelancer.freelancer_cargos
                  ?.map((rel) => rel.cargos?.nome)
                  .filter(Boolean)
                  .join(", ") || "Sem cargo"

              return (
                <div
                  key={freelancer.id}
                  className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {freelancer.nome}
                    </p>

                    <p className="text-sm text-gray-500">
                      {freelancer.telefone || "Sem telefone"}
                    </p>

                    <p className="text-sm text-gray-600">{nomesCargos}</p>
                  </div>

                  <button
                    onClick={() => removerFreelancer(freelancer.id)}
                    className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
                    Remover
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}