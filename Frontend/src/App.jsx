import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppLogic } from './hooks/useAppLogic';

export default function App() {
  const { router } = useAppLogic();

  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}