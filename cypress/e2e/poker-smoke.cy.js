/// <reference types="cypress" />

/**
 * Smoke test do Poker App.
 *
 * Objetivo:
 *  1. Verificar que o usuário de teste consegue fazer login
 *  2. Verificar que a mesa de poker renderiza
 *  3. Verificar que os 5 botões de ação aparecem em uma única linha
 *  4. Verificar que a tela de jogo cabe em um celular em pé (sem rolagem
 *     na área da mesa + botões) — o requisito principal do BruCe
 *  5. Verificar que em paisagem a mesa organiza CPU/comunitárias/jogador
 *     em uma linha (classe .game-stage no page.jsx + flexDirection: row
 *     no GameTable.jsx)
 */

describe("Poker App - Smoke Test", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  context("Mobile Portrait (iPhone 12/13/14 - 390x844)", () => {
    beforeEach(() => {
      cy.viewport(390, 844);
    });

    it("faz login com o usuário de teste", () => {
      cy.login();
      cy.url().should("not.include", "/login");
      cy.waitForTable(); // ⬅️ usa o waitForTable (espera mesa + botões)
    });

    it("renderiza a mesa com todas as áreas (CPU, comunitárias, jogador)", () => {
      cy.login();
      cy.waitForTable();

      cy.get(".game-table-player-area-cpu").should("be.visible");
      cy.get(".game-table-community-area").should("be.visible");
      cy.get(".game-table-community-cards-row").should("be.visible");
      cy.get(".game-table-player-area-player").should("be.visible");
    });

    it("mostra os 5 botões de ação em uma única linha", () => {
      cy.login();
      cy.waitForTable();

      cy.get(".action-buttons-grid").should("be.visible");

      cy.get(".action-buttons-grid").then(($grid) => {
        const gridStyle = window.getComputedStyle($grid[0]);
        const columns = gridStyle.gridTemplateColumns;
        const columnCount = columns.split(" ").filter((c) => c.trim()).length;
        expect(columnCount).to.eq(5);
      });
    });

    it("enquadra a mesa + botões na viewport sem rolagem vertical", () => {
      cy.login();
      cy.waitForTable();
      cy.assertGameStageFitsViewport();
    });

    it("mantém os botões de ação visíveis na parte inferior", () => {
      cy.login();
      cy.waitForTable();

      cy.get(".action-buttons-grid").then(($grid) => {
        const rect = $grid[0].getBoundingClientRect();
        expect(rect.top).to.be.lessThan(844);
        expect(rect.bottom).to.be.lessThan(844);
        expect(rect.top).to.be.greaterThan(0);
      });
    });
  });

  context("Mobile Landscape (iPhone 12/13/14 - 844x390)", () => {
    beforeEach(() => {
      cy.viewport(844, 390);
    });

    it("renderiza a mesa em paisagem com cartas em uma linha", () => {
      cy.login();
      cy.waitForTable();
      cy.get(".game-table-felt").should("be.visible");

      cy.get(".game-table-felt").then(($felt) => {
        const style = window.getComputedStyle($felt[0]);
        expect(style.flexDirection).to.eq("row");
      });
    });

    it("mostra os botões de ação visíveis em paisagem", () => {
      cy.login();
      cy.waitForTable();
      cy.get(".action-buttons-grid").should("be.visible");
    });
  });

  context("Tablet (iPad - 820x1180)", () => {
    beforeEach(() => {
      cy.viewport(820, 1180);
    });

    it("renderiza a mesa corretamente em tablet", () => {
      cy.login();
      cy.waitForTable();
      cy.get(".game-table-felt").should("be.visible");
      cy.get(".action-buttons-grid").should("be.visible");
    });
  });

  context("Desktop (1920x1080)", () => {
    beforeEach(() => {
      cy.viewport(1920, 1080);
    });

    it("renderiza a mesa e o sidebar lado a lado", () => {
      cy.login();
      cy.waitForTable();
      cy.get(".game-table-column").should("be.visible");
      cy.get(".game-sidebar-column").should("be.visible");
    });
  });
});
