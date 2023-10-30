const fs = require('fs');
function read(){
    var x = JSON.parse(fs.readFileSync('ULP.json', 'utf8'))
    while (Object.keys(x['recv']).length === 0){
        try{x = JSON.parse(fs.readFileSync('ULP.json', 'utf8'))}
        catch (e){}
    }
    write({'recv': {}, 'send': x['send']})
    return x['recv'];
}

function write(data){
    var x = JSON.parse(fs.readFileSync('ULP.json', 'utf8'));
    while (JSON.stringify(x['send']) !== '{}'){
        try{x = JSON.parse(fs.readFileSync('ULP.json', 'utf8'))}
        catch (e){}
    }
    fs.writeFileSync('ULP.json', JSON.stringify(data), 'utf8');
}

function treeVar(node, path='', disallowedPaths=[]) {
    if (!disallowedPaths.includes(path)){
        if (typeof node === 'object' && node !== null) {
            const resultObject = {};
            for (const key in node) {
                const newPath = path ? `${path}.${key}` : key;
                resultObject[key] = treeVar(node[key], newPath);
            }
            return resultObject;
        } else if (node === 'LOAR<func>LOAR') {
            return function (...args) {
                var posArgs = []
                var kwargs = {}
                args.forEach(arg => {
                    if (typeof arg === 'object') {
                        Object.assign(kwargs, arg);
                    } else {
                        posArgs.push(arg);
                    }
                });
                write({'send': {'type': 2, 'attr': path, 'args': posArgs, 'kwargs': kwargs}, 'recv': {}});
                a = read()
                return a['return'];
            };
        } else {
            return node;
        }
    }
}

function importModule(moduleName, importAttrs={}, disallowedPaths=[], allowedTypes=['int', 'str', 'bool', 'dict', 'list', 'NoneType'], c=false){
    write({'send': {'type': 0, 'module': moduleName, 'allowedTypes': allowedTypes, 'c': c, 'importAttrs': importAttrs}, 'recv': {}});
    var x = read();
    return treeVar(x['tree'], moduleName, disallowedPaths);
}

module.exports = {importModule}