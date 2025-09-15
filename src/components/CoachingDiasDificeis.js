import React, { useState, useCallback } from 'react';

// 1. Criamos a nossa lista de dicas de resiliência, agora mais detalhadas e com novas adições
const dicasDeResiliencia = [
  {
    emoji: '⏳',
    titulo: 'A Regra dos 5 Minutos',
    descricao: 'Se estiver a procrastinar, faça um acordo consigo mesma: trabalhe na tarefa por apenas 5 minutos. Depois disso, tem permissão para parar. O segredo é que começar é a parte mais difícil; geralmente, depois de 5 minutos, você continuará.'
  },
  {
    emoji: '🧠',
    titulo: 'Reformule o Pensamento',
    descricao: 'Os seus pensamentos não são factos. Quando pensar "Eu não consigo fazer isto", questione e reformule para "Isto é difícil, mas posso tentar o primeiro passo". Mudar a sua narrativa interna é uma ferramenta poderosa para sair da inércia.'
  },
  {
    emoji: '💖',
    titulo: 'Autocompaixão Radical',
    descricao: 'Trate-se com a mesma gentileza que trataria um bom amigo que está a passar por dificuldades. Um dia mau não a define. Permita-se sentir, descanse se for preciso e recomece amanhã sem culpa. A autocrítica paralisa; a autocompaixão motiva.'
  },
  {
    emoji: '🔍',
    titulo: '"Encolha" a Tarefa',
    descricao: 'Se uma tarefa parece uma montanha ("Limpar a casa"), "encolha-a" até ao primeiro passo ridicularmente pequeno. Por exemplo: "Levar um copo para a cozinha". Concluir este micropasso quebra a barreira mental e torna o próximo mais fácil.'
  },
  {
    emoji: '🌳',
    titulo: 'Mude o Seu Ambiente',
    descricao: 'Sentir-se presa ou desmotivada? Levante-se e mude de cenário. Dê uma caminhada de 5 minutos lá fora, trabalhe noutro cómodo da casa ou simplesmente ponha uma música animada. Mudar o seu estado físico muitas vezes muda o seu estado mental.'
  }
];

function CoachingDiasDificeis() {
  const [indiceAtual, setIndiceAtual] = useState(0);

  const handleAnimationIteration = useCallback(() => {
    setIndiceAtual((indiceAnterior) => (indiceAnterior + 1) % dicasDeResiliencia.length);
  }, []);

  const dicaAtual = dicasDeResiliencia[indiceAtual];

  return (
    <div className="coaching-banner">
      <p 
        className="coaching-banner-text"
        onAnimationIteration={handleAnimationIteration}
      >
        {dicaAtual.emoji} <strong>{dicaAtual.titulo}:</strong> {dicaAtual.descricao}
      </p>
    </div>
  );
}

export default CoachingDiasDificeis;