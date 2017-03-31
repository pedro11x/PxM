function createContext(w, h){
    canvas = document.getElementById('viewport');
    canvas.height = h;
    canvas.width = w;
    return canvas.getContext('2d');
}

document.getElementById('file-selector').addEventListener('change', function(e){
    let file = e.target.files[0];
    if(file){
        /*Updating progress*/progress('imgloadprogress', 5);
        readTextFile(file).then((text)=>{
            window.text = text;
            console.info('File read.',text.length,'bytes.')
            /*Updating progress*/progress('imgloadprogress', 15);
            readTextAndRender(text);
        }).catch(console.error);
    }
});

function getNextValue(data){
    let values = data.text.split(/\w+\s+/);
    data.text = values[1];
    return values[0];
}

function readTextFile(file){
    return new Promise(function(resolve, reject){
        let reader = new FileReader();
        reader.onload = function (e) {
            resolve(e.target.result);
        }
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function PXMImage(text){}

PXMImage.TYPE = {
    PBM:'P1',
    PGM:'P2',
    PPM:'P3',
    PBMB:'P4',
    PGMB:'P5',
    PPMB:'P6'
};

function readTextAndRender(text){
    text = text.replace(/^[#]+.*/m,'');//<-- Removing comments
    
    let data = text.split(/\s+/) || [];
    let header = readHeader(data);
    let type = header.type;
    let width = header.width;
    let heigth = header.height;
    let depth = header.depth;
    console.log('PXM file read. The following attributes were found:', header);
    window.ctx = createContext(width, heigth);
    
    /*Updating progress*/progress('imgloadprogress', 20);
    
    render(ctx, width, heigth, depth, data, type);
}

function render(ctx, width, height, depth, data, type){
    let img = new ImageData(width, height);
    
    switch(type){
        case PXMImage.TYPE.PPM:
            renderPPM(img, width, height, depth, data);
            break;
        case PXMImage.TYPE.PGM:
            renderPGM(img, width, height, depth, data);
            break;
        case PXMImage.TYPE.PBM:
            renderPGM(img, width, height, 1, data);
            break;
        default:
            console.error('File not suported!');
    }
    
    ctx.putImageData(img, 0, 0);
    console.info('Rendering has finished.', img);
    /*Updating progress*/progress('imgloadprogress', 100);
}

function renderPPM(img, width, height, depth, data){
    let ppmcomponents = 3;
    let imgcomponents = 4;
    let npixels = (width * height);
    
    for(let i = 0; i < npixels; i++){
        let ppmoffset = i * ppmcomponents;
        let imgoffset = i * imgcomponents;
        img.data[imgoffset + 0] = Math.round(data[ppmoffset + 0]/depth*255);
        img.data[imgoffset + 1] = Math.round(data[ppmoffset + 1]/depth*255);
        img.data[imgoffset + 2] = Math.round(data[ppmoffset + 2]/depth*255);
        img.data[imgoffset + 3] = 255; //overriding alpha
        
        /*Updating progress*/
        if((i%(Math.round(npixels/10)))==0){let p=20 + Math.round(80 * (i/npixels));progress('imgloadprogress', p);console.log('progress',p)}
    }
}

function renderPGM(img, width, height, depth, data){
    let imgcomponents = 4;
    let npixels = (width * height);
    
    for(let i = 0; i < npixels; i++){
        let ppmoffset = i ;
        let imgoffset = i * imgcomponents;
        let pvalue = Math.round(data[ppmoffset]/depth*255);
        img.data[imgoffset + 0] = pvalue;
        img.data[imgoffset + 1] = pvalue;
        img.data[imgoffset + 2] = pvalue;
        img.data[imgoffset + 3] = 255; //overriding alpha
    }
}

function renderPBMB(img, width, height, data){
    let imgcomponents = 4;
    let npixels = (width * height);
    
    for(let i = 0; i < npixels; i++){
        let ppmoffset = i ;
        let imgoffset = i * imgcomponents * 8;
        for(let j = 0; j < 8; j++){
            let pvalue = ((data[ppmoffset] >> j) & 0x01)*255;
            img.data[imgoffset + j + 0] = pvalue;
            img.data[imgoffset + j + 1] = pvalue;
            img.data[imgoffset + j + 2] = pvalue;
            img.data[imgoffset + j + 3] = 255; //overriding alpha
        }
    }
}

function readHeader(data){
    let type = data.shift(),
        width= data.shift(),
        height= data.shift(),
        depth= !(type == PXMImage.TYPE.PBM || type == PXMImage.TYPE.PBMB)?data.shift():1;
    return {
        type: type,
        width: width,
        height: height,
        depth: depth
    };
}

function progress(id, value){
    window['pb'+id] = window['pb'+id] || {values: [], interval:null};
    window['pb'+id].values.push(value);
    window['pb'+id].interval = window['pb'+id].interval || setInterval(()=>{
        let pb = document.getElementById(id);
        let next = window['pb'+id].values.shift();
        if(next){
            if(pb.childNodes.length > 0){
                let span = pb.childNodes[0];
                span.style.width = next+'%';
                //console.log(next);
            }else
                pb.innerHTML = '<span style="width:'+next+'%"></span>';
            pb.classList.remove('done');
        }else{
            //pb.classList.add('done');
        }
        if(window['pb'+id].values.length == 0 && next == 100){
            window['pb'+id].interval = clearInterval(window['pb'+id].interval);
            setTimeout(_=>{pb.classList.add('done');}, 500);
        } 
    }, 100);
}