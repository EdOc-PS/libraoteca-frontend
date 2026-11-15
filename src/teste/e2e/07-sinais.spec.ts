// @ts-nocheck
import { test, expect, api, aviso, CONTAS, abrirComo, tokenDe } from '../support';
import { API_URL } from '../playwright.config';

const YOUTUBE = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

// Envia como o front: multipart, com listas separadas por vírgula
async function criarSinal(request, token, campos) {
    const res = await request.fetch(`${API_URL}/sign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        multipart: campos,
    });
    return { status: res.status(), body: await res.json().catch(() => null) };
}

async function editarSinal(request, token, id, campos) {
    const res = await request.fetch(`${API_URL}/sign/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        multipart: campos,
    });
    return { status: res.status(), body: await res.json().catch(() => null) };
}

test.describe('Sinais', () => {
    test.describe.configure({ mode: 'serial' });

    let professor: string;
    let professor2: string;
    let aluno: string;
    let gestor: string;
    let turmaId: string;
    let opcoes: { categoryId: string; handConfigId: string };
    let sinal: { id: string; slug: string; name: string };

    test.beforeAll(async ({ request }) => {
        professor = await tokenDe(request, CONTAS.professor);
        professor2 = await tokenDe(request, CONTAS.professor2);
        aluno = await tokenDe(request, CONTAS.aluno);
        gestor = await tokenDe(request, CONTAS.gestor);

        const turma = await api(request, professor, 'POST', 'classrooms', { name: `Turma Sinais ${Date.now()}` });
        turmaId = turma.body.object.id;
        await api(request, professor, 'POST', `classrooms/${turmaId}/members`, { email: CONTAS.aluno });

        const maos = (await api(request, professor, 'GET', 'hand-config')).body.object;
        const categorias = (await api(request, professor, 'GET', 'category')).body.object;
        opcoes = { categoryId: categorias[0].id, handConfigId: maos[0].id };
    });

    test('educador cria um sinal com link do YouTube', async ({ request }) => {
        const nome = `Casa ${Date.now()}`;
        const res = await criarSinal(request, professor, {
            name: nome,
            ...opcoes,
            classroomIds: turmaId,
            anotherUrl: YOUTUBE,
            examplePt: 'Eu moro em uma casa.',
            tags: 'moradia,lugar',
        });
        expect(res.status, JSON.stringify(res.body)).toBe(201);
        sinal = { id: res.body.object.id, slug: res.body.object.slug, name: nome };
        expect(sinal.slug).toMatch(/^casa-\d+/);
        expect(res.body.object.tags).toEqual(['moradia', 'lugar']);
    });

    test('educador cria um sinal com vídeo enviado', async ({ request }) => {
        // Bytes mínimos de um MP4 válido (cabeçalho ftyp)
        const mp4 = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
        const res = await criarSinal(request, professor, {
            name: `Vídeo ${Date.now()}`,
            ...opcoes,
            video: { name: 'sinal.mp4', mimeType: 'video/mp4', buffer: mp4 },
        });
        expect(res.status, JSON.stringify(res.body)).toBe(201);
        expect(res.body.object.videoUrl).toMatch(/^https:\/\/r2\.teste\//);
    });

    test('regras de criação', async ({ request }) => {
        const semMidia = await criarSinal(request, professor, { name: `Sem mídia ${Date.now()}`, ...opcoes });
        expect(semMidia.status, 'sem vídeo nem link').toBe(400);

        const repetido = await criarSinal(request, professor, { name: sinal.name, ...opcoes, anotherUrl: YOUTUBE });
        expect(repetido.status, 'nome repetido').toBe(400);

        const maoInexistente = await criarSinal(request, professor, {
            name: `Mão ${Date.now()}`, categoryId: opcoes.categoryId, handConfigId: '00000000-0000-0000-0000-000000000000', anotherUrl: YOUTUBE,
        });
        expect(maoInexistente.status, 'configuração de mão inexistente').toBe(400);

        const falso = await criarSinal(request, professor, {
            name: `Falso ${Date.now()}`, ...opcoes,
            video: { name: 'virus.mp4', mimeType: 'video/mp4', buffer: Buffer.from('isto não é um vídeo') },
        });
        expect(falso.status, 'arquivo que não é vídeo').toBe(400);
    });

    test('aluno não cria, não edita e não exclui sinais', async ({ request }) => {
        expect((await criarSinal(request, aluno, { name: 'Do aluno', ...opcoes, anotherUrl: YOUTUBE })).status).toBe(403);
        expect((await editarSinal(request, aluno, sinal.id, { name: 'Alterado' })).status).toBe(403);
        expect((await api(request, aluno, 'DELETE', `sign/${sinal.id}`)).status).toBe(403);
    });

    test('o criador edita o sinal e o slug não muda', async ({ request }) => {
        const res = await editarSinal(request, professor, sinal.id, { name: `${sinal.name} editado`, examplePt: 'Novo exemplo.' });
        expect(res.status, JSON.stringify(res.body)).toBe(200);
        const detalhe = (await api(request, professor, 'GET', `sign/${sinal.slug}`)).body.object;
        expect(detalhe.examplePt).toBe('Novo exemplo.');
        expect(detalhe.slug).toBe(sinal.slug);
    });

    test('o aluno da turma vê o sinal pela tela, pelo slug', async ({ page }) => {
        await abrirComo(page, page.request, CONTAS.aluno, `/signs/${sinal.slug}`);
        await expect(page.getByText(`${sinal.name} editado`).first()).toBeVisible();
        await expect(page.getByText('Novo exemplo.')).toBeVisible();

        const naTurma = (await api(page.request, aluno, 'GET', `classrooms/${turmaId}/signs`)).body.object;
        expect(naTurma.some((s) => s.id === sinal.id)).toBe(true);
    });

    test('busca encontra o sinal pelo nome', async ({ request }) => {
        const res = await api(request, aluno, 'GET', `search/signs?search=${encodeURIComponent(sinal.name)}`);
        expect(res.status).toBe(200);
        const lista = Array.isArray(res.body.object) ? res.body.object : res.body.object.items ?? res.body.object.data;
        expect(lista.some((s) => s.id === sinal.id)).toBe(true);
    });

    test('favoritar e desfavoritar', async ({ request }) => {
        expect((await api(request, aluno, 'POST', `favorite/${sinal.id}`)).status).toBe(201);
        let favoritos = (await api(request, aluno, 'GET', 'favorite')).body.object;
        expect(favoritos.some((s) => s.id === sinal.id)).toBe(true);

        const daTurma = (await api(request, aluno, 'GET', `classrooms/${turmaId}/signs/favorites`)).body.object;
        expect(daTurma.some((s) => s.id === sinal.id)).toBe(true);

        expect((await api(request, aluno, 'DELETE', `favorite/${sinal.id}`)).status).toBe(200);
        favoritos = (await api(request, aluno, 'GET', 'favorite')).body.object;
        expect(favoritos.some((s) => s.id === sinal.id)).toBe(false);
    });

    test('favoritos pela tela', async ({ page }) => {
        await api(page.request, aluno, 'POST', `favorite/${sinal.id}`);
        await abrirComo(page, page.request, CONTAS.aluno, '/favorites');
        await expect(page.getByText(`${sinal.name} editado`).first()).toBeVisible();
        await api(page.request, aluno, 'DELETE', `favorite/${sinal.id}`);
    });

    test('abrir o sinal entra no histórico, e o histórico pode ser limpo', async ({ page }) => {
        await abrirComo(page, page.request, CONTAS.aluno, `/signs/${sinal.slug}`);
        await expect(page.getByText(`${sinal.name} editado`).first()).toBeVisible();

        await expect.poll(async () => (await api(page.request, aluno, 'GET', 'history')).body.object.some((s) => s.id === sinal.id)).toBe(true);

        await page.goto('/history');
        await expect(page.getByText(`${sinal.name} editado`).first()).toBeVisible();

        expect((await api(page.request, aluno, 'DELETE', 'history')).status).toBe(200);
        expect((await api(page.request, aluno, 'GET', 'history')).body.object).toHaveLength(0);
    });

    test('quem não participa da turma não lista os sinais dela', async ({ request }) => {
        const aluno2 = await tokenDe(request, CONTAS.aluno2);
        expect((await api(request, aluno2, 'GET', `classrooms/${turmaId}/signs`)).status).toBe(403);
    });
    test('educador de fora não edita nem exclui o sinal de outro', async ({ request }) => {
        const editar = await editarSinal(request, professor2, sinal.id, { examplePt: 'Alterado por outro educador' });
        expect.soft(editar.status, 'editar sinal de outro educador').toBe(403);
        const excluir = await api(request, professor2, 'DELETE', `sign/${sinal.id}`);
        expect.soft(excluir.status, 'excluir sinal de outro educador').toBe(403);
        // Se a exclusão passou, recria para não quebrar os próximos testes
        if (excluir.status === 200) {
            const res = await criarSinal(request, professor, { name: sinal.name, ...opcoes, classroomIds: turmaId, anotherUrl: YOUTUBE });
            sinal = { id: res.body.object.id, slug: res.body.object.slug, name: sinal.name };
        }
    });
    test('o gestor pode editar o sinal de qualquer educador', async ({ request }) => {
        expect((await editarSinal(request, gestor, sinal.id, { examplePt: 'Ajustado pelo gestor' })).status).toBe(200);
    });

    test('últimos sinais: aparece para quem participa, não para quem é de fora', async ({ request }) => {
        const recentes = async (t) => (await api(request, t, 'GET', 'sign/recent')).body.object.map((x) => x.id);
        expect(await recentes(professor)).toContain(sinal.id);
        expect(await recentes(gestor)).toContain(sinal.id);
        expect(await recentes(professor2), 'sinal privado de turma alheia').not.toContain(sinal.id);
        expect((await api(request, aluno, 'GET', 'sign/recent')).status).toBe(403);
    });

    test('últimos sinais aparecem na área de trabalho', async ({ page }) => {
        const token = await tokenDe(page.request, CONTAS.professor);
        const ultimo = (await api(page.request, token, 'GET', 'sign/recent')).body.object[0];
        await abrirComo(page, page.request, CONTAS.professor, '/workspace');
        const card = page.locator('div.rounded-3xl', { has: page.getByRole('heading', { name: 'Últimos sinais da plataforma' }) });
        await expect(card.getByText(ultimo.name, { exact: true })).toBeVisible();
    });
});

test.describe('Promoção ao glossário', () => {
    test.describe.configure({ mode: 'serial' });

    let professor: string;
    let gestor: string;
    let aluno: string;
    let sinal: { id: string; name: string };

    const avisosDe = async (request, token) => (await api(request, token, 'GET', 'notifications')).body.object;

    test.beforeAll(async ({ request }) => {
        professor = await tokenDe(request, CONTAS.professor);
        gestor = await tokenDe(request, CONTAS.gestor);
        aluno = await tokenDe(request, CONTAS.aluno);
        const maos = (await api(request, professor, 'GET', 'hand-config')).body.object;
        const categorias = (await api(request, professor, 'GET', 'category')).body.object;
        const nome = `Glossário ${Date.now()}`;
        const res = await criarSinal(request, professor, { name: nome, categoryId: categorias[0].id, handConfigId: maos[0].id, anotherUrl: YOUTUBE });
        sinal = { id: res.body.object.id, name: nome };
    });

    test('aluno não envia sinal para o glossário', async ({ request }) => {
        expect((await api(request, aluno, 'PATCH', `sign/${sinal.id}/promote`, {})).status).toBe(403);
    });

    test('educador envia, o gestor é avisado e o sinal ainda não é público', async ({ request }) => {
        const res = await api(request, professor, 'PATCH', `sign/${sinal.id}/promote`, {});
        expect(res.status, JSON.stringify(res.body)).toBe(200);

        expect((await avisosDe(request, gestor)).some((n) => n.title === 'Novo sinal aguardando aprovação' && n.message.includes(sinal.name))).toBe(true);

        const publico = await api(request, null, 'GET', `glossary?search=${encodeURIComponent(sinal.name)}`);
        expect(JSON.stringify(publico.body)).not.toContain(sinal.id);

        expect((await api(request, professor, 'PATCH', `sign/${sinal.id}/promote`, {})).status, 'enviar duas vezes').toBe(409);
    });

    test('educador não aprova a própria promoção', async ({ request }) => {
        expect((await api(request, professor, 'PATCH', `sign/${sinal.id}/promotion`, { approve: true })).status).toBe(403);
    });

    test('recusar exige motivo, e o criador recebe o motivo', async ({ page }) => {
        const semMotivo = await api(page.request, gestor, 'PATCH', `sign/${sinal.id}/promotion`, { approve: false });
        expect(semMotivo.status).toBe(400);

        await abrirComo(page, page.request, CONTAS.gestor, '/workspace');
        const linha = page.locator('div.rounded-2xl.bg-white').filter({ hasText: sinal.name }).first();
        await linha.getByRole('button', { name: 'Recusar' }).click();
        await page.locator('#rejection-reason').fill('O vídeo corta antes do fim do movimento.');
        await page.getByRole('button', { name: 'Recusar' }).last().click();
        await expect(aviso(page, /recusada/)).toBeVisible();

        const recusa = (await avisosDe(page.request, professor)).find((n) => n.title === 'Promoção do sinal recusada');
        expect(recusa?.reason).toBe('O vídeo corta antes do fim do movimento.');
    });

    test('reenviado e aprovado, o sinal aparece no glossário público', async ({ page }) => {
        await api(page.request, professor, 'PATCH', `sign/${sinal.id}/promote`, {});

        await abrirComo(page, page.request, CONTAS.gestor, '/workspace');
        const linha = page.locator('div.rounded-2xl.bg-white').filter({ hasText: sinal.name }).first();
        await linha.getByRole('button', { name: 'Aprovar' }).click();
        await expect(aviso(page, /agora é público/)).toBeVisible();

        expect((await avisosDe(page.request, professor)).some((n) => n.title === 'Seu sinal entrou no glossário global!')).toBe(true);

        // Sem login
        await page.evaluate(() => localStorage.clear());
        await page.goto('/public-glossary');
        await expect(page.getByText(sinal.name).first()).toBeVisible();
    });

    test('remover do glossário exige motivo e avisa o criador', async ({ request }) => {
        expect((await api(request, professor, 'PATCH', `sign/${sinal.id}/unpromote`, { reason: 'x' })).status, 'educador não remove').toBe(403);
        expect((await api(request, gestor, 'PATCH', `sign/${sinal.id}/unpromote`, {})).status, 'sem motivo').toBe(400);

        const res = await api(request, gestor, 'PATCH', `sign/${sinal.id}/unpromote`, { reason: 'Sinal duplicado.' });
        expect(res.status).toBe(200);

        const aviso = (await avisosDe(request, professor)).find((n) => n.title === 'Seu sinal saiu do glossário global');
        expect(aviso?.reason).toBe('Sinal duplicado.');
        const publico = await api(request, null, 'GET', `glossary?search=${encodeURIComponent(sinal.name)}`);
        expect(JSON.stringify(publico.body)).not.toContain(sinal.id);
    });
});

test.describe('Páginas públicas e limites', () => {
    test('landing abre sem login e leva ao login e ao cadastro', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: 'Entrar' }).first()).toBeVisible();
        await page.getByRole('link', { name: 'Entrar' }).first().click();
        await expect(page).toHaveURL(/\/auth\/login$/);
        await page.getByRole('button', { name: 'Solicitar entrada' }).click();
        await expect(page).toHaveURL(/\/auth\/register$/);
    });

    test('rota inexistente mostra a página de não encontrado', async ({ page }) => {
        await page.goto('/rota-que-nao-existe');
        await expect(page.getByText(/não encontrad/i).first()).toBeVisible();
    });

    test('campos respeitam o limite de caracteres', async ({ page }) => {
        await page.goto('/auth/login');
        await page.locator('#email').fill('a'.repeat(300));
        expect((await page.locator('#email').inputValue()).length).toBe(254);
        await page.locator('#password').fill('b'.repeat(100));
        expect((await page.locator('#password').inputValue()).length).toBe(64);
    });

    test.describe('no celular', () => {
        test.use({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true });

        for (const rota of ['/', '/public-glossary', '/auth/login', '/auth/register']) {
            test(`${rota} não tem rolagem lateral`, async ({ page }) => {
                await page.goto(rota);
                await page.waitForLoadState('networkidle');
                const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
                expect(larguras[0]).toBeLessThanOrEqual(larguras[1]);
            });
        }

        for (const rota of ['/classrooms', '/favorites', '/history', '/notifications', '/profile', '/search']) {
            test(`${rota} logado não tem rolagem lateral`, async ({ page }) => {
                await abrirComo(page, page.request, CONTAS.gestor, rota);
                await page.waitForLoadState('networkidle');
                const larguras = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
                expect(larguras[0]).toBeLessThanOrEqual(larguras[1]);
            });
        }
    });
});
