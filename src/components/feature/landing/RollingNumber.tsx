import { useEffect, useRef, useState } from "react";

const DIGITOS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

interface RollingNumberProps {
    value: number;
}

// Número estilo "caça-níquel": cada dígito gira do 0 até o valor quando o card aparece na tela
export const RollingNumber = ({ value }: RollingNumberProps) => {
    const ref = useRef<HTMLSpanElement>(null);
    const [visivel, setVisivel] = useState(false);

    const observarEntrada = () => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisivel(true);
                observer.disconnect();
            }
        }, { threshold: 0.4 });
        observer.observe(el);
        return () => observer.disconnect();
    };

    useEffect(() => observarEntrada(), []);

    const texto = value.toLocaleString("pt-BR");

    return (
        <span ref={ref} className="inline-flex overflow-hidden leading-none" aria-label={texto}>
            {texto.split("").map((char, i) => {
                const digito = DIGITOS.indexOf(char);
                // Separador de milhar não gira
                if (digito === -1) return <span key={i} aria-hidden>{char}</span>;

                return (
                    <span key={i} aria-hidden className="relative inline-block h-[1em] overflow-hidden">
                        <span
                            className="flex flex-col transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                            style={{
                                // Dá uma volta completa (0–9) antes de parar no dígito certo
                                transform: `translateY(-${visivel ? (10 + digito) * 10 / 2 : 0}%)`,
                                transitionDelay: `${i * 120}ms`,
                            }}
                        >
                            {[...DIGITOS, ...DIGITOS].map((d, j) => (
                                <span key={j} className="h-[1em]">{d}</span>
                            ))}
                        </span>
                    </span>
                );
            })}
        </span>
    );
};

export default RollingNumber;
