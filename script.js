/****************************************************
 * CONFIG
 ****************************************************/
const sheetURL =
"https://docs.google.com/spreadsheets/d/e/2PACX-1vSzQ3NQEMYkrIgKdM3jvY0BWocRlLst3mIDdjY7dxSdDGHZO13jiTs_nR5AQMiRDd2xei2ivWW5iXyd/pub?gid=114836263&single=true&output=csv";

// WEBHOOK DEFINITIVO

const webhookURL = "https://script.google.com/macros/s/AKfycbwtEgf_i0xiFHLdYOn65nhIlQdZ7uaVP324EwLrArGKw51AHqzdpiKXsbkTqKCUygDJUQ/exec";



/****************************************************
 * NORMALIZAR
 ****************************************************/
function normalizar(txt) {
    return txt
        ?.normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/****************************************************
 * VARIABLES
 ****************************************************/
let jugadores = [];

/****************************************************
 * CARGAR JUGADORES
 ****************************************************/
async function cargarJugadores() {
    const response = await fetch(sheetURL);
    const data = await response.text();
    const rows = data.split("\n").map(r =>
        r.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
    );

    const headers = rows[0].map(h => h.replace(/^"|"$/g, "").toLowerCase());
    const colNombre = headers.indexOf("nombre");
    const colDeporte = headers.indexOf("deporte");
    const colDivision = headers.indexOf("division");

    jugadores = rows.slice(1).map(r => {
        if (!r[colNombre]) return null;

        return {
            nombre: r[colNombre].replace(/^"|"$/g, "").trim(),
            deporte: normalizar(r[colDeporte]),
            division: normalizar(r[colDivision])
        };
    }).filter(x => x);

    console.log("JUGADORES CARGADOS:", jugadores);
}

/****************************************************
 * ACTUALIZAR SELECTS
 ****************************************************/
function actualizarJugadores(deporte, A, B, divisionSelect) {

    A.innerHTML = `<option value="">Selecciona jugador</option>`;
    B.innerHTML = `<option value="">Selecciona jugador</option>`;

    const depNorm = normalizar(deporte);
    const candidatos = jugadores.filter(j => j.deporte === depNorm);

    A.dataset.candidatos = JSON.stringify(candidatos);
    B.dataset.candidatos = JSON.stringify(candidatos);

    if (divisionSelect.value !== "") {
        filtrarPorDivision(divisionSelect, A, B);
    }
}

function filtrarPorDivision(divisionSelect, A, B) {

    const division = normalizar(divisionSelect.value);
    const candidatos = JSON.parse(A.dataset.candidatos || "[]");

    const filtrados = candidatos.filter(j => j.division === division);

    A.innerHTML = `<option value="">Selecciona jugador</option>`;
    B.innerHTML = `<option value="">Selecciona jugador</option>`;

    filtrados.forEach(j => {
        A.innerHTML += `<option value="${j.nombre}">${j.nombre}</option>`;
        B.innerHTML += `<option value="${j.nombre}">${j.nombre}</option>`;
    });
}

/****************************************************
 * ENVIAR RESULTADOS
 ****************************************************/
function activarEnvioResultados() {
    const form = document.getElementById("resultForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            jugadorA: document.getElementById("jugadorA").value,
            jugadorB: document.getElementById("jugadorB").value,
            deporte: document.getElementById("deporte").value,
            division: document.getElementById("division").value,
            set1: document.getElementById("set1").value,
            set2: document.getElementById("set2").value,
            set3: document.getElementById("set3").value
        };

        console.log("ENVIANDO:", payload);

        await fetch(webhookURL + "?json=" + encodeURIComponent(JSON.stringify(payload)));


        alert("✔ Resultado enviado correctamente");
        form.reset();
    });
}

/****************************************************
 * INICIO
 ****************************************************/
document.addEventListener("DOMContentLoaded", async () => {

    const deporte = document.getElementById("deporte");
    const division = document.getElementById("division");
    const A = document.getElementById("jugadorA");
    const B = document.getElementById("jugadorB");

    if (deporte && division && A && B) {

        await cargarJugadores();
        activarEnvioResultados();

        deporte.addEventListener("change", () => {
            actualizarJugadores(deporte.value, A, B, division);
        });

        division.addEventListener("change", () => {
            filtrarPorDivision(division, A, B);
        });
    }
});






