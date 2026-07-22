import { RouterProvider } from 'react-router-dom';
import { useAppLogic } from './hooks/useAppLogic';

export default function App() {
  const { router } = useAppLogic();

  return <RouterProvider router={router} />;
}