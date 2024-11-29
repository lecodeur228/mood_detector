
const URL = "https://teachablemachine.withgoogle.com/models/YgSmRV9nm/";
let model, webcam, ctx, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Charger le modèle et les métadonnées
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Initialiser la webcam
    const size = 300;
    const flip = true; // Activer le mirroring
    webcam = new tmPose.Webcam(size, size, flip);
    await webcam.setup(); // Demander l'accès à la webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // Configurer le canvas
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");

    // Préparer les containers de labels
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Estimation de la pose via le modèle
    const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
    const prediction = await model.predict(posenetOutput);

    let moodOverlay = document.getElementById("mood-overlay");
    moodOverlay.classList.add("hidden"); // Masquer par défaut

    // Afficher les prédictions dans les labels
    prediction.forEach((pred, index) => {
        const probability = pred.probability.toFixed(2);
        const className = pred.className;

        labelContainer.childNodes[index].innerHTML = 
            `${className}: <span class="text-gray-400">${probability}</span>`;
        
        // Afficher l'emoji seulement si la probabilité est élevée
        if (probability > 0.8) {
            moodOverlay.innerHTML = className === "Souriant" 
                ? "😊" 
                : className === "Neutre" 
                ? "😐" 
                : "😢";
            moodOverlay.classList.remove("hidden");
        }
    });

    drawPose(pose);
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0); // Dessiner la webcam
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx); // Points clés
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx); // Squelette
        }
    }
}
