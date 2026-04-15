const routes = [
  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    meta: { guestOnly: true },
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') },
      { path: 'login', component: () => import('pages/LoginPage.vue') },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'pocetna', component: () => import('pages/PocetnaPage.vue') },
      { path: 'recenzije', component: () => import('pages/RecenzijePage.vue') },
      { path: 'knjige/:id', component: () => import('pages/DetaljiKnjigePage.vue') },
      { path: 'knjige/:id/reprodukcija', component: () => import('pages/ReprodukcijaPage.vue') },
      { path: 'profil/:id', component: () => import('pages/DetaljiKorisnikaPage.vue') },
      { path: 'admin/korisnici', component: () => import('pages/AdminKorisniciPage.vue'), meta: { requiresAdmin: true },},
      { path: 'admin/knjige', component: () => import('pages/AdminKnjigePage.vue'), meta: { requiresAdmin: true },},
      { path: 'admin/recenzije', component: () => import('pages/AdminRecenzijePage.vue'), meta: { requiresAdmin: true },},
      { path: 'admin/statistika', component: () => import('pages/AdminStatistikaPage.vue'), meta: { requiresAdmin: true },},
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
