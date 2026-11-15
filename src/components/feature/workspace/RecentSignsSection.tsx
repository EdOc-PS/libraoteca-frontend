import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

import { GetRequest } from "@requests";
import { SIGNS } from "@routes/signs";
import { queryKeys } from "@/config/query/queryKeys";
import { unwrap } from "@/config/query/unwrap";
import { getCategoryBadgeClass, type CategorySlim } from "@lib/constants/category";
import { useReportLoading } from "@lib/hooks/useLoadingGroup";
import { SignThumb } from "@components/feature/dashboard/SignUsageSection";

interface RecentSign {
    id: string;
    name: string;
    slug: string;
    videoUrl?: string | null;
    anotherUrl?: string | null;
    imgUrl?: string | null;
    createdAt: string;
    category?: CategorySlim | null;
}

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

// Últimos sinais cadastrados na plataforma — só os que o usuário pode ver
// (públicos, dele ou das turmas de que participa)
export const RecentSignsSection = () => {
    const navigate = useNavigate();

    const { data: signs = [], isPending } = useQuery({
        queryKey: queryKeys.signs.recent(),
        queryFn: () => unwrap(GetRequest<RecentSign[]>(SIGNS.RECENT())),
        meta: { errorMessage: "Falha ao carregar os últimos sinais" },
    });
    useReportLoading("recent-signs", isPending);

    return (
        <div className="flex flex-col gap-5 rounded-3xl bg-white p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime-100">
                    <HugeiconsIcon icon={SparklesIcon} size={24} className="text-lime-700" />
                </div>
                <div>
                    <h2 className="font-baskerville text-lg text-cloud-500">Últimos sinais da plataforma</h2>
                    <p className="text-sm text-neutral-500">Os sinais cadastrados mais recentemente</p>
                </div>
            </div>

            {signs.length === 0 ? (
                <p className="rounded-3xl border border-dashed border-cloud-300 py-8 text-center text-sm text-neutral-500">
                    Nenhum sinal cadastrado ainda.
                </p>
            ) : (
                <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {signs.map((sign) => (
                        <li
                            key={sign.id}
                            onClick={() => navigate(`/signs/${sign.slug}`)}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl bg-cloud-100/60 p-3 transition-colors hover:bg-cloud-100"
                        >
                            <SignThumb sign={sign} />
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className="truncate text-sm font-semibold text-cloud-600">{sign.name}</span>
                                {sign.category && (
                                    <span className={`w-fit rounded-lg px-1.5 py-0.5 text-[10px] font-semibold ${getCategoryBadgeClass(sign.category.value)}`}>
                                        {sign.category.name}
                                    </span>
                                )}
                            </div>
                            <span className="shrink-0 text-xs text-neutral-400">{formatDate(sign.createdAt)}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default RecentSignsSection;
