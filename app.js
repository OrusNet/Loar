import fs from 'fs';
import * as url from 'url';
const parent = url.fileURLToPath(new URL('.', import.meta.url));

function read(fileName='.loar_kernel'){
    var x = JSON.parse(fs.readFileSync(parent+fileName, 'utf8'))
    while (Object.keys(x['recv']).length === 0){
        try{x = JSON.parse(fs.readFileSync(parent+fileName, 'utf8'))}
        catch (e){}
    }
    if ('err' in x['recv']){
        throw new Error(x['recv']['err']);
    }
    write({'recv': {}, 'send': x['send']}, fileName);
    return x['recv'];
}

function write(data, fileName='.loar_kernel'){
    var x = JSON.parse(fs.readFileSync(parent+fileName, 'utf8'));
    while (JSON.stringify(x['send']) !== '{}'){
        try{x = JSON.parse(fs.readFileSync(parent+fileName, 'utf8'))}
        catch (e){}
    }
    fs.writeFileSync(parent+fileName, JSON.stringify(data), 'utf8');
}

function createFunc(path, fileName='.loar_kernel'){
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
            write({'send': {'type': 2, 'attr': path, 'args': posArgs, 'kwargs': kwargs}, 'recv': {}}, fileName);
            var a = read()
            if (a['return']===null){return null}
            if (typeof a['return'] === 'string' && a['return'].startsWith('<LoarObject<') && a['return'].endsWith('>LoarObject>')){
                return createFunc(a['return'].replace('<LoarObject<', 'LOAR_OBJECTS.').replace('>LoarObject>',''), fileName)
                
            } else if (typeof a['return'] === 'object' && 'LoarObject' in a['return']){
                return treeVar(a['return'], 'LOAR_OBJECTS.'+a['return']['LoarObject'], fileName)
            }
            return a['return'];
        }
    };
}

function treeVar(node, path='', fileName, disallowedPaths=[]) {
    if (!disallowedPaths.includes(path)){
        if (typeof node === 'object') {
            const resultObject = {};
            for (const key in node) {
                const newPath = path ? `${path}.${key}` : key;
                resultObject[key] = treeVar(node[key], newPath, fileName, disallowedPaths);
            }
            return resultObject;
        } else if (node === 'LOAR<func>LOAR') {
            return createFunc(path, fileName);
        } else {
            return node;
        }
    }
}

function importModule(moduleName, fileName='.loar_kernel', importAttrs={}, disallowedPaths=[], allowedTypes=['int', 'str', 'bool', 'dict', 'list', 'NoneType'], c=false){
    write({'send': {'type': 0, 'module': moduleName, 'allowedTypes': allowedTypes, 'c': c, 'importAttrs': importAttrs}, 'recv': {}}, fileName);
    var x = read(fileName);
    return treeVar(x['tree'], moduleName, fileName, disallowedPaths);
}


export { importModule, createFunc }