import React from 'react';

const rotinaData = [
    { time: "06:30-07:30", seg: "🙋‍♀️ Rotina Matinal", ter: "🙋‍♀️ Rotina Matinal", qua: "🙋‍♀️ Rotina Matinal", qui: "🙋‍♀️ Rotina Matinal", sex: "🙋‍♀️ Rotina Matinal", sab: "💑 Café Juntos", dom: "😴 Livre" },
    { time: "07:30-08:30", seg: "🙋‍♀️ Órgão (Prática)", ter: "💑 Corrida Juntos", qua: "🙋‍♀️ Órgão (Prática)", qui: "💑 Corrida Juntos", sex: "🙋‍♀️ Órgão (Prática)", sab: "💑 Corrida (Opcional)", dom: "🧘‍♀️ Planear Semana" },
    { time: "08:30-12:00", seg: "🙋‍♀️ Bloco de Estudo", ter: "🙋‍♀️ Bloco de Estudo", qua: "🙋‍♀️ Bloco de Estudo", qui: "🙋‍♀️ Bloco de Estudo", sex: "🙋‍♀️ Bloco de Estudo", sab: "🙋‍♀️ Hobbies", dom: "💑 Tempo de Qualidade" },
    { time: "12:00-13:30", seg: "💑 Almoço + Limpeza", ter: "💑 Almoço + Limpeza", qua: "💑 Almoço + Limpeza", qui: "💑 Almoço + Limpeza", sex: "💑 Almoço + Limpeza", sab: "💑 Almoço", dom: "💑 Almoço" },
    { time: "13:30-17:30", seg: "🙋‍♀️ Estágio/Estudo", ter: "🙋‍♀️ Estágio/Estudo", qua: "🙋‍♀️ Estágio/Estudo", qui: "🙋‍♀️ Estágio/Estudo", sex: "🙋‍♀️ Estágio/Estudo", sab: "🧹 Limpeza Semanal", dom: "😴 Descanso" },
    { time: "17:30-19:00", seg: "🙋‍♀️ Preparar Jantar", ter: "🙋‍♀️ Preparar Jantar", qua: "🙋‍♀️ Preparar Jantar", qui: "🙋‍♀️ Preparar Jantar", sex: "🙋‍♀️ Preparar Jantar", sab: "💑 Lazer", dom: "💑 Lazer" },
    { time: "19:00-20:30", seg: "💑 CrossFit", ter: "🙋‍♂️ Hipertrofia", qua: "💑 CrossFit", qui: "🙋‍♂️ Hipertrofia", sex: "💑 CrossFit", sab: "💑 Noite Livre", dom: "💑 Noite Livre" },
    { time: "20:30-22:30", seg: "💑 Jantar e Descontrair", ter: "💑 Jantar e Descontrair", qua: "💑 Jantar e Descontrair", qui: "💑 Jantar e Descontrair", sex: "💑 Jantar e Descontrair", sab: "💑 Jantar", dom: "💑 Jantar" },
];

const RotinaSemanal = () => {
  return (
    <div className="content-section">
      <h2>Rotina Semanal Integrada</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="rotina-table">
          <thead>
            <tr>
              <th>Bloco de Tempo</th>
              <th>Segunda</th>
              <th>Terça</th>
              <th>Quarta</th>
              <th>Quinta</th>
              <th>Sexta</th>
              <th>Sábado</th>
              <th>Domingo</th>
            </tr>
          </thead>
          <tbody>
            {rotinaData.map((row, index) => (
              <tr key={index}>
                <td>{row.time}</td>
                <td><span>{row.seg}</span></td>
                <td><span>{row.ter}</span></td>
                <td><span>{row.qua}</span></td>
                <td><span>{row.qui}</span></td>
                <td><span>{row.sex}</span></td>
                <td><span>{row.sab}</span></td>
                <td><span>{row.dom}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RotinaSemanal;