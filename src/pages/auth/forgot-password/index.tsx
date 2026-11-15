import { useNavigate } from 'react-router-dom'

import AuthBackground from '@/components/layout/AuthBackground'
import Button from '@components/ui/Button'
import logoImg from '@/assets/images/logo/logo-simples.png'
import securityImg from '@/assets/images/security.png'

// A plataforma não envia emails: quem esqueceu a senha fala com o gestor, que
// cria uma senha temporária. No primeiro login, a troca é obrigatória.
const ForgotPasswordPage = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
            <AuthBackground />
            <div className="flex flex-col items-center w-full">
                <div className="flex items-center">
                    <img src={logoImg} alt="Logo do Sinaliza" className="w-20 h-20" />
                    <h1 className="font-baskerville text-2xl sm:text-3xl font-semibold text-cloud-500">Sinaliza</h1>
                </div>

                <div className="w-full max-w-lg bg-white rounded-4xl p-6 sm:p-8 border-2 border-neutral-300">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <img src={securityImg} alt="" className="w-16 h-16 sm:w-20 sm:h-20" />
                        <p className="text-2xl sm:text-3xl font-semibold text-cloud-500 font-baskerville">
                            Esqueceu a <span className="text-campfire-500">senha?</span>
                        </p>
                        <p className="text-sm sm:text-base text-neutral-500 leading-relaxed">
                            Procure o <b className="text-cloud-500">gestor da sua instituição</b>. Ele cria uma senha
                            temporária para você, e no primeiro acesso você escolhe uma nova.
                        </p>
                        <p className="rounded-2xl bg-sunflower-100 px-4 py-3 text-xs text-sunflower-700">
                            Se lembrar da senha e só quiser trocá-la, entre e use "Solicitar nova senha" no seu perfil.
                        </p>
                        <Button type="button" className="w-full" onClick={() => navigate('/auth/login')}>
                            Voltar para o login
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordPage
