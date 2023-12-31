import inspect
from sys import argv
from os import system, path
from json import dump, dumps, loads
from threading import Thread
from random import randint
from traceback import format_exc
from time import sleep

parent = path.dirname(__file__).replace('\\', '/')+'/'

loarConfig = {
    "kernelFrequency": 524,
    "virtualMemoryFrequency": 160
}

if path.exists('loarconfig.json'):
    with open('loarconfig.json')as f:
        loarConfig = loads(f.read())

class OBJECTS:
    def exit_kernel(c=0):
        quit(0)

#The modules imported will be here (These are just types do not touch them)
M = {'int': int, 'str': str, 'bool': bool, 'NoneType': type(None), 'dict':  dict, 'list':  list, 'LOAR_OBJECTS': OBJECTS}

def classTree(classObj, allowedTypes=[int, str, bool, type(None), dict, list], c=False, dirc='', importAttrs={}):
    classDict = {}
    for name, attr in classObj.__dict__.items():
        if str(dirc+name) in importAttrs.keys():
            tx = importAttrs[dirc+name]
            if tx=='tree':classDict[name] = classTree(attr, dirc=dirc+name+'.')
            elif tx=='function':classDict[name] = 'LOAR<func>LOAR'
            else:classDict[name] = str(attr)
            
        elif inspect.isclass(attr):classDict[name] = classTree(attr)
        elif callable(attr) or inspect.ismethod(attr):
            classDict[name] = 'LOAR<func>LOAR'
        elif type(attr) in allowedTypes or c:
            try:
                dumps({name: attr})
                classDict[name] = attr
            except:pass
    return classDict

def read():
    try:
        with open(parent+'.loar_kernel')as f:
            x = loads(f.read())
            return x
    except:return {'send': {}, 'recv': {}}

def send(data):
    with open(parent+'.loar_kernel', 'w')as f:
        dump(data, f)

def startULPC():
    system('node '+argv[1])

send({'send': {}, 'read': {}})

Thread(target=startULPC).start()

def RD(x):
    A = ''
    for ii, i in enumerate(str(x).split('.')):
        if ii==0:
            A = M[i]
        else:
            A = getattr(A, i)
    return {'send': {}, 'recv': {'output': A}}

while(1):
    #if there is something python should process
    x = read()
    output = {}
    #if the type is 0 or import mode
    if 'type' in x['send']:
        try:
            if x['send']['type']==0:
                A = __import__(x['send']['module'])
                M[x['send']['module']] = A
                C = []
                for i in x['send']['allowedTypes']:
                    C.append(RD(i)['recv']['output'])
                output = {'send': {}, 'recv': {'tree': classTree(A, C, x['send']['c'], importAttrs=x['send']['importAttrs'])}}
            
            #if the type is 1 or var mode 
            elif x['send']['type']==1:
                output = RD(x['send']['attr'])
                
            #if the type is 2 or call mode
            elif x['send']['type']==2:
                A = ''
                for ii, i in enumerate(str(x['send']['attr']).split('.')):
                    if ii==0:
                        A = M[i]
                    else:
                        A = getattr(A, i)
                args = []
                kwargs = {}
                for xfy in x['send']['args']:
                    if str(xfy).startswith('<LoarObject<') and str(xfy).endswith('>LoarObject>'):
                        xfy = type(xfy)(str(xfy).removeprefix('<LoarObject<').removesuffix('>LoarObject>'))
                        Afy=''
                        for iify, ify in enumerate(str(xfy).split('.')):
                            if iify==0:Afy = M[ify]
                            else:Afy = getattr(Afy, ify)
                        args.append(Afy)
                    else:
                        args.append(xfy)

                for xf in dict(x['send']['kwargs']).items():
                    xfy = xf[1]
                    if str(xfy).startswith('<LoarObject<') and str(xfy).endswith('>LoarObject>'):
                        xf = [xf[0], str(xf[1]).removeprefix('<LoarObject<').removesuffix('>LoarObject>')]
                        xfy = xf[1]
                        Afy=''
                        for iify, ify in enumerate(str(xfy).split('.')):
                            if iify==0:Afy = M[ify]
                            else:Afy = getattr(Afy, ify)
                        kwargs[xf[0]] = Afy
                    else:
                        kwargs[xf[0]] = xfy
                B = {'return': A(*args, **kwargs)}
                
                if inspect.isclass(B['return']):
                    B_id = str('_'+str(randint(1000000, 9999999)))
                    setattr(M['LOAR_OBJECTS'], B_id+'_'+x['send']['attr'].replace('.', '_'), B['return'])
                    B['return'] = classTree(B['return'])
                    B['return']['LoarObject'] = B_id+'_'+x['send']['attr'].replace('.', '_')
                    
                elif callable(B['return']):
                    B_id = str('_'+str(randint(1000000, 9999999)))
                    setattr(M['LOAR_OBJECTS'], B_id, B['return'])
                    B['return'] = '<LoarObject<'+B_id+'>LoarObject>'
                output = {'send': {}, 'recv': B}
            send(output)
        except Exception as e:send({'send':{}, 'recv': {'return': 0, 'err': str(format_exc())}})
    try:sleep(1/loarConfig['kernelFrequency'])
    except:pass