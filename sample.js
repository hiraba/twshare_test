"use strict";

//import
import "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation";
import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core";
import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter";
import "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl";
import "https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation";

//変数
const WIDTH  = 640;
const HEIGHT = 480;

let cvs1, ctxt1;
let cvs2, ctxt2;
let bcvs, bctxt;
let video;

let stream;
let segmenter;

//ページ読込時に実行
window.addEventListener("DOMContentLoaded",
    async () => {
      await Promise.all([
              Get_Element(),
              Load_Images(),
              Camera_Open(),
              Load_Modules()
        ]);
      Exe_Loop();
    }
)

//HTML Element取得
async function Get_Element(){
    cvs1    = document.getElementById("cvs1");
    cvs2    = document.getElementById("cvs2");
    bcvs    = document.createElement("canvas");
    
    ctxt1   = cvs1.getContext("2d");
    ctxt2   = cvs2.getContext("2d");
    bctxt   = bcvs.getContext("2d");

    cvs1.width  = cvs2.width  = bcvs.width  = WIDTH;
    cvs1.height = cvs2.height = bcvs.height = HEIGHT;

    video   = document.createElement("video");
}

//画像読込関数
async function load_image(path){
    const t_img = new Image();
    return new Promise(
        (resolve) => {
            t_img.onload = () => { resolve(t_img); };
            t_img.src = path;
        }
    );
}

//画像読込
async function Load_Images(){
    const b_img = await load_image("./003_1024_768.jpg");   //背景画像
    await bctxt.drawImage(b_img, 0, 0, bcvs.width, bcvs.height);
}

//モジュール類用意
async function Load_Modules(){
    const segmenterConfig = {
        runtime: 'mediapipe', 
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
        modelType: 'general'
      }

    const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation;
    segmenter = await bodySegmentation.createSegmenter(model, segmenterConfig);
}

//カメラ開始
async function Camera_Open(){

    stream = await navigator.mediaDevices.getUserMedia({
        video:  true,
        audio:  false
    });

    video.srcObject = stream;
    video.play();

}

//実行ループ
async function Exe_Loop(){

    await ctxt1.drawImage(video, 0, 0, 640, 480);
    await back_comp_execute();

    window.requestAnimationFrame(Exe_Loop);

}



//背景合成
async function back_comp_execute(){

    let DspImgData = ctxt2.getImageData(0, 0, cvs2.width, cvs2.height);
    let f_img_data = ctxt1.getImageData(0, 0, cvs1.width, cvs1.height);
    let b_img_data = bctxt.getImageData(0, 0, bcvs.width, bcvs.height);

    let segmentDATA = await segmenter.segmentPeople(cvs1).then(
        (result) => {
            return result[0].mask.toImageData();
        }
    );

    for(let i = 0; i < cvs1.height; i++){
        for(let j = 0; j < cvs1.width; j++){
            const n = i * cvs1.width + j;
            let w = segmentDATA.data[4 * n + 3] / 255;

            DspImgData.data[4 * n + 0] = Math.floor( f_img_data.data[4 * n + 0] * w + b_img_data.data[4 * n + 0] * (1 - w) );
            DspImgData.data[4 * n + 1] = Math.floor( f_img_data.data[4 * n + 1] * w + b_img_data.data[4 * n + 1] * (1 - w) );
            DspImgData.data[4 * n + 2] = Math.floor( f_img_data.data[4 * n + 2] * w + b_img_data.data[4 * n + 2] * (1 - w) );
            DspImgData.data[4 * n + 3] = Math.floor( f_img_data.data[4 * n + 3] * w + b_img_data.data[4 * n + 3] * (1 - w) );
        }
    }

    ctxt2.putImageData(DspImgData, 0, 0);
}