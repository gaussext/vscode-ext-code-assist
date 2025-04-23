import React from 'react';
import { createRoot } from 'react-dom/client';
import ChatComponent from './ChatComponent';
import { Model } from '../Model';
const container = document.getElementById('root');
const root = createRoot(container!);

const model = new Model();
window.addEventListener('load', (event) => {
  root.render(
    <React.StrictMode>
      <ChatComponent model={model} />
    </React.StrictMode>
  );
})

