function createContext(w, h){
    canvas = document.getElementById('viewport');
    canvas.height = h;
    canvas.width = w;
    return canvas.getContext('2d');
}

document.getElementById('file-selector').addEventListener('change', function(e){
    let file = e.target.files[0];
    if(file){
        readTextFile(file).then((text)=>{
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
}

function renderPPM(img, width, height, data){
    let ppmcomponents = 3;
    let imgcomponents = 4;
    
    for(let i = 0; i < (width * height); i++){
        let ppmoffset = i * ppmcomponents;
        let imgoffset = i * imgcomponents;
        img.data[imgoffset + 0] = data[ppmoffset + 0];
        img.data[imgoffset + 1] = data[ppmoffset + 1];
        img.data[imgoffset + 2] = data[ppmoffset + 2];
        img.data[imgoffset + 3] = 255; //overriding alpha
    }
}

function renderPPM(img, width, height, data){
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