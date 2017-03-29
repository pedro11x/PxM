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
            /*Updating progress*/progress('imgloadprogress', 15);
            readTextAndRender(text);
        }).catch(console.error);
    }
});

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
    PPM:'P3'
};

function readTextAndRender(text){
    let data = text.split(/\s+/) || [];
    let header = readHeader(data);
    let type = header.type;
    let width = header.width;
    let heigth = header.height;
    console.log('PXM file read. The following attributes were found:', header);
    window.ctx = createContext(width, heigth);
    
    /*Updating progress*/progress('imgloadprogress', 20);
    
    render(ctx, width, heigth, data, type);
}

function render(ctx, width, height, data, type){
    let img = ctx.createImageData(width, height);
    
    switch(type){
        case PXMImage.TYPE.PPM:
            renderPPM(img, width, height, data);
            break;
        case PXMImage.TYPE.PGM:
            renderPGM(img, width, height, data);
            break;
        default:
            console.error('File not suported!');
    }
    
    ctx.putImageData(img, 0, 0);
    console.info('Rendering has finished.', img);
    /*Updating progress*/progress('imgloadprogress', 100);
}

function renderPPM(img, width, height, data){
    let ppmcomponents = 3;
    let imgcomponents = 4;
    let npixels = (width * height);
    
    for(let i = 0; i < npixels; i++){
        let ppmoffset = i * ppmcomponents;
        let imgoffset = i * imgcomponents;
        img.data[imgoffset + 0] = data[ppmoffset + 0];
        img.data[imgoffset + 1] = data[ppmoffset + 1];
        img.data[imgoffset + 2] = data[ppmoffset + 2];
        img.data[imgoffset + 3] = 255; //overriding alpha
        
        /*Updating progress*/
        if((i%(Math.round(npixels/10)))==0){
            progress('imgloadprogress', 20 + Math.round(80 * (i/npixels)));
        }
    }
}

function renderPGM(img, width, height, data){
    let imgcomponents = 4;
    
    for(let i = 0; i < (width * height); i++){
        let ppmoffset = i ;
        let imgoffset = i * imgcomponents;
        img.data[imgoffset + 0] = data[ppmoffset];
        img.data[imgoffset + 1] = data[ppmoffset];
        img.data[imgoffset + 2] = data[ppmoffset];
        img.data[imgoffset + 3] = 255; //overriding alpha
    }
}

function readHeader(data){
    return {
        type: data.shift(),
        width: data.shift(),
        height: data.shift(),
        depth: data.shift()
    };
}

function progress(id, value){
    window['pb'+id] = window['pb'+id] || {values: [], interval:null};
    window['pb'+id].values.push(value);
    window['pb'+id].interval = window['pb'+id].interval || setInterval(()=>{
        let pb = document.getElementById(id);
        let next = window['pb'+id].values.shift();
        if(next && next < 100){
            if(pb.childNodes.length > 0){
                let span = pb.childNodes[0];
                span.style.width = next+'%';
                console.log(next);
            }else
                pb.innerHTML = '<span style="width:'+next+'%"></span>';
            pb.classList.remove('done');
        }else{
            pb.classList.add('done');
        }
    }, 100);
}