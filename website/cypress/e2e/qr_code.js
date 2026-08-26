describe('QR Code Generation', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.intercept('POST', 'http://localhost:3000/secret', {
      body: { message: '75c3383d-a0d9-4296-8ca8-026cc2272271' },
    }).as('post');
  });

  it('renders and toggles QR code for generated one-click link', () => {
    cy.get('textarea[rows]').type('secret for QR code');
    cy.contains('Encrypt Message').click();

    // Check table has link
    cy.get('.MuiTableBody-root > :nth-child(1) > :nth-child(3)').should(
      'contain',
      'http://localhost:3000/#/s/75c3383d-a0d9-4296-8ca8-026cc2272271',
    );

    // Click QR toggle button (second button in the row's stack)
    cy.get('.MuiTableBody-root > :nth-child(1) button').eq(1).click();

    // Verify QR SVG element exists and is rendered
    cy.get('.MuiCollapse-root').should('be.visible');
    cy.get('.MuiCollapse-root svg').should('exist');
    cy.contains('QR Code').should('be.visible');

    // Toggle off
    cy.get('.MuiTableBody-root > :nth-child(1) button').eq(1).click();
  });
});
