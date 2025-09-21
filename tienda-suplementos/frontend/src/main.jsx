import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartContext'
import { UIProvider } from './context/UIContext'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <UIProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </UIProvider>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
)
