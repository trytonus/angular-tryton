/*
 Inspired by pyson.js implementation in Sao.
 */
goog.provide('ng.tryton.PYSON');

goog.require('goog.object');
goog.require('goog.date.Interval');

goog.require('ng.tryton.fulfil');


goog.scope(function() {
  'use strict';

  var Fulfil = ng.tryton.fulfil;

  /**
   * Pyson Service.
   * @constructor
   */
  ng.tryton.PYSON = function() {};

  var PYSON = ng.tryton.PYSON;

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
      case 'In':
        return PYSON.In.call(this, pysonObj);
      case 'date':
      case 'Date':
        return PYSON.Date.call(this, pysonObj);
      case 'datetime':
      case 'DateTime':
        return PYSON.DateTime.call(this, pysonObj);
      case 'Len':
        return PYSON.Len.call(this, pysonObj);
      case 'Decimal':
        return PYSON.Decimal.call(this, pysonObj);
    }
  };

  /**
   * This method accept data object and convert that to pyson string
   * @param
   */
  PYSON.prototype.fromObject = function(dataObject) {
    return JSON.stringify(Fulfil.transformRequest(dataObject));
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
      result = result || (
        goog.isObject(statement) ? !goog.object.isEmpty(statement) : !!statement
      );
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
  PYSON.Greater = function (v) {
    var value = {};
    goog.object.extend(value, v);
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
  PYSON.Less = function (v) {
    var value = {};
    goog.object.extend(value, v);
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

  PYSON.In = function (value) {
    if (goog.isArray(value.v)) {
      return goog.object.contains(value.v, value.k);
    } else {
      return goog.object.containsKey(value.v, value.k);
    }
  };

  PYSON.Date = function (value) {
    const deltaObj = {};
    let month = value.M || value.month;

    if (value.dy) deltaObj.years = value.dy;
    if (value.dM) deltaObj.months = value.dM;
    if (value.dd) deltaObj.days = value.dd;

    return new Fulfil.datatype.Date(
      value.y || value.year,
      month && month - 1,
      value.d || value.day,
      deltaObj
    );
  };

  PYSON.DateTime = function (value) {
    const deltaObj = {};
    let month = value.M || value.month;
    let ms = value.ms || value.microsecond;

    if (value.dy) deltaObj.years = value.dy;
    if (value.dM) deltaObj.months = value.dM;
    if (value.dd) deltaObj.days = value.dd;
    if (value.dh) deltaObj.hours = value.dh;
    if (value.dm) deltaObj.minutes = value.dm;
    if (value.ds) deltaObj.seconds = value.ds;

    return new Fulfil.datatype.DateTime(
      value.y || value.year,
      month && month - 1,
      value.d || value.day,
      value.h || value.hour,
      value.m || value.minute,
      value.s || value.second,
      ms && ms / 1000,
      true,
      deltaObj
    )
  };

  PYSON.Len = function (value) {
    return goog.object.getCount(value.v);
  };

  PYSON.Decimal = function(value) {
    return new Fulfil.datatype.Decimal(value.decimal);
  }
});   // goog.scope
