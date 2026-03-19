"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Cenario = {
  id: string
  numero: number
  faturamento: number | null
  faturamento_esperado?: number | null
  total_pessoas: number
}

type CargoResumo = {
  cargo: string
  necessario: number
  fixos: number
  freelancers: number
}

type CenarioCargo = {
  id: string
  cenario_id: string
  cargo_id?: string | null
  quantidade: number
  cargos?: {
    id: string
    nome: string
  } | null
}

type PessoaFixa = {
  id: string
  cargo_id?: string | null
  cargos?: {
    id: string
    nome: string
  } | null
}

type Ausencia = {
  id: string
  fixo_id?: string | null
  data: string
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—"

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function formatDateToInput(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateToBR(dateString: string) {
  if (!dateString) return "—"

  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

export default function PlanejamentoPage() {
  const [loading, setLoading] = useState(true)
  const [cenarios, setCenarios] = useState<Cenario[]>([])
  const [cenariosCargo, setCenariosCargo] = useState<CenarioCargo[]>([])
  const [pessoasFixas, setPessoasFixas] = useState<PessoaFixa[]>([])
  const [ausencias, setAusencias] = useState<Ausencia[]>([])

  const [dataSelecionada, setDataSelecionada] = useState(formatDateToInput(new Date()))
  const [cenarioSelecionadoId, setCenarioSelecionadoId] = useState("")
  const [erro, setErro] = useState("")
  async function gerarEscala() {
    if (!cenarioSelecionadoId || !dataSelecionada) {
      alert("Selecione um cenário e uma data")
      return
    }

    const { error } = await supabase
      .from("escalas")
      .insert([
        {
          data: dataSelecionada,
          cenario_id: cenarioSelecionadoId,
        },
      ])

    if (error) {
      console.error(error)
      alert("Erro ao gerar escala")
      return
    }

    alert("Escala gerada com sucesso!")
  }
  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true)
        setErro("")

        const [
          cenariosResponse,
          cenariosCargoResponse,
          pessoasFixasResponse,
          ausenciasResponse,
        ] = await Promise.all([
          supabase
            .from("cenarios")
            .select("id, numero, faturamento, faturamento_esperado, total_pessoas")
            .order("numero", { ascending: true }),

          supabase
            .from("cenarios_cargos")
            .select("id, cenario_id, cargo_id, quantidade, cargos(id, nome)"),

          supabase
            .from("fixos")
            .select("id, cargo_id, cargos(id, nome)"),

          supabase
            .from("ausencias_fixos")
            .select("id, fixo_id, data"),
        ])

        if (cenariosResponse.error) throw cenariosResponse.error
        if (cenariosCargoResponse.error) throw cenariosCargoResponse.error
        if (pessoasFixasResponse.error) throw pessoasFixasResponse.error
        if (ausenciasResponse.error) throw ausenciasResponse.error

        const cenariosData = (cenariosResponse.data || []).map((cenario: any) => ({
          ...cenario,
          faturamento: cenario.faturamento ?? cenario.faturamento_esperado ?? null,
        })) as Cenario[]

        setCenarios(cenariosData)
        setCenariosCargo((cenariosCargoResponse.data || []) as any)
        setPessoasFixas((pessoasFixasResponse.data || []) as any)
        setAusencias((ausenciasResponse.data || []) as any)

        if (cenariosData.length > 0) {
          setCenarioSelecionadoId(String(cenariosData[0].id))
        }
      } catch (error: any) {
        console.error(error)
        setErro(error?.message || "Erro ao carregar planejamento.")
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  const cenarioSelecionado = useMemo(() => {
    return cenarios.find((cenario) => String(cenario.id) === String(cenarioSelecionadoId)) || null
  }, [cenarios, cenarioSelecionadoId])

  const ausenciasDoDia = useMemo(() => {
    return ausencias.filter((ausencia) => ausencia.data === dataSelecionada)
  }, [ausencias, dataSelecionada])

  const pessoasFixasDisponiveis = useMemo(() => {
    const idsAusentes = new Set(ausenciasDoDia.map((ausencia) => ausencia.fixo_id))
    return pessoasFixas.filter((pessoa) => !idsAusentes.has(pessoa.id))
  }, [pessoasFixas, ausenciasDoDia])

  const cargosDoCenario = useMemo(() => {
    if (!cenarioSelecionado) return []

    return cenariosCargo.filter(
      (item) => String(item.cenario_id) === String(cenarioSelecionado.id)
    )
  }, [cenariosCargo, cenarioSelecionado])

  const resumoPorCargo = useMemo<CargoResumo[]>(() => {
    const fixosPorCargo = new Map<string, number>()

    for (const pessoa of pessoasFixasDisponiveis) {
      const nomeCargo = pessoa.cargos?.nome || "Sem cargo"
      fixosPorCargo.set(nomeCargo, (fixosPorCargo.get(nomeCargo) || 0) + 1)
    }

    return cargosDoCenario.map((item) => {
      const cargo = item.cargos?.nome || "Sem cargo"
      const necessario = Number(item.quantidade || 0)
      const fixos = Number(fixosPorCargo.get(cargo) || 0)
      const freelancers = Math.max(necessario - fixos, 0)

      return {
        cargo,
        necessario,
        fixos,
        freelancers,
      }
    })
  }, [cargosDoCenario, pessoasFixasDisponiveis])

  const totalPessoas = cenarioSelecionado?.total_pessoas || 0
  const fixosDisponiveis = pessoasFixasDisponiveis.length
  const totalAusencias = ausenciasDoDia.length
  const freelancersNecessarios = Math.max(totalPessoas - fixosDisponiveis, 0)

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-4xl font-bold text-blue-700">Planejamento</h1>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">Carregando planejamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 text-slate-800">
      <div>
        <h1 className="text-4xl font-bold text-blue-700">Planejamento</h1>
        <p className="mt-2 text-base text-slate-700">
          Escolha a data e o cenário para visualizar a necessidade da operação.
        </p>
      </div>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-blue-700">Selecionar cenário</h2>
<button
  onClick={gerarEscala}
  className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition"
>
  Gerar escala do dia
</button>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data
            </label>
            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => setDataSelecionada(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cenário
            </label>
            <select
              value={cenarioSelecionadoId}
              onChange={(e) => setCenarioSelecionadoId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            >
              {cenarios.map((cenario) => (
                <option key={cenario.id} value={cenario.id}>
                  Cenário {cenario.numero}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Cenário</p>
          <h3 className="mt-2 text-4xl font-bold text-slate-900">
            {cenarioSelecionado ? cenarioSelecionado.numero : "—"}
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Faturamento esperado</p>
          <h3 className="mt-2 text-4xl font-bold text-slate-900">
            {formatCurrency(cenarioSelecionado?.faturamento)}
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Total de pessoas necessárias</p>
          <h3 className="mt-2 text-4xl font-bold text-slate-900">
            {totalPessoas}
          </h3>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-600">Freelancers necessários</p>
          <h3 className="mt-2 text-4xl font-bold text-red-600">
            {freelancersNecessarios}
          </h3>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-blue-700">Resumo do cálculo</h2>

        <div className="mt-6 space-y-3 text-base text-slate-700">
          <p>
            Data selecionada:{" "}
            <span className="font-semibold text-slate-900">
              {formatDateToBR(dataSelecionada)}
            </span>
          </p>

          <p>
            Total de pessoas do cenário:{" "}
            <span className="font-semibold text-slate-900">
              {totalPessoas}
            </span>
          </p>

          <p>
            Fixos atuais considerados:{" "}
            <span className="font-semibold text-slate-900">
              {fixosDisponiveis}
            </span>
          </p>

          <p>
            Ausências consideradas agora:{" "}
            <span className="font-semibold text-slate-900">
              {totalAusencias}
            </span>
          </p>

          <p>
            Freelancers necessários:{" "}
            <span className="font-semibold text-slate-900">
              {totalPessoas} - {fixosDisponiveis} = {freelancersNecessarios}
            </span>
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-blue-700">Necessidade por cargo</h2>

          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {resumoPorCargo.length} cargos
          </span>
        </div>

        {resumoPorCargo.length === 0 ? (
          <p className="text-slate-600">
            Nenhum cargo encontrado para o cenário selecionado.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Cargo
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Necessário
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Fixos
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Freelancers necessários
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {resumoPorCargo.map((item) => (
                  <tr key={item.cargo} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-800">
                      {item.cargo}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900">
                      {item.necessario}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                      {item.fixos}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-red-600">
                      {item.freelancers}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}