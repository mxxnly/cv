import { createBrowserRouter } from 'react-router'

import { LandingLayout, SiteLayout } from './components/layout/Layouts'
import { LanguageRoot, RootRedirect } from './components/layout/LanguageRoot'
import { HomePage } from './pages/Home'
import { LandingPage } from './pages/Landing'
import { LegalPage } from './pages/Legal'
import { PricesPage } from './pages/Prices'
import { ProductPage } from './pages/ProductPage'
import { ProductsPage } from './pages/Products'
import { AboutPage, ContactsPage, ErrorPage, NotFoundPage, SupportPage } from './pages/StaticPages'

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect />, errorElement: <ErrorPage /> },
  {
    path: '/:lang',
    element: <LanguageRoot />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <SiteLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'products/:slug', element: <ProductPage /> },
          { path: 'prices', element: <PricesPage /> },
          { path: 'support', element: <SupportPage /> },
          { path: 'about', element: <AboutPage /> },
          { path: 'contacts', element: <ContactsPage /> },
          { path: 'legal/:doc', element: <LegalPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
      {
        element: <LandingLayout />,
        children: [{ path: 'lp/:slug', element: <LandingPage /> }],
      },
    ],
  },
])
