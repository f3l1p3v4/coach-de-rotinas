import React, { useState, useEffect } from 'react';

// 1. Criamos uma lista com todos os nossos métodos e descrições detalhadas
const metodos = [
  {
    titulo: 'Time Blocking (Blocos de Tempo)',
    descricao: 'Atribua uma tarefa específica a cada bloco de tempo no seu dia. Em vez de uma lista vaga de "estudar", a sua agenda diz "09:00 - 09:50: Rever aula de Direito Constitucional". Isto elimina a fadiga de decisão e cria um compromisso claro com as suas tarefas.'
  },
  {
    titulo: 'Técnica Pomodoro',
    descricao: 'Trabalhe em sprints de foco total por 25 minutos, seguidos por uma pausa obrigatória de 5 minutos. Após 4 ciclos, faça uma pausa mais longa (15-30 min). O segredo é que a barreira para começar algo por "apenas 25 minutos" é muito baixa, vencendo a procrastinação.'
  },
  {
    titulo: 'Habit Stacking (Empilhar Hábitos)',
    descricao: 'Ancore um novo hábito a um que você já faz automaticamente. A fórmula é: "Depois de [HÁBITO ATUAL], eu vou [NOVO HÁBITO]". Exemplo: "Logo depois de escovar os dentes de manhã, eu vou ler uma página de um livro". Isto usa o momentum de um hábito existente para construir um novo.'
  },
  {
    titulo: 'Eat The Frog (Engolir o Sapo)',
    descricao: 'Identifique a sua tarefa mais importante e mais difícil do dia (o "sapo") e faça-a logo pela manhã. Ao concluir o maior desafio primeiro, você ganha uma enorme sensação de realização e momentum que impulsiona a produtividade para o resto do dia.'
  },
  {
    titulo: 'A Regra dos 2 Minutos',
    descricao: 'Se uma tarefa leva menos de dois minutos para ser concluída, faça-a imediatamente. Responder a um e-mail, arrumar a cama, colocar a louça na máquina. Isto impede que pequenas tarefas se acumulem e sobrecarreguem a sua mente e o seu ambiente.'
  }
];

const GuiaMetodos = () => {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    // 2. Criamos um intervalo que vai mudar o método a cada 20 segundos
    const intervalId = setInterval(() => {
      setVisivel(false); // Começa a transição de fade-out

      // 3. Esperamos a transição terminar para trocar o conteúdo
      setTimeout(() => {
        setIndiceAtual((indiceAnterior) => (indiceAnterior + 1) % metodos.length); // Loop
        setVisivel(true); // Começa a transição de fade-in com o novo conteúdo
      }, 500); // 0.5s, o mesmo tempo da nossa transição de CSS
    }, 30000); // 20 segundos

    // 4. Limpamos o intervalo quando o componente for desmontado para evitar erros
    return () => clearInterval(intervalId);
  }, []);

  const metodoAtual = metodos[indiceAtual];

  return (
    <div className="content-section guia-metodos-container">
      <h3>🚀 Estratégias Fundamentais</h3>
      {/* 5. O conteúdo agora é dinâmico e tem uma classe para a transição */}
      <div className={`metodo-card ${visivel ? 'fade-in' : 'fade-out'}`}>
        <h4>{metodoAtual.titulo}</h4>
        <p>{metodoAtual.descricao}</p>
      </div>
    </div>
  );
}

export default GuiaMetodos;