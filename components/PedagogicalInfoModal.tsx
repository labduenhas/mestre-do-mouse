import React, { useState } from 'react';
import { Accessibility, BookOpenText, BrainCircuit, GraduationCap, X } from 'lucide-react';

interface PedagogicalInfoModalProps {
  topOffsetClass?: string;
}

const bnccSkills = [
  {
    code: 'EI03CG05',
    title: 'Coordenação motora e habilidades manuais',
    description: 'Coordenar suas habilidades manuais no atendimento adequado a seus interesses e necessidades em situações diversas.',
  },
  {
    code: 'EF01MA11',
    title: 'Localização no espaço',
    description: 'Descrever a localização de pessoas e objetos no espaço em relação à própria posição, usando termos como direita, esquerda, em frente e atrás.',
  },
  {
    code: 'EF01MA12',
    title: 'Trajetos e deslocamentos',
    description: 'Descrever e representar percursos e deslocamentos de pessoas e objetos no espaço, usando pontos de referência e mudanças de direção.',
  },
];

const computingSkills = [
  {
    code: 'PC',
    title: 'Pensamento Computacional — sequenciamento e estratégia',
    description: 'Planejar ações em etapas, testar tentativas, identificar padrões e corrigir rotas para alcançar um objetivo.',
  },
  {
    code: 'CD',
    title: 'Cultura Digital — uso autônomo e intencional',
    description: 'Utilizar recursos digitais de maneira orientada, com autonomia progressiva, atenção às regras e propósito de aprendizagem.',
  },
  {
    code: 'TD',
    title: 'Tecnologia Digital — operação de interfaces',
    description: 'Usar mouse e trackpad com clique, duplo clique e arrastar/soltar para interagir com interfaces digitais educacionais.',
  },
];

export const PedagogicalInfoModal: React.FC<PedagogicalInfoModalProps> = ({ topOffsetClass = 'top-4' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir informações pedagógicas da BNCC"
        className={`fixed ${topOffsetClass} right-4 z-[75] flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-white/95 text-xl shadow-lg backdrop-blur-sm transition-transform hover:scale-105`}
      >
        <span aria-hidden="true">🦉</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/60 p-3 sm:p-4">
          <div className="flex min-h-full items-start justify-center">
            <div className="my-4 w-full max-w-4xl rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  <span>🦉</span> Guia do Professor
                </div>
                <h2 className="text-2xl font-bold text-slate-900">INFORMAÇÕES PEDAGÓGICAS — BNCC</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Alinhamento pedagógico sugerido para apoiar o uso do jogo na Educação Básica.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar guia pedagógico"
                className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <BookOpenText size={18} /> Informações pedagógicas
                </h3>
                <ol className="space-y-3 text-sm text-slate-700">
                  <li><strong>1. Objetivo de aprendizagem:</strong> desenvolver coordenação motora fina, atenção, lateralidade, orientação espacial e autonomia no uso de mouse e trackpad.</li>
                  <li><strong>2. Componente curricular principal:</strong> Computação/Cultura Digital, em articulação com Matemática.</li>
                  <li><strong>3. Ano/etapa indicado:</strong> Educação Infantil (crianças maiores) e 1º ao 3º ano do Ensino Fundamental.</li>
                  <li><strong>4. Unidade temática/campo de experiência:</strong> <em>Corpo, gestos e movimentos</em>; <em>Espaços, tempos, quantidades, relações e transformações</em>; cultura digital e resolução de problemas.</li>
                </ol>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-blue-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
                  <GraduationCap size={18} /> Habilidades da BNCC contempladas
                </h3>
                <div className="space-y-3">
                  {bnccSkills.map((skill) => (
                    <div key={skill.code} className="rounded-2xl bg-white p-3 shadow-sm">
                      <div className="mb-1 inline-flex rounded-full bg-sky-100 px-2 py-1 text-xs font-bold text-sky-900">
                        {skill.code}
                      </div>
                      <p className="font-semibold text-slate-800">{skill.title}</p>
                      <p className="text-sm text-slate-600">{skill.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm leading-relaxed text-emerald-950">
                <strong>5 e 6. Como o jogo desenvolve essas habilidades:</strong> os níveis trabalham clique, duplo clique, arrastar e soltar, labirintos, percurso e montagem de peças. Essas mecânicas fortalecem o controle motor, a percepção espacial, a noção de sequência, a persistência diante de erros e a leitura de instruções em ambiente digital.
              </p>
            </section>

            <section className="mt-5 rounded-3xl border border-violet-200 bg-violet-50 p-4 sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-violet-950">
                <BrainCircuit size={20} /> BNCC COMPUTAÇÃO
              </h3>

              <div className="mb-4 rounded-2xl bg-white p-3 text-sm text-slate-700 shadow-sm">
                <strong>7. Eixos contemplados:</strong> Pensamento Computacional, Cultura Digital e Tecnologia Digital.
              </div>

              <div className="space-y-3">
                {computingSkills.map((skill) => (
                  <div key={skill.code} className="rounded-2xl bg-white p-3 shadow-sm">
                    <div className="mb-1 inline-flex rounded-full bg-violet-100 px-2 py-1 text-xs font-bold text-violet-900">
                      {skill.code}
                    </div>
                    <p className="font-semibold text-slate-800">{skill.title}</p>
                    <p className="text-sm text-slate-600">{skill.description}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-violet-950">
                <strong>8 e 9. Desenvolvimento prático:</strong> a criança aprende a planejar ações, observar padrões de resposta, corrigir tentativas e operar dispositivos de entrada com intencionalidade. O jogo transforma habilidades técnicas de interface em experiências de resolução de problemas e autonomia digital.
              </p>
            </section>

            <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <h3 className="mb-3 flex items-center gap-2 text-xl font-bold text-amber-950">
                <Accessibility size={20} /> Acessibilidade
              </h3>
              <ul className="space-y-2 text-sm text-amber-950">
                <li><strong>Alto Contraste:</strong> reforça cores e contornos para facilitar a leitura visual.</li>
                <li><strong>Fonte Simples:</strong> aplica tipografia sem serifa, mais limpa e confortável.</li>
                <li><strong>Reduzir Animações:</strong> diminui movimentos e transições não essenciais.</li>
                <li><strong>Narração de Áudio:</strong> lê instruções principais em voz alta, sem repetir textos o tempo todo.</li>
              </ul>
            </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
