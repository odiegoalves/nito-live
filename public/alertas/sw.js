/* NITO Alertas - trabalhador de servico.
 *
 * De proposito ele NAO guarda nada em cache. Motivo: um app de alerta de venda
 * so tem valor com dado do minuto; servir tela velha aqui seria pior que nao
 * abrir. A unica razao de existir e permitir a instalacao na tela de inicio e,
 * mais para frente, receber aviso com o app fechado.
 */
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

// Repassa direto para a rede, sem intermediar.
self.addEventListener('fetch', () => {});

// Toque na notificacao: traz o app para a frente em vez de abrir outra aba.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if (c.url.indexOf('/alertas') !== -1 && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/alertas');
    })
  );
});
