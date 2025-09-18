import React, { useState, useEffect } from 'react';
import { Trash, Plus } from '@phosphor-icons/react';

import './styles.css';

function BlocoDeNotas({ isMobileView = false }) {
  const [itens, setItens] = useState([]);
  const [novoItem, setNovoItem] = useState('');
  const [inputVisivel, setInputVisivel] = useState(isMobileView);

  useEffect(() => {
    const itensSalvos = localStorage.getItem('bloco_de_notas_sidebar');
    if (itensSalvos) {
      setItens(JSON.parse(itensSalvos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('bloco_de_notas_sidebar', JSON.stringify(itens));
  }, [itens]);

  const handleAdicionarItem = (e) => {
    e.preventDefault();
    if (novoItem.trim() === '') {
      if (!isMobileView) {
        setInputVisivel(false);
      }
      return;
    }

    const itemObj = {
      id: Date.now(),
      texto: novoItem
    };

    setItens([itemObj, ...itens]); // Adiciona no topo
    setNovoItem('');

    if (!isMobileView) {
      setInputVisivel(false);
    }
  };

  const handleRemoverItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const showInput = isMobileView || inputVisivel;

  return (
    <div className="content-section notepad-container">
      <div className="notepad-header">
        <h3>🗒️ Bloco de Notas</h3>
        {!isMobileView && !inputVisivel && (
          <button className="add-note-button" onClick={() => setInputVisivel(true)}>
            <Plus size={20} />
          </button>
        )}
      </div>

      {showInput && (
        <form className="notepad-input-form" onSubmit={handleAdicionarItem}>
          <input
            type="text"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
            placeholder="Nova anotação..."
            autoFocus={inputVisivel} // Auto-foco apenas quando é aberto manualmente
          />
          <button type="submit"><Plus size={20}/></button>
        </form>
      )}

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
    </div>
  );
}

export default BlocoDeNotas;