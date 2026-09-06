import React, { useState, useCallback } from 'react';
import { XCircle } from '@phosphor-icons/react';

import './styles.css';

const todasAsDicas = [
  {
    tipo: 'Estratégia',
    emoji: '🍅',
    titulo: 'Técnica Pomodoro',
    descricao: 'Criada por Francesco Cirillo, esta técnica usa um cronómetro para dividir o trabalho em blocos de foco intenso (25 min) e pausas curtas (5 min), melhorando drasticamente a concentração.'
  },
  {
    tipo: 'Coaching',
    emoji: '⚖️',
    titulo: 'Princípio de Pareto (80/20)',
    descricao: 'Este princípio afirma que 80% dos resultados vêm de 20% dos esforços. Foque-se nas poucas tarefas que lhe darão o maior impacto hoje.'
  },
  {
    tipo: 'Estratégia',
    emoji: '🗺️',
    titulo: 'Matriz de Eisenhower',
    descricao: 'Classifique tarefas em 4 quadrantes (Urgente/Importante) para decidir o que fazer agora, o que agendar e o que eliminar, ganhando clareza total sobre as suas prioridades.'
  },
  {
    tipo: 'Coaching',
    emoji: '⏳',
    titulo: 'Lei de Parkinson',
    descricao: 'Esta lei diz que "o trabalho expande-se para preencher o tempo disponível". Defina prazos mais curtos para as suas tarefas e veja o seu foco aumentar.'
  },
  {
    tipo: 'Estratégia',
    emoji: '🐸',
    titulo: 'Eat That Frog (Engolir o Sapo)',
    descricao: 'Ataque a sua tarefa mais difícil ("o sapo") logo pela manhã. Depois disso, o resto do seu dia parecerá muito mais fácil.'
  },
  {
    tipo: 'Coaching',
    emoji: '🔗',
    titulo: 'Habit Stacking (Empilhar Hábitos)',
    descricao: 'Ancore um novo hábito a um já existente. Ex: "Logo depois de tomar o meu café da manhã, vou meditar por 1 minuto".'
  }
];

todasAsDicas.sort(() => Math.random() - 0.5);

function BannerDinamico() {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAnimationIteration = useCallback(() => {
    setIndiceAtual((indiceAnterior) => (indiceAnterior + 1) % todasAsDicas.length);
  }, []);

  const dicaAtual = todasAsDicas[indiceAtual];
  const headerIcon = dicaAtual.tipo === 'Estratégia' ? '🚀' : '❤️';
  const headerText = dicaAtual.tipo === 'Estratégia' ? 'Impulso Mental' : 'Bússola Interna';
  
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="coaching-banner" onClick={openModal}>
        <div className="banner-title-centered">
          <span>{headerIcon}</span>
          <span>{headerText}</span>
        </div>
        <div className="banner-text-scrolling-container">
          <p 
            className={`coaching-banner-text ${isModalOpen ? 'marquee-paused' : ''}`}
            onAnimationIteration={handleAnimationIteration}
            key={indiceAtual}
          >
            <strong>{dicaAtual.titulo}:</strong> {dicaAtual.descricao}
          </p>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content banner-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModal}>
              <XCircle size={28} />
            </button>
            <h3>{headerIcon} {headerText}</h3>
            <h4>{dicaAtual.emoji} {dicaAtual.titulo}</h4>
            <p>{dicaAtual.descricao}</p>
          </div>
        </div>
      )}
    </>
  );
}

export default BannerDinamico;