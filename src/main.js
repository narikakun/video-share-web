let ws = null;
let already = false;
let video, media, sendInterval;
const cameraSize = { w: 180, h: 120 };

window.onload = function () {
    let urlParams = (new URL(document.location)).searchParams;
    let sender = urlParams.get("sender")?true:false;

    ws = new WebSocket('ws://videoshareweb-websocket.nakn.jp:3000');
    ws.binaryType = "blob";

    ws.onopen = function(evt) {
        ws.onmessage = async function(evt) {
            let blob = new Blob([evt.data], { type: 'text/plain' });
            let stringData = await blob.text();
            let data = JSON.parse(stringData);
            console.log(`${data.w} ${data.h}`);
            let cvs = document.getElementById('canvas');
            cvs.style = "display: block;";
            let ctx= cvs.getContext('2d');
            let img = new Image();
            if (data.base64) {
                showCanvas(inflate(data.base64), data.w, data.h);
            }
            function showCanvas (base64, w, h) {
                ctx.save();
                img.src = "data:image/png;base64," + base64;
                img.onload = function(){
                    ctx.drawImage(img, 0, 0, cameraSize.w, cameraSize.h);
                    ctx.restore();
                }
            }
        }

        ws.onclose = function(evt){
            if (sendInterval) clearInterval(sendInterval);
            swal("エラー", "切断されました。再読み込みします。", "error")
                .then((value) => {
                    window.location.reload();
                })
        }

        if (sender) {
            if (already) return;
            already = true;
            const resolution = { w: 1080, h: 720 };
            video = document.createElement("video");
            video.id = "video";
            video.width = cameraSize.w;
            video.height = cameraSize.h;
            video.autoplay = true;
            document.getElementById("videoPreview").appendChild(video);
            media = navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    width: { ideal: resolution.w },
                    height: { ideal: resolution.h }
                }
            }).then(function (stream) {
                video.srcObject = stream;
            });

            sendInterval = setInterval(()=>{
                let base64 = getBase64();
                ws.send(JSON.stringify({"base64": deflate(base64.pic), "w": base64.w, "h": base64.h}));
            }, 100);
            function getBase64 () {
                let canvas = document.getElementById('canvas');
                let ctx = canvas.getContext("2d");
                let w = video.offsetWidth;
                let h = video.offsetHeight;
                canvas.setAttribute("width", String(w));
                canvas.setAttribute("height", String(h));
                ctx.drawImage(video, 0, 0, w, h);
                let base64 = canvas.toDataURL('image/png');
                let picture = base64.replace(/^data:\w+\/\w+;base64,/, '');
                return {pic: picture, w: w, h: h};
            }
        }
    }
    ws.onerror = function(evt) {
        console.log(evt);
        swal("エラー", "接続が出来ませんでした。", "error")
    }
}

// 圧縮関数 (要deflate.js)
function deflate(val) {
    val = encodeURIComponent(val); // UTF16 → UTF8
    val = RawDeflate.deflate(val); // 圧縮
    val = btoa(val); // base64エンコード
    return val;
}

// 復号関数 (要inflate.js)
function inflate(val) {
    val = atob(val); // base64デコード
    val = RawDeflate.inflate(val); // 復号
    val = decodeURIComponent(val); // UTF8 → UTF16
    return val;
}