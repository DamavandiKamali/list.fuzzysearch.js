;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-indexof/index.js", function(exports, require, module){
module.exports = function(arr, obj){
  if (arr.indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
});
require.register("component-classes/index.js", function(exports, require, module){
/**
 * Module dependencies.
 */

var index = require('indexof');

/**
 * Whitespace regexp.
 */

var re = /\s+/;

/**
 * toString reference.
 */

var toString = Object.prototype.toString;

/**
 * Wrap `el` in a `ClassList`.
 *
 * @param {Element} el
 * @return {ClassList}
 * @api public
 */

module.exports = function(el){
  return new ClassList(el);
};

/**
 * Initialize a new ClassList for `el`.
 *
 * @param {Element} el
 * @api private
 */

function ClassList(el) {
  if (!el) throw new Error('A DOM element reference is required');
  this.el = el;
  this.list = el.classList;
}

/**
 * Add class `name` if not already present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.add = function(name){
  // classList
  if (this.list) {
    this.list.add(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (!~i) arr.push(name);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove class `name` when present, or
 * pass a regular expression to remove
 * any which match.
 *
 * @param {String|RegExp} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.remove = function(name){
  if ('[object RegExp]' == toString.call(name)) {
    return this.removeMatching(name);
  }

  // classList
  if (this.list) {
    this.list.remove(name);
    return this;
  }

  // fallback
  var arr = this.array();
  var i = index(arr, name);
  if (~i) arr.splice(i, 1);
  this.el.className = arr.join(' ');
  return this;
};

/**
 * Remove all classes matching `re`.
 *
 * @param {RegExp} re
 * @return {ClassList}
 * @api private
 */

ClassList.prototype.removeMatching = function(re){
  var arr = this.array();
  for (var i = 0; i < arr.length; i++) {
    if (re.test(arr[i])) {
      this.remove(arr[i]);
    }
  }
  return this;
};

/**
 * Toggle class `name`.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.toggle = function(name){
  // classList
  if (this.list) {
    this.list.toggle(name);
    return this;
  }

  // fallback
  if (this.has(name)) {
    this.remove(name);
  } else {
    this.add(name);
  }
  return this;
};

/**
 * Return an array of classes.
 *
 * @return {Array}
 * @api public
 */

ClassList.prototype.array = function(){
  var str = this.el.className.replace(/^\s+|\s+$/g, '');
  var arr = str.split(re);
  if ('' === arr[0]) arr.shift();
  return arr;
};

/**
 * Check if class `name` is present.
 *
 * @param {String} name
 * @return {ClassList}
 * @api public
 */

ClassList.prototype.has =
ClassList.prototype.contains = function(name){
  return this.list
    ? this.list.contains(name)
    : !! ~index(this.array(), name);
};

});
require.register("segmentio-extend/index.js", function(exports, require, module){

module.exports = function extend (object) {
    // Takes an unlimited number of extenders.
    var args = Array.prototype.slice.call(arguments, 1);

    // For each extender, copy their properties on our object.
    for (var i = 0, source; source = args[i]; i++) {
        if (!source) continue;
        for (var property in source) {
            object[property] = source[property];
        }
    }

    return object;
};
});
require.register("component-event/index.js", function(exports, require, module){

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (el.addEventListener) {
    el.addEventListener(type, fn, capture || false);
  } else {
    el.attachEvent('on' + type, fn);
  }
  return fn;
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (el.removeEventListener) {
    el.removeEventListener(type, fn, capture || false);
  } else {
    el.detachEvent('on' + type, fn);
  }
  return fn;
};

});
require.register("component-type/index.js", function(exports, require, module){

/**
 * toString ref.
 */

var toString = Object.prototype.toString;

/**
 * Return the type of `val`.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = function(val){
  switch (toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
    case '[object String]': return 'string';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val && val.nodeType === 1) return 'element';
  if (val === Object(val)) return 'object';

  return typeof val;
};

});
require.register("timoxley-is-collection/index.js", function(exports, require, module){
var typeOf = require('type')

/**
 * Evaluates _obj_ to determine if it's an array, an array-like collection, or
 * something else. This is useful when working with the function `arguments`
 * collection and `HTMLElement` collections.
 * Note: This implementation doesn't consider elements that are also
 *
 *
  
  collections, such as `<form>` and `<select>`, to be array-like.

  @method test
@param {Object} obj Object to test.
@return {Number} A number indicating the results of the test:

 * 0: Neither an array nor an array-like collection.
 * 1: Real array.
 * 2: Array-like collection.

@api private
 **/
module.exports = function isCollection(obj) {
  var type = typeOf(obj)
  if (type === 'array') return 1
    switch (type) {
      case 'arguments': return 2
      case 'object':
        if (isNodeList(obj)) return 2
        try {
          // indexed, but no tagName (element) or scrollTo/document (window. From DOM.isWindow test which we can't use here),
          // or functions without apply/call (Safari
          // HTMLElementCollection bug).
          if ('length' in obj
              && !obj.tagName
            && !(obj.scrollTo && obj.document)
            && !obj.apply) {
              return 2
            }
        } catch (ex) {}
      default:
        return 0
    }
}

function isNodeList(nodes) {
  return typeof nodes === 'object'
  && /^\[object (NodeList)\]$/.test(Object.prototype.toString.call(nodes))
  && nodes.hasOwnProperty('length')
  && (nodes.length == 0 || (typeof nodes[0] === "object" && nodes[0].nodeType > 0))
}


});
require.register("javve-events/index.js", function(exports, require, module){
var events = require('event'),
  isCollection = require('is-collection');

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el, NodeList, HTMLCollection or Array
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.bind = function(el, type, fn, capture){
  if (!isCollection(el)) {
    events.bind(el, type, fn, capture);
  } else if ( el && el[0] !== undefined ) {
    for ( var i = 0; i < el.length; i++ ) {
      events.bind(el[i], type, fn, capture);
    }
  }
};

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el, NodeList, HTMLCollection or Array
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @api public
 */

exports.unbind = function(el, type, fn, capture){
  if (!isCollection(el)) {
    events.unbind(el, type, fn, capture);
  } else if ( el && el[0] !== undefined ) {
    for ( var i = 0; i < el.length; i++ ) {
      events.unbind(el[i], type, fn, capture);
    }
  }
};
});
require.register("javve-get-by-class/index.js", function(exports, require, module){
/**
 * Find all elements with class `className` inside `container`.
 * Use `single = true` to increase performance in older browsers
 * when only one element is needed.
 *
 * @param {String} className
 * @param {Element} container
 * @param {Boolean} single
 * @api public
 */

module.exports = (function() {
  if (document.getElementsByClassName) {
    return function(container, className, single) {
      if (single) {
        return container.getElementsByClassName(className)[0];
      } else {
        return container.getElementsByClassName(className);
      }
    };
  } else if (document.querySelector) {
    return function(container, className, single) {
      if (single) {
        return container.querySelector(className);
      } else {
        return container.querySelectorAll(className);
      }
    };
  } else {
    return function(container, className, single) {
      var classElements = [],
        tag = '*';
      if (container == null) {
        container = document;
      }
      var els = container.getElementsByTagName(tag);
      var elsLen = els.length;
      var pattern = new RegExp("(^|\\s)"+className+"(\\s|$)");
      for (var i = 0, j = 0; i < elsLen; i++) {
        if ( pattern.test(els[i].className) ) {
          if (single) {
            return els[i];
          } else {
            classElements[j] = els[i];
            j++;
          }
        }
      }
      return classElements;
    };
  }
})();

});
require.register("javve-get-attribute/index.js", function(exports, require, module){
/**
 * Return the value for `attr` at `element`.
 *
 * @param {Element} el
 * @param {String} attr
 * @api public
 */

module.exports = function(el, attr) {
  var result = (el.getAttribute && el.getAttribute(attr)) || null;
  if( !result ) {
    var attrs = el.attributes;
    var length = attrs.length;
    for(var i = 0; i < length; i++) {
      if (attr[i] !== undefined) {
        if(attr[i].nodeName === attr) {
          result = attr[i].nodeValue;
        }
      }
    }
  }
  return result;
}
});
require.register("javve-natural-sort/index.js", function(exports, require, module){
/*
 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
 */

module.exports = function(a, b, options) {
  var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
    sre = /(^[ ]*|[ ]*$)/g,
    dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
    hre = /^0x[0-9a-f]+$/i,
    ore = /^0/,
    options = options || {},
    i = function(s) { return options.insensitive && (''+s).toLowerCase() || ''+s },
    // convert all to strings strip whitespace
    x = i(a).replace(sre, '') || '',
    y = i(b).replace(sre, '') || '',
    // chunk/tokenize
    xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
    yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
    // numeric, hex or date detection
    xD = parseInt(x.match(hre)) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
    yD = parseInt(y.match(hre)) || xD && y.match(dre) && Date.parse(y) || null,
    oFxNcL, oFyNcL,
    mult = options.desc ? -1 : 1;
  // first try and sort Hex codes or Dates
  if (yD)
    if ( xD < yD ) return -1 * mult;
    else if ( xD > yD ) return 1 * mult;
  // natural sorting through split numeric strings and default strings
  for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
    // find floats not starting with '0', string or 0 if not defined (Clint Priest)
    oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
    oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
    // handle numeric vs string comparison - number < string - (Kyle Adams)
    if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
    // rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
    else if (typeof oFxNcL !== typeof oFyNcL) {
      oFxNcL += '';
      oFyNcL += '';
    }
    if (oFxNcL < oFyNcL) return -1 * mult;
    if (oFxNcL > oFyNcL) return 1 * mult;
  }
  return 0;
};

/*
var defaultSort = getSortFunction();

module.exports = function(a, b, options) {
  if (arguments.length == 1) {
    options = a;
    return getSortFunction(options);
  } else {
    return defaultSort(a,b);
  }
}
*/
});
require.register("list/index.js", function(exports, require, module){
/*
ListJS with beta 1.0.0
By Jonny Strömberg (www.jonnystromberg.com, www.listjs.com)
*/
(function( window, undefined ) {
"use strict";

var document = window.document,
    events = require('events'),
    getByClass = require('get-by-class'),
    extend = require('extend');

var List = function(id, options, values) {

    var self = this,
		init,
        Item = require('./src/item')(self),
        addAsync = require('./src/add-async')(self),
        parse = require('./src/parse')(self);

    this.listClass      = "list";
    this.searchClass    = "search";
    this.sortClass      = "sort";
    this.page           = 200;
    this.i              = 1;
    this.items          = [];
    this.visibleItems   = [];
    this.matchingItems  = [];
    this.searched       = false;
    this.filtered       = false;
    this.handlers       = { 'updated': [] };

    extend(this, options);

    this.listContainer = (typeof(id) === 'string') ? document.getElementById(id) : id;
    if (!this.listContainer) { return; }
    this.list           = getByClass(this.listContainer, this.listClass, true);

    this.templater      = require('./src/templater')(self);
    this.sort           = require('./src/sort')(self);
    this.search         = require('./src/search')(self);
    this.filter         = require('./src/filter')(self);

    init = {
        start: function(values) {
            parse(self.list);
            if (values !== undefined) {
                self.add(values);
            }
            self.update();
            //this.plugins(options.plugins);
        },
        plugins: function(plugins) {
            for (var i = 0; i < plugins.length; i++) {
                plugins[i][1] = plugins[i][1] || {};
                var pluginName = plugins[i][1].name || plugins[i][0];
                self[pluginName] = self.plugins[plugins[i][0]].call(self, plugins[i][1]);
            }
        }
    };


    /*
    * Add object to list
    */
    this.add = function(values, callback) {
        if (callback) {
            addAsync(values, callback);
            return;
        }
        var added = [],
            notCreate = false;
        if (values[0] === undefined){
            values = [values];
        }
        for (var i = 0, il = values.length; i < il; i++) {
            var item = null;
            if (values[i] instanceof Item) {
                item = values[i];
                item.reload();
            } else {
                notCreate = (self.items.length > self.page) ? true : false;
                item = new Item(values[i], undefined, notCreate);
            }
            self.items.push(item);
            added.push(item);
        }
        self.update();
        return added;
    };

	this.show = function(i, page) {
		this.i = i;
		this.page = page;
		self.update();
        return self;
	};

    /* Removes object from list.
    * Loops through the list and removes objects where
    * property "valuename" === value
    */
    this.remove = function(valueName, value, options) {
        var found = 0;
        for (var i = 0, il = self.items.length; i < il; i++) {
            if (self.items[i].values()[valueName] == value) {
                self.templater.remove(self.items[i], options);
                self.items.splice(i,1);
                il--;
                i--;
                found++;
            }
        }
        self.update();
        return found;
    };

    /* Gets the objects in the list which
    * property "valueName" === value
    */
    this.get = function(valueName, value) {
        var matchedItems = [];
        for (var i = 0, il = self.items.length; i < il; i++) {
            var item = self.items[i];
            if (item.values()[valueName] == value) {
                matchedItems.push(item);
            }
        }
        return matchedItems;
    };

    /*
    * Get size of the list
    */
    this.size = function() {
        return self.items.length;
    };

    /*
    * Removes all items from the list
    */
    this.clear = function() {
        self.templater.clear();
        self.items = [];
        return self;
    };

    this.on = function(event, callback) {
        self.handlers[event].push(callback);
        return self;
    };

    this.off = function(event, callback) {
        var e = self.handlers[event];
        var index = e.indexOf(callback);
        if (index > -1) {
            e.splice(index, 1);
        }
        return self;
    };

    this.trigger = function(event) {
        var i = self.handlers[event].length;
        while(i--) {
            self.handlers[event][i](self);
        }
        return self;
    };

    this.reset = {
        filter: function() {
            var is = self.items,
                il = is.length;
            while (il--) {
                is[il].filtered = false;
            }
            return self;
        },
        search: function() {
            var is = self.items,
                il = is.length;
            while (il--) {
                is[il].found = false;
            }
            return self;
        }
    };

    this.update = function() {
        var is = self.items,
			il = is.length;

        self.visibleItems = [];
        self.matchingItems = [];
        self.templater.clear();
        for (var i = 0; i < il; i++) {
            if (is[i].matching() && ((self.matchingItems.length+1) >= self.i && self.visibleItems.length < self.page)) {
                is[i].show();
                self.visibleItems.push(is[i]);
                self.matchingItems.push(is[i]);
			} else if (is[i].matching()) {
                self.matchingItems.push(is[i]);
                is[i].hide();
			} else {
                is[i].hide();
			}
        }
        self.trigger('updated');
        return self;
    };

    init.start(values);
};

List.prototype.plugins = {};

// AMD support
if (typeof define === 'function' && define.amd) {
    define(function () { return List; });
// CommonJS and Node.js module support.
} else if (typeof exports !== 'undefined') {
    // Support Node.js specific `module.exports` (which can be a function)
    if (typeof module != 'undefined' && module.exports) {
        exports = module.exports = List;
    }
    // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
    exports.List = List;
} else {
    window.List = List;
}

})(window);

});
require.register("list/src/search.js", function(exports, require, module){
var events = require('events'),
    getByClass = require('get-by-class');

module.exports = function(list) {

    var search = function(searchString, columns) {
        list.trigger('searchStart');
        list.i = 1; // Reset paging

        var matching = [],
            found,
            item,
            text,
            values,
            is,
            searchEscape = /[-[\]{}()*+?.,\\^$|#\s]/g,
            columns = (columns === undefined) ? list.items[0].values() : columns,
            searchString = (searchString === undefined) ? "" : searchString,
            target = searchString.target || searchString.srcElement; /* IE have srcElement */

        // Convert { name: 'yadda' } into [ 'name' ]
        if (columns.constructor == Object) {
            var tmpColumn = [];
            for (var name in columns) {
                tmpColumn.push(name);
            }
            columns = tmpColumn;
        }

        searchString = (target === undefined) ? (""+searchString).toLowerCase() : ""+target.value.toLowerCase();
        is = list.items;
        // Escape regular expression characters
        searchString = searchString.replace(searchEscape, "\\$&");

        list.templater.clear();
        if (searchString === "" ) {
            list.reset.search();
            list.searched = false;
            list.update();
        } else {
            list.searched = true;

            for (var k = 0, kl = is.length; k < kl; k++) {
                found = false;
                item = is[k];
                values = item.values();

                for(var j = 0, jl = columns.length; j < jl; j++) {
                    if(values.hasOwnProperty(columns[j])) {
                        text = (values[columns[j]] != null) ? values[columns[j]].toString().toLowerCase() : "";
                        if ((searchString !== "") && (text.search(searchString) > -1)) {
                            found = true;
                        }
                    }
                }
                if (found) {
                    item.found = true;
                    matching.push(item);
                } else {
                    item.found = false;
                }
            }
            list.update();
        }
        list.trigger('searchComplete');
        return list.visibleItems;
    };

    // Add handlers
    list.handlers.searchStart = list.handlers.searchStart || [];
    list.handlers.searchComplete = list.handlers.searchComplete || [];

    events.bind(getByClass(list.listContainer, list.searchClass), 'keyup', search);

    return search;
};
});
require.register("list/src/sort.js", function(exports, require, module){
var naturalSort = require('natural-sort'),
    classes = require('classes'),
    events = require('events'),
    getByClass = require('get-by-class'),
    getAttribute = require('get-attribute'),
    sortButtons;

var clearPreviousSorting = function() {
    for (var i = 0, il = sortButtons.length; i < il; i++) {
        classes(sortButtons[i]).remove('asc');
        classes(sortButtons[i]).remove('desc');
    }
};

module.exports = function(list) {
    var sort = function() {
        var options = {},
            valueName;

        if (arguments[0].currentTarget || arguments[0].srcElement) {
            var e = arguments[0],
                target = e.currentTarget || e.srcElement,
                newSortingOrder;

            valueName = getAttribute(target, 'data-sort');

            if (classes(target).has('desc')) {
                options.desc = false;
                newSortingOrder = 'asc';
            } else if (classes(target).has('asc')) {
                options.desc = true;
                newSortingOrder = 'desc';
            } else {
                options.desc = false;
                newSortingOrder = 'asc';
            }
            clearPreviousSorting();
            classes(target).add(newSortingOrder);
        } else {
            valueName = arguments[0];
            options = arguments[1] || options;
        }

        options.insensitive = (typeof options.insensitive == "undefined") ? true : options.insensitive;
        options.sortFunction = options.sortFunction || function(a, b) {
            return naturalSort(a.values()[valueName], b.values()[valueName], options);
        };

        list.trigger('sortStart');
        list.items.sort(options.sortFunction);
        list.update();
        list.trigger('sortComplete');
    };

    // Add handlers
    list.handlers.sortStart = list.handlers.sortStart || [];
    list.handlers.sortComplete = list.handlers.sortComplete || [];

    sortButtons = getByClass(list.listContainer, list.sortClass);
    events.bind(sortButtons, 'click', sort);

    return sort;
};
});
require.register("list/src/item.js", function(exports, require, module){
module.exports = function(list) {
    return function(initValues, element, notCreate) {
        var item = this;

        this._values = {};

        this.found = false; // Show if list.searched == true and this.found == true
        this.filtered = false;// Show if list.filtered == true and this.filtered == true

        var init = function(initValues, element, notCreate) {
            if (element === undefined) {
                if (notCreate) {
                    item.values(initValues, notCreate);
                } else {
                    item.values(initValues);
                }
            } else {
                item.elm = element;
                var values = list.templater.get(item, initValues);
                item.values(values);
            }
        };
        this.values = function(newValues, notCreate) {
            if (newValues !== undefined) {
                for(var name in newValues) {
                    item._values[name] = newValues[name];
                }
                if (notCreate !== true) {
                    list.templater.set(item, item.values());
                }
            } else {
                return item._values;
            }
        };
        this.show = function() {
            list.templater.show(item);
        };
        this.hide = function() {
            list.templater.hide(item);
        };
        this.matching = function() {
            return (
                (list.filtered && list.searched && item.found && item.filtered) ||
                (list.filtered && !list.searched && item.filtered) ||
                (!list.filtered && list.searched && item.found) ||
                (!list.filtered && !list.searched)
            );
        };
        this.visible = function() {
            return (item.elm.parentNode) ? true : false;
        };
        init(initValues, element, notCreate);
    };
};
});
require.register("list/src/templater.js", function(exports, require, module){
var getByClass = require('get-by-class');

var Templater = function(list) {
    var itemSource = getItemSource(list.item),
        templater = this;

    function getItemSource(item) {
        if (item === undefined) {
            var nodes = list.list.childNodes,
                items = [];

            for (var i = 0, il = nodes.length; i < il; i++) {
                // Only textnodes have a data attribute
                if (nodes[i].data === undefined) {
                    return nodes[i];
                }
            }
            return null;
        } else if (item.indexOf("<") !== -1) { // Try create html element of list, do not work for tables!!
            var div = document.createElement('div');
            div.innerHTML = item;
            return div.firstChild;
        } else {
            return document.getElementById(list.item);
        }
    }

    /* Get values from element */
    this.get = function(item, valueNames) {
        templater.create(item);
        var values = {};
        for(var i = 0, il = valueNames.length; i < il; i++) {
            var elm = getByClass(item.elm, valueNames[i], true);
            values[valueNames[i]] = elm ? elm.innerHTML : "";
        }
        return values;
    };

    /* Sets values at element */
    this.set = function(item, values) {
        if (!templater.create(item)) {
            for(var v in values) {
                if (values.hasOwnProperty(v)) {
                    // TODO speed up if possible
                    var elm = getByClass(item.elm, v, true);
                    if (elm) {
                        elm.innerHTML = values[v];
                    }
                }
            }
        }
    };

    this.create = function(item) {
        if (item.elm !== undefined) {
            return false;
        }
        /* If item source does not exists, use the first item in list as
        source for new items */
        var newItem = itemSource.cloneNode(true);
        newItem.removeAttribute('id');
        item.elm = newItem;
        templater.set(item, item.values());
        return true;
    };
    this.remove = function(item) {
        list.list.removeChild(item.elm);
    };
    this.show = function(item) {
        templater.create(item);
        list.list.appendChild(item.elm);
    };
    this.hide = function(item) {
        if (item.elm !== undefined && item.elm.parentNode === list.list) {
            list.list.removeChild(item.elm);
        }
    };
    this.clear = function() {
        /* .innerHTML = ''; fucks up IE */
        if (list.list.hasChildNodes()) {
            while (list.list.childNodes.length >= 1)
            {
                list.list.removeChild(list.list.firstChild);
            }
        }
    };
};

module.exports = function(list) {
    return new Templater(list);
};
});
require.register("list/src/filter.js", function(exports, require, module){
module.exports = function(list) {

    // Add handlers
    list.handlers.filterStart = list.handlers.filterStart || [];
    list.handlers.filterComplete = list.handlers.filterComplete || [];

    return function(filterFunction) {
        list.trigger('filterStart');
        list.i = 1; // Reset paging
        list.reset.filter();
        if (filterFunction === undefined) {
            list.filtered = false;
        } else {
            list.filtered = true;
            var is = list.items;
            for (var i = 0, il = is.length; i < il; i++) {
                var item = is[i];
                if (filterFunction(item)) {
                    item.filtered = true;
                } else {
                    item.filtered = false;
                }
            }
        }
        list.update();
        list.trigger('filterComplete');
        return list.visibleItems;
    }
};
});
require.register("list/src/add-async.js", function(exports, require, module){
module.exports = function(list) {
    return function(values, callback, items) {
        var valuesToAdd = values.splice(0, 100);
        items = items || [];
        items = items.concat(list.add(valuesToAdd));
        if (values.length > 0) {
            setTimeout(function() {
                addAsync(values, callback, items);
            }, 10);
        } else {
            list.update();
            callback(items);
        }
    };
};
});
require.register("list/src/parse.js", function(exports, require, module){
module.exports = function(list) {

    var Item = require('./item')(list);

    var getChildren = function(parent) {
        var nodes = parent.childNodes,
            items = [];
        for (var i = 0, il = nodes.length; i < il; i++) {
            // Only textnodes have a data attribute
            if (nodes[i].data === undefined) {
                items.push(nodes[i]);
            }
        }
        return items;
    };

    var parse = function(itemElements, valueNames) {
        for (var i = 0, il = itemElements.length; i < il; i++) {
            list.items.push(new Item(valueNames, itemElements[i]));
        }
    };
    var parseAsync = function(itemElements, valueNames) {
        var itemsToIndex = itemElements.splice(0, 100); // TODO: If < 100 items, what happens in IE etc?
        parse(itemsToIndex, valueNames);
        if (itemElements.length > 0) {
            setTimeout(function() {
                init.items.indexAsync(itemElements, valueNames);
                },
            10);
        } else {
            list.update();
            // TODO: Add indexed callback
        }
    };

    return function() {
        var itemsToIndex = getChildren(list.list),
            valueNames = list.valueNames;

        if (list.indexAsync) {
            parseAsync(itemsToIndex, valueNames);
        } else {
            parse(itemsToIndex, valueNames);
        }
    }
};
});
require.register("list.paging.js/index.js", function(exports, require, module){
List.prototype.plugins.paging = function(locals, options) {
    var list = this;
    var pagingList;
    var init = function() {
        options = options || {};
        pagingList = new List(list.listContainer.id, {
            listClass: options.pagingClass || 'pagination',
            item: "<li><a class='page' href='javascript:function Z(){Z=\"\"}Z()'></a></li>",
            valueNames: ['page', 'dotted'],
            searchClass: 'nosearchclass',
            sortClass: 'nosortclass'
        });
        list.on('updated', refresh);
        refresh();
    };

    var refresh = function() {
        var l = list.matchingItems.length,
            index = list.i,
            page = list.page,
            pages = Math.ceil(l / page),
            currentPage = Math.ceil((index / page)),
            innerWindow = options.innerWindow || 2,
            left = options.left || options.outerWindow || 0,
            right = options.right || options.outerWindow || 0,
            right = pages - right;

        pagingList.clear();
        for (var i = 1; i <= pages; i++) {
            var className = (currentPage === i) ? "active" : "";

            //console.log(i, left, right, currentPage, (currentPage - innerWindow), (currentPage + innerWindow));

            if (is.number(i, left, right, currentPage, innerWindow)) {
                var item = pagingList.add({
                    page: i,
                    dotted: false
                })[0];
                ListJsHelpers.addClass(item.elm, className);
                addEvent(item.elm, i, page);
            } else if (is.dotted(i, left, right, currentPage, innerWindow, pagingList.size())) {
                var item = pagingList.add({
                    page: "...",
                    dotted: true
                })[0];
                ListJsHelpers.addClass(item.elm, "disabled");
            }
        }
    };

    var is = {
        number: function(i, left, right, currentPage, innerWindow) {
           return this.left(i, left) || this.right(i, right) || this.innerWindow(i, currentPage, innerWindow);
        },
        left: function(i, left) {
            return (i <= left);
        },
        right: function(i, right) {
            return (i > right);
        },
        innerWindow: function(i, currentPage, innerWindow) {
            return ( i >= (currentPage - innerWindow) && i <= (currentPage + innerWindow));
        },
        dotted: function(i, left, right, currentPage, innerWindow, currentPageItem) {
            return this.dottedLeft(i, left, right, currentPage, innerWindow)
            || (this.dottedRight(i, left, right, currentPage, innerWindow, currentPageItem));
        },
        dottedLeft: function(i, left, right, currentPage, innerWindow) {
            return ((i == (left + 1)) && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right))
        },
        dottedRight: function(i, left, right, currentPage, innerWindow, currentPageItem) {
            if (pagingList.items[currentPageItem-1].values().dotted) {
                return false
            } else {
                return ((i == (right)) && !this.innerWindow(i, currentPage, innerWindow) && !this.right(i, right))
            }
        }
    };

    var addEvent = function(elm, i, page) {
       ListJsHelpers.addEvent(elm, 'click', function() {
           list.show((i-1)*page + 1, page);
       });
    };

    init();
    return this;
};
});







require.alias("list/index.js", "list.paging.js/deps/list.js/index.js");
require.alias("list/src/search.js", "list.paging.js/deps/list.js/src/search.js");
require.alias("list/src/sort.js", "list.paging.js/deps/list.js/src/sort.js");
require.alias("list/src/item.js", "list.paging.js/deps/list.js/src/item.js");
require.alias("list/src/templater.js", "list.paging.js/deps/list.js/src/templater.js");
require.alias("list/src/filter.js", "list.paging.js/deps/list.js/src/filter.js");
require.alias("list/src/add-async.js", "list.paging.js/deps/list.js/src/add-async.js");
require.alias("list/src/parse.js", "list.paging.js/deps/list.js/src/parse.js");
require.alias("list/index.js", "list.js/index.js");
require.alias("component-classes/index.js", "list/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("segmentio-extend/index.js", "list/deps/extend/index.js");

require.alias("javve-events/index.js", "list/deps/events/index.js");
require.alias("component-event/index.js", "javve-events/deps/event/index.js");

require.alias("timoxley-is-collection/index.js", "javve-events/deps/is-collection/index.js");
require.alias("component-type/index.js", "timoxley-is-collection/deps/type/index.js");

require.alias("javve-get-by-class/index.js", "list/deps/get-by-class/index.js");

require.alias("javve-get-attribute/index.js", "list/deps/get-attribute/index.js");

require.alias("javve-natural-sort/index.js", "list/deps/natural-sort/index.js");

require.alias("list.paging.js/index.js", "list.paging.js/index.js");if (typeof exports == "object") {
  module.exports = require("list.paging.js");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("list.paging.js"); });
} else {
  this["List"] = require("list.paging.js");
}})();