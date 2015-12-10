goog.provide('angular.tryton.fulfil');
goog.provide('angular.tryton.fulfil.datatype');

goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.UtcDateTime');
goog.require('goog.date.Interval');


goog.scope(function() {
  'use strict';

  var Fulfil = angular.tryton.fulfil;
  Fulfil.datatype = angular.tryton.fulfil.datatype;
  var date = goog.date.Date;
  var dateTime = goog.date.DateTime;
  var utcDateTime = goog.date.UtcDateTime;
  var interval = goog.date.Interval;

  Fulfil.reviver = function (key, value) {
    /*
     * Transform server data for client
     */
    if (value === null) {
      return null;
    }
    //console.log(key, value);
    if (value['__class__'] === undefined) {
      return value;
    }
    var __class__ = value['__class__'].toLowerCase();

    if (__class__ === 'decimal') {
      return new Fulfil.datatype.Decimal(value.decimal);
    }

    if (__class__ === 'datetime') {
      return new Fulfil.datatype.DateTime(
        value.year,
        value.month && value.month - 1,
        value.day,
        value.hour,
        value.minute,
        value.second,
        value.microsecond && value.microsecond / 1000
      );
    }
    if (__class__ === 'date') {
      return new Fulfil.datatype.Date(
        value.year,
        value.month && value.month - 1,
        value.day
      );
    }
    if (__class__ === 'time') {
      return new Fulfil.datatype.Time(
        value.hour,
        value.minute,
        value.second,
        value.microsecond && value.microsecond / 1000
      );
    }
    if (__class__ === 'buffer') {
      // TODO: Handle buffer
    }
    return value;
  };

  Fulfil.replacer = function (k, v) {
    /*
     * Transform client data to server
     */
    // TODO: Handle conversion
    return v;
  };

  Fulfil.transformResponse = function (response_obj) {
    /*
     * This method transforms response from tryton server and replace
     * Result to Fulfil Datatypes
     */
    if (response_obj === null) {
      return null;
    }

    var transformed_res = {};

    for (var key in response_obj) {
      if (response_obj.hasOwnProperty(key)) {
        var value = response_obj[key];
        if (typeof value == "object") {
          value = Fulfil.transformResponse(value);
        }
        transformed_res[key] = Fulfil.reviver(key, value);
      }
    }
    if (Object.prototype.toString.call(response_obj) == "[object Array]") {
      // XXX: Response Obj is Array.
      transformed_res = Object.keys(transformed_res).map(function (k) {
        return transformed_res[k];
      });
    }
    return transformed_res;
  };

  // Browser compatibility: polyfill
  if (!('contains' in String.prototype)) {
    String.prototype.contains = function (str, startIndex) {
      return -1 !== String.prototype.indexOf.call(this, str, startIndex);
    };
  }
  if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
      }
    });
  }
  if (!String.prototype.endsWith) {
    Object.defineProperty(String.prototype, 'endsWith', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function (searchString, position) {
        position = position || this.length;
        position = position - searchString.length;
        var lastIndex = this.lastIndexOf(searchString);
        return lastIndex !== -1 && lastIndex === position;
      }
    });
  }

  Fulfil.datatype.Decimal = Number;

  Fulfil.datatype.Date = function (year, month, day) {
    var date = new date(year, month, day);
    date.isDate = true;
    return date;
  };

  Fulfil.datatype.Date.min = dateTime.fromTimestamp(-100000000 * 86400000);
  Fulfil.datatype.Date.min.setHours(0);
  Fulfil.datatype.Date.min.setMinutes(0);
  Fulfil.datatype.Date.min.setSeconds(0);
  Fulfil.datatype.Date.min.setMilliseconds(0);
  Fulfil.datatype.Date.min.isDate = true;
  Fulfil.datatype.Date.max = dateTime.fromTimestamp(100000000 * 86400000);
  Fulfil.datatype.Date.max.setHours(0);
  Fulfil.datatype.Date.max.setMinutes(0);
  Fulfil.datatype.Date.max.setSeconds(0);
  Fulfil.datatype.Date.max.setMilliseconds(0);
  Fulfil.datatype.Date.max.isDate = true;

  Fulfil.datatype.DateTime = function (year, month, day, hour, minute, second,
                                       millisecond, utc) {
    var datetime;
    if (utc) {
      datetime = new utcDateTime(
        year, month, day, hour || 0, minute || 0, second || 0, millisecond || 0
      );
    } else {
      datetime = new dateTime(
        year, month, day, hour || 0, minute || 0, second || 0, millisecond || 0
      );
    }
    datetime.isDateTime = true;
    return datetime;
  };

  Fulfil.datatype.DateTime.combine = function (date, time) {
    var datetime = date.clone();
    datetime.setHours(time.getHours());
    datetime.setMinutes(time.getMinutes());
    datetime.setSeconds(time.getSeconds());
    datetime.setMilliseconds(time.getMilliseconds());
    return datetime;
  };

  Fulfil.datatype.DateTime.min = dateTime.fromTimestamp(-100000000 * 86400000);
  Fulfil.datatype.DateTime.min.isDateTime = true;
  Fulfil.datatype.DateTime.max = dateTime.fromTimestamp(100000000 * 86400000);
  Fulfil.datatype.DateTime.max.isDateTime = true;

  Fulfil.datatype.Time = function (hour, minute, second, millisecond) {
    var time = new dateTime();
    time.setHours(hour);
    time.setMinutes(minute);
    time.setSeconds(second);
    time.setMilliseconds(millisecond || 0);
    time.isTime = true;
    return time;
  };

  Fulfil.datatype.TimeDelta = function (
      years, months, days, hours, minutes, seconds) {
    var timedelta = new interval(years, months, days, hours, minutes, seconds);
    timedelta.isTimeDelta = true;
    return timedelta;
  };

});
