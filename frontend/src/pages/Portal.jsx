// src/components/Portal.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function Portal({ children }) {
  const [mounted, setMounted] = useState(false);
  const [portalNode, setPortalNode] = useState(null);

  useEffect(() => {
    setMounted(true);
    let PNode = document.getElementById('portal-root');
    if (!PNode) {
      PNode = document.createElement('div');
      PNode.setAttribute('id', 'portal-root');
      document.body.appendChild(PNode);
    }
    setPortalNode(PNode);

    return () => {
      // Optional: Cleanup logic for portal-root if necessary
    };
  }, []);

  if (!mounted || !portalNode) {
    return null;
  }

  return createPortal(children, portalNode);
}

export default Portal;