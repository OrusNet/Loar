const fs = require('fs');
const parent = __dirname+'/';
function read(){
    var x = JSON.parse(fs.readFileSync(parent+'.loar_kernel', 'utf8'))
    while (Object.keys(x['recv']).length === 0){
        try{x = JSON.parse(fs.readFileSync(parent+'.loar_kernel', 'utf8'))}
        catch (e){}
    }
    if ('err' in x['recv']){
        throw new Error(x['recv']['err']);
    }
    write({'recv': {}, 'send': x['send']});
    return x['recv'];
}

function removeSuffix(inputString, prefix) {
    if (inputString.endsWith(prefix)) {
        return inputString.substring(prefix.length);
    }
    return inputString;
}

function write(data){
    var x = JSON.parse(fs.readFileSync(parent+'.loar_kernel', 'utf8'));
    while (JSON.stringify(x['send']) !== '{}'){
        try{x = JSON.parse(fs.readFileSync(parent+'.loar_kernel', 'utf8'))}
        catch (e){}
    }
    fs.writeFileSync(parent+'.loar_kernel', JSON.stringify(data), 'utf8');
}

function createFunc(path){
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
        if (path!==undefined){
            if (kwargs['loarCheck']){return '<LoarObject<'+path+'>LoarObject>';}
            delete kwargs['loarCheck']
            write({'send': {'type': 2, 'attr': path, 'args': posArgs, 'kwargs': kwargs}, 'recv': {}});
            a = read()
            if (a['return']===null){return null}
            if (typeof a['return'] === 'string' && a['return'].startsWith('<LoarObject<') && a['return'].endsWith('>LoarObject>')){
                return createFunc(a['return'].replace('<LoarObject<', 'LOAR_OBJECTS.').replace('>LoarObject>',''))
                
            } else if (typeof a['return'] === 'object'){
                if ('LoarObject' in a['return']) {
                return treeVar(a['return'], 'LOAR_OBJECTS.'+a['return']['LoarObject'])
                }
            }
            return a['return'];
        }
    };
}

function treeVar(node, path='', disallowedPaths=[]) {
    if (!disallowedPaths.includes(path)){
        if (typeof node === 'object') {
            const resultObject = {};
            for (const key in node) {
                const newPath = path ? `${path}.${key}` : key;
                resultObject[key] = treeVar(node[key], newPath, disallowedPaths);
            }
            return resultObject;
        } else if (node === 'LOAR<func>LOAR') {
            return createFunc(path);
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

module.exports = { importModule, createFunc }