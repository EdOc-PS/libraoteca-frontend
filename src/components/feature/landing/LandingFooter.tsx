import { Link } from "react-router-dom";

import logo from "@/assets/images/logo/logo-simples.png";

interface FooterLink {
    label: string;
    to: string;
    external?: boolean;
}

const columns: { title: string; links: FooterLink[] }[] = [
    {
        title: "Plataforma",
        links: [
            { label: "Repositório", to: "/public-glossary" },
            { label: "Como funciona", to: "/#como-funciona" },
            { label: "Recursos", to: "/#recursos" },
            { label: "Para quem é", to: "/#para-quem" },
        ],
    },
    {
        title: "Conta",
        links: [
            { label: "Solicitar entrada", to: "/auth/register" },
            { label: "Entrar", to: "/auth/login" },
            { label: "Esqueci a senha", to: "/auth/forgot-password" },
        ],
    },
    {
        title: "Projeto",
        links: [
            { label: "Sobre o TCC", to: "/#sobre" },
            { label: "IFMG Ouro Branco", to: "https://www.ifmg.edu.br/ourobranco", external: true },
            { label: "GitHub", to: "https://github.com/EdOc-ps", external: true },
        ],
    },
];

const linkClass = "text-sm text-white/75 transition-colors duration-300 ease-out hover:text-campfire-500";

function FooterAnchor({ label, to, external }: FooterLink) {
    if (external) {
        return <a href={to} target="_blank" rel="noopener noreferrer" className={linkClass}>{label}</a>;
    }
    if (to.includes("#")) {
        return <a href={to} className={linkClass}>{label}</a>;
    }
    return <Link to={to} className={linkClass}>{label}</Link>;
}

// Rodapé público — imagem de fundo escurecida, colunas de links e linha de base
// A imagem fica em public/footer-bg.jpg; sem ela, o fundo é só o azul escuro
export const LandingFooter = () => (
    <footer
        className="relative overflow-hidden bg-cloud-700 bg-cover bg-center"
        style={{ backgroundImage: "url('/footer-bg.jpg')" }}
    >
        {/* Camada escura por cima da imagem, para o texto ficar legível */}
        <div aria-hidden className="absolute inset-0 bg-cloud-700/85" />

        <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
                {/* Marca */}
                <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
                    <div className="flex items-center gap-1.5">
                        <img src={logo} alt="" className="h-8 w-8 brightness-0 invert" />
                        <span className="font-baskerville text-lg font-semibold text-white">Sinaliza</span>
                    </div>
                    <p className="max-w-xs text-sm leading-relaxed text-white/70">
                        Repositório de sinais em Libras para intérpretes, alunos e professores do IFMG.
                    </p>
                    <span className="flex items-center gap-2 text-xs text-white/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                        Repositório público no ar
                    </span>
                </div>

                {columns.map((col) => (
                    <div key={col.title} className="flex flex-col gap-3.5">
                        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                            {col.title}
                        </h3>
                        {col.links.map((link) => (
                            <FooterAnchor key={link.label} {...link} />
                        ))}
                    </div>
                ))}
            </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 border-t border-white/15 py-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} Sinaliza · Feito por Eduardo Octavio no IFMG</p>
                <div className="flex gap-5">
                    <Link to="/public-glossary" className="transition-colors duration-300 ease-out hover:text-white">Repositório</Link>
                    <a href="/#sobre" className="transition-colors duration-300 ease-out hover:text-white">Sobre</a>
                    <Link to="/auth/login" className="transition-colors duration-300 ease-out hover:text-white">Entrar</Link>
                </div>
            </div>
        </div>
    </footer>
);

export default LandingFooter;
