import React, { useState } from 'react';
import './Texto.css';

const Texto = () => {
    const [isAccordionOpen, setAccordionOpen] = useState(false);

    const toggleAccordion = () => {
        setAccordionOpen((prevState) => !prevState);
    };

    return (
        <div className="accordion-container">
            <button className={`accordion ${isAccordionOpen ? 'active' : ''}`} onClick={toggleAccordion}>
                Sobre o Sintetizador
            </button>
            {isAccordionOpen && (
                <div className="texto-content">
                    <h2>Introdução:</h2>
                    <p>
                        Um sintetizador gera um sinal de áudio por meio de componentes eletrônicos. Basicamente, ele modifica esse sinal e o envia para um alto-falante ou fone de ouvido. O componente fundamental em um sintetizador básico é o que chamamos de oscilador, responsável por criar o sinal de áudio que será direcionado para o alto-falante ou fone de ouvido. Quando as ondas sonoras geradas alcançam os ouvidos, o cérebro as interpreta como som audível.
                    </p>
                    <p>
                        Esse processo de criação de sons é conhecido como síntese sonora. A síntese sonora é uma ferramenta poderosa na música e na produção sonora, permitindo a criação de novos timbres, efeitos e paisagens sonoras únicas. A combinação de diferentes osciladores, filtros e envelopes de amplitude pode levar a uma infinidade de possibilidades criativas, tornando o sintetizador uma peça fundamental no mundo da música e da arte sonora.
                    </p>

                    <h2>Tipos de Formatos de Onda:</h2>

                    <div className='imagem-container'>
                    <img style={{width:50+'%'}} src='/waveforms.png'></img>
                    </div>
                    <p>
                        Os formatos de onda são a base dos sons gerados pelos sintetizadores. Existem quatro tipos principais de formas de onda: a senoidal (ou sine), que produz um som puro e suave; a quadrada (ou square), que gera um som rico em harmônicos e com uma qualidade "brilhante"; a triangular (ou triangle), que é mais suave que a quadrada e com menos harmônicos; e a dente de serra (ou sawtooth), que possui muitos harmônicos e é amplamente utilizada para criar sons brilhantes e expressivos. Cada formato de onda oferece características sonoras distintas e é a partir deles que os sintetizadores iniciam a criação de seus sons.
                    </p>
                    <p>Os formatos de onda podem ser trocados pelo parametro "WAV" do sintetizador.</p>

                    <h2>ADSR - Attack, Decay, Sustain, Release:</h2>

                    <div className='imagem-container'>
                    <img style={{width:80+'%'}} src='/adsr.png'></img>
                    </div>
                    <p>
                        O ADSR é uma técnica fundamental na síntese sonora para moldar a forma como um som é criado e evolui ao longo do tempo. Cada letra representa uma fase do som:
                    </p>
                    <ul>
                        <li>- Attack (Ataque): É o momento inicial do som, quando ele inicia sua amplificação a partir do volume zero e atinge seu pico.</li>
                        <li>- Decay (Decaimento): Após o ataque, o som entra na fase de decaimento, onde sua amplitude diminui até alcançar o nível de sustentação.</li>
                        <li>- Sustain (Sustentação): Nesta fase, o som mantém um volume constante enquanto a tecla é pressionada.</li>
                        <li>- Release (Liberação): Ao soltar a tecla, o som entra na fase de liberação, onde sua amplitude diminui gradualmente até o volume zero.</li>
                    </ul>
            

                    <h2>Filtros Passa-Baixa e Parâmetro Q do Filtro:</h2>
                    <p>
                        Os filtros são dispositivos usados para selecionar ou atenuar certas frequências de um som. O filtro passa-baixa é um tipo de filtro que permite passar as frequências mais baixas e atenua as frequências mais altas. Isso resulta em um som suave e abafado. Por outro lado, o filtro passa-alta permite passar as frequências mais altas e atenua as frequências mais baixas, gerando um som mais brilhante.
                    </p>
                    <p>
                        O parâmetro Q do filtro controla a ressonância do filtro, ou seja, o quanto ele realça as frequências próximas à frequência de corte. Um Q alto criará uma ressonância pronunciada, enquanto um Q baixo resultará em um som mais suave. Essa ferramenta é útil para criar efeitos tonais interessantes e dar vida aos sons sintéticos.
                    </p>

                    <h2>Juntando Três Osciladores:</h2>
                    <p>
                        Uma técnica comum em síntese sonora é juntar três osciladores, cada um ligeiramente desafinado em relação ao outro. Essa técnica é chamada de uníssono ou unison. Ao fazer isso, os osciladores produzem frequências ligeiramente diferentes, o que gera interferência construtiva entre eles, aumentando a intensidade e a riqueza do som. O efeito resultante é um som mais encorpado e cheio.
                    </p>
                    <p>O quão desafinado os osciladores estão, depende do parâmetro "WID" do sintetizador.</p>
                </div>
            )}
        </div>
    );
};

export default Texto;
