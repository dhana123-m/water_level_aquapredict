// ---------------- SPLASH (only if exists) ----------------
const splash = document.getElementById("splash");
const loginContainer = document.getElementById("login-container");

if (splash && loginContainer) {
  setTimeout(() => {
    splash.style.display = "none";
    loginContainer.classList.remove("hidden");
  }, 2500);
}


// ---------------- LOGIN ----------------
function login() {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {

    if (data.error) {
      msg.innerText = data.error;
      msg.style.color = "red";
    }
    else {

      if (data.role === "farmer") {
        window.location.href = "farmdash.html";
      }
      else if (data.role === "civilian") {
        window.location.href = "civdash.html";
      }
      else if (data.role === "authority") {
        window.location.href = "authdash.html";
      }
      else {
        msg.innerText = "Unknown role";
      }

    }

  })
  .catch(() => {
    msg.innerText = "Server error";
  });
}


// ================================
// FARM DASHBOARD - RUN PREDICTION
// ================================

let chartInstance = null;

function runPrediction(){

  fetch("http://127.0.0.1:5000/predict", {
    method:"POST",
    credentials:"include"
  })
  .then(res => res.json())
  .then(data => {

  if(data.error){
    alert(data.error);
    window.location.href = "index.html";
    return;
  }

  const predictions = data.prediction;


    // ---------- DATE LABELS ----------
    let labels = [];
    let today = new Date();

    for(let i=0;i<predictions.length;i++){
      let d = new Date();
      d.setDate(today.getDate() + i);
      labels.push(d.toLocaleDateString());
    }

    // ---------- DRAW GRAPH ----------
    const ctx = document.getElementById("predictionChart");

    if(chartInstance){
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx,{
      type:"line",
      data:{
        labels:labels,
        datasets:[{
          label:"Predicted Water Level",
          data:predictions,
          fill:false,
          borderColor:"#00b4d8",
          tension:0.3
        }]
      }
    });

    // ---------- UPDATE CARDS ----------
    document.getElementById("dateValue").innerText =
      new Date().toLocaleDateString();

    document.getElementById("waterValue").innerText =
      predictions[0].toFixed(2);

    document.getElementById("timeValue").innerText =
      new Date().toLocaleTimeString();

    // ---------- CROP SUGGESTIONS ----------
    generateCrops(predictions[0]);

  })
  .catch(()=>{
    alert("Server error");
  });

}


// ================================
// CROP LOGIC
// ================================

function generateCrops(level){

  const cropList = document.getElementById("cropList");
  cropList.innerHTML = "";

  let crops = [];

  if(level >= 10){
    crops = ["Rice", "Sugarcane", "Banana"];
  }
  else if(level >= 7){
    crops = ["Wheat", "Maize", "Groundnut"];
  }
  else{
    crops = ["Millets", "Pulses", "Chickpea"];
  }

  crops.forEach(c=>{
    let li = document.createElement("li");
    li.innerText = c;
    cropList.appendChild(li);
  });

}


// ================= LOGOUT =================
function logout(){
  fetch("http://127.0.0.1:5000/logout", {
    method:"GET",
    credentials:"include"
  })
  .then(()=>{
    window.location.href = "index.html";
  });
}


// ================= THRESHOLD =================

function saveThreshold(){

  const threshold = document.getElementById("thresholdInput").value;
  const msg = document.getElementById("thresholdMsg");

  if(!threshold){
    msg.innerText = "Please enter threshold value";
    msg.style.color = "red";
    return;
  }

  fetch("http://127.0.0.1:5000/set-threshold",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    credentials:"include",
    body: JSON.stringify({ threshold })
  })
  .then(res => res.json())
  .then(data => {

    if(data.error){
      msg.innerText = data.error;
      msg.style.color = "red";
    }
    else{
      msg.innerText = "Threshold updated successfully";
      msg.style.color = "green";
    }

  })
  .catch(()=>{
    msg.innerText = "Server error";
    msg.style.color = "red";
  });

}


// ================= NOTIFICATIONS =================

// auto load when notification page opens
if(window.location.pathname.includes("notification.html")){
  loadNotifications();
}

let voiceText = "";

// get threshold + predictions and compare
function loadNotifications(){

  fetch("http://127.0.0.1:5000/get-threshold",{
    credentials:"include"
  })
  .then(res => res.json())
  .then(thresholdData => {

    const threshold = thresholdData.threshold;

    fetch("http://127.0.0.1:5000/predict",{
      method:"POST",
      credentials:"include"
    })
    .then(res => res.json())
    .then(predData => {

      const list = document.getElementById("notificationList");
      list.innerHTML = "";

      const predictions = predData.prediction;

      let dangerFound = false;

      for(let i=0;i<predictions.length;i++){
        if(predictions[i] > threshold){   // IMPORTANT LOGIC
          dangerFound = true;
          break;
        }
      }

      if(dangerFound){

        list.innerHTML =
          "<li class='danger'>⚠ Water level may fall below safe limit</li>";

        voiceText =
          "Warning. Water level may fall below safe limit in coming days.";

      }
      else{

        list.innerHTML =
          "<li class='safe'>✅ No threat detected</li>";

        voiceText =
          "No threat detected. Water level is safe.";

      }

    });

  });

}



// ================= PROFILE =================

if(window.location.pathname.includes("profile.html")){
  loadProfile();
}

function loadProfile(){

  fetch("http://127.0.0.1:5000/get-profile",{
    credentials:"include"
  })
  .then(res => res.json())
  .then(data => {

    document.getElementById("profileEmail").value = data.email;
    document.getElementById("profileRole").value = data.role;
    document.getElementById("profileLat").value = data.latitude || "Not set";
    document.getElementById("profileLon").value = data.longitude || "Not set";
    document.getElementById("profileThreshold").value = data.threshold;

  });

}

function updateProfile(){

  const email = document.getElementById("profileEmail").value;
  const threshold = document.getElementById("profileThreshold").value;
  const msg = document.getElementById("profileMsg");

  fetch("http://127.0.0.1:5000/update-profile",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    credentials:"include",
    body: JSON.stringify({ email, threshold })
  })
  .then(res => res.json())
  .then(data => {

    msg.innerText = data.message;
    msg.style.color = "green";

  });

}

function changePassword(){

  const password = document.getElementById("newPassword").value;
  const msg = document.getElementById("profileMsg");

  if(!password){
    msg.innerText = "Enter new password";
    msg.style.color = "red";
    return;
  }

  fetch("http://127.0.0.1:5000/change-password",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    credentials:"include",
    body: JSON.stringify({ password })
  })
  .then(res => res.json())
  .then(data => {

    msg.innerText = data.message;
    msg.style.color = "green";

  });

}

// ========== CIVILIAN DASH ==========

function runPredictionCivil(){

  fetch("http://127.0.0.1:5000/predict",{
    method:"POST",
    credentials:"include"
  })
  .then(res => res.json())
  .then(data => {

    if(data.error){
      alert(data.error);
      return;
    }

    const predictions = data.prediction;

    let labels = [];
    let today = new Date();

    for(let i=0;i<predictions.length;i++){
      let d = new Date();
      d.setDate(today.getDate()+i);
      labels.push(d.toLocaleDateString());
    }

    const ctx = document.getElementById("predictionChart");

    if(chartInstance){
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx,{
      type:"line",
      data:{
        labels:labels,
        datasets:[{
          label:"Predicted Water Level",
          data:predictions,
          borderColor:"#00b4d8",
          tension:0.3
        }]
      }
    });

    document.getElementById("dateValue").innerText =
      new Date().toLocaleDateString();

    document.getElementById("waterValue").innerText =
      predictions[0].toFixed(2);

    document.getElementById("timeValue").innerText =
      new Date().toLocaleTimeString();

    generateSavingTips(predictions[0]);

  });
}


// ========== WATER SAVING LOGIC ==========

function generateSavingTips(level){

  const list = document.getElementById("savingList");
  list.innerHTML="";

  let tips=[];

  if(level > 10){
    tips=[
      "Use water only when necessary",
      "Harvest rainwater",
      "Fix leakages immediately",
      "Avoid washing vehicles with hose"
    ];
  }
  else{
    tips=[
      "Use water responsibly",
      "Prefer bucket instead of hose",
      "Reuse grey water where possible"
    ];
  }

  tips.forEach(t=>{
    let li=document.createElement("li");
    li.innerText=t;
    list.appendChild(li);
  });

}

// ========== AUTHORITY DASHBOARD ==========

function searchBorewell(){

  const id = document.getElementById("borewellId").value;
  const msg = document.getElementById("authMsg");

  if(!id){
    msg.innerText = "Enter Borewell ID";
    msg.style.color = "red";
    return;
  }

  fetch("http://127.0.0.1:5000/get-borewell/" + id,{
    credentials:"include"
  })
  .then(res => res.json())
  .then(data => {

    if(data.error){
      msg.innerText = data.error;
      msg.style.color = "red";
      return;
    }

    document.getElementById("r_id").innerText = data.id;
    document.getElementById("r_user").innerText = data.user_id;
    document.getElementById("r_lat").innerText = data.latitude;
    document.getElementById("r_lon").innerText = data.longitude;

    msg.innerText = "Borewell Found";
    msg.style.color = "green";

  });

}

// ===== AUTHORITY RUN PREDICTION =====

function runAuthorityPrediction(){

  const id = document.getElementById("borewellId").value;

  if(!id){
    alert("Enter Borewell ID first");
    return;
  }

  fetch("http://127.0.0.1:5000/predict-by-borewell/" + id,{
    method:"POST",
    credentials:"include"
  })
  .then(res => res.json())
  .then(data => {

    if(data.error){
      alert(data.error);
      return;
    }

    const predictions = data.prediction;

    let labels=[];
    let today=new Date();

    for(let i=0;i<predictions.length;i++){
      let d=new Date();
      d.setDate(today.getDate()+i);
      labels.push(d.toLocaleDateString());
    }

    const ctx=document.getElementById("predictionChart");

    if(chartInstance){
      chartInstance.destroy();
    }

    chartInstance=new Chart(ctx,{
      type:"line",
      data:{
        labels:labels,
        datasets:[{
          label:"Predicted Water Level",
          data:predictions,
          borderColor:"#00b4d8",
          tension:0.3
        }]
      }
    });

  });
}

// ================= AUTHORITY NOTIFICATION =================

function loadAuthorityNotification(){

  const id = document.getElementById("borewellIdInput").value;
  const list = document.getElementById("authorityNotificationList");

  if(!id){
    list.innerHTML = "<li>Please enter Borewell ID</li>";
    return;
  }

  fetch("http://127.0.0.1:5000/get-threshold",{
    credentials:"include"
  })
  .then(res => res.json())
  .then(thresholdData => {

    const threshold = thresholdData.threshold;

    fetch("http://127.0.0.1:5000/predict-by-borewell/" + id,{
      method:"POST",
      credentials:"include"
    })
    .then(res => res.json())
    .then(predData => {

      if(predData.error){
        list.innerHTML = "<li>" + predData.error + "</li>";
        return;
      }

      const predictions = predData.prediction;

      let dangerFound = false;

      for(let i=0;i<predictions.length;i++){
        if(predictions[i] > threshold){
          dangerFound = true;
          break;
        }
      }

      if(dangerFound){

        list.innerHTML =
          "<li class='danger'>⚠ Water level may fall below safe limit</li>";

        voiceText =
          "Warning. Water level may fall below safe limit in coming days.";

      }
      else{

        list.innerHTML =
          "<li class='safe'>✅ No threat detected</li>";

        voiceText =
          "No threat detected. Water level is safe.";

      }

    });

  });

}


// ================= REAL VOICE ALERT =================

function playVoiceAlert(){

  let language = document.getElementById("langSelect").value;

  let file = "";

  if(voiceText.includes("Warning")){
    // danger case
    if(language === "en"){
      file = "audio/danger_en.mpeg";
    }else{
      file = "audio/danger_ta.mpeg";
    }
  }else{
    // safe case
    if(language === "en"){
      file = "audio/safe_en.mpeg";
    }else{
      file = "audio/safe_ta.mpeg";
    }
  }

  let audio = document.getElementById("ttsPlayer");
  audio.src = file;
  audio.load();
  audio.play();
}
