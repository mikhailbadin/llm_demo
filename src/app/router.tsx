import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { HomePage } from './HomePage';
import { SectionPage } from './SectionPage';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ':slug', element: <SectionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], {
  // BASE_URL берётся из vite.config.ts: '/llm_demo/' в сборке, '/' в тестах.
  basename: import.meta.env.BASE_URL,
});
