import inspect
from sys import argv
from os import system, listdir, path
from json import dump, dumps, loads
from threading import Thread
from time import sleep

parent = path.dirname(__file__).replace('\\', '/')+'/'
if 'kernel' in listdir(parent):
    print(parent+'kernel')

#The modules imported will be here (These are just types do not touch them)
M = {'int': int, 'str': str, 'bool': bool, 'NoneType': type(None), 'dict':  dict, 'list':  list}

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
        with open('ULP.json')as f:
            x = loads(f.read())
            return x
    except:return {'send': {}, 'recv': {}}

def get():
    with open('ULP')as f:
        return f.read()

def Set():
    with open('ULP', 'w')as f:
        f.write('')

def send(data):
    with open('ULP.json', 'w')as f:
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
            args = x['send']['args']
            kwargs = x['send']['kwargs']
            B = A(*args, **kwargs)
            output = {'send': {}, 'recv': {'return': B}}
        send(output)
        sleep(.04)