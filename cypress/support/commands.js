// ***********************************************
// cypress/support/commands.js
// Comandos customizados para o Poker App
// ***********************************************

/**
 * Comando de login customizado.
 * Usa as credenciais do usuário de teste (cypress-test) que estão
 * nos secrets do GitHub Actions e são expostas como CYPRESS_TEST_USER
 * e CYPRESS_TEST_PASSWORD.
 *
 * IMPORTANTE: os inputs do login não têm name/id, só type e className.
 * Por isso usamos seletores por type + className + placeholder.
 */
Cypress.Commands.add("login", (username, password) => {
  const user = username || Cypress.env("TEST_USER");
  const pass = password || Cypress.env("TEST_PASSWORD");

  if (!user || !pass) {
    throw new Error(
      "❌ Credenciais de teste não encontradas. " +
        "Defina CYPRESS_TEST_USER e CYPRESS_TEST_PASSWORD nos secrets do GitHub " +
        "ou passe como argumentos para cy.login(user, pass).",
    );
  }

  cy.visit("/login");

  // 🔥 Aguarda a página de login carregar completamente
  cy.get(".auth-card", { timeout: 15000 }).should("be.visible");

  // 🔥 Campo de usuário: input[type="text"] dentro do auth-card
  cy.get('.auth-card input[type="text"]', { timeout: 10000 })
    .should("be.visible")
    .clear()
    .type(user);

  // 🔥 Campo de senha: input[type="password"] dentro do auth-card
  cy.get('.auth-card input[type="password"]', { timeout: 10000 })
    .should("be.visible")
    .clear()
    .type(pass, { log: false });

  // 🔥 Botão de submit: procura por type="submit" ou pela classe .auth-button
  cy.get("body").then(($body) => {
    if ($body.find('.auth-card button[type="submit"]').length > 0) {
      cy.get('.auth-card button[type="submit"]').click();
    } else if ($body.find(".auth-card .auth-button").length > 0) {
      cy.get(".auth-card .auth-button").first().click();
    } else {
      cy.get(".auth-card button").first().click();
    }
  });

  // Aguarda redirecionamento para a página principal do jogo
  cy.url({ timeout: 15000 }).should("not.include", "/login");
});

/**
 * Comando para esperar a mesa de poker estar pronta.
 */
Cypress.Commands.add("waitForTable", () => {
  cy.get(".game-table-felt", { timeout: 20000 }).should("be.visible");
  cy.get(".action-buttons-grid", { timeout: 20000 }).should("be.visible");
});

/**
 * Verifica que a tela de jogo está enquadrada na viewport
 * (sem rolagem vertical na área da mesa + botões).
 *
 * ⚠️ Este comando depende da classe .game-stage, que só existe
 * depois do refactor do page.jsx (Opção A). Vai falhar até lá.
 */
Cypress.Commands.add("assertGameStageFitsViewport", () => {
  cy.window().then((win) => {
    const viewportHeight = win.innerHeight;

    cy.get(".game-stage", { timeout: 10000 }).then(($stage) => {
      const stageHeight = $stage[0].getBoundingClientRect().height;
      expect(stageHeight).to.be.lessThan(viewportHeight);
    });
  });
});

// ***********************************************
// Fim dos comandos customizados
// ***********************************************
