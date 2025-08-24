
import React from 'react';
import Editor from './features/editor/Editor';

function App(): React.ReactNode {
  return (
    <div className="w-screen h-screen text-gray-800" style={{ backgroundColor: '#f1f3f5' }}>
      <Editor />
    </div>
  );
}

export default App;