"use client"

import Link from "next/link"

export default function AjudaPage() {
  const passos = [
    {
      numero: 1,
      titulo: "Cadastro de freelancers",
      descricao:
        "Cadastre todos os freelancers disponíveis, com seus respectivos cargos.",
      link: "/freelancers",
      botao: "Ir para Freelancers",
    },
    {
      numero: 2,
      titulo: "Cadastro de ausências",
      descricao:
        "Registre folgas, férias ou indisponibilidades dos funcionários fixos antes de montar a escala.",
      link: "/ausencias",
      botao: "Ir para Ausências",
    },
    {
      numero: 3,
      titulo: "Planeje sua escala",
      descricao:
        "Acesse a aba Planejamento, escolha a data e o cenário para gerar a base da escala.",
      link: "/planejamento",
      botao: "Ir para Planejamento",
    },
    {
      numero: 4,
      titulo: "Monte sua escala",
      descricao:
        "Na aba Escalas, selecione os funcionários para cada função necessária.",
      link: "/escalas",
      botao: "Ir para Escalas",
    },
    {
      numero: 5,
      titulo: "Gere relatórios",
      descricao:
        "Gere relatórios individuais na aba Escalas ou relatórios por período no Dashboard.",
      link: "/",
      botao: "Ir para Dashboard",
    },
  ]

  return (
    <div className="space-y-8 p-6 text-slate-800">
      <div>
        <h1 className="text-4xl font-bold text-blue-700">Ajuda</h1>
        <p className="mt-2 text-base text-slate-700">
          Siga os passos abaixo para montar suas escalas de forma rápida e organizada.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {passos.map((passo) => (
          <div
            key={passo.numero}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-blue-600">
                {passo.numero}
              </span>
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              {passo.titulo}
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              {passo.descricao}
            </p>

            <Link href={passo.link}>
              <button className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition">
                {passo.botao}
              </button>
            </Link>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-xl font-bold text-blue-700">Dica importante</h2>
        <p className="mt-2 text-sm text-blue-900">
          Sempre registre as ausências antes de gerar a escala. Isso garante que o cálculo de funcionários necessários seja correto.
        </p>
      </section>
    </div>
  )
}