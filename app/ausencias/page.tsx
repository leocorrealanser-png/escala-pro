"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Fixo = {
  id: string
  nome: string
  cargo_id?: string | null
  cargos?: {
    id: string
    nome: string
  } | null
}

type Ausencia = {
  id: string
  data: string
  motivo: string
  fixo_id?: string | null
  fixos?: {
    id: string
    nome: string
    cargos?: {
      nome: string
    } | null
  } | null
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

export default function AusenciasPage() {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")

  const [fixos, setFixos] = useState<Fixo[]>([])
  const [ausencias, setAusencias] = useState<Ausencia[]>([])

  const [data, setData] = useState(formatDateToInput(new Date()))
  const [fixoId, setFixoId] = useState("")
  const [motivo, setMotivo] = useState("Folga")

  async function carregarDados() {
    try {
      setLoading(true)
      setErro("")

      const [fixosResponse, ausenciasResponse] = await Promise.all([
        supabase
          .from("fixos")
          .select("id, nome, cargo_id, cargos(id, nome)")
          .order("nome", { ascending: true }),

        supabase
          .from("ausencias_fixos")
          .select(`
            id,
            data,
            motivo,
            fixo_id,
            fixos (
              id,
              nome,
              cargos (
                nome
              )
            )
          `)
          .order("data", { ascending: false }),
      ])

      if (fixosResponse.error) throw fixosResponse.error
      if (ausenciasResponse.error) throw ausenciasResponse.error

      const fixosData = (fixosResponse.data || []) as any
      const ausenciasData = (ausenciasResponse.data || []) as any

      setFixos(fixosData)
      setAusencias(ausenciasData)

      if (fixosData.length > 0 && !fixoId) {
        setFixoId(fixosData[0].id)
      }
    } catch (error: any) {
      console.error(error)
      setErro(error?.message || "Erro ao carregar ausências.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  async function salvarAusencia() {
    try {
      setSalvando(true)
      setErro("")
      setSucesso("")

      if (!data || !fixoId || !motivo) {
        setErro("Preencha data, funcionário e motivo.")
        return
      }

      const { error } = await supabase.from("ausencias_fixos").insert([
        {
          data,
          fixo_id: fixoId,
          motivo,
        },
      ])

      if (error) throw error

      setSucesso("Ausência cadastrada com sucesso.")
      await carregarDados()
    } catch (error: any) {
      console.error(error)
      setErro(error?.message || "Erro ao salvar ausência.")
    } finally {
      setSalvando(false)
    }
  }

  async function excluirAusencia(id: string) {
    const confirmou = window.confirm("Deseja excluir esta ausência?")
    if (!confirmou) return

    try {
      setErro("")
      setSucesso("")

      const { error } = await supabase
        .from("ausencias_fixos")
        .delete()
        .eq("id", id)

      if (error) throw error

      setSucesso("Ausência excluída com sucesso.")
      await carregarDados()
    } catch (error: any) {
      console.error(error)
      setErro(error?.message || "Erro ao excluir ausência.")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-4xl font-bold text-blue-700">Ausências</h1>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">Carregando ausências...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 text-slate-800">
      <div>
        <h1 className="text-4xl font-bold text-blue-700">Ausências</h1>
        <p className="mt-2 text-base text-slate-700">
          Cadastre faltas, folgas, férias e afastamentos dos funcionários fixos.
        </p>
      </div>

      {erro ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      ) : null}

      {sucesso ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {sucesso}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-blue-700">Cadastrar ausência</h2>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Data
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Funcionário fixo
            </label>
            <select
              value={fixoId}
              onChange={(e) => setFixoId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            >
              {fixos.map((fixo) => (
                <option key={fixo.id} value={fixo.id}>
                  {fixo.nome} {fixo.cargos?.nome ? `— ${fixo.cargos.nome}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Motivo
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500"
            >
              <option value="Folga">Folga</option>
              <option value="Falta">Falta</option>
              <option value="Férias">Férias</option>
              <option value="Afastamento">Afastamento</option>
            </select>
          </div>
        </div>

        <button
          onClick={salvarAusencia}
          disabled={salvando}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {salvando ? "Salvando..." : "Salvar ausência"}
        </button>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold text-blue-700">Ausências cadastradas</h2>

          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {ausencias.length} registros
          </span>
        </div>

        {ausencias.length === 0 ? (
          <p className="text-slate-600">Nenhuma ausência cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Data
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Funcionário
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Cargo
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Motivo
                  </th>
                  <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white">
                {ausencias.map((ausencia) => (
                  <tr key={ausencia.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-800">
                      {formatDateToBR(ausencia.data)}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900">
                      {ausencia.fixos?.nome || "—"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                      {ausencia.fixos?.cargos?.nome || "—"}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">
                      {ausencia.motivo}
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3 text-sm">
                      <button
                        onClick={() => excluirAusencia(ausencia.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 font-medium text-red-600 transition hover:bg-red-100"
                      >
                        Excluir
                      </button>
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