"use client"
 
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { toPng } from "html-to-image"
 
type Escala = {
  id: string
  data: string
  cenario_id: string
  created_at?: string
  cenarios?: {
    id: string
    numero: number
    faturamento?: number | null
    faturamento_esperado?: number | null
    total_pessoas: number
  } | null
}
 
type Cenario = {
  id: string
  numero: number
  faturamento?: number | null
  faturamento_esperado?: number | null
  total_pessoas: number
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
 
type FixoCargo = {
  cargo_id: string
  cargos?: {
    id: string
    nome: string
  } | null
}
 
type PessoaFixa = {
  id: string
  nome?: string | null
  telefone?: string | null
  ativo?: boolean | null
  fixo_cargos?: FixoCargo[]
}
 
type Ausencia = {
  id: string
  fixo_id?: string | null
  data_inicio: string
  data_fim: string
}
 
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
  ativo?: boolean | null
  freelancer_cargos?: FreelancerCargo[]
}
 
type EscalaFixo = {
  id: string
  escala_id: string
  fixo_id: string
  cargo_id?: string | null
  horario_entrada?: string | null
  horario_inicio_intervalo?: string | null
  horario_fim_intervalo?: string | null
  horario_saida?: string | null
  fixos?: {
    id: string
    nome?: string | null
    telefone?: string | null
    fixo_cargos?: FixoCargo[]
  } | null
}
 
type EscalaFreelancer = {
  id: string
  escala_id: string
  freelancer_id: string
  cargo_id?: string | null
  horario_entrada?: string | null
  horario_inicio_intervalo?: string | null
  horario_fim_intervalo?: string | null
  horario_saida?: string | null
  freelancers?: {
    id: string
    nome: string
    telefone: string | null
    freelancer_cargos?: FreelancerCargo[]
  } | null
}
 
type CargoResumo = {
  cargo: string
  cargoId: string | null
  necessario: number
  fixosSelecionados: number
  freelancersSelecionados: number
  totalSelecionado: number
  faltando: number
}
 
type RelatorioItem = {
  nome: string
  tipo: "Fixo" | "Freelancer"
  cargo: string
  entrada?: string | null
  inicioIntervalo?: string | null
  fimIntervalo?: string | null
  saida?: string | null
}
 
function formatDateToBR(dateString: string) {
  if (!dateString) return "-"
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}
 
function formatDateWithWeekday(dateString: string) {
  if (!dateString) return "-"
 
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)
 
  const texto = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
 
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
 
function formatWeekdayOnly(dateString: string) {
  if (!dateString) return "-"
 
  const [year, month, day] = dateString.split("-").map(Number)
  const date = new Date(year, month - 1, day)
 
  const texto = date.toLocaleDateString("pt-BR", {
    weekday: "long",
  })
 
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
 
function formatCurrency(value: number | null | undefined) {
  if (value == null) return "-"
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}
 
function formatHorario(value?: string | null) {
  if (!value) return "-"
  return value.slice(0, 5)
}
 
function normalizarHorario(valor: string | null, obrigatorio = true) {
  if (!valor) {
    return obrigatorio ? null : null
  }
 
  const limpo = valor.trim().replaceAll('"', "").replaceAll("'", "")
 
  if (!limpo) {
    return obrigatorio ? null : null
  }
 
  if (/^\d{1,2}$/.test(limpo)) {
    return `${limpo.padStart(2, "0")}:00`
  }
 
  if (/^\d{1,2}:\d{2}$/.test(limpo)) {
    const [hora, minuto] = limpo.split(":")
    return `${hora.padStart(2, "0")}:${minuto}`
  }
 
  return null
}
 
export default function EscalasPage() {
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState("")
  const [sucesso, setSucesso] = useState("")
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false)
 
  const [escalas, setEscalas] = useState<Escala[]>([])
  const [cenarios, setCenarios] = useState<Cenario[]>([])
  const [escalaSelecionadaId, setEscalaSelecionadaId] = useState("")
 
  const [cenariosCargo, setCenariosCargo] = useState<CenarioCargo[]>([])
  const [pessoasFixas, setPessoasFixas] = useState<PessoaFixa[]>([])
  const [ausencias, setAusencias] = useState<Ausencia[]>([])
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [escalaFixos, setEscalaFixos] = useState<EscalaFixo[]>([])
  const [escalaFreelancers, setEscalaFreelancers] = useState<EscalaFreelancer[]>([])
 
  useEffect(() => {
    carregarDados()
  }, [])
 
  async function carregarDados() {
    try {
      setLoading(true)
      setErro("")
      setSucesso("")
 
      const [
        escalasResponse,
        cenariosResponse,
        cenariosCargoResponse,
        pessoasFixasResponse,
        ausenciasResponse,
        freelancersResponse,
        escalaFixosResponse,
        escalaFreelancersResponse,
      ] = await Promise.all([
        supabase
          .from("escalas")
          .select(`
            id,
            data,
            cenario_id,
            created_at,
            cenarios (
              id,
              numero,
              faturamento,
              faturamento_esperado,
              total_pessoas
            )
          `)
          .order("data", { ascending: false }),
 
        supabase
          .from("cenarios")
          .select("id, numero, faturamento, faturamento_esperado, total_pessoas")
          .order("numero", { ascending: true }),
 
        supabase
          .from("cenarios_cargos")
          .select("id, cenario_id, cargo_id, quantidade, cargos(id, nome)"),
 
        supabase
          .from("fixos")
          .select(`
            id,
            nome,
            telefone,
            ativo,
            fixo_cargos (
              cargo_id,
              cargos (
                id,
                nome
              )
            )
          `)
          .eq("ativo", true)
          .order("nome", { ascending: true }),
 
        supabase
          .from("ausencias_fixos")
          .select("id, fixo_id, data_inicio, data_fim"),
 
        supabase
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
          .eq("ativo", true)
          .order("nome", { ascending: true }),
 
        supabase
          .from("escala_fixos")
          .select(`
            id,
            escala_id,
            fixo_id,
            cargo_id,
            horario_entrada,
            horario_inicio_intervalo,
            horario_fim_intervalo,
            horario_saida,
            fixos (
              id,
              nome,
              telefone,
              fixo_cargos (
                cargo_id,
                cargos (
                  id,
                  nome
                )
              )
            )
          `),
 
        supabase
          .from("escala_freelancers")
          .select(`
            id,
            escala_id,
            freelancer_id,
            cargo_id,
            horario_entrada,
            horario_inicio_intervalo,
            horario_fim_intervalo,
            horario_saida,
            freelancers (
              id,
              nome,
              telefone,
              freelancer_cargos (
                cargo_id,
                cargos (
                  id,
                  nome
                )
              )
            )
          `),
      ])
 
      if (escalasResponse.error) throw escalasResponse.error
      if (cenariosResponse.error) throw cenariosResponse.error
      if (cenariosCargoResponse.error) throw cenariosCargoResponse.error
      if (pessoasFixasResponse.error) throw pessoasFixasResponse.error
      if (ausenciasResponse.error) throw ausenciasResponse.error
      if (freelancersResponse.error) throw freelancersResponse.error
      if (escalaFixosResponse.error) throw escalaFixosResponse.error
      if (escalaFreelancersResponse.error) throw escalaFreelancersResponse.error
 
      const escalasData = (escalasResponse.data || []) as unknown as Escala[]
 
      setEscalas(escalasData)
      setCenarios((cenariosResponse.data || []) as unknown as Cenario[])
      setCenariosCargo((cenariosCargoResponse.data || []) as unknown as CenarioCargo[])
      setPessoasFixas((pessoasFixasResponse.data || []) as unknown as PessoaFixa[])
      setAusencias((ausenciasResponse.data || []) as unknown as Ausencia[])
      setFreelancers((freelancersResponse.data || []) as unknown as Freelancer[])
      setEscalaFixos((escalaFixosResponse.data || []) as unknown as EscalaFixo[])
      setEscalaFreelancers((escalaFreelancersResponse.data || []) as unknown as EscalaFreelancer[])
 
      if (escalasData.length > 0) {
        setEscalaSelecionadaId((atual) => {
          const escalaAindaExiste = escalasData.some((item) => item.id === atual)
          if (escalaAindaExiste) return atual
          return escalasData[0].id
        })
      } else {
        setEscalaSelecionadaId("")
      }
    } catch (error: any) {
      console.error(error)
      setErro(error?.message || "Erro ao carregar escalas.")
    } finally {
      setLoading(false)
    }
  }
 
  async function excluirEscala(id: string) {
    const confirmar = window.confirm("Deseja realmente excluir esta escala?")
    if (!confirmar) return
 
    const { error } = await supabase.from("escalas").delete().eq("id", id)
 
    if (error) {
      console.error(error)
      alert("Erro ao excluir escala")
      return
    }
 
    if (escalaSelecionadaId === id) {
      setEscalaSelecionadaId("")
      setMostrarRelatorio(false)
    }
 
    await carregarDados()
  }
 
  async function alterarCenarioDaEscala(
    escalaId: string,
    cenarioAtualId: string,
    novoCenarioId: string
  ) {
    if (!novoCenarioId || novoCenarioId === cenarioAtualId) return
 
    const confirmar = window.confirm(
      "Ao alterar o cenário, os fixos e freelancers já selecionados nesta escala serão removidos para evitar inconsistências. Deseja continuar?"
    )
 
    if (!confirmar) return
 
    const { error: deleteFixosError } = await supabase
      .from("escala_fixos")
      .delete()
      .eq("escala_id", escalaId)
 
    if (deleteFixosError) {
      console.error(deleteFixosError)
      alert("Erro ao limpar fixos da escala")
      return
    }
 
    const { error: deleteFreelancersError } = await supabase
      .from("escala_freelancers")
      .delete()
      .eq("escala_id", escalaId)
 
    if (deleteFreelancersError) {
      console.error(deleteFreelancersError)
      alert("Erro ao limpar freelancers da escala")
      return
    }
 
    const { error: updateError } = await supabase
      .from("escalas")
      .update({ cenario_id: novoCenarioId })
      .eq("id", escalaId)
 
    if (updateError) {
      console.error(updateError)
      alert("Erro ao alterar cenário da escala")
      return
    }
 
    setSucesso("Cenário da escala alterado com sucesso.")
    setMostrarRelatorio(false)
    await carregarDados()
  }
 
  async function adicionarFixoNaEscala(
    escalaId: string,
    fixoId: string,
    cargoId: string | null
  ) {
    const jaExiste = escalaFixos.some(
      (item) => item.escala_id === escalaId && item.fixo_id === fixoId
    )
 
    if (jaExiste) {
      alert("Esse fixo já está nessa escala.")
      return
    }
 
    const horarioEntrada = window.prompt("Horário de entrada do fixo (ex: 18:00)")
    if (!horarioEntrada) return
 
    const horarioInicioIntervalo = window.prompt("Início do intervalo do fixo (opcional, ex: 20:00)")
    const horarioFimIntervalo = window.prompt("Fim do intervalo do fixo (opcional, ex: 20:30)")
 
    const horarioSaida = window.prompt("Horário de saída do fixo (ex: 23:00)")
    if (!horarioSaida) return
 
    const entradaFormatada = normalizarHorario(horarioEntrada)
    const inicioIntervaloFormatado = normalizarHorario(horarioInicioIntervalo, false)
    const fimIntervaloFormatado = normalizarHorario(horarioFimIntervalo, false)
    const saidaFormatada = normalizarHorario(horarioSaida)
 
    if (!entradaFormatada || !saidaFormatada) {
      alert("Informe entrada e saída em formato válido. Exemplo: 18:00")
      return
    }
 
    if ((horarioInicioIntervalo && !inicioIntervaloFormatado) || (horarioFimIntervalo && !fimIntervaloFormatado)) {
      alert("Informe o intervalo em formato válido. Exemplo: 20:00")
      return
    }
 
    const fixoCompleto = pessoasFixas.find((item) => item.id === fixoId) || null
 
    const { data, error } = await supabase
      .from("escala_fixos")
      .insert([
        {
          escala_id: escalaId,
          fixo_id: fixoId,
          cargo_id: cargoId,
          horario_entrada: entradaFormatada,
          horario_inicio_intervalo: inicioIntervaloFormatado,
          horario_fim_intervalo: fimIntervaloFormatado,
          horario_saida: saidaFormatada,
        },
      ])
      .select("id, escala_id, fixo_id, cargo_id, horario_entrada, horario_inicio_intervalo, horario_fim_intervalo, horario_saida")
      .single()
 
    if (error) {
      alert(JSON.stringify(error, null, 2))
      console.error("Erro real ao adicionar fixo:", error)
      return
    }
 
    const novoItem: EscalaFixo = {
      id: data.id,
      escala_id: data.escala_id,
      fixo_id: data.fixo_id,
      cargo_id: data.cargo_id,
      horario_entrada: data.horario_entrada,
      horario_inicio_intervalo: data.horario_inicio_intervalo,
      horario_fim_intervalo: data.horario_fim_intervalo,
      horario_saida: data.horario_saida,
      fixos: fixoCompleto
        ? {
            id: fixoCompleto.id,
            nome: fixoCompleto.nome,
            telefone: fixoCompleto.telefone,
            fixo_cargos: fixoCompleto.fixo_cargos,
          }
        : null,
    }
 
    setEscalaFixos((prev) => [...prev, novoItem])
    setSucesso("Fixo adicionado à escala com horário de entrada e saída.")
  }
 
  async function removerFixoDaEscala(id: string) {
    const confirmar = window.confirm("Remover fixo da escala?")
    if (!confirmar) return
 
    const { error } = await supabase
      .from("escala_fixos")
      .delete()
      .eq("id", id)
 
    if (error) {
      console.error(error)
      alert("Erro ao remover fixo da escala")
      return
    }
 
    setEscalaFixos((prev) => prev.filter((item) => item.id !== id))
    setSucesso("Fixo removido da escala com sucesso.")
  }
 
  async function adicionarFreelancerNaEscala(
    escalaId: string,
    freelancerId: string,
    cargoId: string | null
  ) {
    const jaExiste = escalaFreelancers.some(
      (item) => item.escala_id === escalaId && item.freelancer_id === freelancerId
    )
 
    if (jaExiste) {
      alert("Esse freelancer já está nessa escala.")
      return
    }
 
    const horarioEntrada = window.prompt("Horário de entrada do freelancer (ex: 18:00)")
    if (!horarioEntrada) return
 
    const horarioInicioIntervalo = window.prompt("Início do intervalo do freelancer (opcional, ex: 20:00)")
    const horarioFimIntervalo = window.prompt("Fim do intervalo do freelancer (opcional, ex: 20:30)")
 
    const horarioSaida = window.prompt("Horário de saída do freelancer (ex: 23:00)")
    if (!horarioSaida) return
 
    const entradaFormatada = normalizarHorario(horarioEntrada)
    const inicioIntervaloFormatado = normalizarHorario(horarioInicioIntervalo, false)
    const fimIntervaloFormatado = normalizarHorario(horarioFimIntervalo, false)
    const saidaFormatada = normalizarHorario(horarioSaida)
 
    if (!entradaFormatada || !saidaFormatada) {
      alert("Informe entrada e saída em formato válido. Exemplo: 18:00")
      return
    }
 
    if ((horarioInicioIntervalo && !inicioIntervaloFormatado) || (horarioFimIntervalo && !fimIntervaloFormatado)) {
      alert("Informe o intervalo em formato válido. Exemplo: 20:00")
      return
    }
 
    const freelancerCompleto = freelancers.find((item) => item.id === freelancerId) || null
 
    const { data, error } = await supabase
      .from("escala_freelancers")
      .insert([
        {
          escala_id: escalaId,
          freelancer_id: freelancerId,
          cargo_id: cargoId,
          horario_entrada: entradaFormatada,
          horario_inicio_intervalo: inicioIntervaloFormatado,
          horario_fim_intervalo: fimIntervaloFormatado,
          horario_saida: saidaFormatada,
        },
      ])
      .select("id, escala_id, freelancer_id, cargo_id, horario_entrada, horario_inicio_intervalo, horario_fim_intervalo, horario_saida")
      .single()
 
    if (error) {
      alert(JSON.stringify(error, null, 2))
      console.error("Erro real ao adicionar freelancer:", error)
      return
    }
 
    const novoItem: EscalaFreelancer = {
      id: data.id,
      escala_id: data.escala_id,
      freelancer_id: data.freelancer_id,
      cargo_id: data.cargo_id,
      horario_entrada: data.horario_entrada,
      horario_inicio_intervalo: data.horario_inicio_intervalo,
      horario_fim_intervalo: data.horario_fim_intervalo,
      horario_saida: data.horario_saida,
      freelancers: freelancerCompleto
        ? {
            id: freelancerCompleto.id,
            nome: freelancerCompleto.nome,
            telefone: freelancerCompleto.telefone,
            freelancer_cargos: freelancerCompleto.freelancer_cargos,
          }
        : null,
    }
 
    setEscalaFreelancers((prev) => [...prev, novoItem])
    setSucesso("Freelancer adicionado à escala com horário de entrada e saída.")
  }
 
  async function removerFreelancerDaEscala(id: string) {
    const confirmar = window.confirm("Remover freelancer da escala?")
    if (!confirmar) return
 
    const { error } = await supabase
      .from("escala_freelancers")
      .delete()
      .eq("id", id)
 
    if (error) {
      console.error(error)
      alert("Erro ao remover freelancer da escala")
      return
    }
 
    setEscalaFreelancers((prev) => prev.filter((item) => item.id !== id))
    setSucesso("Freelancer removido da escala com sucesso.")
  }
 
  function imprimirRelatorioEscala() {
    const elemento = document.getElementById("relatorio-escala-impressao")
    if (!elemento || !escalaSelecionada) return
 
    const janela = window.open("", "_blank", "width=1000,height=700")
    if (!janela) return
 
    janela.document.write(`
      <html>
        <head>
          <title>Relatório da Escala</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #0f172a;
            }
 
            h1 {
              color: #1E5AA8;
              margin-bottom: 8px;
              font-size: 32px;
            }
 
            .data-destaque {
              margin-bottom: 4px;
              color: #0f172a;
              font-size: 28px;
              font-weight: 700;
            }
 
            .subinfo {
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
          </style>
        </head>
        <body>
          <h1>Relatório da escala</h1>
          <div class="data-destaque">${formatDateWithWeekday(escalaSelecionada.data)}</div>
          <p class="subinfo">Cenário ${escalaSelecionada.cenarios?.numero ?? "-"}</p>
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
 
  async function baixarRelatorioComoImagem() {
    const elemento = document.getElementById("relatorio-escala-impressao")
 
    if (!elemento) {
      alert("Relatório não encontrado.")
      return
    }
 
    try {
      const dataUrl = await toPng(elemento, {
        cacheBust: true,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      })
 
      const link = document.createElement("a")
      link.download = `relatorio-escala-${escalaSelecionada?.data || "escala"}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error(error)
      alert("Não foi possível gerar a imagem.")
    }
  }
 
  const escalaSelecionada = useMemo(() => {
    return escalas.find((escala) => escala.id === escalaSelecionadaId) || null
  }, [escalas, escalaSelecionadaId])
 
  const ausenciasDaEscala = useMemo(() => {
    if (!escalaSelecionada) return []
 
    return ausencias.filter((ausencia) => {
      return (
        ausencia.data_inicio <= escalaSelecionada.data &&
        ausencia.data_fim >= escalaSelecionada.data
      )
    })
  }, [ausencias, escalaSelecionada])
 
  const pessoasFixasDisponiveis = useMemo(() => {
    const idsAusentes = new Set(ausenciasDaEscala.map((ausencia) => ausencia.fixo_id))
    return pessoasFixas.filter((pessoa) => !idsAusentes.has(pessoa.id))
  }, [pessoasFixas, ausenciasDaEscala])
 
  const cargosDoCenario = useMemo(() => {
    if (!escalaSelecionada) return []
    return cenariosCargo.filter(
      (item) => String(item.cenario_id) === String(escalaSelecionada.cenario_id)
    )
  }, [cenariosCargo, escalaSelecionada])
 
  const fixosDaEscala = useMemo(() => {
    if (!escalaSelecionada) return []
    return escalaFixos.filter((item) => item.escala_id === escalaSelecionada.id)
  }, [escalaFixos, escalaSelecionada])
 
  const freelancersDaEscala = useMemo(() => {
    if (!escalaSelecionada) return []
    return escalaFreelancers.filter((item) => item.escala_id === escalaSelecionada.id)
  }, [escalaFreelancers, escalaSelecionada])
 
  const resumoPorCargo = useMemo<CargoResumo[]>(() => {
    return cargosDoCenario.map((item) => {
      const cargo = item.cargos?.nome || "Sem cargo"
      const cargoId = item.cargo_id || null
      const necessario = Number(item.quantidade || 0)
 
      const fixosSelecionados = fixosDaEscala.filter(
        (fixo) => fixo.cargo_id === cargoId
      ).length
 
      const freelancersSelecionados = freelancersDaEscala.filter(
        (freelancer) => freelancer.cargo_id === cargoId
      ).length
 
      const totalSelecionado = fixosSelecionados + freelancersSelecionados
      const faltando = Math.max(necessario - totalSelecionado, 0)
 
      return {
        cargo,
        cargoId,
        necessario,
        fixosSelecionados,
        freelancersSelecionados,
        totalSelecionado,
        faltando,
      }
    })
  }, [cargosDoCenario, fixosDaEscala, freelancersDaEscala])
 
  const totalPessoasFaltando = useMemo(() => {
    return resumoPorCargo.reduce((acc, item) => acc + item.faltando, 0)
  }, [resumoPorCargo])
 
  function fixosDisponiveisPorCargo(cargoId: string | null) {
    const idsSelecionados = new Set(fixosDaEscala.map((item) => item.fixo_id))
 
    return pessoasFixasDisponiveis.filter((fixo) => {
      const temCargo = cargoId
        ? fixo.fixo_cargos?.some((rel) => rel.cargo_id === cargoId)
        : true
 
      const naoSelecionado = !idsSelecionados.has(fixo.id)
 
      return temCargo && naoSelecionado
    })
  }
 
  function freelancersDisponiveisPorCargo(cargoId: string | null) {
    const idsSelecionados = new Set(freelancersDaEscala.map((item) => item.freelancer_id))
 
    return freelancers.filter((freelancer) => {
      const temCargo = cargoId
        ? freelancer.freelancer_cargos?.some((rel) => rel.cargo_id === cargoId)
        : true
 
      const naoSelecionado = !idsSelecionados.has(freelancer.id)
 
      return temCargo && naoSelecionado
    })
  }
 
  function fixosSelecionadosPorCargo(cargoId: string | null) {
    return fixosDaEscala.filter((item) => {
      if (!cargoId) return true
      return item.cargo_id === cargoId
    })
  }
 
  function freelancersSelecionadosPorCargo(cargoId: string | null) {
    return freelancersDaEscala.filter((item) => {
      if (!cargoId) return true
      return item.cargo_id === cargoId
    })
  }
 
  function nomesDosCargosDoFixo(fixo: PessoaFixa | EscalaFixo["fixos"]) {
    return (
      fixo?.fixo_cargos
        ?.map((rel) => rel.cargos?.nome)
        .filter(Boolean)
        .join(", ") || "Sem cargo"
    )
  }
 
  function nomesDosCargosDoFreelancer(freelancer: Freelancer | EscalaFreelancer["freelancers"]) {
    return (
      freelancer?.freelancer_cargos
        ?.map((rel) => rel.cargos?.nome)
        .filter(Boolean)
        .join(", ") || "Sem cargo"
    )
  }
 
  function nomeCargoPorId(cargoId?: string | null) {
    const cargo = cargosDoCenario.find((item) => item.cargo_id === cargoId)
    return cargo?.cargos?.nome || "Sem cargo"
  }
 
  const relatorioDaEscala = useMemo<RelatorioItem[]>(() => {
    if (!escalaSelecionada) return []
 
    const itens: RelatorioItem[] = []
 
    for (const item of fixosDaEscala) {
      itens.push({
        nome: item.fixos?.nome || "Fixo",
        tipo: "Fixo",
        cargo: nomeCargoPorId(item.cargo_id),
        entrada: item.horario_entrada,
        inicioIntervalo: item.horario_inicio_intervalo,
        fimIntervalo: item.horario_fim_intervalo,
        saida: item.horario_saida,
      })
    }
 
    for (const item of freelancersDaEscala) {
      itens.push({
        nome: item.freelancers?.nome || "Freelancer",
        tipo: "Freelancer",
        cargo: nomeCargoPorId(item.cargo_id),
        entrada: item.horario_entrada,
        inicioIntervalo: item.horario_inicio_intervalo,
        fimIntervalo: item.horario_fim_intervalo,
        saida: item.horario_saida,
      })
    }
 
    return itens.sort((a, b) => {
      const comparacaoCargo = (a.cargo || "").localeCompare(b.cargo || "", "pt-BR")
      if (comparacaoCargo !== 0) return comparacaoCargo
 
      const comparacaoNome = (a.nome || "").localeCompare(b.nome || "", "pt-BR")
      if (comparacaoNome !== 0) return comparacaoNome
 
      return (a.tipo || "").localeCompare(b.tipo || "", "pt-BR")
    })
  }, [escalaSelecionada, fixosDaEscala, freelancersDaEscala, cargosDoCenario])
 
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-4xl font-bold text-[#1E5AA8]">Escalas</h1>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">Carregando escalas...</p>
        </div>
      </div>
    )
  }
 
  return (
    <>
      <div className="space-y-8 p-6 text-slate-800">
        <div>
          <h1 className="text-4xl font-bold text-[#1E5AA8]">Escalas</h1>
          <p className="mt-2 text-base text-slate-700">
            Visualize, organize e complete as escalas geradas.
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
 
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-[#1E5AA8]">Escalas geradas</h2>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                {escalas.length} registros
              </span>
            </div>
 
            {escalas.length === 0 ? (
              <p className="text-slate-600">Nenhuma escala foi gerada ainda.</p>
            ) : (
              <div className="space-y-3">
                {escalas.map((escala) => {
                  const ativa = escala.id === escalaSelecionadaId
 
                  return (
                    <div
                      key={escala.id}
                      onClick={() => setEscalaSelecionadaId(escala.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          setEscalaSelecionadaId(escala.id)
                        }
                      }}
                      className={`w-full cursor-pointer rounded-2xl border p-4 text-left transition ${
                        ativa
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Data</p>
                          <h3 className="mt-1 text-xl font-bold text-slate-900">
                            {formatDateToBR(escala.data)}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {formatWeekdayOnly(escala.data)}
                          </p>
 
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEscalaSelecionadaId(escala.id)
                                setMostrarRelatorio(true)
                              }}
                              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100"
                            >
                              Gerar relatório
                            </button>
 
                            <select
                              value={escala.cenario_id}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation()
                                alterarCenarioDaEscala(escala.id, escala.cenario_id, e.target.value)
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-400"
                            >
                              {cenarios.map((cenario) => (
                                <option key={cenario.id} value={cenario.id}>
                                  Cenário {cenario.numero}
                                </option>
                              ))}
                            </select>
 
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                excluirEscala(escala.id)
                              }}
                              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                            >
                              Excluir escala
                            </button>
                          </div>
                        </div>
 
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-600">Cenário</p>
                          <h3 className="mt-1 text-xl font-bold text-slate-900">
                            {escala.cenarios?.numero ?? "-"}
                          </h3>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
 
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-[#1E5AA8]">Resumo da escala</h2>
 
            {!escalaSelecionada ? (
              <p className="mt-6 text-slate-600">Selecione uma escala para ver os detalhes.</p>
            ) : (
              <div className="mt-6 space-y-4">
                <ResumoCard titulo="Data" valor={formatDateWithWeekday(escalaSelecionada.data)} valorMenor />
                <ResumoCard titulo="Cenário" valor={String(escalaSelecionada.cenarios?.numero ?? "-")} />
                <ResumoCard
                  titulo="Faturamento esperado"
                  valor={formatCurrency(
                    escalaSelecionada.cenarios?.faturamento ?? escalaSelecionada.cenarios?.faturamento_esperado
                  )}
                />
                <ResumoCard titulo="Total necessário" valor={String(escalaSelecionada.cenarios?.total_pessoas ?? 0)} />
                <ResumoCard titulo="Fixos disponíveis" valor={String(pessoasFixasDisponiveis.length)} />
                <ResumoCard titulo="Fixos selecionados" valor={String(fixosDaEscala.length)} />
                <ResumoCard titulo="Freelancers selecionados" valor={String(freelancersDaEscala.length)} />
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">Pessoas ainda faltando</p>
                  <h3 className="mt-1 text-2xl font-bold text-red-600">{totalPessoasFaltando}</h3>
                </div>
              </div>
            )}
          </div>
        </section>
 
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between gap-4">
            <h2 className="text-3xl font-bold text-[#1E5AA8]">Necessidade por cargo</h2>
            <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              {resumoPorCargo.length} cargos
            </span>
          </div>
 
          {!escalaSelecionada ? (
            <p className="text-slate-600">Selecione uma escala para ver os cargos.</p>
          ) : resumoPorCargo.length === 0 ? (
            <p className="text-slate-600">Nenhum cargo encontrado para esta escala.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Cargo</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Necessário</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Fixos selecionados</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Freelancers selecionados</th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-red-700">Faltando</th>
                  </tr>
                </thead>
 
                <tbody className="bg-white">
                  {resumoPorCargo.map((item) => (
                    <tr key={item.cargo} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-800">{item.cargo}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900">{item.necessario}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{item.fixosSelecionados}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{item.freelancersSelecionados}</td>
                      <td className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-red-600">{item.faltando}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
 
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-[#1E5AA8]">Montar equipe da escala</h2>
 
          {!escalaSelecionada ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-slate-600">Selecione uma escala para organizar a equipe.</p>
            </div>
          ) : (
            resumoPorCargo.map((cargo) => {
              const fixosDisponiveis = fixosDisponiveisPorCargo(cargo.cargoId)
              const freelancersDisponiveis = freelancersDisponiveisPorCargo(cargo.cargoId)
              const fixosSelecionados = fixosSelecionadosPorCargo(cargo.cargoId)
              const freelancersSelecionados = freelancersSelecionadosPorCargo(cargo.cargoId)
 
              return (
                <div key={cargo.cargo} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{cargo.cargo}</h3>
                      <p className="mt-1 text-slate-600">
                        Necessário: {cargo.necessario} | Selecionados: {cargo.totalSelecionado} | Faltando: {cargo.faltando}
                      </p>
                    </div>
 
                    <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                      {cargo.totalSelecionado}/{cargo.necessario}
                    </span>
                  </div>
 
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div>
                      <h4 className="mb-3 text-lg font-semibold text-slate-900">1. Fixos disponíveis</h4>
 
                      {fixosDisponiveis.length === 0 ? (
                        <p className="text-slate-600">Nenhum fixo disponível para este cargo.</p>
                      ) : (
                        <div className="space-y-3">
                          {fixosDisponiveis.map((fixo) => (
                            <div key={fixo.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">{fixo.nome || "Fixo"}</p>
                                <p className="text-sm text-slate-600">{fixo.telefone || "Sem telefone"}</p>
                                <p className="text-sm text-slate-500">{nomesDosCargosDoFixo(fixo)}</p>
                              </div>
 
                              <button
                                type="button"
                                onClick={() => adicionarFixoNaEscala(escalaSelecionada.id, fixo.id, cargo.cargoId)}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                              >
                                Adicionar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
 
                    <div>
                      <h4 className="mb-3 text-lg font-semibold text-slate-900">2. Freelancers disponíveis</h4>
 
                      {freelancersDisponiveis.length === 0 ? (
                        <p className="text-slate-600">Nenhum freelancer disponível para este cargo.</p>
                      ) : (
                        <div className="space-y-3">
                          {freelancersDisponiveis.map((freelancer) => (
                            <div key={freelancer.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">{freelancer.nome}</p>
                                <p className="text-sm text-slate-600">{freelancer.telefone || "Sem telefone"}</p>
                                <p className="text-sm text-slate-500">{nomesDosCargosDoFreelancer(freelancer)}</p>
                              </div>
 
                              <button
                                type="button"
                                onClick={() => adicionarFreelancerNaEscala(escalaSelecionada.id, freelancer.id, cargo.cargoId)}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                              >
                                Adicionar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
 
                    <div>
                      <h4 className="mb-3 text-lg font-semibold text-slate-900">3. Selecionados</h4>
 
                      {fixosSelecionados.length === 0 && freelancersSelecionados.length === 0 ? (
                        <p className="text-slate-600">Nenhuma pessoa selecionada neste cargo.</p>
                      ) : (
                        <div className="space-y-3">
                          {fixosSelecionados.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-green-50 px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">{item.fixos?.nome || "Fixo"}</p>
                                <p className="text-sm font-medium text-blue-700">Fixo</p>
                                <p className="text-sm text-slate-600">{item.fixos?.telefone || "Sem telefone"}</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  Entrada: {formatHorario(item.horario_entrada)} | Intervalo: {formatHorario(item.horario_inicio_intervalo)} - {formatHorario(item.horario_fim_intervalo)} | Saída: {formatHorario(item.horario_saida)}
                                </p>
                              </div>
 
                              <button
                                type="button"
                                onClick={() => removerFixoDaEscala(item.id)}
                                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
 
                          {freelancersSelecionados.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-green-50 px-4 py-3">
                              <div>
                                <p className="font-semibold text-slate-900">{item.freelancers?.nome || "Freelancer"}</p>
                                <p className="text-sm font-medium text-emerald-700">Freelancer</p>
                                <p className="text-sm text-slate-600">{item.freelancers?.telefone || "Sem telefone"}</p>
                                <p className="mt-1 text-sm font-medium text-slate-700">
                                  Entrada: {formatHorario(item.horario_entrada)} | Intervalo: {formatHorario(item.horario_inicio_intervalo)} - {formatHorario(item.horario_fim_intervalo)} | Saída: {formatHorario(item.horario_saida)}
                                </p>
                              </div>
 
                              <button
                                type="button"
                                onClick={() => removerFreelancerDaEscala(item.id)}
                                className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </div>
 
      {mostrarRelatorio && escalaSelecionada ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-[#1E5AA8]">Relatório da escala</h2>
 
                <div className="mt-3">
                  <p className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                    {formatDateToBR(escalaSelecionada.data)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-600 sm:text-xl">
                    {formatWeekdayOnly(escalaSelecionada.data)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Cenário {escalaSelecionada.cenarios?.numero ?? "-"}
                  </p>
                </div>
              </div>
 
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={imprimirRelatorioEscala}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Exportar / Imprimir
                </button>
 
                <button
                  type="button"
                  onClick={baixarRelatorioComoImagem}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Baixar imagem
                </button>
 
                <button
                  type="button"
                  onClick={() => setMostrarRelatorio(false)}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Fechar
                </button>
              </div>
            </div>
 
            <div className="flex-1 overflow-y-auto p-6">
              <div id="relatorio-escala-impressao">
                {relatorioDaEscala.length === 0 ? (
                  <p className="text-slate-600">Nenhum funcionário encontrado para esta escala.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Nome</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Tipo</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Função designada</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Entrada</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Início intervalo</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Fim intervalo</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700">Saída</th>
                        </tr>
                      </thead>
 
                      <tbody className="bg-white">
                        {relatorioDaEscala.map((item, index) => (
                          <tr key={`${item.tipo}-${item.nome}-${item.cargo}-${index}`} className="hover:bg-slate-50">
                            <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-800">{item.nome}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{item.tipo}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-900">{item.cargo}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{formatHorario(item.entrada)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{formatHorario(item.inicioIntervalo)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{formatHorario(item.fimIntervalo)}</td>
                            <td className="border-b border-slate-100 px-4 py-3 text-sm text-slate-700">{formatHorario(item.saida)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
 
function ResumoCard({
  titulo,
  valor,
  valorMenor = false,
}: {
  titulo: string
  valor: string
  valorMenor?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-600">{titulo}</p>
      <h3 className={`mt-1 font-bold text-slate-900 ${valorMenor ? "text-lg leading-snug sm:text-xl" : "text-2xl"}`}>
        {valor}
      </h3>
    </div>
  )
}
