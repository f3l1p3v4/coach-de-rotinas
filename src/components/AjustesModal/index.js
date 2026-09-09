import React, { useState } from 'react';
import { XCircle, Gear, SquaresFour, Tag } from '@phosphor-icons/react';
import GerenciadorModelos from '../GerenciadorModelos';
import GerenciadorCategorias from '../GerenciadorCategorias';
import './styles.css';

function AjustesModal({ templates, onAddTemplate, onEditTemplate, onDeleteTemplate, onClose }) {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' | 'categories'

  return (
    <div className="ajustes-card-container">
      <div className="ajustes-header">
        <div className="ajustes-title-group">
          <Gear size={22} className="gear-spin-icon" />
          <h3>Ajustes & Personalização</h3>
        </div>
        {onClose && (
          <button className="ajustes-close-btn" onClick={onClose} aria-label="Fechar">
            <XCircle size={24} />
          </button>
        )}
      </div>

      <div className="ajustes-tabs-bar">
        <button
          type="button"
          className={`ajustes-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <SquaresFour size={18} />
          <span>Modelos de Tarefa</span>
        </button>
        <button
          type="button"
          className={`ajustes-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={18} />
          <span>Categorias</span>
        </button>
      </div>

      <div className="ajustes-content-area">
        {activeTab === 'templates' && (
          <GerenciadorModelos
            templates={templates}
            onAddTemplate={onAddTemplate}
            onEditTemplate={onEditTemplate}
            onDeleteTemplate={onDeleteTemplate}
            hideHeader={true}
          />
        )}
        {activeTab === 'categories' && (
          <GerenciadorCategorias />
        )}
      </div>
    </div>
  );
}

export default AjustesModal;
