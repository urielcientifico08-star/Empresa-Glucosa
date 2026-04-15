let datos = [100];
let etiquetas = ["Inicio"];
let grafica;

let usuarioActual = null;
let rechazosEmergencia = 0;
let rechazosSoporte = 0;
let ultimoEventoCritico = false;

// 🔊 AUDIO (CORREGIDO)
let alarma = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");

// 📊 gráfica
window.onload = function () {
  const ctx = document.getElementById("grafica").getContext("2d");

  grafica = new Chart(ctx, {
    type: "line",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Glucosa",
        data: datos,
        borderColor: "blue"
      }]
    }
  });
};

// 🧠 CLASIFICACIÓN
function clasificarGlucosa(valor) {
  if (valor < 70) return "Bajo";
  if (valor <= 140) return "Normal";
  if (valor <= 200) return "Elevado";
  if (valor <= 300) return "Alto";
  return "Crítico";
}

// 🔴 SIMULAR
function simular() {

  let valor;

  // 🎯 PROBABILIDAD CONTROLADA
  let prob = Math.random();

  // 🔴 1 de cada ~12 → CRÍTICO
  if (prob < 0.08) {

    // 50% bajo, 50% muy alto
    if (Math.random() < 0.5) {
      valor = Math.floor(Math.random() * (59 - 40) + 40); // hipoglucemia
    } else {
      valor = Math.floor(Math.random() * (350 - 301) + 301); // hiperglucemia crítica
    }

    ultimoEventoCritico = true;
  }

  // 🟠 1 de cada ~10 → ALTO (200–300)
  else if (prob < 0.18) {
    valor = Math.floor(Math.random() * (300 - 200) + 200);

    // 🔥 POSIBILIDAD DE 2 ALTAS SEGUIDAS
    if (Math.random() < 0.4) {
      setTimeout(() => {
        simular(); // genera otra alta después
      }, 2000);
    }
  }

  // 🟢 NORMAL / VARIACIÓN
  else {
    let base = 120;
    let variacion = Math.random() * 60 - 30;
    valor = Math.floor(base + variacion);

    ultimoEventoCritico = false;
  }

  // 📊 MOSTRAR
  document.getElementById("glucosa").innerText =
    valor + " mg/dL (" + clasificarGlucosa(valor) + ")";

  datos.push(valor);
  etiquetas.push("Medida " + datos.length);

  guardarHistorial(valor);
  actualizarPromedio();

  // 📳 vibración leve
  if (navigator.vibrate) navigator.vibrate(200);

  // 🚨 CRÍTICO
  if (valor < 60 || valor > 300) {

    registrarEvento("CRÍTICO", valor);

    if (ultimoEventoCritico) rechazosEmergencia++;

    grafica.data.datasets[0].borderColor = "red";

    alarma.currentTime = 0;
    alarma.play().catch(()=>{});

    mostrarEmergencia();
  }

  // 📞 SOPORTE (200–300)
  else if (valor >= 200 && valor <= 300) {

    grafica.data.datasets[0].borderColor = "orange";

    let soporte = confirm("Nivel alto ¿Contactar soporte?");

    if (soporte) {
      rechazosSoporte = 0;
      contactarSoporte();
    } else {
      rechazosSoporte++;
    }

    // 🔥 2 RECHAZOS → LLAMADA AUTOMÁTICA
    if (rechazosSoporte >= 2) {
      alert("⚠️ Se llamará automáticamente a soporte");
      contactarSoporte();
      rechazosSoporte = 0;
    }
  }

  else {
    grafica.data.datasets[0].borderColor = "green";
  }

  grafica.update();
}

// 🚨 EMERGENCIA
function mostrarEmergencia() {

  let modal = document.createElement("div");
  modal.id = "modalEmergencia";

  modal.innerHTML = `
  <div style="position:fixed;top:0;left:0;width:100%;height:100%;
  background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;">
    <div style="background:white;color:black;padding:20px;border-radius:10px;">
      <h2>🚨 NIVEL CRÍTICO 🚨</h2>
      <p>¿Estás consciente?</p>
      <h3 id="contador">15</h3>
      <button onclick="responderEmergencia(true)">Sí</button>
      <button onclick="responderEmergencia(false)">No</button>
    </div>
  </div>
  `;

  document.body.appendChild(modal);

  let tiempo = 15;

  let intervalo = setInterval(() => {
    tiempo--;
    document.getElementById("contador").innerText = tiempo;

    if (tiempo <= 0) {
      clearInterval(intervalo);
      llamar911();
    }
  }, 1000);

  window.intervaloEmergencia = intervalo;
}

// 🧠 RESPUESTA
function responderEmergencia(estado) {
  clearInterval(window.intervaloEmergencia);
  document.getElementById("modalEmergencia").remove();

  if (!estado) {
    llamar911();
  } else {
    let llamar = confirm("¿Llamar al 911?");
    if (llamar) {
      rechazosEmergencia = 0;
      llamar911();
    } else {
      rechazosEmergencia++;
    }
  }

  if (rechazosEmergencia >= 2) {
    llamar911();
    rechazosEmergencia = 0;
  }
}

// 📞
function llamar911() {
  alert("📞 Llamando al 911...");
  notificarSoporte();

  // 📍 ubicación
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      console.log("Ubicación:", pos.coords.latitude, pos.coords.longitude);
    });
  }
}

// 📩
function notificarSoporte() {
  console.log("⚠️ Notificación enviada a soporte");
}

// 👤 REGISTRO
function registrar() {

  let nombre = document.getElementById("nombre").value;
  let correo = document.getElementById("correo").value;
  let pass = document.getElementById("pass").value;

  if (!nombre || !correo || !pass) {
    alert("Completa todos los campos");
    return;
  }

  let user = { nombre, correo, pass, historial: [] };

  localStorage.setItem(nombre, JSON.stringify(user));
  alert("Registrado");
}

// 🔐 LOGIN
function login() {
  let nombre = document.getElementById("loginNombre").value;
  let pass = document.getElementById("loginPass").value;

  let user = JSON.parse(localStorage.getItem(nombre));

  if (user && user.pass === pass) {
    usuarioActual = user;
    mostrarSeccion("config");
    mostrarHistorial();
  } else {
    alert("Error");
  }
}

// 💾 HISTORIAL
function guardarHistorial(valor) {
  if (!usuarioActual) return;

  let registro = {
    valor: valor,
    fecha: new Date().toLocaleString()
  };

  usuarioActual.historial.push(registro);
  localStorage.setItem(usuarioActual.nombre, JSON.stringify(usuarioActual));
  mostrarHistorial();
}

// 📊 MOSTRAR
function mostrarHistorial() {
  let lista = document.getElementById("historial");
  lista.innerHTML = "";

  if (!usuarioActual) return;

  usuarioActual.historial.forEach(r => {
    let li = document.createElement("li");
    li.textContent = r.valor + " mg/dL - " + r.fecha;
    lista.appendChild(li);
  });
}

// 📈 PROMEDIO
function actualizarPromedio() {
  if (!usuarioActual || usuarioActual.historial.length === 0) return;

  let suma = usuarioActual.historial.reduce((a, b) => a + b.valor, 0);
  let prom = (suma / usuarioActual.historial.length).toFixed(1);

  document.getElementById("promedio").innerText = "Promedio: " + prom;
}

// 📡
function conectarBluetooth() {
  alert("🔵 Conectando...");
}

// 📞
function contactarSoporte() {
  alert("📞 Contactando soporte...");
}

// 📂 EVENTOS
function registrarEvento(tipo, valor) {
  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  eventos.push({
    tipo,
    valor,
    fecha: new Date().toLocaleString()
  });

  localStorage.setItem("eventos", JSON.stringify(eventos));
}

// 🔄
function mostrarSeccion(id) {
  document.getElementById("inicio").style.display = "none";
  document.getElementById("config").style.display = "none";
  document.getElementById(id).style.display = "block";
}