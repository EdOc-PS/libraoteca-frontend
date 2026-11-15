// @ts-nocheck
// Prints das telas para o relatório. Rodar a partir de sinaliza-frontend:
//   npx playwright test -c src/teste/playwright.prints.config.ts
// Mesmo ambiente dos testes e2e (API e banco locais); salva em ../qualidade/prints.
import base from './playwright.config';

export default {
    ...base,
    testDir: './prints',
    reporter: [['list']],
    outputDir: './resultados/prints',
};
