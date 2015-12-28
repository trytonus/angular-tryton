/**
 *
 * Test the tryton angular js module
 *
 */

'use strict';

ddescribe('angular-tryton pyson', function() {

  // Mock the angular-tryton module
  beforeEach(module('fulfil.angular-tryton'));

  var pyson;

  beforeEach(inject(function (_pyson_) {
    pyson = _pyson_;
  }));

  it('should Eval', function() {
    var rv = pyson.evaluate({
      d: '',
      __class__: 'Eval',
      v: 'attribute_set'
    }, {});
    expect(rv).toEqual('');

    var rv = pyson.evaluate({
      d: '',
      __class__: 'Eval',
      v: 'attribute_set'
    }, {
      'attribute_set': 'something'
    });
    expect(rv).toEqual('something');
  });

});