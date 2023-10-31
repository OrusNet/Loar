const fs = require('fs');
const { loadavg, type } = require('os');
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

function create_func(path){
    return function (...args) {
        var posArgs = []
        var kwargs = {'loarCheck': false}
        args.forEach(arg => {
            if (typeof arg === 'object') {
                for (let v in arg){
                    if (typeof arg[v] === 'function'){
                        var xv = arg[v]({'loarCheck': true});
                        kwargs[String(v)] = String(xv);
                    }
                    else{kwargs[v] = arg[v];}
                }

            }
            else if (typeof arg === 'function'){
                var xv = arg({'loarCheck': true});
                posArgs.push(xv);
            }
            else{posArgs.push(arg)}
        });
        // console.log(kwargs, posArgs, path)
        if (kwargs['loarCheck']){return '<LoarObject<'+path+'>LoarObject>';}
        delete kwargs['loarCheck']
        write({'send': {'type': 2, 'attr': path, 'args': posArgs, 'kwargs': kwargs}, 'recv': {}});
        a = read()
        if (typeof a['return'] === 'string' && a['return'].startsWith('<LoarObject<') && a['return'].endsWith('>LoarObject>')){
            return create_func(a['return'].replace('<LoarObject<', 'LOAR_OBJECTS.').replace('>LoarObject>',''))
        }
        
        return a['return'];
    };
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
            return create_func(path)
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

module.exports = { importModule, create_func }