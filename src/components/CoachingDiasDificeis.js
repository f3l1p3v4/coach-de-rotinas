import React, { useState, useEffect } from 'react';

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
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    // 2. Usamos a mesma lógica de intervalo para mudar a dica a cada 20 segundos
    const intervalId = setInterval(() => {
      setVisivel(false); // Inicia o fade-out

      setTimeout(() => {
        setIndiceAtual((indiceAnterior) => (indiceAnterior + 1) % dicasDeResiliencia.length);
        setVisivel(true); // Inicia o fade-in com a nova dica
      }, 500); // Sincronizado com a transição de CSS
    }, 30000); // 20 segundos

    return () => clearInterval(intervalId); // Limpa o intervalo
  }, []);

  const dicaAtual = dicasDeResiliencia[indiceAtual];

  return (
    <div className="content-section">
      <h3>{dicaAtual.emoji} Coaching para Dias Difíceis</h3>
      {/* 3. Reutilizamos as mesmas classes de CSS para a animação */}
      <div className={`metodo-card ${visivel ? 'fade-in' : 'fade-out'}`}>
        <h4>{dicaAtual.titulo}</h4>
        <p>{dicaAtual.descricao}</p>
      </div>
    </div>
  );
}

export default CoachingDiasDificeis;