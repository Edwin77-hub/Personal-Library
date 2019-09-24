

function objParser(str, init) {
 
  var openSym = ['[', '{', '"', "'", '('];
  var closeSym = [']', '}', '"', "'", ')'];
  var type;
  for(var i = (init || 0); i < str.length; i++ ) {
    type = openSym.indexOf(str[i]);
    if( type !== -1)  break;
  }
  if (type === -1) return null;
  var open = openSym[type];
  var close = closeSym[type];
  var count = 1;
  for(var k = i+1; k < str.length; k++) {
    if(open === '"' || open === "'") {
      if(str[k] === close) count--;
      if(str[k] === '\\') k++;
    } else {
      if(str[k] === open) count++;
      if(str[k] === close) count--;
    }
    if(count === 0) break;
  }
  if(count !== 0) return null;
  var obj = str.slice(i, k+1);
  return {
    start : i,
    end: k,
    obj: obj
  };
}

function replacer(str) {
  
  var obj;
  var cnt = 0;
  var data = [];
  while(obj = objParser(str)) {
    data[cnt] = obj.obj;
    str = str.substring(0, obj.start) + '__#' + cnt++ + str.substring(obj.end+1)
  }
  return {
    str : str,
    dictionary : data
  }
}

function splitter(str) {
 
  var strObj = replacer(str);
  var args = strObj.str.split(',');
  args = args.map(function(a){
    var m = a.match(/__#(\d+)/);
    while (m) {
      a = a.replace(/__#(\d+)/, strObj.dictionary[m[1]]);
      m = a.match(/__#(\d+)/);
    }
    return a.trim();
  })
  return args;
}

function assertionAnalyser(body) {
  

  if(!body) return "invalid assertion";
  

  var body = body.match(/(?:browser\s*\.\s*)?assert\s*\.\s*\w*\([\s\S]*\)/)[0];
  var s = replacer(body);

  var splittedAssertions = s.str.split('assert');
  var assertions = splittedAssertions.slice(1);


  var assertionBodies = [];
  var methods = assertions.map(function(a, i){
    var m = a.match(/^\s*\.\s*(\w+)__#(\d+)/);
    assertionBodies.push(parseInt(m[2]));
    var pre = splittedAssertions[i].match(/browser\s*\.\s*/) ? 'browser.' : '';
    return pre + m[1];
  });
  if(methods.some(function(m){ return !m })) return "invalid assertion";
 
  var bodies = assertionBodies.map(function(b){
    return s.dictionary[b].slice(1,-1).trim();
  });
  assertions = methods.map(function(m, i) {
    return {
      method: m,
      args: splitter(bodies[i])
    }
  })
  return assertions;
}

module.exports = assertionAnalyser;
