goog.provide('ng.tryton.fulfil');
goog.provide('ng.tryton.fulfil.datatype');

goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.UtcDateTime');
goog.require('goog.date.Interval');


goog.scope(function() {
  'use strict';

  var Fulfil = ng.tryton.fulfil;
  Fulfil.datatype = {};  // Need to initialize with Object for compilation
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
    if (value['__class__'] === undefined) {
      return value;
    }
    var __class__ = value['__class__'].toLowerCase();

    if (__class__ === 'decimal') {
      var result = new Fulfil.datatype.Decimal(value.decimal);
      if (isNaN(result) || value === '' || value === null) {
          return null;
      } else {
          return result;
      }
    }

    if (__class__ === 'datetime') {
      return new Fulfil.datatype.DateTime(
        value.year,
        value.month && value.month - 1,
        value.day,
        value.hour,
        value.minute,
        value.second,
        value.microsecond && value.microsecond / 1000,
        true
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

  Fulfil.toJson = function (value) {
    return angular.toJson(Fulfil.transformRequest(value));
  };
  Fulfil.transformRequest = function (value) {
    if (!goog.isDefAndNotNull(value)) {
      return value;
    }
    if (goog.isArray(value)) {
      return value.map(function (item) {
        return Fulfil.transformRequest(item);
      });
    }
    if (value.isDate) {
      return {
        '__class__': 'date',
        'year': value.getYear(),
        'month': value.getMonth() + 1,
        'day': value.getDate()
      };
    }
    if (value.isDateTime) {
      value = value.clone();
      return {
        '__class__': 'datetime',
        'year': value.getUTCFullYear(),
        'month': value.getUTCMonth() + 1,
        'day': value.getUTCDate(),
        'hour': value.getUTCHours(),
        'minute': value.getUTCMinutes(),
        'second': value.getUTCSeconds(),
        'microsecond': value.getUTCMilliseconds() * 1000
      };
    }
    if (value.isTime) {
      return {
        '__class__': 'time',
        'hour': value.getHours(),
        'minute': value.getMinutes(),
        'second': value.getSeconds(),
        'microsecond': value.getMilliseconds() * 1000
      }
    }
    if (value.isTimeDelta) {
      // XXX: getTotalSeconds()
      // Gets the total number of seconds in the time interval.
      // Assumes that months and years are empty.
      return {
        '__class__': 'timedelta',
        'seconds': value.getTotalSeconds()
      };
    }
    if (value instanceof Fulfil.datatype.Decimal) {
      return {
        '__class__': 'Decimal',
        'decimal': value.toString()
      };
    }
    if (value instanceof Uint8Array) {
      var strings = [], chunksize = 0xffff;
      // JavaScript Core has hard-coded argument limit of 65536
      // String.fromCharCode can not be called with too many
      // arguments
      for (var j = 0; j * chunksize < value.length; j++) {
        strings.push(String.fromCharCode.apply(
          null, value.subarray(
            j * chunksize, (j + 1) * chunksize)));
      }
      return {
        '__class__': 'bytes',
        'base64': btoa(strings.join(''))
      };
    }

    if (goog.isObject(value)) {
      var transformed_res = {};
      for (var key in value) {
        if (value.hasOwnProperty(key)) {
          transformed_res[key] = Fulfil.transformRequest(value[key]);
        }
      }
      return transformed_res;
    }
    return value;
  };

  Fulfil.fromJson = function (value) {
    return Fulfil.transformResponse(angular.fromJson(value));
  };
  Fulfil.transformResponse = function (response_obj) {
    /*
     * This method transforms response from tryton server and replace
     * Result to Fulfil Datatypes
     */
    if (!goog.isObject(response_obj)) {
      return response_obj;
    }

    if (goog.isArray(response_obj)) {
      return response_obj.map(function (item) {
        return Fulfil.transformResponse(item);
      });
    }

    var transformed_res = {};

    for (var key in response_obj) {
      if (response_obj.hasOwnProperty(key)) {
        var value = response_obj[key];
        if (typeof value == "object") {
          transformed_res[key] = Fulfil.transformResponse(value);
        }
        else {
          transformed_res[key] = Fulfil.reviver(key, value);
        }
      }
    }
    transformed_res = Fulfil.reviver(null, transformed_res);
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

  /*
   * Number field
   */
  Fulfil.datatype.Decimal = Number;

  /*
   * Date field
   */
  Fulfil.datatype.Date = function (year, month, day) {
    var date = new goog.date.Date(year, month, day);
    date.isDate = true;
    return date;
  };

  Fulfil.datatype.Date.clone = function (date) {
    var value = date.clone();
    value.isDate = true;
    return value;
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

  /*
   * Datetime field
   */
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

  Fulfil.datatype.DateTime.clone = function (datetime) {
    var value = datetime.clone();
    value.isDateTime = true;
    return value;
  };

  Fulfil.datatype.DateTime.now = function () {
    var value = new dateTime();
    value.isDateTime = true;
    return value;
  };
  Fulfil.datatype.DateTime.min = dateTime.fromTimestamp(-100000000 * 86400000);
  Fulfil.datatype.DateTime.min.isDateTime = true;
  Fulfil.datatype.DateTime.max = dateTime.fromTimestamp(100000000 * 86400000);
  Fulfil.datatype.DateTime.max.isDateTime = true;

  /*
   * Time field
   */
  Fulfil.datatype.Time = function (hour, minute, second, millisecond) {
    var time = new dateTime();
    if (hour) {
      time.setHours(hour);
    }
    if (minute) {
      time.setMinutes(minute);
    }
    if (second) {
      time.setSeconds(second);
    }
    if (millisecond) {
      time.setMilliseconds(millisecond || 0);
    }
    time.isTime = true;
    return time;
  };
  Fulfil.datatype.Time.clone = function (time) {
    var value = time.clone();
    value.isTime = true;
    return value;
  };

  /*
   * Time Delta
   */
  Fulfil.datatype.TimeDelta = function (
      years, months, days, hours, minutes, seconds) {
    var timedelta = new interval(years, months, days, hours, minutes, seconds);
    timedelta.isTimeDelta = true;
    return timedelta;
  };

});
