import { useEffect } from 'react';

const useTitle = (title = 'Eduassist') => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `Eduassist - ${title}`;
    
    // Cleanup: restaurar título anterior cuando el componente se desmonte
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

export default useTitle;