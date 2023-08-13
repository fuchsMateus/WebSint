import React, { useState, useEffect } from 'react';
import './App.css';
import './ListaTarefas.css';

const ListaTarefas = () => {
  const [tarefas, setTarefas] = useState([
    {
      id: 1,
      descricao: 'Mude o volume do sintetizador (parâmetro "VOL" da aba "MASTER") e perceba a '+
      'diferença de formato que ocorre no visualizador de onda.',
      completada: false,
    },

    {
      id: 2,
      descricao: 'Toque uma nota musical usando diferentes formas de onda'+
      ' (sine, square, triangle, sawtooth) e observe as diferenças de som e formato entre elas'+
      ' (A seleção dos tipos de onda é o parâmetro "WAV" que está na aba "TIMBRE").',
      completada: false,
    },

    {
      id: 3,
      descricao: 'Aumente o parâmetro "WID" na aba "TIMBRE" e veja como o som produzido fica dissonante.',
      completada: false,
    },

    {
      id: 4,
      descricao: 'Mude o alvo do ADSR (parâmetro "TGT" da aba "ADSR") para mudar o comportamento do ADSR'+
      ' e em seguida mude os valores de "ATK", "DEC", "SUS" e "REL" para ver seus efeitos no som produzido.' ,
      completada: false,
    },

    {
      id: 5,
      descricao: 'Mude o valor da frequência aceita pelo filtro de passa-baixa (parâmetro "FRQ" da aba "PASSA-BAIXA")'+
      ' e perceba como as frequências mais agudas são cortadas ao diminuir seu valor.' ,
      completada: false,
    },

    {
      id: 6,
      descricao: 'Mude o valor do parâmetro "Q" na aba "PASSA-BAIXA" para alterar a ressonância do filtro.' ,
      completada: false,
    },

    {
      id: 7,
      descricao: 'Na aba "EFEITO DE ECO" aumente o feedback ("FBK") e o tempo ("TIM") para gerar um efeito de eco.' ,
      completada: false,
    }
  ]);

  const [todasCompletadas, setTodasCompletadas] = useState(false);

  // Verificar se todas as tarefas estão completadas
  useEffect(() => {
    const todasConcluidas = tarefas.every((tarefa) => tarefa.completada);
    setTodasCompletadas(todasConcluidas);
  }, [tarefas]);

  // Função para marcar uma tarefa como completada
  const marcarComoCompletada = (id) => {
    const tarefasAtualizadas = tarefas.map((tarefa) => {
      if (tarefa.id === id) {
        return { ...tarefa, completada: !tarefa.completada };
      }
      return tarefa;
    });
    setTarefas(tarefasAtualizadas);
  };

  return (
    <section>
      <div>
        <h2>Tarefas</h2>
        <ul>
          {tarefas.map((tarefa) => (
            <li key={tarefa.id}>
              <label>
                <input
                  type="checkbox"
                  checked={tarefa.completada}
                  onChange={() => marcarComoCompletada(tarefa.id)}
                />
                <span style={{ textDecoration: tarefa.completada ? 'line-through' : 'none' }}>
                  {tarefa.descricao}
                </span>
              </label>
            </li>
          ))}
        </ul>
        {todasCompletadas && (

          <div className="button-container">
            <button className="ir-ao-questionario-button" onClick={() => window.location.href = '/questionario.html'}>Ir ao questionário</button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ListaTarefas;