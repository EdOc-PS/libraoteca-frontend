// @ts-nocheck
// Tira os prints das principais telas, com dados criados na hora (banco de testes).
import path from 'path';
import { test, api, CONTAS, abrirComo, tokenDe } from '../support';
import { API_URL } from '../playwright.config';

const PASTA = path.resolve(process.cwd(), '../qualidade/prints');
const YOUTUBE = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

test.describe.configure({ mode: 'serial' });

let turma: { id: string; classCode: string };
let sinal: { slug: string };

const print = async (page, nome) => {
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(PASTA, `${nome}.png`), fullPage: true });
};

// Fecha o tour de boas-vindas, se aparecer
const fecharTour = async (page) => {
    const pular = page.getByRole('button', { name: /Pular/ });
    if (await pular.isVisible().catch(() => false)) await pular.click();
};

test.beforeAll(async ({ request }) => {
    const professor = await tokenDe(request, CONTAS.professor);
    const criada = await api(request, professor, 'POST', 'classrooms', {
        name: 'Informática Básica', description: 'Sinais de tecnologia para o 1º ano', colorBackground: '#56B2D4',
    });
    turma = criada.body.object;
    await api(request, professor, 'POST', `classrooms/${turma.id}/members`, { email: CONTAS.aluno });

    const handConfigId = (await api(request, professor, 'GET', 'hand-config')).body.object[0].id;
    const categoryId = (await api(request, professor, 'GET', 'category')).body.object[0].id;
    for (const [i, nome] of ['Computador', 'Teclado', 'Internet'].entries()) {
        const res = await request.fetch(`${API_URL}/sign`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${professor}` },
            multipart: {
                name: nome, categoryId, handConfigIds: handConfigId, classroomIds: turma.id, anotherUrl: YOUTUBE,
                tags: 'tecnologia', examplePt: `Exemplo de uso de ${nome.toLowerCase()} ${i + 1}.`,
            },
        });
        sinal = (await res.json()).object;
    }
});

test('01 landing', async ({ page }) => {
    await page.goto('/');
    await print(page, '01-landing');
});

test('02 login', async ({ page }) => {
    await page.goto('/auth/login');
    await print(page, '02-login');
});

test('03 cadastro', async ({ page }) => {
    await page.goto('/auth/register');
    await print(page, '03-cadastro');
});

test('04 turmas do aluno', async ({ page }) => {
    await abrirComo(page, page.request, CONTAS.aluno, '/classrooms');
    await fecharTour(page);
    await print(page, '04-turmas');
});

test('05 detalhe da turma', async ({ page }) => {
    await abrirComo(page, page.request, CONTAS.professor, `/classrooms/${turma.id}`);
    await fecharTour(page);
    await print(page, '05-turma-detalhe');
});

test('06 detalhe do sinal', async ({ page }) => {
    await abrirComo(page, page.request, CONTAS.aluno, `/signs/${sinal.slug}`);
    await fecharTour(page);
    await print(page, '06-sinal-detalhe');
});

test('07 área de trabalho', async ({ page }) => {
    await abrirComo(page, page.request, CONTAS.professor, '/workspace');
    await fecharTour(page);
    await print(page, '07-area-de-trabalho');
});

test('08 notificações do gestor', async ({ page }) => {
    const aluno = await tokenDe(page.request, CONTAS.aluno2);
    await api(page.request, aluno, 'POST', 'notifications/password-requests');
    await abrirComo(page, page.request, CONTAS.gestor, '/notifications');
    await fecharTour(page);
    await print(page, '08-notificacoes');
});

test('09 esqueci a senha', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await print(page, '09-esqueci-a-senha');
});

test.describe('celular', () => {
    test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });

    test('10 turma no celular', async ({ page }) => {
        await abrirComo(page, page.request, CONTAS.professor, `/classrooms/${turma.id}`);
        await fecharTour(page);
        await print(page, '10-turma-celular');
    });
});
