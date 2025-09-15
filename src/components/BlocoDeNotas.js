// src/components/BlocoDeNotas.js
import React, { useState, useEffect } from 'react';
import { Trash, Plus } from '@phosphor-icons/react';

function BlocoDeNotas() {
  // Usamos nomes de estado diferentes para clareza
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [inputVisivel, setInputVisivel] = useState(false);

  // Efeito para CARREGAR os itens do localStorage
  useEffect(() => {
    // Usamos uma chave DIFERENTE no localStorage para não misturar com as outras notas
    const itensSalvos = localStorage.getItem('bloco_de_notas_sidebar');
    if (itensSalvos) {
      setItens(JSON.parse(itensSalvos));
    }
  }, []);

  // Efeito para SALVAR os itens sempre que a lista 'itens' muda
  useEffect(() => {
    localStorage.setItem('bloco_de_notas_sidebar', JSON.stringify(itens));
  }, [itens]);

  const handleAdicionarItem = (e) => {
    e.preventDefault();
    if (novoItem.trim() === '') {
      setInputVisivel(false);
      return;
    }

    const itemObj = {
      id: Date.now(),
      texto: novoItem
    };

    setItens([...itens, itemObj]);
    setNovoItem('');
    setInputVisivel(false);
  };

  const handleRemoverItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  return (
    <div className="content-section notepad-container">
      <div className="notepad-header">
        <h3>🗒️ Bloco de Notas</h3>
        {!inputVisivel && (
          <button className="add-note-button" onClick={() => setInputVisivel(true)}>
            <Plus size={20} />
          </button>
        )}
      </div>
      <ul className="notepad-list">
        {itens.map(item => (
          <li key={item.id} className="notepad-item">
            <span>{item.texto}</span>
            <button onClick={() => handleRemoverItem(item.id)} className="delete-note-button">
              <Trash size={16} />
            </button>
          </li>
        ))}
      </ul>
      {inputVisivel && (
        <form className="notepad-input-form" onSubmit={handleAdicionarItem}>
          <input
            type="text"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            placeholder="Nova anotação..."
            autoFocus
          />
          <button type="submit"><Plus size={20}/></button>
        </form>
      )}
    </div>
  );
}

export default BlocoDeNotas;
