import './App.css';
import React from 'react';
import ListaTarefas from './ListaTarefas';
import Texto from './Texto';

const NOTAS = {
  // Frequências das notas
  "C-3": 130.813,
  "C#3": 138.591,
  "D-3": 146.832,
  "D#3": 155.563,
  "E-3": 164.814,
  "F-3": 174.614,
  "F#3": 184.997,
  "G-3": 195.998,
  "G#3": 207.652,
  "A-3": 220,
  "A#3": 233.082,
  "B-3": 246.942,
  "C-4": 261.626,
};

// Classe do Sintetizador

class Sintetizador {
  static AC = new AudioContext();

  // Tipos de formatos de onda
  static TIPOS = ['sine', 'square', 'triangle', 'sawtooth'];
  static TIPOS_ABR = ['sin', 'squ', 'tri', 'saw'];

  // ADSR (Attack, Decay, Sustain, Release)
  static ADSR_TARGETS = ['adsr', 'filtro'];

  // Valores máximos para os parâmetros
  static MAX_UNISON_WIDTH = 50;
  static MAX_ADSR_STAGE_DURATION = 2;
  static MAX_ECHO_DURATION = 2;
  static MIN_FILTER_FREQ = 40;
  static MAX_FILTER_Q = 30;

  // Valores padrão para os parâmetros
  static PARAM_PADRAO = {
    unisonWidth: 0,
    volume: 0.3,
    adsrAttack: 0.2,
    adsrDecay: 0,
    adsrSustain: 1,
    adsrRelease: 0.2,
    adsrTarget: 0,
    filterFreq: 0.5,
    filterQ: 0.2,
    echoTime: 0,
    echoFeedback: 0,
    waveform: 3
  };

  constructor(params = {}) {
    if (!Sintetizador.AC) throw Error('Web Audio não é suportado.');

    this.osciladores = new Array(3);

    // Adiciona os parâmetros padrão e os passados no construtor
    this.params = {
      ...Sintetizador.PARAM_PADRAO,
      ...params
    };

    this.nodes = {}; // Cria um objeto para os nós de áudio

    this.nodes.volume = Sintetizador.AC.createGain(); // Cria um nó de ganho para controlar o volume
    this.setParam('volume'); // Define o valor do parâmetro de volume

    this.nodes.adsr = Sintetizador.AC.createGain(); // Cria um nó de ganho para a seção ADSR

    this.nodes.filter = Sintetizador.AC.createBiquadFilter(); // Cria um nó de filtro biquad para controlar o filtro
    this.nodes.filter.type = 'lowpass'; // Define o tipo de filtro como passa-baixa
    this.setParam('filterFreq'); // Define o valor do parâmetro de frequência do filtro
    this.setParam('filterQ'); // Define o valor do parâmetro Q do filtro

    this.nodes.delay = Sintetizador.AC.createDelay(Sintetizador.MAX_ECHO_DURATION); // Cria um nó de atraso para o efeito de eco
    this.nodes.feedback = Sintetizador.AC.createGain(); // Cria um nó de ganho para controlar o feedback do eco
    this.setParam('echoTime'); // Define o valor do parâmetro de tempo do eco
    this.setParam('echoFeedback'); // Define o valor do parâmetro de feedback do eco

    this.nodes.analyser = Sintetizador.AC.createAnalyser(); // Cria um nó de analisador para visualização de forma de onda
    this.nodes.analyser.smoothingTimeConstant = 0.5; // Define a constante de tempo de suavização do analisador
    this.nodes.analyser.fftSize = 256; // Define o tamanho da FFT (Transformada Rápida de Fourier) para análise de frequência
    this.analyserBufferLength = this.nodes.analyser.frequencyBinCount; // Obtém o comprimento do buffer do analisador
    this.analyserData = new Uint8Array(this.analyserBufferLength); // Cria um array de bytes para armazenar os dados do analisador

    // Conecta os nós de áudio em uma cadeia de processamento
    this.nodes.adsr.connect(this.nodes.filter);
    this.nodes.filter.connect(this.nodes.delay);
    this.nodes.delay.connect(this.nodes.feedback);
    this.nodes.feedback.connect(this.nodes.delay);

    this.nodes.filter.connect(this.nodes.volume);
    this.nodes.feedback.connect(this.nodes.volume);

    this.nodes.volume.connect(this.nodes.analyser);
    this.nodes.analyser.connect(Sintetizador.AC.destination);
  }

  // Obtém os dados da forma de onda do nó de analisador
  getAnalyserData = () => {
    this.nodes.analyser.getByteTimeDomainData(this.analyserData); // Obtém os dados da forma de onda em formato de bytes
    return this.analyserData; // Retorna os dados da forma de onda
  };

  // Define um parâmetro do sintetizador
  setParam = (param, value = this.params[param]) => {
    if (param && param in this.params) this.params[param] = value; // Atualiza o valor do parâmetro se ele existir

    switch (param) {
      case 'volume':
        this.nodes.volume.gain.value = value; // Define o valor do parâmetro de volume no nó de ganho
        break;
      case 'filterFreq':
        this.nodes.filter.frequency.value = this.calcFreqValue(value); // Calcula e define o valor da frequência do filtro
        break;
      case 'filterQ':
        this.nodes.filter.Q.value = value * Sintetizador.MAX_FILTER_Q; // Define o valor do parâmetro Q do filtro
        break;
      case 'echoTime':
        this.nodes.delay.delayTime.value = value * Sintetizador.MAX_ECHO_DURATION; // Define o valor do parâmetro de tempo do eco
        break;
      case 'echoFeedback':
        this.nodes.feedback.gain.value = value; // Define o valor do parâmetro de feedback do eco
        break;
      case 'unisonWidth':
        const width = this.getUnisonWidth(value); // Calcula a largura do uníssono com base no valor do parâmetro
        this.osciladores[1].detune.value = -width; // Define o valor do detune do segundo oscilador com o valor negativo da largura
        this.osciladores[2].detune.value = width; // Define o valor do detune do terceiro oscilador com o valor da largura
        break;
      default:
        break;
    }
  };

  // Calcula a largura do uníssono com base em um valor relativo
  getUnisonWidth = (amt) => amt * Sintetizador.MAX_UNISON_WIDTH;

  // Calcula o valor absoluto da frequência com base em um valor relativo
  calcFreqValue = (amt) => Math.max(Sintetizador.MIN_FILTER_FREQ, amt * (Sintetizador.AC.sampleRate / 2));

  // Obtém o alvo do ADSR (Attack, Decay, Sustain, Release) com base no parâmetro adsrTarget
  getADSRTarget = () => {
    const tgtName = Sintetizador.ADSR_TARGETS[this.params.adsrTarget];
    switch (tgtName) {
      case 'filtro': {
        return this.nodes.filter.frequency; // Retorna o alvo como a frequência do nó de filtro
      }
      case 'adsr':
      default: {
        return this.nodes.adsr.gain; // Retorna o alvo como o ganho do nó de ADSR
      }
    }
  };

  // Obtém o valor do ADSR ajustado com base no alvo e no valor do parâmetro
  getADSRValue = (val) => {
    const tgtName = Sintetizador.ADSR_TARGETS[this.params.adsrTarget];
    switch (tgtName) {
      case 'filtro': {
        const tgt = this.calcFreqValue(val); // Calcula o valor absoluto da frequência do alvo
        const max = this.calcFreqValue(this.params.filterFreq); // Calcula o valor absoluto da frequência máxima permitida pelo filtro
        return Math.min(tgt, max); // Retorna o valor mínimo entre o valor do alvo e a frequência máxima
      }
      case 'adsr':
      default: {
        return val; // Retorna o valor do parâmetro sem modificação
      }
    }
  }

  // Ativa a reprodução de uma nota musical no sintetizador
  noteOn = (freq, t = 0) => {
    Sintetizador.AC.resume(); // Resume o contexto de áudio caso esteja em estado de suspensão

    this.killOscillators(t); // Interrompe a reprodução dos osciladores existentes

    const ct = Sintetizador.AC.currentTime; // Obtém o tempo atual do contexto de áudio

    const adsrTarget = this.getADSRTarget(); // Obtém o alvo do ADSR (Attack, Decay, Sustain, Release)

    // Define o ganho do nó de ADSR como 1 se o alvo não for o filtro
    if (this.params.adsrTarget !== 0) {
      this.nodes.adsr.gain.setValueAtTime(1, ct);
    }

    // Define a frequência do filtro se o alvo não for o ADSR
    if (this.params.adsrTarget !== 1) {
      this.nodes.filter.frequency.setValueAtTime(
        this.calcFreqValue(this.params.filterFreq),
        ct
      );
    }

    const atkDuration = this.params.adsrAttack * Sintetizador.MAX_ADSR_STAGE_DURATION;
    // Define o valor do ADSR no tempo atual e faz uma rampa linear até o valor 1 no tempo atual + duração do ataque
    adsrTarget.setValueAtTime(this.getADSRValue(0), ct);
    adsrTarget.linearRampToValueAtTime(this.getADSRValue(1), ct + atkDuration);

    const decayDuration = this.params.adsrDecay * Sintetizador.MAX_ADSR_STAGE_DURATION;
    // Define o valor do ADSR como um alvo no tempo atual + duração do ataque com a duração do decay
    adsrTarget.setTargetAtTime(
      this.getADSRValue(this.params.adsrSustain),
      ct + atkDuration,
      decayDuration
    );

    const width = this.getUnisonWidth(this.params.unisonWidth); // Calcula a largura do uníssono

    // Cria três osciladores com a frequência fornecida, o formato de onda e a largura do uníssono
    this.osciladores[0] = this.createOscillator(freq, this.params.waveform);
    this.osciladores[1] = this.createOscillator(freq, this.params.waveform, -width);
    this.osciladores[2] = this.createOscillator(freq, this.params.waveform, width);

    this.osciladores.forEach((osc) => osc.start(t)); // Inicia a reprodução dos osciladores no tempo fornecido
  };

  // Desativa a reprodução da nota musical
  noteOff = (t = 0) => {
    const ct = Sintetizador.AC.currentTime; // Obtém o tempo atual do contexto de áudio

    const relDuration = this.params.adsrRelease * Sintetizador.MAX_ADSR_STAGE_DURATION;
    this.killOscillators(ct + relDuration); // Interrompe a reprodução dos osciladores no tempo atual + duração de release

    const adsrTarget = this.getADSRTarget(); // Obtém o alvo do ADSR (Attack, Decay, Sustain, Release)

    adsrTarget.setValueAtTime(adsrTarget.value, ct); // Define o valor do alvo como o valor atual no tempo atual
    adsrTarget.linearRampToValueAtTime(this.getADSRValue(0), ct + relDuration); // Faz uma rampa linear do valor atual para 0 no tempo atual + duração de release
  };

  // Interrompe a reprodução dos osciladores
  killOscillators = (t = 0) => {
    this.nodes.adsr.gain.cancelScheduledValues(t); // Cancela os valores agendados para o ganho do nó de ADSR
    this.nodes.filter.frequency.cancelScheduledValues(t); // Cancela os valores agendados para a frequência do nó de filtro
    this.osciladores.forEach((osc) => {
      if (osc) osc.stop(t); // Interrompe a reprodução de cada oscilador
    });
  };

  // Cria um oscilador com a frequência, o formato de onda e a detunação especificados
  createOscillator = (freq, waveform, detune = 0) => {
    const osc = Sintetizador.AC.createOscillator(); // Cria um novo oscilador do contexto de áudio
    osc.type = Sintetizador.TIPOS[waveform]; // Define o formato de onda do oscilador com base no valor do parâmetro
    osc.frequency.value = freq; // Define a frequência do oscilador
    osc.detune.value = detune; // Define a detunação do oscilador
    osc.connect(this.nodes.adsr); // Conecta o oscilador ao nó de ganho ADSR
    return osc; // Retorna o oscilador criado
  };

}

/** Interface Gráfica **/

// Importa as funcionalidades necessárias do pacote React
const { createContext, useContext, useState, useEffect, useRef } = React;

// Cria um novo contexto chamado SintetizadorContext
const SintetizadorContext = createContext(null);

// Cria um hook personalizado para acessar o valor do contexto SintetizadorContext
const useSintetizador = () => useContext(SintetizadorContext);

// Cria um hook personalizado para manipular um parâmetro específico do sintetizador
const useSintetizadorParam = (param) => {
  const sintetizador = useSintetizador();

  // Define um estado local para o valor do parâmetro
  const [val, setVal] = useState(sintetizador.params[param]);

  // Função para atualizar o parâmetro quando o valor é alterado
  const updateParam = (e) => {
    const v = Number(e.target.value);
    setVal(v);
    sintetizador.setParam(param, v);
  };

  return [val, updateParam];
};

// Componente para agrupar controles com um rótulo
const ControlGroup = ({ label, children }) => (
  <fieldset>
    <legend>{label}</legend>
    {children}
  </fieldset>
);

// Componente para um slider genérico
const GenericSlider = ({ label, belowLabel, ...options }) => {
  return (
    <label className="generic-slider">
      {/* Renderiza um rótulo lateral, se fornecido */}
      {label && <span className="sidelabel">{label}</span>}
      <div>
        {/* Input range para representar o slider */}
        <input type="range" min="0" max="1" step="0.01" {...options} />
        {/* Renderiza um rótulo abaixo do slider, se fornecido */}
        {belowLabel && <span className="sublabel">{belowLabel}</span>}
      </div>
    </label>
  );
};

// Componente para um slider estilo "potenciômetro"
const PotSlider = ({ param, label }) => {
  // Obtém o valor do parâmetro do sintetizador e a função para atualizá-lo
  const [val, setVal] = useSintetizadorParam(param);

  // Renderiza um slider genérico com o rótulo e valor obtidos
  return (
    <GenericSlider label={label} value={val} onInput={setVal} />
  );
};

// Componente para um slider estilo "chave seletora"
const SwitchSlider = ({ param, label, belowLabels }) => {
  // Obtém o valor do parâmetro do sintetizador e a função para atualizá-lo
  const [val, setVal] = useSintetizadorParam(param);

  // Renderiza um slider genérico com o rótulo, rótulos abaixo e valores obtidos
  return (
    <GenericSlider
      label={label}
      belowLabel={belowLabels.join(' - ')}
      value={val}
      max={belowLabels.length - 1}
      step={1}
      onInput={setVal}
    />
  );
};

// Componente para controlar um teclado virtual
const TecladoController = ({ notas }) => {
  const sintetizador = useSintetizador();

  // Função para pressionar uma tecla do teclado
  const pressKey = (nota) => {
    sintetizador.noteOn(NOTAS[nota]);
  };

  // Função para renderizar as teclas do teclado
  const renderKeys = () => notas.map((nota) => {
    // Verifica se a nota é um sustenido
    let cn = nota[1] === '#' ? 'sustenido' : '';

    // Renderiza um botão para representar a tecla
    return (
      <button
        key={nota}
        className={cn}
        onMouseDown={() => pressKey(nota)} // Ao pressionar o mouse, chama a função pressKey para ligar a nota
        onMouseUp={sintetizador.noteOff} // Ao soltar o mouse, chama a função noteOff do sintetizador para desligar a nota
      >
        <span>{nota}</span>
      </button>
    );
  });

  // Renderiza o teclado virtual com as teclas
  return (
    <div className="teclado">
      {renderKeys()}
    </div>
  );
};

// Valores padrão para as notas do teclado
TecladoController.defaultProps = {
  notas: ['C-3', 'C#3', 'D-3', 'D#3', 'E-3', 'F-3', 'F#3', 'G-3', 'G#3', 'A-3', 'A#3', 'B-3', 'C-4']
};

// Componente para visualizar uma forma de onda
const VisualizadorDeOnda = () => {
  const sintetizador = useSintetizador();
  const canvasRef = useRef(null);

  // Efeito colateral para desenhar a forma de onda no canvas
  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    const cw = canvasRef.current.width;
    const ch = canvasRef.current.height;
    const chh = Math.round(ch * 0.5);
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'red';

    let canDraw = true;

    const draw = () => {
      try {
        // Solicita o próximo frame de animação, a menos que canDraw seja falso
        if (canDraw) requestAnimationFrame(draw);
        ctx.clearRect(0, 0, cw, ch);
        const data = sintetizador.getAnalyserData();

        // Desenha a forma de onda no canvas
        ctx.beginPath();
        ctx.moveTo(0, chh);
        for (let i = 0, ln = data.length; i < ln; i++) {
          ctx.lineTo(i, ch * (data[i] / 255));
        }
        ctx.stroke();
      } catch (e) {
        canDraw = false;
      }
    };

    // Chama a função de desenho
    draw();
  }, [sintetizador]);

  // Renderiza um elemento <canvas> para o visualizador de onda
  return (
    <canvas className="visualizador" width="128" height="45" ref={canvasRef} />
  );
};

const InterfaceSintetizador = ({ sintetizador, label, notasDoTeclado }) => (

  <SintetizadorContext.Provider value={sintetizador}>
    <section>
      <h4>WebSint{label && <span>&nbsp;- {label}</span>}</h4>

      <div className="row">
        <div className="col">
          <ControlGroup label="Master">
            <PotSlider param="volume" label="Vol" />
          </ControlGroup>

          <ControlGroup label="Timbre">
            <SwitchSlider param="waveform" label="WAV" belowLabels={Sintetizador.TIPOS_ABR} />
            <PotSlider param="unisonWidth" label="WID" />
          </ControlGroup>
        </div>

        <ControlGroup label="ADSR">
          <SwitchSlider param="adsrTarget" label="TGT" belowLabels={Sintetizador.ADSR_TARGETS} />
          <PotSlider param="adsrAttack" label="ATK" />
          <PotSlider param="adsrDecay" label="DEC" />
          <PotSlider param="adsrSustain" label="SUS" />
          <PotSlider param="adsrRelease" label="REL" />
        </ControlGroup>

        <div className="col">
          <ControlGroup label="Passa-Baixa">
            <PotSlider param="filterFreq" label="FRQ" />
            <PotSlider param="filterQ" label="Q" />
          </ControlGroup>

          <ControlGroup label="Efeito de Eco">
            <PotSlider param="echoTime" label="TIM" />
            <PotSlider param="echoFeedback" label="FBK" />
          </ControlGroup>
        </div>
      </div>
      <div className="row">
        <TecladoController notes={notasDoTeclado} />
        <ControlGroup label="onda">
          <VisualizadorDeOnda />
        </ControlGroup>
      </div>
    </section>
  </SintetizadorContext.Provider>

);


const App = () => {
  const sintetizador = new Sintetizador();


  return (
    <div>
      <div id="sintetizador" className="container">
        <InterfaceSintetizador sintetizador={sintetizador} />
      </div>
      <div id='tarefas' className='tarefa-container'>
        <ListaTarefas></ListaTarefas>
      </div>
      <div id='texto'>
        <Texto></Texto>
      </div>
    </div>


  );
};

export default App;