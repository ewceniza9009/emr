describe('Halkyone EMR Mobile App', () => {
  it('Should load login page', () => {
    cy.visit('/')
    cy.contains('Halkyone Clinical OS')
    cy.contains('Virtual Hospital Room Portal')
  })
})