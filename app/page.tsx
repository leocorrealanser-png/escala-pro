"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

type Escala = {
  id: string
  data: string
  cenario_id: string
  cenarios?:
    | {
        id: string
        numero: number
        faturamento?: number | null
        faturamento_esperado?: number | null
        total_pessoas: number
      }
    | {
        id: string
        numero: number
        faturamento?: number | null
        faturamento_esperado?: number | null
        total_pessoas: number
      }[]
    | null
}

type Ausencia = {
  id: string
  fixo_id?: string | null
  data: string
}

type EscalaFreelancer = {
  id: string
  escala_id: string
  freelancer_id?: string | null
}

type RelatorioItem = {
  id: string
  data: string
  cenario: number | string
  fixosDisponiveis: number
  freelancersEscalados: number
  freelancersFaltando: number
}

function formatDateToISO(date: Date) {
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

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—"

  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

function getCenario(
  cenarios: Escala["cenarios"] | undefined | null
): {
  id: string
  numero: number
  faturamento?: number | null
  faturamento_esperado?: number | null
  total_pessoas: number
} | null {
  if (!cenarios) return null
  return Array.isArray(cenarios) ? cenarios[0] ?? null : cenarios
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")

  const [fixosAtivos, setFixosAtivos] = useState(0)
  const [freelancersAtivos, setFreelancersAtivos] = useState(0)
  const [candidatosTotal, setCandidatosTotal] = useState(0)
  const [escalasTotal, setEscalasTotal] = useState(0)

  const [escalaFreelancers, setEscalaFreelancers] = useState<
    EscalaFreelancer[]
  >([])
  const [escalasSemana, setEscalasSemana] = useState<Escala[]>([])
  const [escalasHoje, setEscalasHoje] = useState<Escala[]>([])
  const [ausenciasHoje, setAusenciasHoje] = useState<Ausencia[]>([])
  const [ausenciasSemana, setAusenciasSemana] = useState<Ausencia[]>([])

  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [relatorio, setRelatorio] = useState<RelatorioItem[]>([])
  const [carregandoRelatorio, setCarregandoRelatorio] = useState(false)
  const [erroRelatorio, setErroRelatorio] = useState("")

  async function carregarDados(mostrarLoading = false) {
    try {
      if (mostrarLoading) setLoading(true)
      setErro("")

      const hoje = new Date()
      const hojeISO = formatDateToISO(hoje)

      const fimSemana = new Date()
      fimSemana.setDate(hoje.getDate() + 7)
      const fimSemanaISO = formatDateToISO(fimSemana)

      const [
        fixosResponse,
        freelancersResponse,
        candidatosResponse,
        escalasCountResponse,
        escalasSemanaResponse,
        escalasHojeResponse,
        ausenciasHojeResponse,
        ausenciasSemanaResponse,
        escalaFreelancersResponse,
      ] = await Promise.all([
        supabase
          .from("fixos")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true),

        supabase
          .from("freelancers")
          .select("id", { count: "exact", head: true })
          .eq("ativo", true),

        supabase
          .from("candidatos")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("escalas")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("escalas")
          .select(`
            id,
            data,
            cenario_id,
            cenarios (
              id,
              numero,
              faturamento,
              faturamento_esperado,
              total_pessoas
            )
          `)
          .gte("data", hojeISO)
          .lte("data", fimSemanaISO)
          .order("data", { ascending: true }),

        supabase
          .from("escalas")
          .select(`
            id,
            data,
            cenario_id,
            cenarios (
              id,
              numero,
              faturamento,
              faturamento_esperado,
              total_pessoas
            )
          `)
          .eq("data", hojeISO)
          .order("data", { ascending: true }),

        supabase
          .from("ausencias_fixos")
          .select("id, fixo_id, data")
          .eq("data", hojeISO),

        supabase
          .from("ausencias_fixos")
          .select("id, fixo_id, data")
          .gte("data", hojeISO)
          .lte("data", fimSemanaISO),

        supabase
          .from("escala_freelancers")
          .select("id, escala_id, freelancer_id"),
      ])

      if (fixosResponse.error) throw fixosResponse.error
      if (freelancersResponse.error) throw freelancersResponse.error
      if (candidatosResponse.error) throw candidatosResponse.error
      if (escalasCountResponse.error) throw escalasCountResponse.error
      if (escalasSemanaResponse.error) throw escalasSemanaResponse.error
      if (escalasHojeResponse.error) throw escalasHojeResponse.error
      if (ausenciasHojeResponse.error) throw ausenciasHojeResponse.error
      if (ausenciasSemanaResponse.error) throw ausenciasSemanaResponse.error
      if (escalaFreelancersResponse.error) throw escalaFreelancersResponse.error

      setFixosAtivos(fixosResponse.count || 0)
      setFreelancersAtivos(freelancersResponse.count || 0)
      setCandidatosTotal(candidatosResponse.count || 0)
      setEscalasTotal(escalasCountResponse.count || 0)

      setEscalasSemana(
        (escalasSemanaResponse.data || []) as unknown as Escala[]
      )
      setEscalasHoje((escalasHojeResponse.data || []) as unknown as Escala[])
      setAusenciasHoje(
        (ausenciasHojeResponse.data || []) as unknown as Ausencia[]
      )
      setAusenciasSemana(
        (ausenciasSemanaResponse.data || []) as unknown as Ausencia[]
      )
      setEscalaFreelancers(
        (escalaFreelancersResponse.data || []) as unknown as EscalaFreelancer[]
      )
    } catch (error: any) {
      console.error(error)
      setErro(error?.message || "Erro ao carregar dashboard.")
    } finally {
      if (mostrarLoading) setLoading(false)
    }
  }

  async function gerarRelatorio() {
    if (!dataInicio || !dataFim) {
      setErroRelatorio("Selecione a data inicial e a data final.")
      setRelatorio([])
      return
    }

    if (dataFim < dataInicio) {
      setErroRelatorio("A data final não pode ser menor que a data inicial.")
      setRelatorio([])
      return
    }

    setCarregandoRelatorio(true)
    setErroRelatorio("")

    try {
      const { data: escalasPeriodo, error } = await supabase
        .from("escalas")
        .select(`
          id,
          data,
          cenario_id,
          cenarios (
            id,
            numero,
            faturamento,
            faturamento_esperado,
            total_pessoas
          )
        `)
        .gte("data", dataInicio)
        .lte("data", dataFim)
        .order("data", { ascending: true })

      if (error) throw error

      const datasUnicas = Array.from(
        new Set((escalasPeriodo || []).map((escala: any) => escala.data))
      )

      let ausenciasPeriodo: Ausencia[] = []

      if (datasUnicas.length > 0) {
        const { data: ausenciasData, error: ausenciasError } = await supabase
          .from("ausencias_fixos")
          .select("id, fixo_id, data")
          .gte("data", dataInicio)
          .lte("data", dataFim)

        if (ausenciasError) throw ausenciasError

        ausenciasPeriodo = (ausenciasData || []) as Ausencia[]
      }

      const resultado: RelatorioItem[] = (escalasPeriodo || []).map(
        (escala: any) => {
          const cenario = Array.isArray(escala.cenarios)
            ? escala.cenarios[0]
            : escala.cenarios

          const totalPessoas = Number(cenario?.total_pessoas || 0)

          const ausenciasDia = ausenciasPeriodo.filter(
            (ausencia) => ausencia.data === escala.data
          ).length

          const fixosDisponiveis = Math.max(fixosAtivos - ausenciasDia, 0)

          const freelancersEscalados = escalaFreelancers.filter(
            (f) => f.escala_id === escala.id
          ).length

          const freelancersFaltando = Math.max(
            totalPessoas - fixosDisponiveis - freelancersEscalados,
            0
          )

          return {
            id: escala.id,
            data: escala.data,
            cenario: cenario?.numero ?? "—",
            fixosDisponiveis,
            freelancersEscalados,
            freelancersFaltando,
          }
        }
      )

      setRelatorio(resultado)
    } catch (error: any) {
      console.error(error)
      setErroRelatorio(error?.message || "Erro ao gerar relatório.")
      setRelatorio([])
    } finally {
      setCarregandoRelatorio(false)
    }
  }

  function excluirRelatorio() {
    setRelatorio([])
    setErroRelatorio("")
    setCarregandoRelatorio(false)
  }

  function imprimirRelatorioDashboard() {
    const elemento = document.getElementById("relatorio-dashboard-impressao")
    if (!elemento || relatorio.length === 0) return

    const janela = window.open("", "_blank", "width=1100,height=800")
    if (!janela) return

    janela.document.write(`
      <html>
        <head>
          <title>Relatório por período</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #0f172a;
            }

            h1 {
              color: #1E5AA8;
              margin-bottom: 6px;
            }

            p {
              margin-top: 0;
              margin-bottom: 20px;
              color: #475569;
              font-size: 14px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 16px;
            }

            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px;
              text-align: left;
              font-size: 14px;
            }

            th {
              background: #eff6ff;
              color: #1e3a8a;
            }

            .faltando {
              color: #dc2626;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>Relatório por período</h1>
          <p>Período: ${formatDateToBR(dataInicio)} até ${formatDateToBR(dataFim)}</p>
          ${elemento.innerHTML}
        </body>
      </html>
    `)

    janela.document.close()
    janela.focus()

    setTimeout(() => {
      janela.print()
    }, 300)
  }

  useEffect(() => {
    let timeout: NodeJS.Timeout

    carregarDados(true)

    const atualizarComDelay = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        carregarDados(false)
      }, 250)
    }

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "escalas" },
        atualizarComDelay
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "escala_freelancers" },
        atualizarComDelay
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ausencias_fixos" },
        atualizarComDelay
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [])

  const totalPessoasHoje = useMemo(() => {
    return escalasHoje.reduce((acc, escala) => {
      const cenario = getCenario(escala.cenarios)
      return acc + Number(cenario?.total_pessoas || 0)
    }, 0)
  }, [escalasHoje])

  const fixosDisponiveisHoje = useMemo(() => {
    return Math.max(fixosAtivos - ausenciasHoje.length, 0)
  }, [fixosAtivos, ausenciasHoje])

  const freelancersNecessariosHoje = useMemo(() => {
    const freelancersSelecionadosHoje = escalasHoje.reduce((acc, escala) => {
      return (
        acc +
        escalaFreelancers.filter((f) => f.escala_id === escala.id).length
      )
    }, 0)

    return Math.max(
      totalPessoasHoje - fixosDisponiveisHoje - freelancersSelecionadosHoje,
      0
    )
  }, [totalPessoasHoje, fixosDisponiveisHoje, escalasHoje, escalaFreelancers])

  const escalasSemanaComResumo = useMemo(() => {
    return escalasSemana.map((escala) => {
      const cenario = getCenario(escala.cenarios)
      const totalPessoas = Number(cenario?.total_pessoas || 0)

      const ausenciasDaEscala = ausenciasSemana.filter(
        (ausencia) => ausencia.data === escala.data
      ).length

      const fixosDisponiveis = Math.max(fixosAtivos - ausenciasDaEscala, 0)

      const freelancersEscalados = escalaFreelancers.filter(
        (item) => item.escala_id === escala.id
      ).length

      const freelancersFaltando = Math.max(
        totalPessoas - fixosDisponiveis - freelancersEscalados,
        0
      )

      return {
        ...escala,
        cenario,
        totalPessoas,
        fixosDisponiveis,
        freelancersEscalados,
        freelancersFaltando,
      }
    })
  }, [escalasSemana, ausenciasSemana, fixosAtivos, escalaFreelancers])

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        <h1 className="text-4xl font-bold text-[#1E5AA8]">Dashboard</h1>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 text-slate-800">
      <div>
        <h1 className="text-4xl font-bold text-[#1E5AA8]">Dashboard</h1>
        <p className="mt-2 text-base text-slate-700">
          Visão geral da operação do restaurante.
        </p>
      </div>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Relatório por período
        </h2>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 outline-none focus:border-[#1E5AA8]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-800 outline-none focus:border-[#1E5AA8]"
            />
          </div>

          <button
            onClick={gerarRelatorio}
            className="rounded-xl bg-[#1E5AA8] px-5 py-2.5 font-medium text-white transition hover:opacity-90"
          >
            Gerar relatório
          </button>

          {relatorio.length > 0 && (
            <>
              <button
                onClick={imprimirRelatorioDashboard}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 font-medium text-white transition hover:opacity-90"
              >
                Exportar / Imprimir
              </button>

              <button
                onClick={excluirRelatorio}
                className="rounded-xl bg-red-600 px-5 py-2.5 font-medium text-white transition hover:opacity-90"
              >
                Excluir relatório
              </button>
            </>
          )}
        </div>

        {erroRelatorio ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erroRelatorio}
          </div>
        ) : null}

        {carregandoRelatorio ? (
          <p className="mt-4 text-sm text-slate-600">Gerando relatório...</p>
        ) : null}

        {!carregandoRelatorio &&
        !erroRelatorio &&
        dataInicio &&
        dataFim &&
        relatorio.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Nenhuma escala encontrada no período selecionado.
          </p>
        ) : null}

        {relatorio.length > 0 ? (
          <div id="relatorio-dashboard-impressao" className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Cenário</th>
                  <th className="px-4 py-3 font-semibold">Fixos disponíveis</th>
                  <th className="px-4 py-3 font-semibold">
                    Freelancers escalados
                  </th>
                  <th className="px-4 py-3 font-semibold text-red-700">
                    Freelancers faltando
                  </th>
                </tr>
              </thead>
              <tbody>
                {relatorio.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      Escala dia {formatDateToBR(item.data)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.cenario}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.fixosDisponiveis}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.freelancersEscalados}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">
                      {item.freelancersFaltando}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardCard titulo="Funcionários Fixos Ativos" valor={fixosAtivos} />
        <DashboardCard titulo="Freelancers Ativos" valor={freelancersAtivos} />
        <DashboardCard titulo="Escalas Criadas" valor={escalasTotal} />
        <DashboardCard titulo="Candidatos" valor={candidatosTotal} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#1E5AA8]">
            Operação de hoje
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoBox titulo="Escalas de hoje" valor={escalasHoje.length} />
            <InfoBox
              titulo="Total de pessoas necessárias"
              valor={totalPessoasHoje}
            />
            <InfoBox
              titulo="Fixos disponíveis hoje"
              valor={fixosDisponiveisHoje}
            />
            <InfoBox
              titulo="Freelancers necessários hoje"
              valor={freelancersNecessariosHoje}
              destaque="alerta"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Ausências registradas hoje
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {ausenciasHoje.length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-[#1E5AA8]">
            Escalas da semana
          </h2>

          {escalasSemanaComResumo.length === 0 ? (
            <p className="mt-6 text-slate-600">
              Nenhuma escala criada para os próximos dias.
            </p>
          ) : (
            <div className="mt-6 space-y-3">
              {escalasSemanaComResumo.map((escala) => (
                <div
                  key={escala.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Data
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatDateToBR(escala.data)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600">
                        Cenário
                      </p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {escala.cenario?.numero ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-5">
                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Faturamento esperado
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {formatCurrency(
                          escala.cenario?.faturamento ??
                            escala.cenario?.faturamento_esperado
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Total de pessoas
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {escala.totalPessoas}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Fixos disponíveis
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {escala.fixosDisponiveis}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-600">
                        Freelancers escalados
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {escala.freelancersEscalados}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-red-700">
                        Freelancers faltando
                      </p>
                      <p className="mt-1 font-bold text-red-600">
                        {escala.freelancersFaltando}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function DashboardCard({
  titulo,
  valor,
}: {
  titulo: string
  valor: number
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{titulo}</p>
      <p className="mt-2 text-4xl font-bold text-slate-900">{valor}</p>
    </div>
  )
}

function InfoBox({
  titulo,
  valor,
  destaque,
}: {
  titulo: string
  valor: number
  destaque?: "alerta"
}) {
  const classes =
    destaque === "alerta"
      ? "border-red-200 bg-red-50 text-red-600"
      : "border-slate-200 bg-slate-50 text-slate-900"

  const tituloClasse =
    destaque === "alerta" ? "text-red-700" : "text-slate-600"

  return (
    <div className={`rounded-2xl border p-4 ${classes}`}>
      <p className={`text-sm font-medium ${tituloClasse}`}>{titulo}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
    </div>
  )
}