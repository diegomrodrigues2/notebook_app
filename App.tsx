
import React from 'react';
import Editor from './features/editor/Editor';

function App(): React.ReactNode {
  return (
    <div className="w-screen h-screen bg-gray-300 text-gray-800">
      <Editor />
    </div>
  );
}

export default App;
