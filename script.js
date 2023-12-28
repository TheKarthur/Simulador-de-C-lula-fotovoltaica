// Parâmetros fixos
let G_ref = 800;
let k = 1.38 * Math.pow(10, -23);
let e = 1.60 * Math.pow(10, -19);
let m = 1.25, Eg = 1.1, Rs = 0.0075, Rp = 1000;
// Parâmetros do painel
let Voc_ref = 22.65, Isc_ref = 3.8, Vm_ref = 18.53, Im_ref = 3.592, Pm = 66.6, FF = 0.773, N = 36;

// Coeficientes de temperatura
let Beta = -82.8 * Math.pow(10, -3);
let Alpha = 1.15 * Math.pow(10, -2);
let Gama = -0.4, NOCT = 45;
let Kt = (45 - 20) / 800;

let V = 0, Id = 0, Irp = 0, pot = 0, Pmax = 0, Imax = 0, Vmax = 0, I = 0, Ia = 1;

let TmodK = 0;
let Tref = 0;
let TrefK = 0;
let Vtn = 0;

let IL = 0, Voc = 0, Pmp = 0;
let Ion = 0, Io = 0;
let Tmod = 0, G = 0;

// Função para baixar o HTML
function baixarHtml(url) {
    fetch(url)
        .then(response => {
            // Verifica se a resposta foi bem-sucedida (código 200)
            if (!response.ok) {
                throw new Error(`Falha ao baixar o HTML. Código de status: ${response.status}`);
            }
            // Retorna o conteúdo HTML da resposta
            return response.text();
        })
        .then(html => {
            // Imprime o conteúdo HTML
            const a = JSON.parse(html);
            console.log(a);
            console.log(a.temperatura)

            const input2 = document.getElementById('tmod');
            Tmod = Number(a.temperatura);
            input2.value = Tmod;
            input2.disabled = true;

            document.getElementById('ip-form').innerHTML='';

        })
        .catch(error => {
            // Se ocorrer um erro, imprime a mensagem de erro
            console.error(`Erro ao baixar o HTML: ${error.message}`);
        });
}

// Aguarde o carregamento completo da página
window.addEventListener('load', function () {    
    obterTemperatura();

    document.getElementById('ip-form').addEventListener('submit', function (event) {
        event.preventDefault();
        const ip = 'http://'+ document.getElementById('ip').value;
        console.log(ip);
        console.log(baixarHtml(ip));

        // Chama a função baixarHtml a cada 10 segundos
        setInterval(function () {
            console.log('Chamando baixarHtml a cada 10 segundos');
            baixarHtml(ip);
        }, 10000); // 10000 milissegundos = 10 segundos
    });

});




// Exibição no site
let curvas = [];

// Sua chave de API do OpenWeatherMap
const apiKey = "1a03b3c92fd5ba7788c8ce710d33557d";
// Cidade e país para Novo Hamburgo, Brasil
const cidade = "Novo Hamburgo";
const pais = "BR";
// URL da API do OpenWeatherMap
const apiUrl = `http://api.openweathermap.org/data/2.5/weather?q=${cidade},${pais}&appid=${apiKey}&units=metric`;

function obterTemperatura(){
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        const temperatura = data.main.temp;
        const temp = document.getElementById("temperatura")
        temp.value = temperatura;
        temp.disabled = true;
      })
      .catch(error => {
        console.error(`Erro ao obter a temperatura: ${error}`);
      });
  }

function buscaValores() {
    // Verifica se já existe uma curva no gráfico

    TmodK = 0; IL = 0; Voc = 0; Pmp = 0; Ion = 0; Io = 0; Ia = 0; I = 0; Id = 0; Irp = 0; pot = 0; V = 0; Pmax = 0; Vmax = 0; Imax = 0; eixoX = []; eixoY = [];

    const input1 = document.getElementById('temperatura');
    Tref = Number(input1.value);
    TrefK = 273 + Tref;
    Vtn = N * k * TrefK / e;    

    const input2 = document.getElementById('tmod');
    Tmod = Number(input2.value);

    const input3 = document.getElementById('irradiancia');
    G = Number(input3.value);

    Voc_ref = Number(document.getElementById('voc').value);
    Isc_ref = Number(document.getElementById('isc').value);
    Vm_ref = Number(document.getElementById('vm').value);
    Im_ref = Number(document.getElementById('im').value);
    Pm = Number(document.getElementById('pm').value);
    FF = Number(document.getElementById('ff').value);

    // Verifica se já existe uma curva com esses parâmetros
    const curvaExistente = curvas.find(curva => curva.label === `${G}W/m2 ${Tmod}°C`);
    if (!curvaExistente) {
        // Adiciona uma nova curva ao array
        const cor = getRandomColor();
        if (Tmod > 0 && Tmod <= 100 && G > 0 && G <= 1000) {
            curvas.push({ eixoX: [], eixoY: [], label: `${G}W/m2 ${Tmod}°C`, cor: cor });
            document.getElementById('voc').disabled = true;
            document.getElementById('isc').disabled = true;
            document.getElementById('vm').disabled = true;
            document.getElementById('im').disabled = true;
            document.getElementById('pm').disabled = true;
            document.getElementById('ff').disabled = true;
        }
        testaErros();
    } else {
        alert("Já existe uma curva com esses parâmetros no gráfico.");
    }
}


function limpaGrafico() {
    // Reativa as entradas correspondentes
    document.getElementById('voc').disabled = false;
    document.getElementById('isc').disabled = false;
    document.getElementById('vm').disabled = false;
    document.getElementById('im').disabled = false;
    document.getElementById('pm').disabled = false;
    document.getElementById('ff').disabled = false;

    curvas = [];
    document.getElementById('result-container').innerHTML = '';
    document.getElementById('simular').innerHTML = '<button class="comum" onclick="buscaValores()">Simular</button>'
}

function testaErros() {
    if (Tmod < 0 || G < 0) {
        alert("Os valores inseridos não podem ser menores que zero");
    } else if (G > 1000) {
        alert("A irradiância solar não pode ser maior que 1000W/m²");
    } else if (Tmod > 100) {
        alert("A temperatura do painel não pode ser maior que 100ºC");
    } else if (!G || !Tmod) {
        alert("Os valores não podem ser nulos");
    } else {
        resultado = calculo();
        resultado = parseFloat(resultado).toFixed(2);
        exibe(resultado);
        plotaGrafico();
    }
}

function exibe(resultado) {
    const result = document.getElementById('result-container');
    if(result.innerHTML==''){
        const simular = document.getElementById('simular');
        simular.innerHTML = '';
    }

    const html = `<h3 class="result-title">Potência máxima para G: ${G}W/m2 e T: ${Tmod}°C</h3>
       <div class="result">${resultado} W</div>
       <h4> Gráfico Corrente (A) / Tensão (V)</h4>
       <div class="graph-container"><canvas id="grafico"></canvas></div>
       <div id="button-container">
           <button class="comum" onclick="limpaGrafico()">Limpar Gráfico</button>
           <button class="comum" onclick="buscaValores()">Simular</button>
       </div>`;

    result.innerHTML = html;
}

function calculo() {
    TmodK = 273 + Tmod;
    IL = (Isc_ref + (Alpha * (Tmod - 25))) * G / 1000;
    Voc = Voc_ref + Beta * (Tmod - 25);
    Pmp = Vm_ref * Im_ref + (Gama * (Tmod - 25));
    Ion = Isc_ref / (Math.exp((Voc / (m * Vtn))) - 1);
    Io = Ion * Math.pow((TmodK / TrefK), 3) * (Math.exp(((e * Eg) / (m * k)) * ((1 / TrefK) - (1 / TmodK))));

    while (I >= 0) {
        for (let i = 0; i < 10; i++) {
            Ia = I;
            Id = Io * ((Math.exp((e / (N * m * k * TmodK)) * (V + Rs * I))) - 1);
            Irp = (V + I * Rs) / Rp;
            I = IL - Id - Irp;
        }

        pot = V * I;
        V = V + 0.1;

        curvas[curvas.length - 1].eixoX.push(V);
        curvas[curvas.length - 1].eixoY.push(I);

        if (Pmax < pot) {
            Pmax = pot;
            Vmax = V;
            Imax = I;
        }
    }
    return Pmax;
}

function plotaGrafico() {
    const graph = document.getElementById('grafico');

    // Remove o gráfico anterior
    if (Chart.instances.length > 0) {
        Chart.instances.forEach(instance => {
            instance.destroy();
        });
    }

    // Cria um novo gráfico com todas as curvas
    let chart = new Chart(graph, {
        type: 'line',
        data: {
            labels: curvas[0].eixoX.map(value => parseFloat(value).toFixed(2)),
            datasets: curvas.map(curva => ({
                label: curva.label,
                backgroundColor: curva.cor,
                data: curva.eixoY
            }))
        }
    });
}

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}