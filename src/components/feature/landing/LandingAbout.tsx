import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { GetRequest } from "@requests";
import { queryKeys } from "@/config/query/queryKeys";
import { unwrap } from "@/config/query/unwrap";
import { GLOSSARY } from "@routes/signs";

import { CardMemphisBackground } from "@components/feature/classroom/CardMemphisBackground";
import ifmgLogo from "@/assets/images/logo/ifmg-vertical.png";
import WordReveal from "./WordReveal";

type PublicStats = { signs: number; publicSigns: number; handConfigs: number };

// Portais de Libras que inspiraram o Sinaliza (os sinais da plataforma não vêm deles)
const REFERENCIAS = [
    {
        nome: "Libras Acadêmica",
        instituicao: "Universidade Federal Fluminense (UFF)",
        url: "https://librasacademica.uff.br/",
    },
    {
        nome: "Dicionário da Língua Brasileira de Sinais",
        instituicao: "Instituto Nacional de Educação de Surdos (INES)",
        url: "https://www.ines.gov.br/dicionario-de-libras/",
    },
    {
        nome: "Dicionário de Libras",
        instituicao: "Universidade Federal de Viçosa (UFV)",
        url: "https://sistemas.cead.ufv.br/capes/dicionario/",
    },
    {
        nome: "Acessibilidade Brasil",
        instituicao: "Dicionário de Libras on-line",
        url: "https://www.acessobrasil.org.br/libras/",
    },
];

// "Sobre o projeto" — contexto do TCC, números da plataforma, referências e CTA final
export const LandingAbout = () => {
    const navigate = useNavigate();

    const { data: stats } = useQuery({
        queryKey: queryKeys.glossary.stats(),
        queryFn: () => unwrap(GetRequest<PublicStats>(GLOSSARY.STATS())),
        staleTime: 10 * 60_000,
    });

    const numeros = [
        { valor: stats?.signs, rotulo: "sinais cadastrados" },
        { valor: stats?.publicSigns, rotulo: "sinais no glossário público" },
        { valor: stats?.handConfigs, rotulo: "configurações de mão" },
    ];

    return (
        <section id="sobre" className="bg-white py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Contexto do projeto */}
                <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-center md:gap-x-12 md:gap-y-6">
                    <h3 className="reveal font-baskerville font-semibold md:col-span-2 text-2xl text-cloud-600">
                        Por que <em className="font-baskerville text-lime-500">Sinaliza</em>?
                    </h3>

                    <div className="reveal flex max-w-3xl flex-col gap-4 text-sm sm:text-base leading-relaxed text-cloud-500/75" style={{ transitionDelay: "90ms" }}>
                        <p>
                            O Sinaliza nasceu como Trabalho de Conclusão de Curso no{" "}
                            <strong className="font-semibold text-cloud-600">IFMG — Campus Ouro Branco</strong>.
                        </p>
                        <p>
                            A ideia é ligar intérpretes, alunos e professores num lugar só, onde os sinais usados
                            em cada disciplina ficam guardados, organizados e fáceis de achar no celular.
                        </p>
                    </div>

                    <img
                        src={ifmgLogo}
                        alt="Instituto Federal de Minas Gerais"
                        className="reveal w-28 object-contain md:w-32"
                        style={{ transitionDelay: "180ms" }}
                    />
                </div>

                {/* Números da plataforma */}
                <div className="reveal mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {numeros.map(({ valor, rotulo }) => (
                        <div key={rotulo} className="rounded-3xl bg-cloud-100 px-6 py-8">
                            <p className="font-baskerville text-4xl font-semibold text-cloud-600 sm:text-5xl">
                                {valor === undefined ? "—" : valor.toLocaleString("pt-BR")}
                            </p>
                            <p className="mt-2 text-sm text-cloud-500/75">{rotulo}</p>
                        </div>
                    ))}
                </div>

                {/* Referências */}
                <div className="reveal mt-16">
                    <h3 className="font-baskerville text-2xl font-semibold text-cloud-600">Referências</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cloud-500/75 sm:text-base">
                        O Sinaliza foi inspirado em outros portais de acesso à Libras. Os sinais da plataforma são cadastrados pelos próprios educadores e intérpretes, mas estes projetos serviram de referência para a ideia e a organização do repositório.
                    </p>
                    <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {REFERENCIAS.map((ref) => (
                            <li key={ref.url}>
                                <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block h-full rounded-3xl border border-cloud-200 px-6 py-5 transition-colors duration-300 ease-out hover:border-campfire-500 hover:bg-campfire-100"
                                >
                                    <p className="font-semibold text-cloud-600">{ref.nome}</p>
                                    <p className="mt-1 text-sm text-cloud-500/75">{ref.instituicao}</p>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA final */}
                <div className="reveal relative mt-24 overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-24">
                    <CardMemphisBackground seed="landing-cta" color="#213547" rounded="rounded-[2rem]" />

                    <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
                        <h2 className="font-baskerville text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
                            <WordReveal lines={[["Comece", "pelo"], ["primeiro", "sinal."]]} />
                        </h2>
                        <p className="mt-5 max-w-md text-sm sm:text-base leading-relaxed text-white/70">
                            Solicite sua entrada ou explore o repositório público agora mesmo.
                        </p>

                        <div className="mt-9 flex flex-col items-center gap-5 sm:flex-row">
                            <button
                                onClick={() => navigate("/auth/register")}
                                className="rounded-full bg-campfire-500 px-6 py-3.5 text-sm font-semibold text-cloud-700 transition-colors duration-300 ease-out hover:bg-campfire-600"
                            >
                                Solicitar entrada
                            </button>
                            <Link
                                to="/auth/login"
                                className="text-sm font-semibold text-white/80 underline-offset-4 transition-colors duration-300 ease-out hover:text-white hover:underline"
                            >
                                Já tenho conta
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LandingAbout;
