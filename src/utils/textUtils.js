import React from 'react';

/**
 * Converte URLs dentro de um texto em links <a> clicáveis com target="_blank".
 * Trata URLs completas (http://, https://) e com www.
 * Interrompe a propagação do clique para evitar acionar checkboxes ou modais pai.
 * 
 * @param {string} text - O texto a ser formatado
 * @param {object} [options] - Opções adicionais (className, style, etc.)
 * @returns {React.ReactNode} Texto com componentes <a> para cada link encontrado
 */
export const renderTextWithLinks = (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Regex para encontrar URLs válidas (http, https ou www.) excluindo pontuações finais indesejadas
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s]|www\.[^\s<]+[^<.,:;"')\]\s])/gi;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const matchedUrl = match[0];
    const matchIndex = match.index;

    // Adiciona o trecho de texto antes do link
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    const href = matchedUrl.startsWith('http://') || matchedUrl.startsWith('https://')
      ? matchedUrl
      : `https://${matchedUrl}`;

    parts.push(
      <a
        key={`${matchIndex}_${matchedUrl}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`auto-link ${options.className || ''}`.trim()}
        style={options.style}
        onClick={(e) => {
          e.stopPropagation();
        }}
        title={`Abrir link: ${href}`}
      >
        {matchedUrl}
      </a>
    );

    lastIndex = matchIndex + matchedUrl.length;
  }

  // Se não encontrou links, retorna a string original intacta
  if (parts.length === 0) {
    return text;
  }

  // Adiciona o restante do texto após o último link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};
