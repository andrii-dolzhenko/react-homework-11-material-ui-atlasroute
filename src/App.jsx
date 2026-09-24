import { RouterProvider } from 'react-router/dom'
import ThemeSync from './components/ThemeSync'
import AtlasMuiProvider from './components/trip/AtlasMuiProvider.jsx'
import { router } from './router'

export default function App() {
  return (
    <>
      <ThemeSync></ThemeSync>
      <AtlasMuiProvider>
        <RouterProvider router={router}></RouterProvider>
      </AtlasMuiProvider>
    </>
  )
}
