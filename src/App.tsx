import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { PostsListPage } from './pages/PostsListPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { ViewPostPage } from './pages/ViewPostPage';
import { EditPostPage } from './pages/EditPostPage';

export const App: React.FC = () => {
  return (
    <div>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/posts" replace />} />
          <Route path="/posts" element={<PostsListPage />} />
          <Route path="/posts/new" element={<CreatePostPage />} />
          <Route path="/posts/:id" element={<ViewPostPage />} />
          <Route path="/posts/:id/edit" element={<EditPostPage />} />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/posts" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
