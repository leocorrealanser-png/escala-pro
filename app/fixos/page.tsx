"use client"
 
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
 
type FixoCargo = {
  cargo_id: string
  cargos: {
    nome: string
  } | null
}
 
type Fixo = {
  id: string
  nome: string
  telefone: string | null
  ativo: boolean | null
  fixo_cargos?: FixoCargo[]
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
  const [cargosSelecionados, setCargosSelecionados] = useState<string[]>([])
 
  const [fixoEditando, setFixoEditando] = useState<Fixo | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState("")
  const [telefoneEdicao, setTelefoneEdicao] = useState("")
  const [cargosEdicao, setCargosEdicao] = useState<string[]>([])
 
  useEffect(() => {
    carregarDados()
  }, [])
 
  async function carregarDados() {
    setLoading(true)
 
    const { data: fixosData, error: fixosError } = await supabase
      .from("fixos")
      .select(`
        id,
        nome,
        telefone,
        ativo,
        fixo_cargos (
          cargo_id,
          cargos ( nome )
        )
      `)
      .order("nome")
 
    const { data: cargosData, error: cargosError } = await supabase
      .from("cargos")
      .select("id,nome")
      .order("nome")
 
    if (fixosError) {
      console.error(fixosError)
      alert("Erro ao carregar fixos")
    }
 
    if (cargosError) {
      console.error(cargosError)
      alert("Erro ao carregar cargos")
    }
 
    setFixos((fixosData || []) as unknown as Fixo[])
    setCargos((cargosData || []) as Cargo[])
    setLoading(false)
  }
 
  function toggleCargoAdicionar(cargoId: string) {
    if (cargosSelecionados.includes(cargoId)) {
      setCargosSelecionados(cargosSelecionados.filter((id) => id !== cargoId))
    } else {
      setCargosSelecionados([...cargosSelecionados, cargoId])
    }
  }
 
  function toggleCargoEdicao(cargoId: string) {
    if (cargosEdicao.includes(cargoId)) {
      setCargosEdicao(cargosEdicao.filter((id) => id !== cargoId))
    } else {
      setCargosEdicao([...cargosEdicao, cargoId])
    }
  }
 
  async function adicionarFixo() {
    if (!nome.trim()) {
      alert("Informe o nome")
      return
    }
 
    if (cargosSelecionados.length === 0) {
      alert("Selecione pelo menos um cargo")
      return
    }
 
    const { data: fixo, error } = await supabase
      .from("fixos")
      .insert([
        {
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          ativo: true,
        },
      ])
      .select("id")
      .single()
 
    if (error || !fixo) {
      console.error(error)
      alert("Erro ao criar fixo")
      return
    }
 
    const novosCargos = cargosSelecionados
      .filter((cargoId) => cargoId && cargoId !== "")
      .map((cargoId) => ({
        fixo_id: fixo.id,
        cargo_id: cargoId,
      }))
 
    if (novosCargos.length === 0) {
      alert("Selecione pelo menos um cargo")
      return
    }
 
    const { error: insertError } = await supabase
      .from("fixo_cargos")
      .insert(novosCargos)
 
    if (insertError) {
      console.error("Erro detalhado:", insertError)
      alert("Fixo criado, mas houve erro ao salvar os cargos")
      return
    }
 
    setNome("")
    setTelefone("")
    setCargosSelecionados([])
    await carregarDados()
  }
 
  function abrirEdicao(fixo: Fixo) {
    setFixoEditando(fixo)
    setNomeEdicao(fixo.nome || "")
    setTelefoneEdicao(fixo.telefone || "")
    setCargosEdicao(
      (fixo.fixo_cargos || [])
        .map((item) => item.cargo_id)
        .filter((cargoId) => cargoId && cargoId !== "")
    )
  }
 
  function cancelarEdicao() {
    setFixoEditando(null)
    setNomeEdicao("")
    setTelefoneEdicao("")
    setCargosEdicao([])
  }
 
  async function salvarEdicao() {
    if (!fixoEditando) return
 
    if (!nomeEdicao.trim()) {
      alert("Informe o nome")
      return
    }
 
    if (cargosEdicao.length === 0) {
      alert("Selecione pelo menos um cargo")
      return
    }
 
    const { error: updateError } = await supabase
      .from("fixos")
      .update({
        nome: nomeEdicao.trim(),
        telefone: telefoneEdicao.trim() || null,
      })
      .eq("id", fixoEditando.id)
 
    if (updateError) {
      console.error(updateError)
      alert("Erro ao atualizar fixo")
      return
    }
 
    const { error: deleteError } = await supabase
      .from("fixo_cargos")
      .delete()
      .eq("fixo_id", fixoEditando.id)
 
    if (deleteError) {
      console.error(deleteError)
      alert("Erro ao remover cargos antigos")
      return
    }
 
    const novosCargos = cargosEdicao
      .filter((cargoId) => cargoId && cargoId !== "")
      .map((cargoId) => ({
        fixo_id: fixoEditando.id,
        cargo_id: cargoId,
      }))
 
    console.log("cargosEdicao:", cargosEdicao)
    console.log("novosCargos:", novosCargos)
 
    if (novosCargos.length === 0) {
      alert("Selecione pelo menos um cargo")
      return
    }
 
    const { error: insertError } = await supabase
      .from("fixo_cargos")
      .insert(novosCargos)
 
    if (insertError) {
      console.error("Erro detalhado:", insertError)
      alert("Erro ao salvar novos cargos")
      return
    }
 
    cancelarEdicao()
    await carregarDados()
  }
 
  async function removerFixo(id: string) {
    const confirmar = window.confirm("Deseja remover este fixo?")
    if (!confirmar) return
 
    const { error } = await supabase.from("fixos").delete().eq("id", id)
 
    if (error) {
      console.error(error)
      alert("Erro ao remover fixo")
      return
    }
 
    await carregarDados()
  }
 
  return (
    <div className="space-y-8 p-6 text-slate-800">
      <h1 className="text-4xl font-bold text-[#1E5AA8]">
        Funcionários Fixos
      </h1>
 
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Adicionar funcionário fixo
        </h2>
 
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#1E5AA8]"
          />
 
          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#1E5AA8]"
          />
        </div>
 
        <div className="mt-6">
          <p className="mb-3 font-semibold text-slate-700">
            Selecione um ou mais cargos:
          </p>
 
          {cargos.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum cargo cadastrado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {cargos.map((cargo) => (
                <label
                  key={cargo.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={cargosSelecionados.includes(cargo.id)}
                    onChange={() => toggleCargoAdicionar(cargo.id)}
                    className="h-4 w-4"
                  />
                  {cargo.nome}
                </label>
              ))}
            </div>
          )}
        </div>
 
        <button
          onClick={adicionarFixo}
          className="mt-6 rounded-xl bg-[#1E5AA8] px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Adicionar fixo
        </button>
      </section>
 
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#1E5AA8]">
          Funcionários cadastrados
        </h2>
 
        {loading ? (
          <p className="mt-4 text-slate-600">Carregando...</p>
        ) : fixos.length === 0 ? (
          <p className="mt-4 text-slate-500">Nenhum fixo cadastrado</p>
        ) : (
          <div className="mt-6 space-y-3">
            {fixos.map((fixo) => (
              <div
                key={fixo.id}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">{fixo.nome}</p>
                    <p className="text-sm text-slate-500">
                      {fixo.telefone || "Sem telefone"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {fixo.fixo_cargos && fixo.fixo_cargos.length > 0
                        ? fixo.fixo_cargos
                            .map((fc) => fc.cargos?.nome)
                            .filter(Boolean)
                            .join(", ")
                        : "Sem cargos"}
                    </p>
                  </div>
 
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirEdicao(fixo)}
                      className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-[#1E5AA8] hover:bg-blue-100"
                    >
                      Editar
                    </button>
 
                    <button
                      onClick={() => removerFixo(fixo.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                    >
                      Remover
                    </button>
                  </div>
                </div>
 
                {fixoEditando?.id === fixo.id ? (
                  <div className="mt-5 rounded-2xl border border-blue-100 bg-white p-4">
                    <h3 className="text-lg font-bold text-[#1E5AA8]">
                      Editar fixo
                    </h3>
 
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        placeholder="Nome"
                        value={nomeEdicao}
                        onChange={(e) => setNomeEdicao(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#1E5AA8]"
                      />
 
                      <input
                        placeholder="Telefone"
                        value={telefoneEdicao}
                        onChange={(e) => setTelefoneEdicao(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#1E5AA8]"
                      />
                    </div>
 
                    <div className="mt-5">
                      <p className="mb-3 font-semibold text-slate-700">
                        Cargos do fixo:
                      </p>
 
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {cargos.map((cargo) => (
                          <label
                            key={cargo.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                          >
                            <input
                              type="checkbox"
                              checked={cargosEdicao.includes(cargo.id)}
                              onChange={() => toggleCargoEdicao(cargo.id)}
                              className="h-4 w-4"
                            />
                            {cargo.nome}
                          </label>
                        ))}
                      </div>
                    </div>
 
                    <div className="mt-5 flex gap-3">
                      <button
                        onClick={salvarEdicao}
                        className="rounded-xl bg-[#1E5AA8] px-5 py-2.5 font-semibold text-white transition hover:bg-blue-700"
                      >
                        Salvar alterações
                      </button>
 
                      <button
                        onClick={cancelarEdicao}
                        className="rounded-xl bg-slate-100 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
