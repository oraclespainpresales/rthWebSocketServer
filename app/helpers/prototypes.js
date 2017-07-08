module.exports = function() {

  var Type = require('type-of-is');

  // Custom prototypes
  Array.prototype.find = function (obj) {
    if (this === void 0 || this === null || !Type.is(this, Array)) {
      throw new TypeError('Not a valid Array');
    }
    if ( !Type.is(obj, Object)) {
      throw new TypeError('Search input not a valid Object');
    }

    var searchKey
      , searchValue
      , found = undefined;

    for (searchKey in obj) {
      searchValue = JSON.stringify(obj[searchKey]);
    }

    this.some(function(element) {
      if ( element[searchKey]) {
        if ( JSON.stringify(element[searchKey]) === searchValue) {
          found = element;
          return true;
        }
      }
    });
    return found;
  }

  Array.prototype.findBySingleObj = function(obj) {
      return this.filter(function(item) {
          for (var prop in obj)
              if (!(prop in item) || obj[prop] !== item[prop])
                   return false;
          return true;
      });
  };

  Array.prototype.findByObj = function (obj) {
    if (this === void 0 || this === null || !Type.is(this, Array)) {
      throw new TypeError('Not a valid Array');
    }
    if ( Type.is(obj, Object)) {
      return this.findBySingleObj(obj);
    }

    if ( !Type.is(obj, Array)) {
      throw new TypeError('Search input must be an object or an array of objects');
    }
    // [ {att1: value1}, {att2: value2} ]
    var filteredArray = this;
    for ( var i = 0; i < obj.length; i++) {
      // For each incoming object, we invoke the myFind method to filter out data
      filteredArray = filteredArray.findBySingleObj(obj[i]);
      if ( filteredArray === undefined) {
        // Bad luck, not found
        break;
      }
    }
    return filteredArray;
  }

  Array.prototype.remove = function (obj) {
    if (this === void 0 || this === null || !Type.is(this, Array)) {
      throw new TypeError('Not a valid Array');
    }
    if ( !Type.is(obj, Object)) {
      throw new TypeError('Search input not a valid Object');
    }

    var searchKey
      , searchValue;

    for (searchKey in obj) {
      searchValue = JSON.stringify(obj[searchKey]);
    }
    var i = 0;
    var a = this;
    this.some(function(element) {
      if ( element[searchKey]) {
        i++;
        if ( JSON.stringify(element[searchKey]) === searchValue) {
          a.splice(i-1, 1);
          return true;
        }
      }
    });
    return false;
  }

  String.prototype.contains = function(str) {
    return this.indexOf(str) != -1;
  }

}
