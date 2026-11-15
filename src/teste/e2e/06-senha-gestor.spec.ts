// @ts-nocheck
import { test, expect, api, aviso, CONTAS, SENHA, abrirComo, criarEducadorPronto, loginApi, novoEmail, tokenDe } from '../support';

test.describe.configure({ mode: 'serial' });

const decidir = (request, token, id, approve) =>
    api(request, token, 'PATCH', `notifications/password-requests/${id}`, { approve });

const ultimoPedidoDe = async (request, tokenGestor, nome) => {
    const avisos = (await api(request, tokenGestor, 'GET', 'notifications')).body.object;
    return avisos.find((n) => n.passwordRequest?.status === 'PENDING' && n.message.includes(nome));
};

test.describe('Pedido de senha do próprio gestor', () => {
    let gestor: string;

    test.beforeAll(async ({ request }) => {
        gestor = await tokenDe(request, CONTAS.gestor);
    });

    test('sendo o único gestor, ele aprova o próprio pedido', async ({ request }) => {
        expect((await api(request, gestor, 'POST', 'notifications/password-requests')).status).toBe(201);
        const pedido = await ultimoPedidoDe(request, gestor, 'Gestor Teste');
        expect(pedido, 'o gestor recebe o próprio pedido').toBeTruthy();

        expect((await decidir(request, gestor, pedido.passwordRequest.id, true)).status).toBe(200);

        // No próximo login, a troca é obrigatória
        const login = await loginApi(request, CONTAS.gestor);
        expect(login.body.object.user.mustChangePassword).toBe(true);
        const troca = await api(request, login.body.object.access_token, 'PATCH', 'auth/password', { newPassword: 'GestorNova@1' });
        expect(troca.status).toBe(200);

        // Volta para a senha padrão, que os outros testes usam
        expect((await api(request, troca.body.object.access_token, 'POST', 'notifications/password-requests')).status).toBe(201);
        const novo = troca.body.object.access_token;
        const outro = await ultimoPedidoDe(request, novo, 'Gestor Teste');
        await decidir(request, novo, outro.passwordRequest.id, true);
        const relogin = await loginApi(request, CONTAS.gestor, 'GestorNova@1');
        await api(request, relogin.body.object.access_token, 'PATCH', 'auth/password', { newPassword: SENHA });
        gestor = await tokenDe(request, CONTAS.gestor);
    });

    test('havendo outro gestor, ele não aprova o próprio pedido, e o outro aprova', async ({ request }) => {
        // Segundo gestor, criado pelo primeiro
        const email = novoEmail('gestor2');
        const criado = await api(request, gestor, 'POST', 'users/educator', {
            name: 'Segundo Gestor',
            email,
            password: 'Temporaria@1',
            educatorType: 'TEACHER',
            isManager: true,
            dataProfile: { department: 'TI', specialty: 'Libras' },
        });
        expect(criado.status, JSON.stringify(criado.body)).toBe(201);
        const temporario = await tokenDe(request, email, 'Temporaria@1');
        const segundo = (await api(request, temporario, 'PATCH', 'auth/password', { newPassword: SENHA })).body.object.access_token;

        expect((await api(request, gestor, 'POST', 'notifications/password-requests')).status).toBe(201);
        const pedido = await ultimoPedidoDe(request, gestor, 'Gestor Teste');

        expect((await decidir(request, gestor, pedido.passwordRequest.id, true)).status).toBe(403);

        // O segundo gestor também recebeu o pedido e pode decidir
        const doSegundo = await ultimoPedidoDe(request, segundo, 'Gestor Teste');
        expect(doSegundo?.passwordRequest.id).toBe(pedido.passwordRequest.id);
        expect((await decidir(request, segundo, pedido.passwordRequest.id, false)).status).toBe(200);

        expect((await loginApi(request, CONTAS.gestor)).body.object.user.mustChangePassword).toBe(false);

        // Tira o perfil de gestor do segundo, para não mudar o cenário dos outros testes
        const id = (await api(request, segundo, 'GET', 'auth/me')).body.object.id;
        expect((await api(request, gestor, 'PATCH', `users/${id}/roles`, { roles: ['EDUCATOR'] })).status).toBe(200);
    });

    test('educador comum não decide pedidos', async ({ request }) => {
        const { token, email } = await criarEducadorPronto(request, gestor, 'Pedido Alheio');
        const aluno = await tokenDe(request, CONTAS.aluno);
        expect((await api(request, aluno, 'POST', 'notifications/password-requests')).status).toBe(201);
        const pedido = await ultimoPedidoDe(request, gestor, 'Aluno Teste 1');

        expect((await decidir(request, token, pedido.passwordRequest.id, true)).status).toBe(403);
        expect((await decidir(request, aluno, pedido.passwordRequest.id, true)).status).toBe(403);
        expect((await loginApi(request, CONTAS.aluno)).body.object.user.mustChangePassword).toBe(false);
        expect(email).toBeTruthy();

        // Limpa: recusa o pedido do aluno
        await decidir(request, gestor, pedido.passwordRequest.id, false);
    });
});

test.describe('Pedido de senha no celular', () => {
    test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

    test('o botão do perfil envia o pedido', async ({ page }) => {
        const gestor = await tokenDe(page.request, CONTAS.gestor);
        const { email } = await criarEducadorPronto(page.request, gestor, 'Pedido Celular');
        await abrirComo(page, page.request, email, '/profile');

        const botao = page.getByRole('button', { name: 'Solicitar nova senha' });
        await expect(botao).toBeInViewport();
        await botao.tap();
        await expect(aviso(page, /Pedido enviado ao gestor/)).toBeVisible();
        expect(await ultimoPedidoDe(page.request, gestor, 'Pedido Celular')).toBeTruthy();
    });

    test('o passo da nova senha funciona no celular', async ({ page }) => {
        const gestor = await tokenDe(page.request, CONTAS.gestor);
        const { email, token } = await criarEducadorPronto(page.request, gestor, 'Troca Celular');
        await api(page.request, token, 'POST', 'notifications/password-requests');
        const pedido = await ultimoPedidoDe(page.request, gestor, 'Troca Celular');
        await decidir(page.request, gestor, pedido.passwordRequest.id, true);

        await page.goto('/auth/login');
        await page.locator('#email').fill(email);
        await page.locator('#password').fill(SENHA);
        await page.getByRole('button', { name: 'Entrar na minha conta' }).tap();

        await page.locator('#new-password').fill('Celular@123');
        await page.locator('#confirm-password').fill('Celular@123');
        const proximo = page.getByRole('button', { name: /Próximo|Começar/ });
        await expect(proximo).toBeInViewport();
        await proximo.tap();
        await expect(aviso(page, 'Senha criada com sucesso!')).toBeVisible();
        expect((await loginApi(page.request, email, 'Celular@123')).status).toBe(201);
    });
});

test.describe('Esqueci a senha (sem envio de email)', () => {
    test('a tela orienta a procurar o gestor e não promete email', async ({ page }) => {
        await page.goto('/auth/forgot-password');
        await expect(page.getByText('gestor da sua instituição')).toBeVisible();
        await expect(page.getByText(/Confira seu|enviaremos um link/)).toHaveCount(0);
        await page.getByRole('button', { name: 'Voltar para o login' }).click();
        await expect(page).toHaveURL(/auth\/login/);
    });
});
