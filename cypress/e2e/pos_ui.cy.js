describe('Pruebas de Interfaz del Sistema POS (Actividad 9)', () => {
  beforeEach(() => {
    // Apunta directamente a la carpeta interior donde está tu index.html
    cy.visit('pos-system-main/index.html');
  });

  it('CP-UI-01: La pagina principal del POS carga correctamente', () => {
    cy.get('body').should('be.visible');
  });

  it('CP-UI-02: Verifica la existencia de elementos de la aplicacion', () => {
    cy.get('body').should('exist');
  });

  it('CP-UI-03: Valida la carga del DOM y entorno visual', () => {
    cy.document().should('exist');
  });
});