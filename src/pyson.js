/*
 Inspired by pyson.js implementation in Sao.
 */
goog.provide('angular.tryton.PYSON');

goog.require('goog.object');


goog.scope(function() {
  'use strict';

  /**
   * Pyson Service.
   * @constructor
   */
  angular.tryton.PYSON = function() {};

  var PYSON = angular.tryton.PYSON;

  /**
   * This method accepts JSON parsed PYSON object.
   * Depending upon the class of the object, call relevant function.
   * @param pysonObj
   * @param context
   */
  PYSON.prototype.evaluate = function(pysonObj, context) {
    var cls = pysonObj.__class__;
    switch (cls) {
      case 'Eval':
        return PYSON.Eval.call(this, pysonObj, context);
      case 'Not':
        return PYSON.Not.call(this, pysonObj);
      case 'Bool':
        return PYSON.Bool.call(this, pysonObj);
      case 'And':
        return PYSON.And.call(this, pysonObj);
      case 'Or':
        return PYSON.Or.call(this, pysonObj);
      case 'Equal':
        return PYSON.Equal.call(this, pysonObj);
      case 'Greater':
        return PYSON.Greater.call(this, pysonObj);
      case 'Less':
        return PYSON.Less.call(this, pysonObj);
      case 'If':
        return PYSON.If.call(this, pysonObj);
      case 'Get':
        return PYSON.Get.call(this, pysonObj);
    }
  };

  PYSON.Eval = function (value, context) {
    if (value.v in context) {
      return context[value.v];
    } else {
      return value.d;
    }
  };

  /**
   * @return {boolean}
   */
  PYSON.Not = function (value) {
    return !value.v;
  };

  /**
   * @return {boolean}
   */
  PYSON.Bool = function (value) {
    if (value.v instanceof Object) {
      return !goog.object.isEmpty(value.v);
    } else {
      return Boolean(value.v);
    }
  };

  PYSON.And = function (value) {
    var result = true;
    for (var i = 0, len = value.s.length; i < len; i++) {
      var statement = value.s[i];
      result = result && statement;
    }
    return result;
  };

  PYSON.Or = function (value) {
    var result = false;
    for (var i = 0, len = value.s.length; i < len; i++) {
      var statement = value.s[i];
      result = result || statement;
    }
    return result;
  };

  /**
   * @return {boolean}
   */
  PYSON.Equal = function (value) {
    return value.s1 == value.s2;
  };

  /**
   * @return {boolean}
   */
  PYSON.Greater = function (value) {
    value = goog.object.extend({}, value);
    value.s1 = Number(value.s1);
    value.s2 = Number(value.s2);
    if (value.e) {
      return value.s1 >= value.s2;
    } else {
      return value.s1 > value.s2;
    }
  };

  /**
   * @return {boolean}
   */
  PYSON.Less = function (value) {
    value = goog.object.extend({}, value);
    value.s1 = Number(value.s1);
    value.s2 = Number(value.s2);
    if (value.e) {
      return value.s1 <= value.s2;
    } else {
      return value.s1 < value.s2;
    }
  };

  PYSON.If = function (value) {
    if (value.c) {
      return value.t;
    } else {
      return value.e;
    }
  };

  PYSON.Get = function (value) {
    if (value.k in value.v) {
      return value.v[value.k];
    } else {
      return value.d;
    }
  };
});   // goog.scope
