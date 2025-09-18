import React from 'react';

import './styles.css';

const PomodoroDots = ({ count }) => {
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push(<span key={i}>🍅</span>);
  }
  return <div className="pomodoro-dots">{dots}</div>;
};

function PlacarFoco({ count }) {
  return (
    <div className="content-section placar-foco-container">
      <h3>🏆 Placar de Foco do Dia</h3>
      <div className="placar-display">
        <span className="placar-count">{count}</span>
        <span className="placar-label">Ciclo(s) de Foco Concluído(s)</span>
      </div>
      
      {/* Mostra os tomates apenas se a contagem for maior que 0 */}
      {count > 0 && <PomodoroDots count={count} />}

      {/* Mensagem muda dependendo da contagem */}
      {count > 0 ? (
        <p className="placar-motivacao">Excelente trabalho! Continue assim!</p>
      ) : (
        <p className="placar-motivacao">Complete o seu primeiro ciclo de foco para começar a marcar!</p>
      )}
    </div>
  );
}

export default PlacarFoco;