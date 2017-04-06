import { Ng2TrytonPage } from './app.po';

describe('ng2-tryton App', () => {
  let page: Ng2TrytonPage;

  beforeEach(() => {
    page = new Ng2TrytonPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
